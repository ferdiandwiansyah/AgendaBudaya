// PATH: app/events/page.tsx
import Link from "next/link"
import { createServerSupabase } from "@/lib/supabaseServer"
import FiltersBar, { type Category } from "./FiltersBar"
import PagingControls from "./PagingControls"
import ModeToggle from "./ModeToggle"
import AdminButton from "./AdminButton"

export const dynamic = "force-dynamic"

const BANNER_BUCKET = "event-banners"
const PAGE_SIZE = 9

type SPromise = Promise<{
  q?: string
  category?: string
  page?: string
  mode?: "mendatang" | "semua" | "lewat"
}>

// === Utils ===
function getPublicUrl(path: string | null | undefined) {
  if (!path) return null
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL
  if (!base) return null
  return `${base}/storage/v1/object/public/${BANNER_BUCKET}/${path}`
}
function getCategoryName(cat: any): string {
  if (!cat) return "Umum"
  if (Array.isArray(cat)) return cat[0]?.name ?? "Umum"
  return cat.name ?? "Umum"
}
function formatDay(dateIso: string) {
  return new Date(dateIso).toLocaleDateString("id-ID", { day: "2-digit", timeZone: "Asia/Jakarta" })
}
function formatMonShort(dateIso: string) {
  return new Date(dateIso).toLocaleDateString("id-ID", { month: "short", timeZone: "Asia/Jakarta" }).toUpperCase()
}
function formatDateOnly(dateIso: string) {
  return new Date(dateIso).toLocaleDateString("id-ID", {
    timeZone: "Asia/Jakarta",
    year: "numeric",
    month: "long",
    day: "numeric",
  })
}

