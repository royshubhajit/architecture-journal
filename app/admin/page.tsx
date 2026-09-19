import { isAdmin } from "@/lib/auth";
import { getPosts } from "@/lib/posts";
import { login, logout } from "./actions";
import { ArticleEditor } from "@/components/article-editor";
import { PostLibrary } from "@/components/post-library";
export const dynamic = "force-dynamic";

export default async function Admin({searchParams}:{searchParams:Promise<{error?:string; saved?:string; deleted?:string; edit?:string}>}) {
  const qs = await searchParams;
  if (!(await isAdmin())) return <main className="admin-shell"><section className="login-card"><p className="eyebrow">Private author access</p><h1>Welcome back.</h1><p>Sign in to write and manage your articles.</p>{qs.error && <p className="notice error" role="alert">Incorrect password. Please try again.</p>}<form action={login}><label>Password<input type="password" name="password" required autoComplete="current-password" autoFocus/></label><button>Sign in</button></form></section></main>;
  const posts = await getPosts(true);
  const selected = posts.find(post => post.slug === qs.edit);
  return <main className="admin-shell"><div className="admin-head"><div><p className="eyebrow">Your publishing workspace</p><h1>{selected ? "Edit article" : "New article"}</h1><p>Write, preview, and publish in one place.</p></div><div className="workspace-links"><a className="quiet" href="/" target="_blank" rel="noreferrer">View website ↗</a><form action={logout}><button className="quiet">Sign out</button></form></div></div>
    {qs.saved && <p className="notice" role="status">{qs.saved === "published" ? "Published. Your article is now live." : "Draft saved. It is not visible to readers."}</p>}
    {qs.deleted && <p className="notice" role="status">Article deleted.</p>}
    {qs.edit && !selected && <p className="notice error">That article no longer exists. Choose another article below.</p>}
    <div className="admin-grid"><section className="editor-column">{selected && <div className="editing-bar"><span><strong>{selected.title}</strong> · {selected.status === "published" ? "Live on your website" : "Private draft"}</span><a href="/admin">+ New article</a></div>}<ArticleEditor key={`${selected?.slug || "new"}-${selected?.updatedAt || ""}`} post={selected}/></section><PostLibrary posts={posts} selectedSlug={selected?.slug}/></div>
  </main>;
}
