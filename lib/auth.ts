import { createHmac, randomUUID, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";
import { getSiteSettings, saveSiteSettings } from "./settings";
const COOKIE = "aj_session";
function digest(value:string) { return createHmac("sha256", process.env.AUTH_SECRET!).update(value).digest("hex"); }
function safeEqual(left:string, right:string) { return left.length === right.length && timingSafeEqual(Buffer.from(left), Buffer.from(right)); }
function signature(expires:string, version:string) { return digest(`architecture-journal-admin:${expires}:${version}`); }
export async function verifyAdminPassword(password:string) {
  if (!process.env.AUTH_SECRET) return false;
  const settings = await getSiteSettings();
  if (settings.auth) return safeEqual(digest(`admin-password:${password}`), settings.auth.passwordDigest);
  return !!process.env.ADMIN_PASSWORD && safeEqual(digest(`admin-password:${password}`), digest(`admin-password:${process.env.ADMIN_PASSWORD}`));
}
export async function isAdmin() {
  if (!process.env.AUTH_SECRET) return false;
  const value = (await cookies()).get(COOKIE)?.value;
  if (!value || !/^\d{13}\.[a-f0-9]{64}$/.test(value)) return false;
  const [expires, hash] = value.split(".");
  const version = (await getSiteSettings()).auth?.sessionVersion || "environment";
  return Number(expires)>Date.now() && safeEqual(hash, signature(expires, version));
}
export async function setAdminSession(versionOverride?:string) {
  if (!process.env.AUTH_SECRET) throw new Error("Admin access is not configured.");
  const expires=String(Date.now()+1000*60*60*24*14);
  const version = versionOverride || (await getSiteSettings()).auth?.sessionVersion || "environment";
  (await cookies()).set(COOKIE, `${expires}.${signature(expires, version)}`, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge: 60*60*24*14 });
}
export async function clearAdminSession() { (await cookies()).delete(COOKIE); }
export async function changeAdminPassword(current:string, next:string) {
  if (!(await verifyAdminPassword(current))) return { error: "Your current password is incorrect." };
  if (next.length < 12) return { error: "Use at least 12 characters for the new password." };
  if (current === next) return { error: "Choose a new password that is different from the current one." };
  const sessionVersion = randomUUID();
  await saveSiteSettings({ auth: { passwordDigest: digest(`admin-password:${next}`), sessionVersion } });
  await setAdminSession(sessionVersion);
  return { error: "" };
}
