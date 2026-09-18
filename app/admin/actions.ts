"use server";
import { redirect } from "next/navigation"; import { clearAdminSession, isAdmin, setAdminSession } from "@/lib/auth"; import { deletePost, savePost } from "@/lib/posts";
export async function login(data:FormData){if(String(data.get("password"))!==(process.env.ADMIN_PASSWORD||"change-me"))redirect("/admin?error=1");await setAdminSession();redirect("/admin");}
export async function logout(){await clearAdminSession();redirect("/admin");}
export async function publish(data:FormData){if(!(await isAdmin()))redirect("/admin");await savePost({originalSlug:String(data.get("originalSlug")||"")||undefined,title:String(data.get("title")),excerpt:String(data.get("excerpt")),topic:String(data.get("topic")),content:String(data.get("content")),coverImage:String(data.get("coverImage")||"")||undefined,coverAlt:String(data.get("coverAlt")||"")||undefined,status:data.get("status")==="published"?"published":"draft"});redirect("/admin?saved=1");}
export async function removePost(data:FormData){if(!(await isAdmin()))redirect("/admin");await deletePost(String(data.get("slug")));redirect("/admin?deleted=1");}
