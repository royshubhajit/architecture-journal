"use client";
import { useRef, useState } from "react";
import { ImagePlus, LoaderCircle, X } from "lucide-react";
import { publish } from "@/app/admin/actions";
import type { Post } from "@/lib/types";

type UploadResult = { url: string; name: string };
async function upload(file: File): Promise<UploadResult> {
  const body = new FormData(); body.set("file", file);
  const response = await fetch("/api/uploads", { method: "POST", body });
  const result = await response.json();
  if (!response.ok) throw new Error(result.error || "Upload failed.");
  return result;
}

export function ArticleEditor({post}:{post?:Post}) {
  const articleRef = useRef<HTMLTextAreaElement>(null);
  const [content,setContent] = useState(post?.content||""); const [cover,setCover] = useState<UploadResult|null>(post?.coverImage?{url:post.coverImage,name:"Existing cover"}:null);
  const [coverAlt,setCoverAlt] = useState(post?.coverAlt||""); const [busy,setBusy] = useState<"cover"|"inline"|null>(null); const [error,setError]=useState("");
  async function addCover(file?:File){if(!file)return;setBusy("cover");setError("");try{setCover(await upload(file));}catch(e){setError(e instanceof Error?e.message:"Upload failed.");}finally{setBusy(null)}}
  async function addInline(file?:File){if(!file)return;setBusy("inline");setError("");try{const image=await upload(file);const area=articleRef.current;const at=area?.selectionStart??content.length;const alt=image.name.replace(/\.[^.]+$/,"").replace(/[-_]+/g," ");const markdown=`\n\n![${alt}](${image.url})\n\n`;const next=content.slice(0,at)+markdown+content.slice(at);setContent(next);requestAnimationFrame(()=>{area?.focus();area?.setSelectionRange(at+markdown.length,at+markdown.length)});}catch(e){setError(e instanceof Error?e.message:"Upload failed.");}finally{setBusy(null)}}
  return <form action={publish} className="editor">
    {post&&<input type="hidden" name="originalSlug" value={post.slug}/>}
    {error&&<p className="notice error" role="alert">{error}</p>}
    <label>Title<input name="title" required defaultValue={post?.title} placeholder="A precise, useful title"/></label>
    <div className="two"><label>Topic<input name="topic" required defaultValue={post?.topic} placeholder="Distributed systems"/></label><label>Status<select name="status" defaultValue={post?.status||"draft"}><option value="draft">Draft</option><option value="published">Published</option></select></label></div>
    <label>Summary<textarea name="excerpt" required rows={3} defaultValue={post?.excerpt} placeholder="What will the reader understand?"/></label>
    <fieldset className="cover-field"><legend>Cover image <span>Optional</span></legend>{cover&&<div className="cover-preview"><img src={cover.url} alt={coverAlt||"Selected cover preview"}/><button type="button" className="remove-image" onClick={()=>setCover(null)} aria-label="Remove cover"><X size={16}/></button></div>}<label className="upload-drop">{busy==="cover"?<LoaderCircle className="spin"/>:<ImagePlus/>}<strong>{busy==="cover"?"Uploading…":"Choose cover image"}</strong><span>JPG, PNG, WebP or GIF · up to 4 MB</span><input type="file" accept="image/jpeg,image/png,image/webp,image/gif" onChange={e=>addCover(e.target.files?.[0])}/></label>
      <label>Or use an image URL<input name="coverImage" value={cover?.url||""} onChange={e=>setCover(e.target.value?{url:e.target.value,name:"Remote image"}:null)} placeholder="https://… or /uploads/…"/></label>{cover&&<label>Cover description<input name="coverAlt" value={coverAlt} onChange={e=>setCoverAlt(e.target.value)} required placeholder="Describe the image for readers"/></label>}
    </fieldset>
    <label>Article <span>Markdown supported</span><textarea ref={articleRef} className="content-input" name="content" required rows={18} value={content} onChange={e=>setContent(e.target.value)} placeholder="Start with the problem…"/></label>
    <div className="editor-actions"><label className="inline-upload">{busy==="inline"?<LoaderCircle size={17} className="spin"/>:<ImagePlus size={17}/>} {busy==="inline"?"Uploading…":"Insert image at cursor"}<input type="file" accept="image/jpeg,image/png,image/webp,image/gif" onChange={e=>addInline(e.target.files?.[0])}/></label><button>{post?"Update post":"Save post"}</button></div>
  </form>;
}
