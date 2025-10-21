"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"

export default function RowActions({
  id,
  currentStatus,
}: {
  id: string
  currentStatus: "registered" | "checked_in" | "cancelled"
}) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const updateStatus = async (status: "registered" | "checked_in" | "cancelled") => {
    if (status === currentStatus) return
    setLoading(true)
    const res = await fetch(`/api/admin/registrations/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    })
    setLoading(false)
    if (res.ok) router.refresh()
    else alert((await res.json()).message || "Gagal update status")
  }

  const del = async () => {
    if (!confirm("Hapus registrasi ini?")) return
    setLoading(true)
    const res = await fetch(`/api/admin/registrations/${id}`, { method: "DELETE" })
    setLoading(false)
    if (res.ok) router.refresh()
    else alert((await res.json()).message || "Gagal menghapus")
  }

  return (
    <div className="inline-flex items-center gap-2">
      <select
        className="rounded-xl border bg-white px-2 py-1 text-xs shadow-card disabled:opacity-50"
        defaultValue={currentStatus}
        disabled={loading}
        onChange={(e) => updateStatus(e.target.value as any)}
      >
        <option value="registered">Registered</option>
        <option value="checked_in">Checked-in</option>
        <option value="cancelled">Cancelled</option>
      </select>
      <button
        onClick={del}
        disabled={loading}
        className="rounded-xl border bg-white px-2 py-1 text-xs text-rose-600 shadow-card hover:shadow-card-hover disabled:opacity-50"
      >
        Hapus
      </button>
    </div>
  )
}
