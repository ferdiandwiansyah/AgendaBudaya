// PATH: app/components/ui/Navbar.tsx
"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useEffect, useState, MouseEvent } from "react"

const NAV = [
  { href: "/", label: "Beranda" },
  { href: "/events", label: "Agenda" },
  { href: "/#about", label: "Tentang" }, // anchor ke section ABOUT di homepage
]

export default function Navbar() {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [hash, setHash] = useState<string>("")

  // tutup menu saat route/hash berubah
  useEffect(() => { setOpen(false) }, [pathname, hash])

  // track scroll utk shadow + track hash untuk active state anchor
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

  // Aktif:
  // - link dengan hash (#about): aktif HANYA jika pathname === base & window.hash cocok
  // - tanpa hash: aktif jika tepat di base atau child path-nya
  const isActive = (href: string) => {
    const [base, anchor] = href.split("#")
    if (anchor) {
      return pathname === (base || "/") && hash === `#${anchor}`
    }
    if ((base || "/") === "/") return pathname === "/" && hash === "" // pastikan hanya aktif saat hash kosong
    return pathname === base || pathname.startsWith(`${base}/`)
  }

  // Smooth scroll untuk anchor di halaman yang sama (offset header ~ 64px)
  const handleAnchorClick = (e: MouseEvent<HTMLAnchorElement>, href: string) => {
    const [base, anchor] = href.split("#")
    if (!anchor) return
    if (pathname !== (base || "/")) return // biarkan Next navigasi normal ke halaman lain

    const el = document.getElementById(anchor)
    if (!el) return
    e.preventDefault()
    const headerHeight = 64 // kira-kira tinggi header
    const top = el.getBoundingClientRect().top + window.scrollY - headerHeight - 8
    window.scrollTo({ top, behavior: "smooth" })
    // update hash agar state aktif ikut berubah
    history.replaceState(null, "", `#${anchor}`)
    setHash(`#${anchor}`)
  }

  // Klik Beranda: kalau sudah di "/" bersihkan hash & scroll ke top
  const handleHomeClick = (e: MouseEvent<HTMLAnchorElement>) => {
    if (pathname === "/") {
      e.preventDefault()
      history.replaceState(null, "", "/")    // clear hash
      setHash("")
      window.scrollTo({ top: 0, behavior: "smooth" })
      setOpen(false)
    }
    // kalau bukan di "/", biarkan Next navigate normal
  }

  return (
    <header
      className={[
        "sticky top-0 z-50 w-full border-b backdrop-blur transition",
        scrolled ? "border-zinc-200/80 bg-white/80 shadow-sm" : "border-zinc-200/60 bg-white/60",
      ].join(" ")}
      role="banner"
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        {/* Brand */}
        <Link
          href="/"
          onClick={handleHomeClick}
          className="no-underline text-base font-semibold tracking-tight text-zinc-900 hover:text-emerald-700"
          aria-label="Portal Event & Budaya Majalengka - Beranda"
        >
          Portal Event & Budaya Majalengka
        </Link>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-6 md:flex" aria-label="Primary">
          {NAV.map((item) => {
            const isHash = item.href.includes("#")
            const isHome = item.href === "/"
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={
                  isHash ? (e) => handleAnchorClick(e, item.href)
                  : isHome ? handleHomeClick
                  : undefined
                }
                aria-current={isActive(item.href) ? "page" : undefined}
                className={[
                  "no-underline text-sm transition",
                  isActive(item.href)
                    ? "text-emerald-700"
                    : "text-zinc-700 hover:text-emerald-700",
                ].join(" ")}
              >
                {item.label}
              </Link>
            )
          })}

          {/* CTA kanan */}
          <Link
            href="/auth/sign-in"
            className="no-underline inline-flex items-center rounded-2xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
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
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={(e) => {
                      if (isHash) handleAnchorClick(e, item.href)
                      else if (isHome) handleHomeClick(e)
                      setOpen(false)
                    }}
                    aria-current={isActive(item.href) ? "page" : undefined}
                    className={[
                      "no-underline block rounded-xl px-3 py-2 text-sm transition",
                      isActive(item.href)
                        ? "bg-emerald-50 text-emerald-700"
                        : "text-zinc-800 hover:bg-zinc-100",
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
                onClick={() => setOpen(false)}
                className="no-underline inline-flex w-full items-center justify-center rounded-2xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700"
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
