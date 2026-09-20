"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { changeAdminPassword, clearAdminSession, isAdmin, setAdminSession, verifyAdminPassword } from "@/lib/auth";
import { deletePost, getPost, savePost } from "@/lib/posts";
import { isBlogTheme, saveSiteSettings } from "@/lib/settings";

export async function login(data:FormData) {
  if (!(await verifyAdminPassword(String(data.get("password") || "")))) redirect("/admin?error=1");
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
  const plainText = content.replace(/<[^>]*>/g, " ").replace(/&nbsp;/g, " ").replace(/\s+/g, " ").trim();
  if (!title || !plainText) throw new Error("Add a title and article text before saving.");
  const status = data.get("intent") === "draft" ? "draft" : data.get("intent") === "published" ? "published" : data.get("status") === "published" ? "published" : "draft";
  const post = await savePost({originalSlug:String(data.get("originalSlug") || "") || undefined, title, content, contentFormat:data.get("contentFormat") === "html" ? "html" : "markdown", excerpt:String(data.get("excerpt") || "").trim() || plainText.slice(0,180), topic:String(data.get("topic") || "").trim() || "Software architecture", coverImage:String(data.get("coverImage") || "") || undefined, coverAlt:String(data.get("coverAlt") || "") || undefined, status});
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

export async function duplicatePost(data:FormData) {
  if (!(await isAdmin())) redirect("/admin");
  const original = await getPost(String(data.get("slug")), true);
  if (!original) redirect("/admin");
  const copy = await savePost({ title:`Copy of ${original.title}`, excerpt:original.excerpt, content:original.content, contentFormat:original.contentFormat, topic:original.topic, status:"draft", coverImage:original.coverImage, coverAlt:original.coverAlt });
  revalidatePath("/admin");
  redirect(`/admin?edit=${encodeURIComponent(copy.slug)}&duplicated=1`);
}

export async function saveTheme(data:FormData) {
  if (!(await isAdmin())) redirect("/admin");
  const theme = String(data.get("theme"));
  if (!isBlogTheme(theme)) redirect("/admin?section=settings&themeError=1");
  await saveSiteSettings({ theme });
  revalidatePath("/", "layout");
  redirect("/admin?section=settings&themeSaved=1");
}

export async function changePasswordState(_previous:{error:string}, data:FormData):Promise<{error:string}> {
  if (!(await isAdmin())) redirect("/admin");
  const current = String(data.get("currentPassword") || "");
  const next = String(data.get("newPassword") || "");
  if (next !== String(data.get("confirmPassword") || "")) return { error: "The new passwords do not match." };
  const result = await changeAdminPassword(current, next);
  if (result.error) return result;
  redirect("/admin?section=settings&passwordChanged=1");
}
