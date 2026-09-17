import type { ReactNode } from "react";
function inline(s:string):ReactNode[]{ return s.split(/(`[^`]+`|\*\*[^*]+\*\*)/g).map((x,i)=>x.startsWith("`")?<code key={i}>{x.slice(1,-1)}</code>:x.startsWith("**")?<strong key={i}>{x.slice(2,-2)}</strong>:x); }
export function Markdown({content}:{content:string}) {
  const blocks=content.trim().split(/\r?\n\s*\r?\n/).map(block=>block.trim());
  return <div className="prose">{blocks.map((b,i)=>{
    const image=b.match(/^!\[([^\]]*)\]\(([^)]+)\)$/);
    if(image) return <figure key={i}><img src={image[2]} alt={image[1]}/>{image[1]&&<figcaption>{image[1]}</figcaption>}</figure>;
    if(b.startsWith("## ")) return <h2 key={i}>{b.slice(3)}</h2>;
    if(b.startsWith("> ")) return <blockquote key={i}>{inline(b.slice(2))}</blockquote>;
    if(b.split("\n").every(x=>x.startsWith("- "))) return <ul key={i}>{b.split("\n").map((x,j)=><li key={j}>{inline(x.slice(2))}</li>)}</ul>;
    return <p key={i}>{inline(b)}</p>;
  })}</div>;
}
