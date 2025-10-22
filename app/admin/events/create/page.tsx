// PATH: app/admin/events/create/page.tsx
"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { supabaseClient } from "@/lib/supabaseClient"

type Category = { id: string | number; name: string }

/** ===== Helpers waktu lokal → string input & ISO (tanpa file baru) ===== */
function pad(n: number) { return String(n).padStart(2, "0") }
/** "YYYY-MM-DDTHH:mm" pakai zona lokal (untuk attribute `min`) */
function nowLocalInputValue() {
  const d = new Date()
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}
/** Konversi nilai <input type="datetime-local"> (lokal) → ISO UTC */
function localInputToISO(local: string | null | undefined) {
  if (!local) return null
  // "2025-10-22T09:00" → Date lokal → ISO
  const d = new Date(`${local}:00`)
  return isNaN(d.getTime()) ? null : d.toISOString()
}

export default function CreateEventPage() {
  const router = useRouter()
  const supabase = supabaseClient

  const [event, setEvent] = useState({
    title: "",
    description: "",
    starts_at: "",
    ends_at: "",
    location_name: "",
    address: "",
    category_id: "",
  })

  const [categories, setCategories] = useState<Category[]>([])
  const [catLoading, setCatLoading] = useState(true)
  const [catError, setCatError] = useState<string | null>(null)

  const [bannerFile, setBannerFile] = useState<File | null>(null)
  const [bannerPreview, setBannerPreview] = useState<string | null>(null)

  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  // ✅ Ambil kategori saat halaman dibuka
  useEffect(() => {
    const fetchCategories = async () => {
      setCatLoading(true); setCatError(null)
      const { data, error } = await supabase.from("categories").select("id,name").order("name")
      if (error) setCatError(error.message)
      setCategories((data as Category[]) || [])
      setCatLoading(false)
    }
    fetchCategories()
  }, [supabase])

  // ✅ Cleanup preview URL saat file berubah / unmount
  useEffect(() => {
    if (!bannerFile) { setBannerPreview(null); return }
    const url = URL.createObjectURL(bannerFile)
    setBannerPreview(url)
    return () => URL.revokeObjectURL(url)
  }, [bannerFile])

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setEvent({ ...event, [e.target.name]: e.target.value })
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (!f) return
    const maxMB = 5
    if (f.size > maxMB * 1024 * 1024) {
      setFormError(`Ukuran gambar maksimal ${maxMB}MB`)
      return
    }
    if (!/^image\//.test(f.type)) {
      setFormError("File harus berupa gambar.")
      return
    }
    setFormError(null)
    setBannerFile(f)
  }

  const validate = () => {
    if (!event.title.trim()) return "Judul wajib diisi."
    if (!event.starts_at) return "Tanggal mulai wajib diisi."
    if (!event.category_id) return "Kategori wajib dipilih."
    if (event.ends_at && event.starts_at && new Date(event.ends_at) < new Date(event.starts_at)) {
      return "Tanggal selesai tidak boleh lebih awal dari tanggal mulai."
    }
    return null
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const v = validate()
    if (v) { setFormError(v); return }
    setSaving(true); setFormError(null)

    try {
      let bannerPath: string | null = null

      // ✅ Upload banner kalau ada
      if (bannerFile) {
        const safeName = bannerFile.name.replace(/\s+/g, "-").replace(/[^a-zA-Z0-9.\-_]/g, "")
        const unique = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2,8)}-${safeName}`
        const { error: uploadError } = await supabase.storage
          .from("event-banners")
          .upload(unique, bannerFile, { contentType: bannerFile.type, upsert: false })

        if (uploadError) {
          setFormError("Gagal upload banner: " + uploadError.message)
          setSaving(false)
          return
        }
        bannerPath = unique
      }

      // ⬇️ Konversi nilai input (lokal) → ISO UTC agar aman di DB (timestamptz)
      const startsISO = localInputToISO(event.starts_at)
      const endsISO   = event.ends_at ? localInputToISO(event.ends_at) : null

      const payload = {
        title: event.title.trim(),
        description: event.description?.trim() || null,
        starts_at: startsISO,        // e.g. "2025-10-22T02:00:00.000Z"
        ends_at: endsISO,            // atau null
        location_name: event.location_name?.trim() || null,
        address: event.address?.trim() || null,
        category_id: event.category_id || null, // "" → null
        banner_path: bannerPath,
      }

      const { error } = await supabase.from("events").insert([payload])
      if (error) {
        setFormError("Gagal menambahkan event: " + error.message)
        setSaving(false)
        return
      }

      router.push("/admin/events")
    } catch (err: any) {
      setFormError(err?.message || "Terjadi kesalahan tak terduga.")
    } finally {
      setSaving(false)
    }
  }

  // ✅ "min" harus pakai waktu lokal, jangan toISOString()
  const minStart = useMemo(() => nowLocalInputValue(), [])
  const minEnd   = event.starts_at || minStart

  return (
    <div className="min-h-[100svh] bg-gradient-to-b from-white to-emerald-50/30">
      {/* Top bar */}
      <header className="border-b border-zinc-200/70 bg-white/70 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <Link
            href="/admin/events"
            className="inline-flex items-center rounded-xl border border-zinc-200 bg-white px-3 py-1.5 text-sm text-zinc-800 shadow-sm hover:bg-zinc-50"
          >
            ← Kembali
          </Link>
          <span className="text-xs text-zinc-500">Buat Event</span>
        </div>
      </header>

      {/* Content */}
      <main className="mx-auto max-w-6xl px-4 py-8">
        <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white/90 p-6 shadow-sm">
          <div className="mb-6">
            <h1 className="text-xl font-semibold text-zinc-900">Buat Event Baru</h1>
            <p className="mt-1 text-sm text-zinc-600">
              Lengkapi informasi berikut. Banner disarankan rasio 16:9.
            </p>
          </div>

          {/* Alert error global */}
          {formError && (
            <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
              {formError}
            </div>
          )}

          <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            {/* Kolom kiri (field utama) */}
            <div className="lg:col-span-2 space-y-4">
              {/* Judul */}
              <div>
                <label className="block text-sm font-medium text-zinc-800">
                  Judul
                  <input
                    type="text"
                    name="title"
                    value={event.title}
                    onChange={handleChange}
                    required
                    className="mt-1 h-11 w-full rounded-2xl border border-zinc-200 px-3 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    placeholder="Contoh: Festival Seni Rakyat"
                  />
                </label>
              </div>

              {/* Deskripsi */}
              <div>
                <label className="block text-sm font-medium text-zinc-800">
                  Deskripsi
                  <textarea
                    name="description"
                    value={event.description}
                    onChange={handleChange}
                    rows={6}
                    className="mt-1 w-full rounded-2xl border border-zinc-200 px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    placeholder="Tuliskan ringkasan acara, pengisi, dan informasi penting lain."
                  />
                </label>
              </div>

              {/* Waktu */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <label className="block text-sm font-medium text-zinc-800">
                  Mulai
                  <input
                    type="datetime-local"
                    name="starts_at"
                    value={event.starts_at}
                    onChange={handleChange}
                    required
                    min={minStart}
                    className="mt-1 h-11 w-full rounded-2xl border border-zinc-200 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </label>

                <label className="block text-sm font-medium text-zinc-800">
                  Selesai
                  <input
                    type="datetime-local"
                    name="ends_at"
                    value={event.ends_at}
                    onChange={handleChange}
                    min={minEnd}
                    className="mt-1 h-11 w-full rounded-2xl border border-zinc-200 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </label>
              </div>

              {/* Lokasi & Alamat */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <label className="block text-sm font-medium text-zinc-800">
                  Lokasi
                  <input
                    type="text"
                    name="location_name"
                    value={event.location_name}
                    onChange={handleChange}
                    className="mt-1 h-11 w-full rounded-2xl border border-zinc-200 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    placeholder="Contoh: Alun-Alun Majalengka"
                  />
                </label>

                <label className="block text-sm font-medium text-zinc-800">
                  Alamat
                  <input
                    type="text"
                    name="address"
                    value={event.address}
                    onChange={handleChange}
                    className="mt-1 h-11 w-full rounded-2xl border border-zinc-200 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    placeholder="Jl. Contoh No. 123, Majalengka"
                  />
                </label>
              </div>

              {/* Kategori */}
              <div>
                <label className="block text-sm font-medium text-zinc-800">
                  Kategori
                  <select
                    name="category_id"
                    value={event.category_id}
                    onChange={handleChange}
                    required
                    className="mt-1 h-11 w-full rounded-2xl border border-zinc-200 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="">{catLoading ? "Memuat kategori..." : "-- Pilih Kategori --"}</option>
                    {categories.map((cat) => (
                      <option key={String(cat.id)} value={String(cat.id)}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </label>
                {catError && <p className="mt-1 text-xs text-red-600">{catError}</p>}
              </div>
            </div>

            {/* Kolom kanan (banner) */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-zinc-800">
                  Banner
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="mt-1 block w-full cursor-pointer rounded-2xl border border-zinc-200 bg-white px-3 py-2 text-sm file:mr-3 file:rounded-xl file:border-0 file:bg-emerald-600 file:px-3 file:py-1.5 file:text-sm file:font-semibold file:text-white hover:file:bg-emerald-700"
                  />
                </label>
                <p className="mt-1 text-xs text-zinc-500">
                  File yang di upload, maksimal 5MB.
                </p>

                {bannerPreview && (
                  <div className="mt-3 overflow-hidden rounded-2xl border border-zinc-200 bg-zinc-50">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={bannerPreview}
                      alt="Preview banner"
                      className="h-40 w-full object-cover"
                    />
                    <div className="flex justify-end p-2">
                      <button
                        type="button"
                        onClick={() => { setBannerFile(null); setBannerPreview(null) }}
                        className="rounded-xl border border-zinc-200 px-3 py-1.5 text-xs text-zinc-700 hover:bg-zinc-100"
                      >
                        Hapus gambar
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Tips kecil */}
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50/60 p-3 text-xs text-emerald-800">
                Event tanpa banner tetap bisa ditampilkan. Kamu bisa menambah banner nanti.
              </div>
            </div>

            {/* Actions */}
            <div className="lg:col-span-3 mt-2 flex flex-col-reverse items-stretch gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => router.push("/admin/events")}
                className="inline-flex h-11 items-center justify-center rounded-2xl border border-zinc-200 bg-white px-5 text-sm font-medium text-zinc-800 shadow-sm transition hover:bg-zinc-50"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={saving}
                className="inline-flex h-11 items-center justify-center rounded-2xl bg-emerald-600 px-6 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 disabled:opacity-50"
              >
                {saving ? "Menyimpan..." : "Simpan Event"}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  )
}
