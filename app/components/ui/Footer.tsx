import Link from 'next/link'
import React from 'react'

const Footer = () => {
  return (
    <footer className="mt-10 border-t border-emerald-100/60 bg-white/70 backdrop-blur">
        <div className="container mx-auto max-w-6xl px-4 py-10">
          <div className="grid grid-cols-1 gap-10 sm:grid-cols-3">
            {/* Brand & Deskripsi */}
            <div>
              <Link href="/" className="inline-flex items-center gap-3">
                <span className="inline-grid place-items-center h-9 w-9 rounded-xl bg-emerald-600 text-white font-bold">
                  E
                </span>
                <span className="text-md font-semibold text-zinc-900">Event & Budaya Majalengka</span>
              </Link>
              <p className="mt-3 text-sm leading-relaxed text-zinc-600">
                Agenda budaya, festival, dan kegiatan komunitas di Majalengka.
                Temukan event terbaru dan dukung pelaku budaya lokal.
              </p>
            </div>

            {/* Tautan Cepat */}
            <div>
              <h3 className="text-md font-semibold text-zinc-900">Tautan</h3>
              <ul className="mt-3 space-y-2 text-sm ">
                <li>
                  <Link href="/events" className="text-zinc-600 hover:text-emerald-700 hover:font-semibold">
                    Semua Event
                  </Link>
                </li>
                <li>
                  <Link href="/categories" className="text-zinc-600 hover:text-emerald-700 hover:font-semibold">
                    Kategori
                  </Link>
                </li>
                <li>
                  <Link href="/#about" className="text-zinc-600 hover:text-emerald-700 hover:font-semibold">
                    Tentang
                  </Link>
                </li>
              </ul>
            </div>

            {/* Kontak & Sosial */}
            <div>
              <h3 className="text-md font-semibold text-zinc-900">Kontak</h3>
              <ul className="mt-3 space-y-2 text-sm text-zinc-600">
                <li className="flex items-start gap-3">
                  <svg
                    width="35"
                    height="35"
                    viewBox="0 0 24 24"
                    className="mt-0.5 text-emerald-600"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                  >
                    <path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 1 1 16 0Z" />
                    <circle cx="12" cy="10" r="3" />
                  </svg>
                  <span>
                    Jl. Raya KH. Abdul Halim No.311, Majalengka Wetan, Kec. Majalengka, Kabupaten Majalengka, Jawa Barat
                    45411
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    className="mt-0.5 text-emerald-600"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                  >
                    <path d="M4 6h16v12H4z" />
                    <path d="m22 6-10 7L2 6" />
                  </svg>
                  <a href="mailto:halo@majabudaya.id" className="hover:text-emerald-700">
                    disparbud@jabarprov.go.id
                  </a>
                </li>
                <li className="flex items-start gap-3">
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    className="mt-0.5 text-emerald-600"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                  >
                    <path d="M22 16.92v2a2 2 0 0 1-2.18 2 19.8 19.8 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 5.18 2 2 0 0 1 4.1 3h2a2 2 0 0 1 2 1.72c.12.86.32 1.7.6 2.5a2 2 0 0 1-.45 2.11L7.1 10.9a16 16 0 0 0 6 6l1.57-1.14a2 2 0 0 1 2.11-.45c.8.28 1.64.48 2.5.6A2 2 0 0 1 22 16.92z" />
                  </svg>
                  <a href="tel:+6281234567890" className="hover:text-emerald-700">
                    (0233) 8294553
                  </a>
                </li>
              </ul>

              <div className="mt-4 flex items-center gap-3">
                <a
                  href="https://www.instagram.com/disparbudmajalengka/"
                  aria-label="Instagram"
                  className="inline-grid h-9 w-9 place-items-center rounded-full border border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <rect x="3" y="3" width="18" height="18" rx="5" />
                    <circle cx="12" cy="12" r="4" />
                    <circle cx="17.5" cy="6.5" r="1" />
                  </svg>
                </a>
                <a
                  href="https://www.facebook.com/disparbudmajalengka/?locale=id_ID"
                  aria-label="Facebook"
                  className="inline-grid h-9 w-9 place-items-center rounded-full border border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M13.5 9H15V6h-1.5C11.6 6 10 7.6 10 9.5V11H8v3h2v7h3v-7h2.1l.4-3H13v-1.5c0-.3.2-.5.5-.5Z" />
                  </svg>
                </a>
                <a
                  href="https://www.youtube.com/@disparbudmajalengka8014"
                  aria-label="YouTube"
                  className="inline-grid h-9 w-9 place-items-center rounded-full border border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M23 12s0-3.2-.4-4.7a3 3 0 0 0-2.1-2.1C18.9 4.6 12 4.6 12 4.6s-6.9 0-8.5.6A3 3 0 0 0 1.4 7.3C1 8.8 1 12 1 12s0 3.2.4 4.7a3 3 0 0 0 2.1 2.1c1.6.6 8.5.6 8.5.6s6.9 0 8.5-.6a3 3 0 0 0 2.1-2.1c.4-1.5.4-4.7.4-4.7ZM10 8.9l5.7 3.1L10 15V8.9Z" />
                  </svg>
                </a>
              </div>
            </div>
          </div>

          {/* Bottom bar */}
          <div className="mt-10 border-t border-zinc-200/70 pt-6 flex flex-col items-center justify-between gap-3 sm:flex-row">
            <p className="text-xs text-zinc-500">
              © {new Date().getFullYear()} Event & Budaya Majalengka. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
  )
}

export default Footer