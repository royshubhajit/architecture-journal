"use client";
import { useState } from "react";
export function DeletePostButton({title}:{title:string}) {
  const [confirming,setConfirming]=useState(false);
  if(confirming)return <span className="delete-confirm"><span>Delete permanently?</span><button className="delete-post danger" type="submit">Yes, delete</button><button className="delete-post" type="button" onClick={()=>setConfirming(false)}>Cancel</button></span>;
  return <button className="delete-post" type="button" aria-label={`Delete ${title}`} onClick={()=>setConfirming(true)}>Delete</button>;
}
