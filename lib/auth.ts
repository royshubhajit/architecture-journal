import { createHmac, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";
const COOKIE = "aj_session";
function signature() { return createHmac("sha256", process.env.AUTH_SECRET || "local-development-only").update("architecture-journal-admin").digest("hex"); }
export async function isAdmin() { const value = (await cookies()).get(COOKIE)?.value; return !!value && timingSafeEqual(Buffer.from(value), Buffer.from(signature())); }
export async function setAdminSession() { (await cookies()).set(COOKIE, signature(), { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge: 60*60*24*14 }); }
export async function clearAdminSession() { (await cookies()).delete(COOKIE); }
