// PATH: app/components/ui/Navbar.tsx
"use client"

import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import { useEffect, useState, MouseEvent } from "react"

const NAV = [
  { href: "/", label: "Beranda" },
  { href: "/events", label: "Agenda" },
  { href: "/#about", label: "Tentang" },
]

export default function Navbar() {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [hash, setHash] = useState<string>("")

  useEffect(() => { setOpen(false) }, [pathname, hash])

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    const onHash = () => setHash(window.location.hash || "")
    onScroll()
    onHash()
    window.addEventListener("scroll", onScroll)
    window.addEventListener("hashchange", onHash)
    return () => {
      window.removeEventListener("scroll", onScroll)
      window.removeEventListener("hashchange", onHash)
    }
  }, [])

  const isActive = (href: string) => {
    const [base, anchor] = href.split("#")
    if (anchor) return pathname === (base || "/") && hash === `#${anchor}`
    if ((base || "/") === "/") return pathname === "/" && hash === ""
    return pathname === base || pathname.startsWith(`${base}/`)
  }

  const handleAnchorClick = (e: MouseEvent<HTMLAnchorElement>, href: string) => {
    const [base, anchor] = href.split("#")
    if (!anchor) return
    if (pathname !== (base || "/")) return

    const el = document.getElementById(anchor)
    if (!el) return
    e.preventDefault()
    const headerHeight = 64
    const top = el.getBoundingClientRect().top + window.scrollY - headerHeight - 8
    window.scrollTo({ top, behavior: "smooth" })
    history.replaceState(null, "", `#${anchor}`)
    setHash(`#${anchor}`)
  }

  const handleHomeClick = (e: MouseEvent<HTMLAnchorElement>) => {
    if (pathname === "/") {
      e.preventDefault()
      history.replaceState(null, "", "/")
      setHash("")
      window.scrollTo({ top: 0, behavior: "smooth" })
      setOpen(false)
    }
  }

  return (
    <header
      role="banner"
      className={[
        "sticky top-0 z-50 w-full border-b bg-white/60 backdrop-blur supports-[backdrop-filter]:bg-white/50",
        "transition-shadow",
        scrolled ? "border-zinc-200/80 shadow-sm" : "border-zinc-200/60 shadow-[0_0_0_0_rgba(0,0,0,0)]",
      ].join(" ")}
    >
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        {/* Brand: logo + teks singkat (teks disembunyikan di mobile) */}
        <Link
          href="/"
          onClick={handleHomeClick}
          className="group no-underline flex items-center gap-2"
          aria-label="Beranda"
          title="Beranda"
        >
          <Image
            src="/logo.rmv.png"   // simpan file di /public/logo.rmv.png
            alt="Logo Majabudaya"
            width={36}
            height={36}
            priority
            className="h-14 w-auto select-none gap-0"
          />
          <span className="hidden md:inline text-base font-semibold tracking-tight text-zinc-900 group-hover:text-emerald-700">
            Agenda Budaya
          </span>
          <span className="sr-only">Portal Event & Budaya Majalengka</span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-1 md:flex" aria-label="Primary">
          {NAV.map((item) => {
            const isHash = item.href.includes("#")
            const isHome = item.href === "/"
            const active = isActive(item.href)
            return (
              <Link
                key={item.href}
                href={item.href}
                prefetch={false}
                onClick={
                  isHash ? (e) => handleAnchorClick(e, item.href)
                  : isHome ? handleHomeClick
                  : undefined
                }
                aria-current={active ? "page" : undefined}
                className={[
                  "no-underline relative rounded-lg px-3 py-2 text-sm transition",
                  active ? "text-emerald-700" : "text-zinc-700 hover:text-emerald-700",
                ].join(" ")}
              >
                {item.label}
                {/* Active underline */}
                <span
                  className={[
                    "pointer-events-none absolute inset-x-2 -bottom-0.5 h-0.5 rounded-full bg-emerald-600 transition",
                    active ? "opacity-100" : "opacity-0 group-hover:opacity-50",
                  ].join(" ")}
                />
              </Link>
            )
          })}

          {/* CTA kanan */}
          <Link
            href="/auth/sign-in"
            prefetch={false}
            className="no-underline ml-2 inline-flex items-center rounded-2xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
          >
            Admin
          </Link>
        </nav>

        {/* Hamburger (mobile) */}
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="inline-flex items-center justify-center rounded-xl p-2 text-zinc-700 hover:bg-zinc-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 md:hidden"
          aria-label="Toggle navigation menu"
          aria-expanded={open}
          aria-controls="mobile-menu"
        >
          <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2">
            {open ? (
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5M3.75 17.25h16.5" />
            )}
          </svg>
        </button>
      </div>

      {/* Mobile panel */}
      <div
        id="mobile-menu"
        className={[
          "md:hidden transition-[max-height,opacity] duration-300 ease-out overflow-hidden border-t border-zinc-200",
          open ? "max-h-96 opacity-100" : "max-h-0 opacity-0",
        ].join(" ")}
      >
        <nav className="mx-auto max-w-6xl px-4 py-3" aria-label="Mobile">
          <ul className="space-y-1">
            {NAV.map((item) => {
              const isHash = item.href.includes("#")
              const isHome = item.href === "/"
              const active = isActive(item.href)
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    prefetch={false}
                    onClick={(e) => {
                      if (isHash) handleAnchorClick(e, item.href)
                      else if (isHome) handleHomeClick(e)
                      setOpen(false)
                    }}
                    aria-current={active ? "page" : undefined}
                    className={[
                      "no-underline block rounded-xl px-3 py-2 text-sm transition",
                      active ? "bg-emerald-50 text-emerald-700" : "text-zinc-800 hover:bg-zinc-100",
                    ].join(" ")}
                  >
                    {item.label}
                  </Link>
                </li>
              )
            })}
            <li className="pt-2">
              <Link
                href="/auth/sign-in"
                prefetch={false}
                onClick={() => setOpen(false)}
                className="no-underline inline-flex w-full items-center justify-center rounded-2xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
              >
                Masuk Admin
              </Link>
            </li>
          </ul>
        </nav>
      </div>
    </header>
  )
}
