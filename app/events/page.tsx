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

// handle hasil join Supabase (objek/array)
function getCategoryName(cat: any): string {
  if (!cat) return "Umum"
  if (Array.isArray(cat)) return cat[0]?.name ?? "Umum"
  return cat.name ?? "Umum"
}

function formatLongDate(dateIso: string) {
  const d = new Date(dateIso)
  return d.toLocaleString("id-ID", {
    timeZone: "Asia/Jakarta",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}
function formatDay(dateIso: string) {
  return new Date(dateIso).toLocaleDateString("id-ID", { day: "2-digit" })
}
function formatMonShort(dateIso: string) {
  return new Date(dateIso).toLocaleDateString("id-ID", { month: "short" }).toUpperCase()
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

  // Next 15: await searchParams
  const sp = await searchParams
  const q = (sp?.q ?? "").trim()
  const category = (sp?.category ?? "").trim()
  const mode = (sp?.mode ?? "semua") as "mendatang" | "semua" | "lewat"
  const page = Math.max(1, Number.parseInt(sp?.page ?? "1") || 1)

  // data (paged)
  let dataQuery = supabase
    .from("events")
    .select("id, title, starts_at, location_name, banner_path, category_id, categories(name)")
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

  // count
  let countQuery = supabase.from("events").select("id", { count: "exact", head: true })
  countQuery = applyFilters(countQuery, { q, category, mode })
  const { count } = await countQuery
  const totalPages = Math.max(1, Math.ceil((count ?? 0) / PAGE_SIZE))

  // ringkasan hasil (range)
  const displayFrom = (count ?? 0) > 0 ? from + 1 : 0
  const displayTo = Math.min(count ?? 0, from + (events?.length ?? 0))

  return (
    <div className="mx-auto max-w-7xl px-4 py-12">
      {/* Header / Hero card (selaras dengan homepage: zinc + emerald, border halus, shadow-sm) */}
      <section className="relative overflow-hidden rounded-2xl border border-zinc-200 bg-white/80 p-6 shadow-sm backdrop-blur">
        {/* Overlay gradient lembut biar konsisten tone */}
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

        {/* Filters */}
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

        {/* Divider gradasi kecil ala homepage */}
        <div className="pointer-events-none mt-5 h-[2px] w-full rounded-full bg-gradient-to-r from-emerald-500/50 via-transparent to-teal-500/50" />

        {/* Summary */}
        <div className="mt-3 text-xs text-zinc-600">
          {typeof count === "number" ? (
            <span>
              Menampilkan{" "}
              <span className="font-semibold text-zinc-900">{displayFrom}–{displayTo}</span>{" "}
              dari <span className="font-semibold text-zinc-900">{count}</span> event
              {q ? <> untuk pencarian <span className="font-semibold">&ldquo;{q}&rdquo;</span></> : null}
              {category ? " (terfilter kategori)" : ""}
              {mode !== "semua" ? ` — ${mode === "mendatang" ? "yang akan datang" : "yang telah berlalu"}` : ""}
            </span>
          ) : (
            <span>Tidak ada hasil.</span>
          )}
        </div>
      </section>

      {/* List cards (selaras gaya card event di beranda) */}
      <ul className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {events?.length ? (
          events.map((event) => {
            const bannerUrl = getPublicUrl(event.banner_path)
            const longDate = formatLongDate(event.starts_at)
            const day = formatDay(event.starts_at)
            const mon = formatMonShort(event.starts_at)

            return (
              <li
                key={event.id}
                className=" group overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
              >
                {/* NOTE: tetap pakai id (slug redirect sudah ditangani di [slug]) */}
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
                        {/* Hover overlay tipis */}
                        <div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity group-hover:opacity-100">
                          <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/35 to-transparent" />
                        </div>
                      </>
                    ) : (
                      <div className="absolute inset-0 grid place-items-center bg-gradient-to-br from-emerald-50 to-teal-50 text-sm text-emerald-700">
                        Tidak ada gambar
                      </div>
                    )}

                    {/* Badge tanggal ala beranda */}
                    <div className="absolute left-3 top-3 rounded-xl bg-white/90 px-3 py-1 text-center text-xs font-medium text-zinc-800 shadow">
                      <div className="leading-3">{mon}</div>
                      <div className="text-base font-bold leading-4">{day}</div>
                    </div>
                  </div>

                  <div className="p-4">
                    <div className="flex items-center gap-2 text-xs text-zinc-600">
                      <span className="inline-flex items-center rounded-full bg-emerald-50 px-2 py-0.5 text-emerald-700">
                        {getCategoryName((event as any).categories)}
                      </span>
                      <span>•</span>
                      <time dateTime={event.starts_at}>{longDate}</time>
                    </div>

                    <h2 className="mt-1 line-clamp-2 text-base font-semibold text-zinc-900">
                      {event.title}
                    </h2>

                    {event.location_name && (
                      <p className="mt-1 line-clamp-1 text-sm text-zinc-600">{event.location_name}</p>
                    )}
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
