"use client"

import { usePathname } from "next/navigation";
import Footer from "./Footer"

const HIDE =  [ "/auth", "/admin/events", "/admin/setup", "/admin/danger", "/admin/featured" ]

const FooterGuard = () => {
  const pathname = usePathname();
  const hidden = HIDE.some(p => pathname.startsWith(p));
  if (hidden) return null;
  return <Footer />;
}

export default FooterGuard