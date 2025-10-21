"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { useEffect, useState } from "react"

export type Category = { id: string | number; name: string }

export default function FiltersBar({
  categories,
  initialQ,
  initialCategory,
}: {
  categories: Category[]
  initialQ: string
  initialCategory: string
}) {
  const router = useRouter()
  const sp = useSearchParams()

  const [q, setQ] = useState(initialQ ?? "")
  const [cat, setCat] = useState(initialCategory ?? "")

  useEffect(() => {
    const t = setTimeout(() => {
      const params = new URLSearchParams(sp.toString())
      if (q) params.set("q", q)
      else params.delete("q")

      if (cat) params.set("category", cat)
      else params.delete("category")

      router.push(`/events?${params.toString()}`)
    }, 300)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, cat])

  return (
    <div className="flex flex-col gap-3 md:flex-row md:items-center">
      <input
        aria-label="Cari event"
        type="search"
        placeholder="Cari judul atau lokasi…"
        className="h-10 w-full rounded-2xl border border-gray-200 bg-white px-3 text-sm shadow-card focus:outline-none focus:ring-2 focus:ring-emerald-500 md:w-80 text-black"
        value={q}
        onChange={(e) => setQ(e.target.value)}
      />
      <select
        aria-label="Filter kategori"
        className="h-10 w-full rounded-2xl border border-gray-200 bg-white px-3 text-sm shadow-card focus:outline-none focus:ring-2 focus:ring-emerald-500 md:w-56 text-black"
        value={cat}
        onChange={(e) => setCat(e.target.value)}
      >
        <option value="">Semua Kategori</option>
        {categories.map((c) => (
          <option key={String(c.id)} value={String(c.id)}>
            {c.name}
          </option>
        ))}
      </select>
    </div>
  )
}
