import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export function Markdown({content}:{content:string}) {
  return <div className="prose"><ReactMarkdown remarkPlugins={[remarkGfm]} components={{
    a: ({...props}) => <a {...props} target={props.href?.startsWith("http")?"_blank":undefined} rel={props.href?.startsWith("http")?"noreferrer":undefined}/>,
    img: ({...props}) => <img {...props} loading="lazy"/>
  }}>{content}</ReactMarkdown></div>;
}
