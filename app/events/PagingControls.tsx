"use client"

import { useRouter, useSearchParams } from "next/navigation"

export default function PagingControls({
  page,
  totalPages,
}: {
  page: number
  totalPages: number
}) {
  const router = useRouter()
  const sp = useSearchParams()

  const go = (p: number) => {
    const params = new URLSearchParams(sp.toString())
    if (p <= 1) params.delete("page")
    else params.set("page", String(p))
    router.push(`/events?${params.toString()}`)
  }

  if (totalPages <= 1) return null

  return (
    <div className="mt-8 flex items-center justify-center">
      <div className="inline-flex items-center gap-2 rounded-2xl border border-gray-200 bg-white p-1 shadow-card">
        <button
          className="rounded-xl px-3 py-1.5 text-sm hover:bg-gray-50 disabled:opacity-50"
          disabled={page <= 1}
          onClick={() => go(page - 1)}
        >
          Prev
        </button>
        <span className="px-2 text-sm text-gray-600">
          Page <span className="font-semibold text-ink">{page}</span> / {totalPages}
        </span>
        <button
          className="rounded-xl px-3 py-1.5 text-sm hover:bg-gray-50 disabled:opacity-50"
          disabled={page >= totalPages}
          onClick={() => go(page + 1)}
        >
          Next
        </button>
      </div>
    </div>
  )
}
