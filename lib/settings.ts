import { Redis } from "@upstash/redis";
import { list, put } from "@vercel/blob";
import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";
import type { BlogTheme, SiteSettings } from "./types";

const fallback: SiteSettings = { theme: "paper", updatedAt: new Date(0).toISOString() };
const localFile = path.join(process.cwd(), ".data", "settings.json");

function redis() {
  if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) return null;
  return Redis.fromEnv();
}

async function readLocal(): Promise<SiteSettings | null> {
  try { return JSON.parse(await readFile(localFile, "utf8")) as SiteSettings; }
  catch (error) { if ((error as NodeJS.ErrnoException).code === "ENOENT") return null; throw error; }
}

async function readBlob(): Promise<SiteSettings | null> {
  if (!process.env.BLOB_READ_WRITE_TOKEN) return null;
  let result = await list({ prefix: "data/settings", limit: 1000 });
  const blobs = [...result.blobs];
  while (result.hasMore) {
    result = await list({ prefix: "data/settings", limit: 1000, cursor: result.cursor });
    blobs.push(...result.blobs);
  }
  const latest = blobs.filter(blob => blob.pathname.endsWith(".json")).sort((a, b) => b.uploadedAt.getTime() - a.uploadedAt.getTime())[0];
  if (!latest) return null;
  const response = await fetch(latest.url, { cache: "no-store" });
  if (!response.ok) throw new Error("Could not read site settings.");
  return response.json() as Promise<SiteSettings>;
}

export async function getSiteSettings(): Promise<SiteSettings> {
  const db = redis();
  const stored = db ? await db.get<SiteSettings>("architecture-journal:settings") : process.env.BLOB_READ_WRITE_TOKEN ? await readBlob() : await readLocal();
  return stored ? { ...fallback, ...stored } : fallback;
}

export async function saveSiteSettings(update: Partial<SiteSettings>): Promise<SiteSettings> {
  const current = await getSiteSettings();
  const next: SiteSettings = { ...current, ...update, updatedAt: new Date().toISOString() };
  const db = redis();
  if (db) await db.set("architecture-journal:settings", next);
  else if (process.env.BLOB_READ_WRITE_TOKEN) await put(`data/settings/${Date.now()}.json`, JSON.stringify(next), { access: "public", contentType: "application/json", cacheControlMaxAge: 60 });
  else { await mkdir(path.dirname(localFile), { recursive: true }); await writeFile(localFile, JSON.stringify(next, null, 2), "utf8"); }
  return next;
}

export function isBlogTheme(value: string): value is BlogTheme { return value === "paper" || value === "ink" || value === "grid"; }
