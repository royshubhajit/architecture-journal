import type { Metadata } from "next";
import Link from "next/link";
import { ThemePicker } from "@/components/theme-picker";
import "./globals.css";
export const metadata: Metadata = { title: { default: "The Architecture Fieldnotes", template: "%s — The Architecture Fieldnotes" }, description: "Clear fieldnotes on building reliable software systems.", icons: { icon: "/favicon.svg" } };
export default function Layout({children}:{children:React.ReactNode}) { return <html lang="en" suppressHydrationWarning><body><header className="site-header"><Link className="brand" href="/"><span className="brand-mark">AF</span><span>The Architecture<br/>Fieldnotes</span></Link><nav><Link href="/#writing">Writing</Link><Link href="/about">About</Link><ThemePicker/></nav></header>{children}<footer><span>© {new Date().getFullYear()} The Architecture Fieldnotes</span><span>Systems, explained from first principles.</span></footer></body></html>; }
