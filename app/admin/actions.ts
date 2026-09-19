"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { clearAdminSession, isAdmin, setAdminSession } from "@/lib/auth";
import { deletePost, getPost, savePost } from "@/lib/posts";

export async function login(data:FormData) {
  if (!process.env.ADMIN_PASSWORD || String(data.get("password")) !== process.env.ADMIN_PASSWORD) redirect("/admin?error=1");
  await setAdminSession(); redirect("/admin");
}
export async function logout(){await clearAdminSession(); redirect("/admin");}
export async function saveArticleState(_previous:{error:string}, data:FormData):Promise<{error:string}> {
  try { await publish(data); return {error:""}; }
  catch(error) {
    if(error && typeof error==="object" && "digest" in error && String(error.digest).startsWith("NEXT_REDIRECT")) throw error;
    return {error:"Your article could not be saved. Your text is still here—check your connection and try again."};
  }
}
export async function publish(data:FormData) {
  if (!(await isAdmin())) redirect("/admin");
  const title = String(data.get("title") || "").trim(), content = String(data.get("content") || "").trim();
  if (!title || !content) throw new Error("Add a title and article text before saving.");
  const status = data.get("intent") === "draft" ? "draft" : data.get("intent") === "published" ? "published" : data.get("status") === "published" ? "published" : "draft";
  const post = await savePost({originalSlug:String(data.get("originalSlug") || "") || undefined, title, content, excerpt:String(data.get("excerpt") || "").trim() || content.replace(/[#*_`]/g, "").slice(0,180), topic:String(data.get("topic") || "").trim() || "Software architecture", coverImage:String(data.get("coverImage") || "") || undefined, coverAlt:String(data.get("coverAlt") || "") || undefined, status});
  revalidatePath("/"); revalidatePath(`/posts/${post.slug}`); revalidatePath("/admin");
  redirect(`/admin?edit=${encodeURIComponent(post.slug)}&saved=${status}`);
}
export async function changeStatus(data:FormData) {
  if (!(await isAdmin())) redirect("/admin");
  const post = await getPost(String(data.get("slug")), true);
  if (!post) redirect("/admin");
  const status = data.get("status") === "published" ? "published" : "draft";
  await savePost({...post, originalSlug:post.slug, status});
  revalidatePath("/"); revalidatePath(`/posts/${post.slug}`); revalidatePath("/admin");
  redirect(`/admin?edit=${encodeURIComponent(post.slug)}&saved=${status}`);
}
export async function removePost(data:FormData) {
  if (!(await isAdmin())) redirect("/admin");
  const slug = String(data.get("slug")); await deletePost(slug);
  revalidatePath("/"); revalidatePath(`/posts/${slug}`); revalidatePath("/admin");
  redirect("/admin?deleted=1");
}
