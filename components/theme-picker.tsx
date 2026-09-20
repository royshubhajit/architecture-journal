"use client";
import { useEffect, useState } from "react";
import { Moon, Sun, Grid3X3 } from "lucide-react";
const themes = [{id:"paper",label:"Paper",Icon:Sun},{id:"ink",label:"Ink",Icon:Moon},{id:"grid",label:"Grid",Icon:Grid3X3}];
export function ThemePicker({defaultTheme="paper"}:{defaultTheme?:string}) {
  const [theme,setTheme] = useState(defaultTheme);
  useEffect(()=>{ const saved=localStorage.getItem("aj-theme")||defaultTheme; setTheme(saved); document.documentElement.dataset.theme=saved; },[defaultTheme]);
  function choose(id:string){setTheme(id);localStorage.setItem("aj-theme",id);document.documentElement.dataset.theme=id;}
  return <div className="theme-picker" aria-label="Reading theme">{themes.map(({id,label,Icon})=><button key={id} className={theme===id?"active":""} onClick={()=>choose(id)} title={`${label} theme`} aria-label={`${label} theme`}><Icon size={15}/></button>)}</div>;
}