// === Harga (multi-kolom fallback) ===
function toNum(n: any): number | null {
  if (n === null || n === undefined) return null
  const x = Number(n)
  return Number.isFinite(x) ? x : null
}
function formatIDR(n: number) {
  return n.toLocaleString("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 })
}
function getPriceText(e: any): string {
  const single = toNum(e.price ?? e.ticket_price ?? e.harga ?? e.price_idr)
  const min = toNum(e.price_min ?? e.min_price ?? e.harga_min ?? e.priceFrom)
  const max = toNum(e.price_max ?? e.max_price ?? e.harga_max)

  if (single !== null) return single <= 0 ? "Gratis" : formatIDR(single)
  if (min !== null && max !== null) {
    if (min <= 0 && max <= 0) return "Gratis"
    return `${formatIDR(min)}–${formatIDR(max)}`
  }
  if (min !== null) return min <= 0 ? "Gratis" : `Mulai ${formatIDR(min)}`
  return "Harga belum tersedia"
}

function applyFilters(
  base: any,
  { q, category, mode }: { q?: string; category?: string; mode: "mendatang" | "semua" | "lewat" }
) {
  let qy = base
  if (category) qy = qy.eq("category_id", category)
  if (q) qy = qy.or(`title.ilike.%${q}%,location_name.ilike.%${q}%`)
  const nowIso = new Date().toISOString()
  if (mode === "mendatang") qy = qy.gte("starts_at", nowIso)
  if (mode === "lewat") qy = qy.lt("starts_at", nowIso)
  return qy
}

export default async function EventsPage({ searchParams }: { searchParams: SPromise }) {
  const supabase = await createServerSupabase()

  const { data: categories = [] } = await supabase
    .from("categories")
    .select("id, name")
    .order("name")

  const sp = await searchParams
  const q = (sp?.q ?? "").trim()
  const category = (sp?.category ?? "").trim()
  const mode = (sp?.mode ?? "semua") as "mendatang" | "semua" | "lewat"
  const page = Math.max(1, Number.parseInt(sp?.page ?? "1") || 1)

  // Ambil semua kolom agar kolom harga apapun ikut; plus join kategori
  let dataQuery = supabase
    .from("events")
    .select("*, categories(name)")
    .order("starts_at", { ascending: true })

  dataQuery = applyFilters(dataQuery, { q, category, mode })
  const from = (page - 1) * PAGE_SIZE
  const to = from + PAGE_SIZE - 1
  dataQuery = dataQuery.range(from, to)

  const { data: events, error } = await dataQuery
  if (error) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-12">
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          Error: {error.message}
        </div>
      </div>
    )
  }

  let countQuery = supabase.from("events").select("id", { count: "exact", head: true })
  countQuery = applyFilters(countQuery, { q, category, mode })
  const { count } = await countQuery
  const totalPages = Math.max(1, Math.ceil((count ?? 0) / PAGE_SIZE))

  const displayFrom = (count ?? 0) > 0 ? from + 1 : 0
  const displayTo = Math.min(count ?? 0, from + (events?.length ?? 0))

  return (
    <div className="mx-auto max-w-7xl px-4 py-12">
      {/* Header / Filters */}
      <section className="relative overflow-hidden rounded-2xl border border-zinc-200 bg-white/80 p-6 shadow-sm backdrop-blur">
        <div className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-br from-emerald-50/60 via-teal-50/50 to-transparent" />
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 sm:text-3xl">
              <span className="bg-gradient-to-r from-emerald-600 to-teal-500 bg-clip-text text-transparent">
                Agenda & Event Budaya
              </span>
            </h1>
            <p className="mt-1 text-sm text-zinc-600">
              Jelajahi acara budaya gunakan pencarian, kategori, dan mode waktu.
            </p>
          </div>
        </div>

        <div className="mt-5 space-y-3">
          <FiltersBar
            categories={categories as Category[]}
            initialQ={q}
            initialCategory={category}
          />
          <div className="flex items-center gap-2">
            <span className="text-xs text-zinc-500">Tampilkan:</span>
            <ModeToggle mode={mode} />
          </div>
        </div>

        <div className="pointer-events-none mt-5 h-[2px] w-full rounded-full bg-gradient-to-r from-emerald-500/50 via-transparent to-teal-500/50" />

        <div className="mt-3 text-xs text-zinc-600">
          {typeof count === "number" ? (
            <span>
              Menampilkan{" "}
              <span className="font-semibold text-zinc-900">{displayFrom}–{displayTo}</span>{" "}
              dari <span className="font-semibold text-zinc-900">{count}</span> event
              {q ? <> untuk <span className="font-semibold">&ldquo;{q}&rdquo;</span></> : null}
              {category ? " (terfilter kategori)" : ""}
              {mode !== "semua" ? ` — ${mode === "mendatang" ? "yang akan datang" : "yang telah berlalu"}` : ""}
            </span>
          ) : (
            <span>Tidak ada hasil.</span>
          )}
        </div>
      </section>

      {/* List cards — minimal: Nama, Tanggal (tanpa jam), Kategori, Harga */}
      <ul className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {events?.length ? (
          events.map((event: any) => {
            const bannerUrl = getPublicUrl(event.banner_path)
            const day = formatDay(event.starts_at)
            const mon = formatMonShort(event.starts_at)
            const dateOnly = formatDateOnly(event.starts_at)
            const priceText = getPriceText(event)
            const categoryText = getCategoryName(event.categories)

            return (
              <li
                key={event.id}
                className="group overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
              >
                <Link href={`/events/${event.id}`} className="block no-underline">
                  <div className="relative aspect-[16/9] w-full overflow-hidden bg-zinc-100">
                    {bannerUrl ? (
                      <>
                        <img
                          src={bannerUrl}
                          alt={event.title}
                          className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]"
                          loading="lazy"
                        />
                        <div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity group-hover:opacity-100">
                          <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/35 to-transparent" />
                        </div>
                      </>
                    ) : (
                      <div className="absolute inset-0 grid place-items-center bg-gradient-to-br from-emerald-50 to-teal-50 text-sm text-emerald-700">
                        Tidak ada gambar
                      </div>
                    )}

                    {/* Badge tanggal (tanpa jam) */}
                    <div className="absolute left-3 top-3 rounded-xl bg-white/90 px-3 py-1 text-center text-xs font-medium text-zinc-800 shadow">
                      <div className="leading-3">{mon}</div>
                      <div className="text-base font-bold leading-4">{day}</div>
                    </div>
                  </div>

                  <div className="p-4">
                    {/* Nama event */}
                    <h2 className="line-clamp-2  text-base font-semibold text-zinc-900">
                      {event.title}
                    </h2>

                    {/* Tanggal (tanpa jam) */}
                    <div className="mt-1 text-sm text-zinc-700  ">
                      <time dateTime={event.starts_at}>{dateOnly}</time>
                    </div>

                    {/* Kategori + Harga */}
                    <div className="mt-3 flex items-center justify-between gap-2">
                      <span className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">
                        {categoryText}
                      </span>

                      <span
                        className={[
                          "inline-flex items-center rounded-xl px-2.5 py-1 text-sm font-medium shadow-sm",
                          priceText === "Gratis"
                            ? "bg-emerald-600 text-white"
                            : "border border-emerald-200 bg-emerald-50 text-emerald-700",
                        ].join(" ")}
                      >
                        {priceText}
                      </span>
                    </div>
                  </div>
                </Link>
              </li>
            )
          })
        ) : (
          <li className="col-span-full">
            <div className="rounded-2xl border border-dashed border-zinc-300 bg-white p-10 text-center text-sm text-zinc-600">
              <div className="mb-2 text-2xl">🎭</div>
              Belum ada event yang cocok dengan filter saat ini.
            </div>
          </li>
        )}
      </ul>

      {/* Pagination */}
      <div className="mt-8">
        <PagingControls page={page} totalPages={totalPages} />
      </div>
    </div>
  )
}
