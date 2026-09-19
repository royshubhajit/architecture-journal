import { createHmac, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";
const COOKIE = "aj_session";
function signature(expires:string) { return createHmac("sha256", process.env.AUTH_SECRET!).update(`architecture-journal-admin:${expires}:${process.env.ADMIN_PASSWORD}`).digest("hex"); }
export async function isAdmin() {
  if (!process.env.AUTH_SECRET || !process.env.ADMIN_PASSWORD) return false;
  const value = (await cookies()).get(COOKIE)?.value;
  if (!value || !/^\d{13}\.[a-f0-9]{64}$/.test(value)) return false;
  const [expires, hash] = value.split(".");
  return Number(expires)>Date.now() && timingSafeEqual(Buffer.from(hash), Buffer.from(signature(expires)));
}
export async function setAdminSession() {
  if (!process.env.AUTH_SECRET || !process.env.ADMIN_PASSWORD) throw new Error("Admin access is not configured.");
  const expires=String(Date.now()+1000*60*60*24*14);
  (await cookies()).set(COOKIE, `${expires}.${signature(expires)}`, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge: 60*60*24*14 });
}
export async function clearAdminSession() { (await cookies()).delete(COOKIE); }
