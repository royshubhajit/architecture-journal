"use client";
import { useState } from "react";
import { useFormStatus } from "react-dom";
import { changeStatus, removePost } from "@/app/admin/actions";
import { DeletePostButton } from "./delete-post-button";
import type { Post } from "@/lib/types";

function StatusButton({published}:{published:boolean}){const {pending}=useFormStatus();return <button disabled={pending} className={published ? "quiet" : "publish-small"}>{pending ? "Saving…" : published ? "Unpublish" : "Publish now"}</button>;}
export function PostLibrary({posts,selectedSlug}:{posts:Post[]; selectedSlug?:string}) {
  const [filter,setFilter]=useState("all"), [search,setSearch]=useState("");
  const shown=posts.filter(post=>(filter==="all"||post.status===filter)&&post.title.toLowerCase().includes(search.toLowerCase()));
  return <aside className="post-library"><div className="library-heading"><h2>Your articles <span>{posts.length}</span></h2><a href="/admin">+ New</a></div><input aria-label="Search your articles" placeholder="Find an article…" value={search} onChange={event=>setSearch(event.target.value)}/><div className="library-filters" aria-label="Filter articles">{[["all","All"],["draft","Drafts"],["published","Published"]].map(([value,label])=><button type="button" key={value} aria-pressed={filter===value} onClick={()=>setFilter(value)}>{label} <span>{value==="all"?posts.length:posts.filter(post=>post.status===value).length}</span></button>)}</div>
    {shown.map(post=><article className={`library-card ${post.slug===selectedSlug?"selected":""}`} key={post.slug}><a className="library-title" href={`/admin?edit=${encodeURIComponent(post.slug)}`}><span className={`status-pill ${post.status}`}>{post.status === "published"?"Published":"Draft"}</span><h3>{post.title}</h3><small>{post.topic}</small><span className="edit-label">Edit article →</span></a><div className="library-actions"><form action={changeStatus}><input type="hidden" name="slug" value={post.slug}/><input type="hidden" name="status" value={post.status==="published"?"draft":"published"}/><StatusButton published={post.status==="published"}/></form>{post.status==="published"&&<a href={`/posts/${post.slug}`} target="_blank" rel="noreferrer">View ↗</a>}<form action={removePost}><input type="hidden" name="slug" value={post.slug}/><DeletePostButton title={post.title}/></form></div></article>)}
    {!shown.length&&<p className="empty">{posts.length?"No matching articles.":"Your first article will appear here."}</p>}
  </aside>;
}
