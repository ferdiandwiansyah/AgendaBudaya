// PATH: app/events/[slug]/page.tsx
import type { Metadata } from "next"
import { notFound, redirect } from "next/navigation"
import { createServerSupabase } from "@/lib/supabaseServer"
import { buildGoogleCalURL } from "@/lib/ics"

import HeroSection from "./_parts/HeroSection"
import DescriptionSection from "./_parts/DescriptionSection"
import LocationSection from "./_parts/LocationSection"
import RegistrationSection from "./_parts/RegistrationSection"

const BANNER_BUCKET = "event-banners"
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"

// ——— helper tampilkan WIB ———
function fmtWIB(iso?: string | null, opts?: Intl.DateTimeFormatOptions) {
  if (!iso) return "-"
  const base: Intl.DateTimeFormatOptions = {
    dateStyle: "full",
    timeStyle: "short",
    timeZone: "Asia/Jakarta",
  }
  return new Intl.DateTimeFormat("id-ID", { ...base, ...opts }).format(new Date(iso))
}

function getPublicUrl(path: string | null | undefined) {
  if (!path) return null
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL
  if (!base) return null
  return `${base}/storage/v1/object/public/${BANNER_BUCKET}/${path}`
}

// cek apakah string adalah URL (http/https)
function isUrl(str?: string | null) {
  return !!str && /^https?:\/\//i.test(str)
}

// format harga sederhana
const asIDR = (n?: number | null, cur?: string | null) =>
  typeof n === "number" && n > 0
    ? new Intl.NumberFormat("id-ID", { style: "currency", currency: (cur || "IDR") }).format(n)
    : "Gratis"

export const dynamic = "force-dynamic"
export const revalidate = 0

// ---------- Metadata ----------
export async function generateMetadata(
  { params }: { params: Promise<{ slug: string }> }
): Promise<Metadata> {
  const { slug: handle } = await params
  const supabase = await createServerSupabase()

  let { data: ev } = await supabase
    .from("events")
    .select("title, description, banner_path, starts_at, slug")
    .eq("slug", handle)
    .single()

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
    .select(`
      id, slug, title, description, starts_at, ends_at,
      location_name, address, banner_path, capacity, registrations_count,
      price, currency, payment_mode, whatsapp_contact, external_payment_url,
      categories(name)
    `)
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
    // tanggal untuk tampilan (WIB)
    const niceStart = fmtWIB(event.starts_at, { dateStyle: "full", timeStyle: "short" })
    const niceEnd = event.ends_at ? fmtWIB(event.ends_at, { dateStyle: "full", timeStyle: "short" }) : null

    // badge tanggal (kiri atas banner) — WIB juga
    const day = new Intl.DateTimeFormat("id-ID", { day: "2-digit", timeZone: "Asia/Jakarta" }).format(new Date(event.starts_at))
    const mon = new Intl.DateTimeFormat("id-ID", { month: "short", timeZone: "Asia/Jakarta" }).format(new Date(event.starts_at)).toUpperCase()

    // alamat → jika URL pakai langsung, jika teks buatkan link Maps
    const addressIsUrl = isUrl(event.address)
    const mapsHref =
      addressIsUrl
        ? event.address
        : event.address
          ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
              [event.address, event.location_name].filter(Boolean).join(", ")
            )}`
          : null

    // lokasi untuk Calendar: jangan kirim URL, cukup teks
    const locationForCalendar =
      addressIsUrl
        ? (event.location_name || null)
        : ([event.location_name, event.address].filter(Boolean).join(", ") || null)

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

    // JSON-LD (alamat harus teks, jangan URL)
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
        ? { "@type": "Place", name: event.location_name, address: addressIsUrl ? undefined : (event.address || undefined) }
        : undefined,
    }

    const priceText = asIDR(event.price, event.currency)

    return (
      <div className="mx-auto max-w-4xl px-4 py-8">
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

        {/* Header Hero → dipisah ke komponen */}
        <HeroSection
          title={event.title}
          categoryName={event.category_name}
          bannerUrl={event.banner_url}
          startsAt={event.starts_at}
          niceStart={niceStart}
          niceEnd={niceEnd}
          day={day}
          mon={mon}
          priceText={priceText}
          gcal={gcal}
        />

        {/* Konten */}
        <div className="mt-6 grid gap-6 md:grid-cols-3">
          {/* Deskripsi */}
          <DescriptionSection description={event.description} />

          {/* Sidebar: Lokasi + Registrasi */}
          <aside className="space-y-6">
            {(event.location_name || event.address) && (
              <LocationSection
                locationName={event.location_name}
                address={event.address}
                mapsHref={mapsHref}
                addressIsUrl={addressIsUrl}
              />
            )}

            <RegistrationSection
              eventId={event.id}
              capacity={event.capacity ?? null}
              registeredCount={event.registrations_count ?? 0}
              paymentMode={event.payment_mode}
              whatsappContact={event.whatsapp_contact}
              externalPaymentUrl={event.external_payment_url}
              title={event.title}
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
