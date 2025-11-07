// PATH: app/events/[slug]/_parts/HeroSection.tsx
import Link from "next/link"
import { Badge } from "../../../components/ui/Badge"

type Props = {
  title: string
  categoryName: string | null
  bannerUrl: string | null
  startsAt: string
  niceStart: string
  niceEnd: string | null
  day: string
  mon: string
  priceText: string
  gcal: string
}

export default function HeroSection({
  title,
  categoryName,
  bannerUrl,
  startsAt,
  niceStart,
  niceEnd,
  day,
  mon,
  priceText,
  gcal,
}: Props) {
  return (
    <section className="relative overflow-hidden rounded-2xl border border-emerald-100 bg-white shadow-sm ring-1 ring-black/5">
      {/* Latar mesh lembut */}
      <div
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          backgroundImage: `
            radial-gradient(60% 60% at 0% 0%, rgba(16,185,129,0.10), transparent 55%),
            radial-gradient(60% 60% at 100% 0%, rgba(13,148,136,0.06), transparent 50%)
          `,
        }}
      />

      {/* Banner */}
      <div className="relative">
        {bannerUrl ? (
          <img
            src={bannerUrl}
            alt={title}
            loading="lazy"
            decoding="async"
            className="w-full max-h-[460px] rounded-t-2xl object-cover"
          />
        ) : (
          <div className="grid h-48 w-full place-items-center rounded-t-2xl bg-emerald-50 text-emerald-700">
            Tidak ada banner
          </div>
        )}

        {/* Scrim agar judul kontras bila ada gambar */}
        <div className="pointer-events-none absolute inset-0 rounded-t-2xl bg-gradient-to-t from-black/50 via-black/10 to-transparent" />

        {/* Badge tanggal (kiri-atas) */}
        <div className="absolute left-4 top-4 rounded-xl bg-white/95 px-2 py-1 text-center shadow-sm ring-1 ring-black/5 backdrop-blur">
          <div className="text-[11px] font-semibold leading-3 text-emerald-600">{mon}</div>
          <time className="block text-lg font-bold leading-4 text-zinc-900" dateTime={startsAt}>
            {day}
          </time>
        </div>

        {/* Add to Google Calendar (kanan-atas) */}
        <a
          href={gcal}
          target="_blank"
          rel="noopener noreferrer"
          title="Add to Google Calendar"
          aria-label="Add to Google Calendar"
          className="absolute right-4 top-4 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-white/95 text-emerald-700 shadow-sm ring-1 ring-black/5 transition hover:bg-white focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M7 2h2v3H7zM15 2h2v3h-2z" />
            <path d="M5 5h14a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2zm0 4v10h14V9H5z" />
          </svg>
          <span className="sr-only">Add to Google Calendar</span>
        </a>
      </div>

      {/* Konten utama: poster-style */}
      <div className="p-5 md:p-6">
        {/* Badge kategori di atas judul */}
        <div className="text-sm text-emerald-700">
          <Badge>{categoryName ?? "Umum"}</Badge>
        </div>

        {/* Judul besar ala poster */}
        <h1 className="mt-2 font-serif text-[28px] leading-tight text-zinc-900 md:text-4xl">
          {title}
        </h1>

        {/* Meta ringkas sebagai chip */}
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center rounded-full bg-emerald-50 px-3 py-1 text-sm font-medium text-emerald-700 ring-1 ring-emerald-200">
            {niceStart}{niceEnd ? ` – ${niceEnd}` : ""} WIB
          </span>
          <span className="inline-flex items-center rounded-full bg-zinc-50 px-3 py-1 text-sm font-medium text-zinc-700 ring-1 ring-zinc-200">
            {priceText}
          </span>
        </div>

        {/* CTA (desktop/tablet) */}
        <div className="mt-4 hidden gap-2 md:flex">
          <Link
            href="/events"
            aria-label="Kembali ke daftar"
            className="inline-flex h-10 items-center justify-center rounded-xl border border-emerald-200 bg-white px-4 text-sm font-medium text-emerald-700 shadow-sm transition hover:bg-emerald-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
          >
            ← Kembali
          </Link>
          <a
            href="#registrasi"
            className="inline-flex h-10 items-center justify-center rounded-xl bg-emerald-600 px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
          >
            Registrasi Segera
          </a>
        </div>
      </div>

      {/* Sticky CTA (mobile) */}
      <div className="sticky bottom-3 z-10 px-3 md:hidden">
        <div className="rounded-2xl bg-white/95 p-3 shadow-lg ring-1 ring-black/5 backdrop-blur">
          <div className="flex items-center justify-between gap-2">
            <div className="text-sm">
              <div className="font-semibold text-zinc-900">{mon} {day}</div>
              <div className="text-zinc-600">
                {niceStart}{niceEnd ? ` – ${niceEnd}` : ""} WIB
              </div>
            </div>
            <a
              href="#registrasi"
              className="inline-flex h-10 items-center justify-center rounded-xl bg-emerald-600 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
            >
              Daftar
            </a>
          </div>
        </div>
      </div>
    </section>
  )
}
