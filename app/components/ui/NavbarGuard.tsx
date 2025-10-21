// PATH: app/components/ui/NavbarGuard.tsx
"use client"

import { usePathname } from "next/navigation"
import Navbar from "./Navbar"

const SHOW: (string | RegExp)[] = [
  "/",                 // beranda
  "/events",           // daftar event
  /^\/events\/[^/]+$/, // detail event: /events/<slug|id>
  "/categories",
  "/about",
  "/contact",
  // tambah sendiri kalau perlu, contoh: "/news", /^\/news\/.+$/
]

function shouldShow(pathname: string) {
  return SHOW.some((p) =>
    typeof p === "string"
      ? pathname === p || pathname.startsWith(p + "/")
      : p.test(pathname)
  )
}

export default function NavbarGuard() {
  const pathname = usePathname()
  return shouldShow(pathname) ? <Navbar /> : null
}
