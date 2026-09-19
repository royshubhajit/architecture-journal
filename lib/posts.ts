import { Redis } from "@upstash/redis";
import type { Post } from "./types";
import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";
import { list, put } from "@vercel/blob";

const seed: Post[] = [
  {
    slug: "designing-idempotent-payment-apis",
    title: "Designing idempotent payment APIs",
    excerpt: "How idempotency keys, request fingerprints, and durable results turn retries from a risk into a guarantee.",
    topic: "Distributed systems", status: "published", publishedAt: "2026-09-12T08:30:00.000Z", updatedAt: "2026-09-12T08:30:00.000Z", readingMinutes: 8,
    content: `A client retries because the response was lost. Did the charge fail, or did only the response fail? That uncertainty is the heart of the problem.\n\n## The contract\n\nAn idempotency key identifies one intended operation. The server stores the key beside a fingerprint of the request and the final response. A retry with the same key and payload receives the original result. A retry with a different payload is rejected.\n\n> Idempotency does not prevent failure. It makes repeated intent safe.\n\n## The durable boundary\n\nWrite the business change and the idempotency record in the same database transaction. If those writes can diverge, the guarantee is only cosmetic. Keep the record long enough to cover the client's retry window, and make concurrent requests contend on a unique key.\n\n## A useful review checklist\n\n- Is the key scoped to the authenticated caller?\n- Is the request fingerprint compared on every retry?\n- Are errors classified as retryable or final?\n- Can two regions accept the same key concurrently?\n\nThe best API contract makes the safe client behavior the easiest client behavior.`
  },
  {
    slug: "the-transactional-outbox-without-magic",
    title: "The transactional outbox, without the magic",
    excerpt: "A practical mental model for reliably connecting a database write to an asynchronous event.",
    topic: "Architecture patterns", status: "published", publishedAt: "2026-09-03T08:30:00.000Z", updatedAt: "2026-09-03T08:30:00.000Z", readingMinutes: 6,
    content: `Your service updates an order and publishes an event. Between those two actions is a failure window. The outbox closes it by making one local transaction the source of truth.\n\n## One commit, two records\n\nWrite the order change and an outbox row together. A separate relay reads unpublished rows, sends them to the broker, and marks progress. Publishing can happen more than once, so consumers still need idempotency.\n\n## What it buys you\n\nYou trade an impossible cross-system atomic write for a local atomic write plus an observable delivery process. That is easier to reason about, operate, and repair.`
  },
  {
    slug: "queues-are-not-just-for-scale",
    title: "Queues are not just for scale",
    excerpt: "The more useful reason to add a queue is often control: over bursts, retries, ownership, and failure.",
    topic: "System design", status: "published", publishedAt: "2026-08-21T08:30:00.000Z", updatedAt: "2026-08-21T08:30:00.000Z", readingMinutes: 5,
    content: `Teams often reach for a queue when traffic grows. Scale matters, but control is the deeper benefit.\n\n## Shape the work\n\nA queue lets producers move at one speed and consumers at another. It gives you a place to measure backlog, cap concurrency, retry transient failures, and isolate a struggling dependency.\n\n## The cost\n\nYou now own delayed work, duplicates, poison messages, ordering expectations, and operational visibility. Add a queue when those tradeoffs are better than synchronous coupling—not because the architecture diagram looks more serious.`
  }
];

function redis() {
  if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) return null;
  return Redis.fromEnv();
}
const localDataDir = path.join(process.cwd(), ".data");
const localPostsFile = path.join(localDataDir, "posts.json");
async function getLocalPosts(): Promise<Post[] | null> {
  try { return JSON.parse(await readFile(localPostsFile, "utf8")) as Post[]; }
  catch (error) { if ((error as NodeJS.ErrnoException).code === "ENOENT") return null; throw error; }
}
async function saveLocalPosts(posts: Post[]) {
  await mkdir(localDataDir, { recursive: true });
  await writeFile(localPostsFile, JSON.stringify(posts, null, 2), "utf8");
}
async function getBlobPosts(): Promise<Post[] | null> {
  if (!process.env.BLOB_READ_WRITE_TOKEN) return null;
  let result = await list({ prefix: "data/posts", limit: 1000 });
  const blobs = [...result.blobs];
  while (result.hasMore) { result = await list({prefix:"data/posts", limit:1000, cursor:result.cursor}); blobs.push(...result.blobs); }
  const record = blobs.filter(blob => blob.pathname.endsWith(".json")).sort((a,b) => b.uploadedAt.getTime() - a.uploadedAt.getTime())[0];
  if (!record) return null;
  const response = await fetch(record.url, { cache: "no-store" });
  if (!response.ok) throw new Error("Could not read published posts.");
  return response.json() as Promise<Post[]>;
}
export function slugify(value: string) { return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, ""); }
export function estimateMinutes(text: string) { return Math.max(1, Math.ceil(text.trim().split(/\s+/).length / 220)); }
export async function getPosts(includeDrafts = false): Promise<Post[]> {
  const db = redis();
  const stored = db ? await db.get<Post[]>("architecture-journal:posts") : process.env.BLOB_READ_WRITE_TOKEN ? await getBlobPosts() : await getLocalPosts();
  const posts = stored ?? seed;
  return posts.filter(p => includeDrafts || p.status === "published").sort((a,b) => +new Date(b.publishedAt) - +new Date(a.publishedAt));
}
export async function getPost(slug: string, includeDrafts = false) { return (await getPosts(includeDrafts)).find(p => p.slug === slug); }
async function persistPosts(posts: Post[]) {
  const db = redis();
  if (db) await db.set("architecture-journal:posts", posts);
  else if (process.env.BLOB_READ_WRITE_TOKEN) await put(`data/posts/${Date.now()}.json`, JSON.stringify(posts), { access: "public", contentType: "application/json", cacheControlMaxAge: 60 });
  else await saveLocalPosts(posts);
}
export async function savePost(input: Pick<Post, "title"|"excerpt"|"content"|"topic"|"status"> & { slug?: string; originalSlug?: string; coverImage?: string; coverAlt?: string }) {
  const posts = await getPosts(true); const now = new Date().toISOString(); let slug = input.originalSlug || input.slug || slugify(input.title) || `article-${Date.now()}`;
  if (!input.originalSlug && !input.slug) { const base=slug; let suffix=2; while(posts.some(post=>post.slug===slug)) slug=`${base}-${suffix++}`; }
  const old = posts.find(p => p.slug === (input.originalSlug || slug));
  const { originalSlug: _originalSlug, ...postInput } = input;
  void _originalSlug;
  const post: Post = { ...postInput, slug, publishedAt: old?.publishedAt || now, updatedAt: now, readingMinutes: estimateMinutes(input.content) };
  const next = [post, ...posts.filter(p => p.slug !== slug && p.slug !== input.originalSlug)];
  await persistPosts(next);
  return post;
}
export async function deletePost(slug: string) {
  const posts = await getPosts(true);
  await persistPosts(posts.filter(post => post.slug !== slug));
}
