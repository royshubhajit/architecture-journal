"use client";
import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { Check, Eye, EyeOff, Grid3X3, Moon, Sun } from "lucide-react";
import { changePasswordState, saveTheme } from "@/app/admin/actions";
import type { BlogTheme } from "@/lib/types";

const themes=[
  {id:"paper" as const,label:"Paper",description:"Warm, editorial and calm.",Icon:Sun,colors:["#f4f1e9","#18231d","#d75f38"]},
  {id:"ink" as const,label:"Ink",description:"Focused dark reading mode.",Icon:Moon,colors:["#111513","#edf0ea","#ff7b52"]},
  {id:"grid" as const,label:"Grid",description:"Technical, crisp and structured.",Icon:Grid3X3,colors:["#eef1f3","#17202b","#255ad8"]}
];

function ThemeSave(){const {pending}=useFormStatus();return <button disabled={pending}>{pending?"Applying…":"Apply theme"}</button>}
function PasswordSave(){const {pending}=useFormStatus();return <button disabled={pending}>{pending?"Updating…":"Change password"}</button>}

export function AdminSettings({theme}:{theme:BlogTheme}){
  const [selected,setSelected]=useState(theme),[show,setShow]=useState(false);
  const [passwordState,passwordAction]=useActionState(changePasswordState,{error:""});
  return <div className="settings-grid"><section className="settings-card"><p className="eyebrow">Appearance</p><h2>Blog theme</h2><p>Choose the default look every new reader sees. Readers can still switch themes for their own device.</p><form action={saveTheme} onSubmit={()=>localStorage.removeItem("aj-theme")}><div className="theme-options">{themes.map(({id,label,description,Icon,colors})=><label key={id} className={`theme-option ${selected===id?"selected":""}`}><input type="radio" name="theme" value={id} checked={selected===id} onChange={()=>setSelected(id)}/><span className="theme-preview" style={{background:colors[0],color:colors[1]}}><Icon size={22}/><i style={{background:colors[2]}}/><b/><b/></span><span><strong>{label}</strong><small>{description}</small></span>{selected===id&&<Check className="theme-check" size={18}/>}</label>)}</div><ThemeSave/></form></section>
    <section className="settings-card"><p className="eyebrow">Security</p><h2>Admin password</h2><p>Change the password used to open this workspace. Other signed-in admin sessions are invalidated immediately.</p>{passwordState.error&&<p className="notice error" role="alert">{passwordState.error}</p>}<form action={passwordAction}><label>Current password<input type={show?"text":"password"} name="currentPassword" required autoComplete="current-password"/></label><label>New password <span>At least 12 characters</span><input type={show?"text":"password"} name="newPassword" required minLength={12} autoComplete="new-password"/></label><label>Confirm new password<input type={show?"text":"password"} name="confirmPassword" required minLength={12} autoComplete="new-password"/></label><button type="button" className="show-password" onClick={()=>setShow(!show)}>{show?<EyeOff size={16}/>:<Eye size={16}/>} {show?"Hide passwords":"Show passwords"}</button><div className="settings-submit"><PasswordSave/></div></form></section></div>;
}
