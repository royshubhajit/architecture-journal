"use client";
import { useMemo, useState } from "react";
import { useFormStatus } from "react-dom";
import { changeStatus, duplicatePost, removePost } from "@/app/admin/actions";
import { DeletePostButton } from "./delete-post-button";
import type { Post } from "@/lib/types";

function StatusButton({published}:{published:boolean}){const {pending}=useFormStatus();return <button disabled={pending} className={published ? "quiet" : "publish-small"}>{pending ? "Saving…" : published ? "Move to drafts" : "Publish now"}</button>;}
function DuplicateButton(){const {pending}=useFormStatus();return <button className="text-action" disabled={pending}>{pending?"Copying…":"Duplicate"}</button>;}

export function PostLibrary({posts,selectedSlug}:{posts:Post[]; selectedSlug?:string}) {
  const [filter,setFilter]=useState("all"), [search,setSearch]=useState(""), [sort,setSort]=useState("updated");
  const shown=useMemo(()=>{
    const query=search.trim().toLowerCase();
    const matching=posts.filter(post=>(filter==="all"||post.status===filter)&&(!query||`${post.title} ${post.topic} ${post.excerpt} ${post.content.replace(/<[^>]+>/g," ")}`.toLowerCase().includes(query)));
    return matching.sort((a,b)=>sort==="title"?a.title.localeCompare(b.title):sort==="oldest"?+new Date(a.updatedAt)-+new Date(b.updatedAt):sort==="status"?a.status.localeCompare(b.status)||a.title.localeCompare(b.title):+new Date(b.updatedAt)-+new Date(a.updatedAt));
  },[posts,filter,search,sort]);
  return <aside className="post-library"><div className="library-heading"><div><p className="eyebrow">Article index</p><h2>All writing <span>{posts.length}</span></h2></div><a href="/admin">+ New</a></div><input aria-label="Search articles by title, topic or content" placeholder="Search title, topic or text…" value={search} onChange={event=>setSearch(event.target.value)}/><div className="library-controls"><div className="library-filters" aria-label="Filter articles">{[["all","All"],["draft","Drafts"],["published","Published"]].map(([value,label])=><button type="button" key={value} aria-pressed={filter===value} onClick={()=>setFilter(value)}>{label} <span>{value==="all"?posts.length:posts.filter(post=>post.status===value).length}</span></button>)}</div><label className="sort-control"><span>Sort</span><select aria-label="Sort articles" value={sort} onChange={event=>setSort(event.target.value)}><option value="updated">Recently edited</option><option value="oldest">Oldest edited</option><option value="title">Title A–Z</option><option value="status">Status</option></select></label></div>
    <div className="library-results" aria-live="polite"><p>{shown.length} {shown.length===1?"article":"articles"}</p>{shown.map((post,index)=><article className={`library-card ${post.slug===selectedSlug?"selected":""}`} key={post.slug}><a className="library-title" href={`/admin?edit=${encodeURIComponent(post.slug)}`}><span className="library-index">{String(index+1).padStart(2,"0")}</span><div><span className={`status-pill ${post.status}`}>{post.status === "published"?"Published":"Draft"}</span><h3>{post.title}</h3><small>{post.topic} · Edited {new Intl.DateTimeFormat("en",{month:"short",day:"numeric"}).format(new Date(post.updatedAt))}</small><span className="edit-label">Open editor →</span></div></a><div className="library-actions"><form action={changeStatus}><input type="hidden" name="slug" value={post.slug}/><input type="hidden" name="status" value={post.status==="published"?"draft":"published"}/><StatusButton published={post.status==="published"}/></form>{post.status==="published"&&<a href={`/posts/${post.slug}`} target="_blank" rel="noreferrer">View ↗</a>}<form action={duplicatePost}><input type="hidden" name="slug" value={post.slug}/><DuplicateButton/></form><form action={removePost}><input type="hidden" name="slug" value={post.slug}/><DeletePostButton title={post.title}/></form></div></article>)}
    {!shown.length&&<p className="empty">{posts.length?"No articles match this search and filter.":"Your first article will appear here."}</p>}</div>
  </aside>;
}
