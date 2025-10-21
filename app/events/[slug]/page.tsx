// PATH: app/events/[slug]/page.tsx
import Link from "next/link"
import type { Metadata } from "next"
import { notFound, redirect } from "next/navigation"
import { createServerSupabase } from "@/lib/supabaseServer"
import { buildGoogleCalURL } from "@/lib/ics" // ← pakai untuk URL Google Calendar

// UI kecil (relative path karena file ada di app/events/[slug])
import { Button } from "../../components/ui/Button"
import { Badge } from "../../components/ui/Badge"
import RegisterForm from "./RegisterForm"

const BANNER_BUCKET = "event-banners"
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"

function getPublicUrl(path: string | null | undefined) {
  if (!path) return null
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL
  if (!base) return null
  return `${base}/storage/v1/object/public/${BANNER_BUCKET}/${path}`
}

export const dynamic = "force-dynamic"
export const revalidate = 0

// ---------- Metadata (slug atau id) ----------
export async function generateMetadata(
  { params }: { params: Promise<{ slug: string }> }
): Promise<Metadata> {
  const { slug: handle } = await params
  const supabase = await createServerSupabase()

  // coba sebagai SLUG
  let { data: ev } = await supabase
    .from("events")
    .select("title, description, banner_path, starts_at, slug")
    .eq("slug", handle)
    .single()

  // fallback sebagai ID (biar canonical/OG tetap oke)
  if (!ev) {
    const { data: byId } = await supabase
      .from("events")
      .select("title, description, banner_path, starts_at, slug")
      .eq("id", handle)
      .single()
    if (byId) ev = byId
  }

  const title = ev?.title ? `${ev.title} | Agenda Budaya` : "Event | Agenda Budaya"
  const description = ev?.description?.slice(0, 160) || "Informasi event dan agenda budaya terbaru."
  const url = ev?.slug ? `${APP_URL}/events/${ev.slug}` : `${APP_URL}/events/${handle}`
  const ogImage = getPublicUrl(ev?.banner_path) || `${APP_URL}/og-default.png`

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: { url, title, description, type: "website", images: ogImage ? [{ url: ogImage }] : undefined },
    twitter: { card: "summary_large_image", title, description, images: ogImage ? [ogImage] : undefined },
  }
}

// ---------- Data util ----------
async function fetchEventBySlug(supabase: any, slug: string) {
  const { data, error } = await supabase
    .from("events")
    .select(
      // tambahkan/kurangi kolom sesuai skema kamu
      "id, slug, title, description, starts_at, ends_at, location_name, address, banner_path, capacity, registrations_count, categories(name)"
    )
    .eq("slug", slug)
    .single()
  if (error || !data) return null
  return {
    ...data,
    category_name: (data as any).categories?.name ?? null,
    banner_url: getPublicUrl((data as any).banner_path),
  }
}

