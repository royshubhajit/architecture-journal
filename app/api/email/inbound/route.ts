import { NextRequest, NextResponse } from "next/server"; import { savePost } from "@/lib/posts";
export async function POST(req:NextRequest){
  if(req.headers.get("authorization")!==`Bearer ${process.env.EMAIL_WEBHOOK_SECRET}`)return NextResponse.json({error:"Unauthorized"},{status:401});
  const body=await req.json() as {from?:string;subject?:string;text?:string;topic?:string;publish?:boolean};
  if(!body.from||body.from.toLowerCase()!==process.env.AUTHOR_EMAIL?.toLowerCase())return NextResponse.json({error:"Sender not allowed"},{status:403});
  if(!body.subject||!body.text)return NextResponse.json({error:"subject and text are required"},{status:400});
  const lines=body.text.trim().split("\n"); const excerpt=lines.find(x=>x.trim()&&!x.startsWith("#"))?.trim().slice(0,220)||body.subject;
  const post=await savePost({title:body.subject.replace(/^\[(draft|publish)\]\s*/i,""),excerpt,topic:body.topic||"Fieldnotes",content:body.text,status:body.publish||/^\[publish\]/i.test(body.subject)?"published":"draft"});
  return NextResponse.json({ok:true,slug:post.slug,status:post.status});
}
