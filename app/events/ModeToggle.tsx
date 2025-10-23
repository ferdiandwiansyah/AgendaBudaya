"use client"

import { useRouter, useSearchParams } from "next/navigation"

export default function ModeToggle({
  mode,
}: {
  mode: "mendatang" | "semua" | "lewat"
}) {
  const router = useRouter()
  const sp = useSearchParams()

  const setMode = (m: "mendatang" | "semua" | "lewat") => {
    const params = new URLSearchParams(sp.toString())
    params.set("mode", m)
    params.delete("page")
    router.push(`/events?${params.toString()}`)
  }

  const Item = ({ m, label }: { m: "mendatang" | "semua" | "lewat"; label: string }) => {
    const active = mode === m
    return (
      <button
        onClick={() => setMode(m)}
        className={
          "rounded-xl px-3 py-1.5 text-sm transition-colors " +
          (active
            ? "bg-ink text-white shadow-card-hover"
            : "bg-white text-ink hover:bg-gray-50")
        }
      >
        {label}
      </button>
    )
  }

  return (
    <div className="inline-flex items-center gap-1 rounded-2xl border border-gray-200 bg-white p-1 shadow-card">
      <Item m="mendatang" label="Mendatang" />
      <Item m="semua" label="Semua" />
      <Item m="lewat" label="Lewat" />
    </div>
  )
}
