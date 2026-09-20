"use client";

import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import Placeholder from "@tiptap/extension-placeholder";
import { marked } from "marked";
import { Bold, Code2, Heading2, ImagePlus, Italic, Link as LinkIcon, List, ListOrdered, LoaderCircle, Minus, Quote, Redo2, Undo2, X } from "lucide-react";
import { useActionState, useEffect, useMemo, useRef, useState } from "react";
import { saveArticleState } from "@/app/admin/actions";
import type { Post } from "@/lib/types";
import { SaveControls } from "./save-controls";

type UploadResult={url:string;name:string};

async function upload(file:File):Promise<UploadResult>{
  const body=new FormData(); body.set("file",file);
  const response=await fetch("/api/uploads",{method:"POST",body});
  const result=await response.json();
  if(!response.ok) throw new Error(result.error||"Upload failed.");
  return result;
}

function initialHtml(post?:Post) {
  if (!post?.content) return "";
  return post.contentFormat === "html" ? post.content : marked.parse(post.content, { async:false }) as string;
}

function ToolButton({label,active=false,disabled=false,onClick,children}:{label:string;active?:boolean;disabled?:boolean;onClick:()=>void;children:React.ReactNode}) {
  return <button type="button" title={label} aria-label={label} aria-pressed={active} disabled={disabled} className={active?"active":""} onClick={onClick}>{children}</button>;
}

