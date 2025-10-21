// app/admin/registrations/page.tsx
import Link from "next/link"
import { createServerSupabase } from "@/lib/supabaseServer"
import Filters from "./Filters"
import RowActions from "./RowActions"

export const dynamic = "force-dynamic"
const PAGE_SIZE = 20

type SPromise = Promise<{
  q?: string
  status?: "registered" | "checked_in" | "cancelled" | ""
  event?: string
  page?: string
}>

export default async function AdminRegistrationsPage({ searchParams }: { searchParams: SPromise }) {
  const supabase = await createServerSupabase()

  // Ambil event utk dropdown
  const { data: events = [] } = await supabase
    .from("events")
    .select("id, title, slug, starts_at")
    .order("starts_at", { ascending: false })

  // Next 15: await searchParams
  const sp = await searchParams
  const q = (sp?.q ?? "").trim()
  const status = (sp?.status ?? "") as "" | "registered" | "checked_in" | "cancelled"
  const eventId = (sp?.event ?? "").trim()
  const page = Math.max(1, Number.parseInt(sp?.page ?? "1") || 1)

  // Query data
  let dataQ = supabase
    .from("registrations")
    .select("id, name, email, phone, status, created_at, event_id, events(title, slug)")
    .order("created_at", { ascending: false })

  if (eventId) dataQ = dataQ.eq("event_id", eventId)
  if (status) dataQ = dataQ.eq("status", status)
  if (q) dataQ = dataQ.or(`name.ilike.%${q}%,email.ilike.%${q}%,phone.ilike.%${q}%`)

  const from = (page - 1) * PAGE_SIZE
  const to = from + PAGE_SIZE - 1
  dataQ = dataQ.range(from, to)

  const { data: rows, error } = await dataQ
  if (error) return <p className="p-6 text-sm text-red-600">Error: {error.message}</p>

  // Count
  let countQ = supabase.from("registrations").select("id", { count: "exact", head: true })
  if (eventId) countQ = countQ.eq("event_id", eventId)
  if (status) countQ = countQ.eq("status", status)
  if (q) countQ = countQ.or(`name.ilike.%${q}%,email.ilike.%${q}%,phone.ilike.%${q}%`)
  const { count } = await countQ
  const totalPages = Math.max(1, Math.ceil((count ?? 0) / PAGE_SIZE))
  const displayFrom = (count ?? 0) > 0 ? from + 1 : 0
  const displayTo = Math.min(count ?? 0, from + (rows?.length ?? 0))

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-2xl font-serif">Registrasi Peserta</h1>
          <p className="text-sm text-gray-600">
            Kelola pendaftaran peserta per event. Ubah status, hapus, atau export CSV.
          </p>
        </div>
        <Link
          href="/admin/events"
          className="inline-flex items-center justify-center rounded-2xl border bg-white px-4 py-2 text-sm font-medium shadow-card hover:shadow-card-hover"
        >
          ← Kelola Event
        </Link>
      </div>

      {/* Filters */}
      <div className="mt-5">
        <Filters
            events={(events ?? []).map((e) => ({ id: e.id, title: e.title }))}
            initialQ={q}
            initialStatus={status}
            initialEventId={eventId}
        />
      </div>

      {/* Summary + Export */}
      <div className="mt-3 flex flex-wrap items-center justify-between gap-3 text-xs text-gray-600">
        <span>
          {count ? (
            <>Menampilkan <b className="text-ink">{displayFrom}–{displayTo}</b> dari <b className="text-ink">{count}</b> registrasi</>
          ) : "Tidak ada data"}
        </span>

        <ExportLink q={q} status={status} eventId={eventId} />
      </div>

      {/* Table */}
      <div className="mt-4 overflow-x-auto rounded-2xl border border-gray-100 bg-white shadow-card">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="bg-gray-50 text-left text-xs uppercase tracking-wide text-gray-600">
              <th className="px-4 py-3">Nama</th>
              <th className="px-4 py-3">Kontak</th>
              <th className="px-4 py-3">Event</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Didaftarkan</th>
              <th className="px-4 py-3 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {rows?.length ? rows.map((r) => {
              const ev = (r as any).events
              const created = new Date(r.created_at).toLocaleString("id-ID")
              return (
                <tr key={r.id} className="border-t hover:bg-gray-50/50">
                  <td className="px-4 py-3 font-medium">{r.name}</td>
                  <td className="px-4 py-3">
                    <div className="text-gray-900">{r.email}</div>
                    {r.phone && <div className="text-gray-600">{r.phone}</div>}
                  </td>
                  <td className="px-4 py-3">
                    {ev?.title ? (
                      <Link href={`/events/${ev.slug ?? ""}`} className="text-terra-600 hover:underline">
                        {ev.title}
                      </Link>
                    ) : <span className="text-gray-500">—</span>}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={r.status as any} />
                  </td>
                  <td className="px-4 py-3 text-gray-600">{created}</td>
                  <td className="px-4 py-3 text-right">
                    <RowActions id={r.id} currentStatus={r.status} />
                  </td>
                </tr>
              )
            }) : (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-gray-500">
                  Tidak ada registrasi sesuai filter.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="mt-6 flex items-center justify-center gap-2">
        {page > 1 && (
          <Link
            href={`/admin/registrations?${new URLSearchParams({ q, status, event: eventId, page: String(page - 1) }).toString()}`}
            className="rounded-2xl border bg-white px-3 py-1.5 text-sm shadow-card hover:shadow-card-hover"
          >
            Prev
          </Link>
        )}
        <span className="text-sm text-gray-600">Page {page} / {totalPages}</span>
        {page < totalPages && (
          <Link
            href={`/admin/registrations?${new URLSearchParams({ q, status, event: eventId, page: String(page + 1) }).toString()}`}
            className="rounded-2xl border bg-white px-3 py-1.5 text-sm shadow-card hover:shadow-card-hover"
          >
            Next
          </Link>
        )}
      </div>
    </div>
  )
}

function StatusBadge({ status }: { status: "registered" | "checked_in" | "cancelled" }) {
  const cls =
    status === "registered" ? "bg-amber-50 text-amber-800 border-amber-100" :
    status === "checked_in" ? "bg-emerald-50 text-emerald-800 border-emerald-100" :
    "bg-rose-50 text-rose-800 border-rose-100"
  const label =
    status === "registered" ? "Registered" :
    status === "checked_in" ? "Checked-in" : "Cancelled"

  return (
    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] ${cls}`}>
      {label}
    </span>
  )
}

function ExportLink({ q, status, eventId }: { q: string; status: string; eventId: string }) {
  const params = new URLSearchParams()
  if (q) params.set("q", q)
  if (status) params.set("status", status)
  if (eventId) params.set("event", eventId)
  return (
    <a
      href={`/api/admin/registrations/export?${params.toString()}`}
      className="inline-flex items-center rounded-2xl border bg-white px-3 py-1.5 text-sm shadow-card hover:shadow-card-hover"
    >
      Export CSV
    </a>
  )
}