export default async function EventDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug: handle } = await params
  const supabase = await createServerSupabase()

  const event = await fetchEventBySlug(supabase, handle)
  if (event) {
    // tanggal untuk tampilan
    const start = new Date(event.starts_at)
    const end = event.ends_at ? new Date(event.ends_at) : null
    const niceStart = start.toLocaleString("id-ID", {
      year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit",
    })
    const niceEnd = end
      ? end.toLocaleString("id-ID", {
          year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit",
        })
      : null

    // badge tanggal (kiri atas banner)
    const day = start.toLocaleDateString("id-ID", { day: "2-digit" })
    const mon = start.toLocaleDateString("id-ID", { month: "short" }).toUpperCase()

    // lokasi gabungan untuk Calendar
    const locationForCalendar =
      [event.location_name, event.address].filter(Boolean).join(", ") || null

    // URL Google Calendar
    const gcal = buildGoogleCalURL(
      {
        id: event.id,
        slug: event.slug,
        title: event.title,
        starts_at: event.starts_at,
        ends_at: event.ends_at ?? null,
        location: locationForCalendar,
        description: event.description ?? null,
      },
      APP_URL
    )

    // JSON-LD
    const jsonLd = {
      "@context": "https://schema.org",
      "@type": "Event",
      name: event.title,
      description: event.description || undefined,
      startDate: event.starts_at,
      endDate: event.ends_at || undefined,
      eventStatus: "https://schema.org/EventScheduled",
      eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
      url: `${APP_URL}/events/${event.slug}`,
      image: event.banner_url ? [event.banner_url] : undefined,
      location: event.location_name
        ? { "@type": "Place", name: event.location_name, address: event.address || undefined }
        : undefined,
    }

    // --- UI ---
    return (
      <div className="mx-auto max-w-4xl px-4 py-8">
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

        {/* Header Hero */}
        <section className="relative overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-card">
          {/* Latar mesh */}
          <div
            className="pointer-events-none absolute inset-0 -z-10"
            style={{
              backgroundImage: `
                radial-gradient(60% 60% at 0% 0%, rgba(199,161,0,0.14), transparent 55%),
                radial-gradient(60% 60% at 100% 0%, rgba(206,106,51,0.12), transparent 50%)
              `,
            }}
          />
          {/* Banner */}
          <div className="relative">
            {event.banner_url ? (
              <img
                src={event.banner_url}
                alt={event.title}
                className="max-h-[420px] w-full rounded-t-2xl object-cover"
              />
            ) : (
              <div className="grid h-48 w-full place-items-center rounded-t-2xl bg-gray-100 text-gray-400">
                Tidak ada banner
              </div>
            )}

            {/* Badge tanggal (kiri-atas) */}
            <div className="absolute left-4 top-4 rounded-xl bg-white/95 px-2 py-1 text-center shadow-card backdrop-blur">
              <div className="text-[11px] font-semibold leading-3 text-terra-600">{mon}</div>
              <time className="block text-lg font-bold leading-4 text-ink" dateTime={event.starts_at}>
                {day}
              </time>
            </div>

            {/* Tombol kecil Add to Google Calendar (kanan-atas) */}
            <a
              href={gcal}
              target="_blank"
              rel="noopener noreferrer"
              title="Add to Google Calendar"
              aria-label="Add to Google Calendar"
              className="absolute right-4 top-4 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-white/95 text-emerald-700 shadow-card ring-1 ring-black/5 hover:bg-white focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
            >
              {/* Ikon kalender sederhana */}
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M7 2h2v3H7zM15 2h2v3h-2z" />
                <path d="M5 5h14a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2zm0 4v10h14V9H5z" />
              </svg>
              <span className="sr-only">Add to Google Calendar</span>
            </a>
          </div>

          {/* Judul + meta */}
          <div className="p-5">
            <h1 className="font-serif text-3xl">{event.title}</h1>
            <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-gray-600">
              <Badge>{event.category_name ?? "Umum"}</Badge>
              <span className="text-terra-500">•</span>
              <span>Mulai: {niceStart}</span>
              {niceEnd && (
                <>
                  <span className="text-terra-500">•</span>
                  <span>Selesai: {niceEnd}</span>
                </>
              )}
            </div>

            {/* CTA bar (tanpa tombol GCal & tanpa Download .ics) */}
            <div className="mt-4 flex flex-wrap gap-2">
              <Link href="/events" aria-label="Kembali ke daftar">
                <Button variant="ghost">← Kembali</Button>
              </Link>
              <Button>Registrasi Segera</Button>
            </div>
          </div>
        </section>

        {/* Konten */}
        <div className="mt-6 grid gap-6 md:grid-cols-3">
          {/* Deskripsi */}
          <section className="md:col-span-2 rounded-2xl border border-gray-100 bg-white p-5 shadow-card">
            <h2 className="text-base font-semibold">Deskripsi</h2>
            <div className="prose prose-sm mt-2 max-w-none text-gray-700">
              {event.description ? (
                <p>{event.description}</p>
              ) : (
                <p className="italic text-gray-500">Belum ada deskripsi.</p>
              )}
            </div>
          </section>

          {/* Sidebar: Lokasi + Registrasi */}
          <aside className="space-y-6">
            {(event.location_name || event.address) && (
              <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-card">
                <h2 className="text-base font-semibold">Lokasi</h2>
                {event.location_name && <p className="mt-2 text-sm text-gray-700">{event.location_name}</p>}
                {event.address && <p className="text-sm text-gray-700">{event.address}</p>}
              </section>
            )}

            <RegisterForm
              eventId={event.id}
              capacity={event.capacity ?? null}
              registeredCount={event.registrations_count ?? 0}
            />
          </aside>
        </div>
      </div>
    )
  }

  // fallback: treat as ID → redirect ke slug
  const { data: byId } = await supabase
    .from("events")
    .select("slug")
    .eq("id", handle)
    .single()

  if (byId?.slug) {
    redirect(`/events/${byId.slug}`)
  }

  notFound()
}