export function ArticleEditor({post}:{post?:Post}){
  const [saveState,saveAction]=useActionState(saveArticleState,{error:""});
  const dirty=useRef(false);
  const startingContent=useMemo(()=>initialHtml(post),[post]);
  const [content,setContent]=useState(startingContent);
  const [cover,setCover]=useState<UploadResult|null>(post?.coverImage?{url:post.coverImage,name:"Existing cover"}:null);
  const [coverAlt,setCoverAlt]=useState(post?.coverAlt||"");
  const [busy,setBusy]=useState<"cover"|"inline"|null>(null);
  const [error,setError]=useState("");

  const editor=useEditor({
    immediatelyRender:false,
    extensions:[StarterKit,Image.configure({inline:false,allowBase64:false}),Placeholder.configure({placeholder:"Start writing. Use the toolbar to add structure, lists, links, quotes and images…"})],
    content:startingContent,
    editorProps:{attributes:{class:"notion-canvas prose","aria-label":"Article content"}},
    onUpdate:({editor:next})=>{setContent(next.getHTML());dirty.current=true;}
  });

  useEffect(()=>{
    const guard=(event:BeforeUnloadEvent)=>{if(dirty.current){event.preventDefault();event.returnValue="";}};
    window.addEventListener("beforeunload",guard);
    return()=>window.removeEventListener("beforeunload",guard);
  },[]);

  async function addCover(file?:File){
    if(!file)return; setBusy("cover");setError("");
    try{setCover(await upload(file));dirty.current=true;}catch(e){setError(e instanceof Error?e.message:"Upload failed.");}finally{setBusy(null)}
  }
  async function addInline(file?:File){
    if(!file||!editor)return; setBusy("inline");setError("");
    try{const image=await upload(file);editor.chain().focus().setImage({src:image.url,alt:"Article illustration"}).run();dirty.current=true;}catch(e){setError(e instanceof Error?e.message:"Upload failed.");}finally{setBusy(null)}
  }
  function setLink(){
    if(!editor)return;
    const previous=editor.getAttributes("link").href as string|undefined;
    const url=window.prompt("Paste a link",previous||"https://");
    if(url===null)return;
    if(!url.trim()){editor.chain().focus().extendMarkRange("link").unsetLink().run();return;}
    editor.chain().focus().extendMarkRange("link").setLink({href:url.trim()}).run();
  }

  return <form action={saveAction} onChange={()=>{dirty.current=true;}} onSubmit={()=>{dirty.current=false;}} className="editor visual-editor">
    {post&&<input type="hidden" name="originalSlug" value={post.slug}/>}<input type="hidden" name="status" value={post?.status||"draft"}/><input type="hidden" name="contentFormat" value="html"/><input type="hidden" name="content" value={content}/>
    {(error||saveState.error)&&<p className="notice error" role="alert">{error||saveState.error}</p>}
    <div className="document-fields"><label className="title-field"><span>Title</span><input name="title" required defaultValue={post?.title} placeholder="Untitled article"/></label><div className="document-meta"><label>Topic<input name="topic" defaultValue={post?.topic} placeholder="Software architecture"/></label><label>Summary <span>Optional — generated if blank</span><textarea name="excerpt" rows={3} defaultValue={post?.excerpt} placeholder="What will the reader understand?"/></label></div></div>
    <fieldset className="cover-field"><legend>Cover image <span>Optional</span></legend>{cover&&<div className="cover-preview"><img src={cover.url} alt={coverAlt||"Selected cover preview"}/><button type="button" className="remove-image" onClick={()=>{setCover(null);dirty.current=true;}} aria-label="Remove cover"><X size={16}/></button></div>}<label className="upload-drop">{busy==="cover"?<LoaderCircle className="spin"/>:<ImagePlus/>}<strong>{busy==="cover"?"Uploading…":"Choose cover image"}</strong><span>Shown above the article · JPG, PNG, WebP or GIF · up to 4 MB</span><input type="file" accept="image/jpeg,image/png,image/webp,image/gif" onChange={e=>addCover(e.target.files?.[0])}/></label><label>Or use an image URL<input name="coverImage" value={cover?.url||""} onChange={e=>{setCover(e.target.value?{url:e.target.value,name:"Remote image"}:null);dirty.current=true;}} placeholder="https://…"/></label>{cover&&<label>Image description <span>For accessibility; never displayed as a filename or caption</span><input name="coverAlt" value={coverAlt} onChange={e=>setCoverAlt(e.target.value)} required placeholder="Describe what the image shows"/></label>}</fieldset>
    <div className="article-field"><div className="article-label"><strong>Article</strong><span>This is how the published article will look</span></div><div className="format-toolbar" aria-label="Formatting tools">
      <ToolButton label="Paragraph" active={!!editor?.isActive("paragraph")} disabled={!editor} onClick={()=>editor?.chain().focus().setParagraph().run()}>Aa</ToolButton>
      <ToolButton label="Heading" active={!!editor?.isActive("heading",{level:2})} disabled={!editor} onClick={()=>editor?.chain().focus().toggleHeading({level:2}).run()}><Heading2 size={16}/></ToolButton>
      <ToolButton label="Bold" active={!!editor?.isActive("bold")} disabled={!editor} onClick={()=>editor?.chain().focus().toggleBold().run()}><Bold size={16}/></ToolButton>
      <ToolButton label="Italic" active={!!editor?.isActive("italic")} disabled={!editor} onClick={()=>editor?.chain().focus().toggleItalic().run()}><Italic size={16}/></ToolButton>
      <ToolButton label="Bullet list" active={!!editor?.isActive("bulletList")} disabled={!editor} onClick={()=>editor?.chain().focus().toggleBulletList().run()}><List size={16}/></ToolButton>
      <ToolButton label="Numbered list" active={!!editor?.isActive("orderedList")} disabled={!editor} onClick={()=>editor?.chain().focus().toggleOrderedList().run()}><ListOrdered size={16}/></ToolButton>
      <ToolButton label="Quote" active={!!editor?.isActive("blockquote")} disabled={!editor} onClick={()=>editor?.chain().focus().toggleBlockquote().run()}><Quote size={16}/></ToolButton>
      <ToolButton label="Code block" active={!!editor?.isActive("codeBlock")} disabled={!editor} onClick={()=>editor?.chain().focus().toggleCodeBlock().run()}><Code2 size={16}/></ToolButton>
      <ToolButton label="Link" active={!!editor?.isActive("link")} disabled={!editor} onClick={setLink}><LinkIcon size={16}/></ToolButton>
      <ToolButton label="Divider" disabled={!editor} onClick={()=>editor?.chain().focus().setHorizontalRule().run()}><Minus size={16}/></ToolButton>
      <span className="toolbar-spacer"/>
      <ToolButton label="Undo" disabled={!editor?.can().undo()} onClick={()=>editor?.chain().focus().undo().run()}><Undo2 size={16}/></ToolButton>
      <ToolButton label="Redo" disabled={!editor?.can().redo()} onClick={()=>editor?.chain().focus().redo().run()}><Redo2 size={16}/></ToolButton>
    </div><EditorContent editor={editor}/><p className="paste-hint">Paste from a document or web page and headings, lists, links, bold and italic formatting stay intact.</p></div>
    <div className="editor-actions"><label className="inline-upload">{busy==="inline"?<LoaderCircle size={17} className="spin"/>:<ImagePlus size={17}/>} {busy==="inline"?"Uploading…":"Insert image here"}<input type="file" disabled={!!busy} accept="image/jpeg,image/png,image/webp,image/gif" onChange={e=>addInline(e.target.files?.[0])}/></label><span>Click in the article first; the image appears at that position.</span></div>
    <SaveControls published={post?.status==="published"} busy={!!busy}/>
  </form>;
}
