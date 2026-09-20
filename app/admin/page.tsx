import { isAdmin } from "@/lib/auth";
import { getPosts } from "@/lib/posts";
import { getSiteSettings } from "@/lib/settings";
import { login, logout } from "./actions";
import { ArticleEditor } from "@/components/article-editor";
import { PostLibrary } from "@/components/post-library";
import { AdminSettings } from "@/components/admin-settings";
export const dynamic = "force-dynamic";

type Query={error?:string;saved?:string;deleted?:string;edit?:string;duplicated?:string;section?:string;themeSaved?:string;themeError?:string;passwordChanged?:string};

export default async function Admin({searchParams}:{searchParams:Promise<Query>}) {
  const qs = await searchParams;
  if (!(await isAdmin())) return <main className="admin-shell"><section className="login-card"><p className="eyebrow">Private author access</p><h1>Welcome back.</h1><p>Sign in to write and manage your articles.</p>{qs.error && <p className="notice error" role="alert">Incorrect password. Please try again.</p>}<form action={login}><label>Password<input type="password" name="password" required autoComplete="current-password" autoFocus/></label><button>Sign in</button></form></section></main>;
  const [posts,settings] = await Promise.all([getPosts(true),getSiteSettings()]);
  const selected = posts.find(post => post.slug === qs.edit);
  const section = qs.section === "settings" ? "settings" : "articles";
  return <main className="admin-shell"><div className="admin-head"><div><p className="eyebrow">Publishing workspace</p><h1>{section==="settings"?"Settings":selected?"Edit article":"New article"}</h1><p>{section==="settings"?"Control the look and security of your blog.":"Write and publish without leaving the page."}</p></div><div className="workspace-links"><a className="quiet" href="/" target="_blank" rel="noreferrer">View website ↗</a><form action={logout}><button className="quiet">Sign out</button></form></div></div>
    <nav className="admin-tabs" aria-label="Admin sections"><a className={section==="articles"?"active":""} href="/admin">Articles <span>{posts.length}</span></a><a className={section==="settings"?"active":""} href="/admin?section=settings">Appearance & security</a></nav>
    {qs.saved && <p className="notice" role="status">{qs.saved === "published" ? "Published. Your article is now live." : "Draft saved. It is not visible to readers."}</p>}
    {qs.deleted && <p className="notice" role="status">Article deleted permanently.</p>}
    {qs.duplicated && <p className="notice" role="status">A private draft copy was created. You can edit it safely.</p>}
    {qs.themeSaved && <p className="notice" role="status">Theme applied. It is now the default for your blog.</p>}
    {qs.themeError && <p className="notice error" role="alert">That theme could not be applied.</p>}
    {qs.passwordChanged && <p className="notice" role="status">Password changed. Other admin sessions have been signed out.</p>}
    {section==="articles"&&<>{qs.edit && !selected && <p className="notice error">That article no longer exists. Choose another article from the index.</p>}<div className="admin-grid"><section className="editor-column">{selected && <div className="editing-bar"><span><strong>{selected.title}</strong> · {selected.status === "published" ? "Live on your website" : "Private draft"}</span><a href="/admin">+ New article</a></div>}<ArticleEditor key={`${selected?.slug || "new"}-${selected?.updatedAt || ""}`} post={selected}/></section><PostLibrary posts={posts} selectedSlug={selected?.slug}/></div></>}
    {section==="settings"&&<AdminSettings theme={settings.theme}/>}
  </main>;
}
