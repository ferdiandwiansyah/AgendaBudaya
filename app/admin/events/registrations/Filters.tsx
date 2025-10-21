"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { useEffect, useState } from "react"

export default function Filters({
  events,
  initialQ,
  initialStatus,
  initialEventId,
}: {
  events: { id: string; title: string }[]
  initialQ: string
  initialStatus: "" | "registered" | "checked_in" | "cancelled"
  initialEventId: string
}) {
  const router = useRouter()
  const sp = useSearchParams()

  const [q, setQ] = useState(initialQ ?? "")
  const [status, setStatus] = useState(initialStatus ?? "")
  const [eventId, setEventId] = useState(initialEventId ?? "")

  useEffect(() => {
    const t = setTimeout(() => {
      const params = new URLSearchParams(sp.toString())
      if (q) params.set("q", q); else params.delete("q")
      if (status) params.set("status", status); else params.delete("status")
      if (eventId) params.set("event", eventId); else params.delete("event")
      params.delete("page")
      router.push(`/admin/registrations?${params.toString()}`)
    }, 300)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, status, eventId])

  return (
    <div className="flex flex-col gap-3 md:flex-row md:items-center">
      <input
        type="search"
        placeholder="Cari nama / email / HP…"
        className="h-10 w-full rounded-2xl border border-gray-200 bg-white px-3 text-sm shadow-card focus:outline-none focus:ring-2 focus:ring-brand-500 md:w-80"
        value={q}
        onChange={(e) => setQ(e.target.value)}
      />
      <select
        className="h-10 w-full rounded-2xl border border-gray-200 bg-white px-3 text-sm shadow-card focus:outline-none focus:ring-2 focus:ring-brand-500 md:w-56"
        value={status}
        onChange={(e) => setStatus(e.target.value as any)}
      >
        <option value="">Semua Status</option>
        <option value="registered">Registered</option>
        <option value="checked_in">Checked-in</option>
        <option value="cancelled">Cancelled</option>
      </select>
      <select
        className="h-10 w-full rounded-2xl border border-gray-200 bg-white px-3 text-sm shadow-card focus:outline-none focus:ring-2 focus:ring-brand-500 md:w-72"
        value={eventId}
        onChange={(e) => setEventId(e.target.value)}
      >
        <option value="">Semua Event</option>
        {events.map((e) => (
          <option key={e.id} value={e.id}>{e.title}</option>
        ))}
      </select>
    </div>
  )
}
