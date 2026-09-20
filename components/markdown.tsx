import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import sanitizeHtml from "sanitize-html";

export function Markdown({content,format="markdown"}:{content:string;format?:"markdown"|"html"}) {
  if (format === "html") {
    const clean = sanitizeHtml(content, {
      allowedTags: ["p","h2","h3","strong","em","s","ul","ol","li","blockquote","pre","code","a","img","hr","br"],
      allowedAttributes: { a:["href","target","rel"], img:["src","alt","loading","decoding"] },
      allowedSchemes: ["http","https","mailto"],
      allowProtocolRelative: false,
      transformTags: { a: sanitizeHtml.simpleTransform("a", { rel:"noreferrer noopener" }, true), img: sanitizeHtml.simpleTransform("img", { loading:"lazy", decoding:"async" }, true) }
    });
    return <div className="prose" dangerouslySetInnerHTML={{__html:clean}}/>;
  }
  return <div className="prose"><ReactMarkdown remarkPlugins={[remarkGfm]} components={{
    a: ({...props}) => <a {...props} target={props.href?.startsWith("http")?"_blank":undefined} rel={props.href?.startsWith("http")?"noreferrer":undefined}/>,
    img: ({...props}) => <img {...props} loading="lazy"/>
  }}>{content}</ReactMarkdown></div>;
}
