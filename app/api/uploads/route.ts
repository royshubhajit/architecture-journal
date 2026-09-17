import { randomUUID } from "crypto";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth";
import { put } from "@vercel/blob";

export const runtime = "nodejs";
const allowed = new Map([["image/jpeg","jpg"],["image/png","png"],["image/webp","webp"],["image/gif","gif"]]);

export async function POST(request: Request) {
  if (!(await isAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const form = await request.formData(); const file = form.get("file");
  if (!(file instanceof File)) return NextResponse.json({ error: "Choose an image to upload." }, { status: 400 });
  const extension = allowed.get(file.type);
  if (!extension) return NextResponse.json({ error: "Use a JPG, PNG, WebP, or GIF image." }, { status: 415 });
  if (file.size > 4 * 1024 * 1024) return NextResponse.json({ error: "Images must be smaller than 4 MB." }, { status: 413 });
  const name = `${Date.now()}-${randomUUID().slice(0,8)}.${extension}`;
  if (process.env.BLOB_READ_WRITE_TOKEN) {
    const blob = await put(`uploads/${name}`, file, { access: "public", addRandomSuffix: false, contentType: file.type });
    return NextResponse.json({ url: blob.url, name: file.name });
  }
  const uploadDir = path.join(process.cwd(), "public", "uploads");
  await mkdir(uploadDir, { recursive: true });
  await writeFile(path.join(uploadDir, name), Buffer.from(await file.arrayBuffer()));
  return NextResponse.json({ url: `/uploads/${name}`, name: file.name });
}
