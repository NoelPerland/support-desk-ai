import type { Metadata } from "next";
import { NAME } from "../lib/product";
import "./globals.css";
export const metadata: Metadata = {title: NAME, description: NAME === "Reply Desk" ? "A considered support workspace. Triage, draft, review, resolve." : "Turn meeting notes into decisions and work that moves."};
export default function Layout({children}:{children: React.ReactNode}) { return <html lang="en"><body>{children}</body></html>; }
