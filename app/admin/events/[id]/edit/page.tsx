// PATH: app/admin/events/[id]/edit/page.tsx
"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import Link from "next/link"
import { supabaseClient } from "@/lib/supabaseClient"

type Category = { id: string | number; name: string }

export default function EditEventPage() {
  const router = useRouter()
  const params = useParams()
  const supabase = supabaseClient

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const [event, setEvent] = useState<any>(null)

  const [categories, setCategories] = useState<Category[]>([])
  const [catError, setCatError] = useState<string | null>(null)

  const [bannerFile, setBannerFile] = useState<File | null>(null)
  const [bannerPreview, setBannerPreview] = useState<string | null>(null)
  const [removeBanner, setRemoveBanner] = useState(false)

  const [formError, setFormError] = useState<string | null>(null)

  // Supabase public URL
  const PUBLIC_URL = process.env.NEXT_PUBLIC_SUPABASE_URL

  // 🧭 Ambil kategori
  useEffect(() => {
    const fetchCategories = async () => {
      const { data, error } = await supabase.from("categories").select("id,name").order("name")
      if (error) setCatError(error.message)
      setCategories((data as Category[]) || [])
    }
    fetchCategories()
  }, [supabase])

  // 🧭 Ambil event by id
  useEffect(() => {
    const fetchEvent = async () => {
      setLoading(true)
      const { data, error } = await supabase
        .from("events")
        .select("*")
        .eq("id", params.id as string)
        .single()

      if (error) {
        setFormError(error.message)
      } else {
        setEvent(data)
      }
      setLoading(false)
    }

    if (params.id) fetchEvent()
  }, [params.id, supabase])

  // 🔎 Preview file
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
    setRemoveBanner(false) // jika upload baru, batalkan flag hapus
    setBannerFile(f)
  }

  const validate = () => {
    if (!event?.title?.trim()) return "Judul wajib diisi."
    if (!event?.starts_at) return "Tanggal mulai wajib diisi."
    if (event?.ends_at && new Date(event.ends_at) < new Date(event.starts_at)) {
      return "Tanggal selesai tidak boleh lebih awal dari tanggal mulai."
    }
    return null
  }

  const currentBannerUrl =
    event?.banner_path && PUBLIC_URL
      ? `${PUBLIC_URL}/storage/v1/object/public/event-banners/${event.banner_path}`
      : null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const v = validate()
    if (v) { setFormError(v); return }

    setSaving(true); setFormError(null)

    try {
      let bannerPath: string | null = event.banner_path ?? null

      // 🗑 Hapus banner lama jika diminta
      if (removeBanner && event.banner_path) {
        const { error: rmErr } = await supabase.storage
          .from("event-banners")
          .remove([event.banner_path])
        if (rmErr) {
          setFormError("Gagal menghapus banner lama: " + rmErr.message)
          setSaving(false)
          return
        }
        bannerPath = null
      }

      // ⬆️ Upload banner baru (override yang lama)
      if (bannerFile) {
        // jika ada banner lama & belum dihapus, hapus dulu agar tidak orphan
        if (event.banner_path && !removeBanner) {
          await supabase.storage.from("event-banners").remove([event.banner_path]).catch(() => {})
        }

        const safe = bannerFile.name.replace(/\s+/g, "-").replace(/[^a-zA-Z0-9.\-_]/g, "")
        const fileName = `${params.id}-${Date.now().toString(36)}-${safe}`
        const { error: uploadError } = await supabase.storage
          .from("event-banners")
          .upload(fileName, bannerFile, { contentType: bannerFile.type })

        if (uploadError) {
          setFormError("Gagal upload banner: " + uploadError.message)
          setSaving(false)
          return
        }
        bannerPath = fileName
      }

      // 📝 Update
      const { error } = await supabase
        .from("events")
        .update({
          title: event.title,
          description: event.description,
          starts_at: event.starts_at,
          ends_at: event.ends_at,
          location_name: event.location_name,
          address: event.address,
          category_id: event.category_id,
          banner_path: bannerPath,
        })
        .eq("id", params.id as string)

      if (error) {
        setFormError("Gagal update event: " + error.message)
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

  // min attribute untuk datetime-local
  const minStart = useMemo(() => (event?.starts_at ? undefined : new Date().toISOString().slice(0, 16)), [event?.starts_at])
  const minEnd   = event?.starts_at ? event.starts_at.slice(0, 16) : minStart

  if (loading) {
    return (
      <main className="mx-auto max-w-6xl px-4 py-10">
        <div className="h-40 animate-pulse rounded-2xl bg-zinc-100" />
      </main>
    )
  }

  if (!event) {
    return (
      <main className="mx-auto max-w-6xl px-4 py-10">
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          Event tidak ditemukan.
        </div>
      </main>
    )
  }

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
          <span className="text-xs text-zinc-500">Edit Event</span>
        </div>
      </header>

      {/* Content */}
      <main className="mx-auto max-w-6xl px-4 py-8">
        <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white/90 p-6 shadow-sm">
          <div className="mb-6">
            <h1 className="text-xl font-semibold text-zinc-900">Edit Event</h1>
            <p className="mt-1 text-sm text-zinc-600">
              Perbarui informasi acara. Kamu bisa mengganti atau menghapus banner.
            </p>
          </div>

          {formError && (
            <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
              {formError}
            </div>
          )}

          <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            {/* Kolom kiri: field utama */}
            <div className="lg:col-span-2 space-y-4">
              {/* Judul */}
              <div>
                <label className="block text-sm font-medium text-zinc-800">
                  Judul
                  <input
                    type="text"
                    name="title"
                    value={event.title || ""}
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
                    value={event.description || ""}
                    onChange={handleChange}
                    rows={6}
                    className="mt-1 w-full rounded-2xl border border-zinc-200 px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    placeholder="Ringkasan acara, pengisi, info tiket, dll."
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
                    value={event.starts_at ? event.starts_at.slice(0, 16) : ""}
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
                    value={event.ends_at ? event.ends_at.slice(0, 16) : ""}
                    onChange={handleChange}
                    min={minEnd}
                    className="mt-1 h-11 w-full rounded-2xl border border-zinc-200 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </label>
              </div>

              {/* Lokasi + Alamat */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <label className="block text-sm font-medium text-zinc-800">
                  Lokasi
                  <input
                    type="text"
                    name="location_name"
                    value={event.location_name || ""}
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
                    value={event.address || ""}
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
                    value={event.category_id || ""}
                    onChange={handleChange}
                    required
                    className="mt-1 h-11 w-full rounded-2xl border border-zinc-200 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="">-- Pilih Kategori --</option>
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

            {/* Kolom kanan: Banner */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-zinc-800">
                  Banner
                </label>

                {/* Preview current or new */}
                <div className="mt-2 overflow-hidden rounded-2xl border border-zinc-200 bg-zinc-50">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={bannerPreview || currentBannerUrl || "/placeholder.png"}
                    alt="Banner"
                    className="h-40 w-full object-cover"
                  />
                </div>

                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <label className="relative inline-flex cursor-pointer items-center rounded-2xl border border-zinc-200 bg-white px-3 py-2 text-sm font-medium text-zinc-800 shadow-sm hover:bg-zinc-50">
                    <input type="file" accept="image/*" onChange={handleFileChange} className="absolute inset-0 h-full w-full cursor-pointer opacity-0" />
                    Ganti Banner
                  </label>

                  {currentBannerUrl && !bannerFile && (
                    <button
                      type="button"
                      onClick={() => { setRemoveBanner((v) => !v) }}
                      className={[
                        "inline-flex items-center rounded-2xl border px-3 py-2 text-sm font-medium transition",
                        removeBanner
                          ? "border-red-200 bg-red-50 text-red-700"
                          : "border-zinc-200 bg-white text-zinc-800 hover:bg-zinc-50",
                      ].join(" ")}
                    >
                      {removeBanner ? "Batal Hapus Banner" : "Hapus Banner"}
                    </button>
                  )}

                  {bannerFile && (
                    <button
                      type="button"
                      onClick={() => { setBannerFile(null); setBannerPreview(null) }}
                      className="inline-flex items-center rounded-2xl border border-zinc-200 bg-white px-3 py-2 text-sm font-medium text-zinc-800 hover:bg-zinc-50"
                    >
                      Batalkan Ganti
                    </button>
                  )}
                </div>

                <p className="mt-2 text-xs text-zinc-500">
                  File yang di upload, maksimal 5MB.
                </p>
              </div>

              <div className="rounded-2xl border border-emerald-200 bg-emerald-50/60 p-3 text-xs text-emerald-800">
                Kamu bisa mengosongkan banner (hapus) atau menggantinya kapan saja.
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
                {saving ? "Menyimpan..." : "Simpan Perubahan"}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  )
}
