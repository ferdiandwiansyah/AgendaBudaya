"use client"

import { useState } from "react"

export default function RegisterForm({
  eventId,
  capacity,
  registeredCount,
}: {
  eventId: string
  capacity: number | null
  registeredCount: number
}) {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)
  const [err, setErr] = useState<string | null>(null)

  const remaining = capacity == null ? null : Math.max(capacity - registeredCount, 0)
  const full = typeof remaining === "number" && remaining <= 0

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true); setMsg(null); setErr(null)
    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ event_id: eventId, name, email, phone }),
      })
      const data = await res.json()
      if (!res.ok) {
        setErr(data?.message || "Gagal mendaftar.")
      } else {
        setMsg(data?.message || "Pendaftaran berhasil.")
        setName(""); setEmail(""); setPhone("")
      }
    } catch (e: any) {
      setErr("Terjadi kesalahan jaringan.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-card">
      <h2 className="text-base font-semibold">Daftar Event</h2>

      <p className="mt-1 text-xs text-gray-600">
        {capacity == null ? (
          <>Kapasitas: <span className="font-medium">Tidak dibatasi</span></>
        ) : (
          <>Kapasitas: <span className="font-medium">{registeredCount}/{capacity}</span> {full && <span className="text-red-600"> — Penuh</span>}</>
        )}
      </p>

      <form onSubmit={submit} className="mt-3 space-y-3">
        <label className="block text-sm">
          Nama Lengkap
          <input
            className="mt-1 h-10 w-full rounded-2xl border border-gray-200 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            minLength={2}
            placeholder="Nama Anda"
          />
        </label>

        <label className="block text-sm">
          Email
          <input
            type="email"
            className="mt-1 h-10 w-full rounded-2xl border border-gray-200 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            placeholder="nama@domain.com"
          />
        </label>

        <label className="block text-sm">
          No. HP (opsional)
          <input
            className="mt-1 h-10 w-full rounded-2xl border border-gray-200 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="08xxxxxxxxxx"
          />
        </label>

        <button
          type="submit"
          disabled={loading || full}
          className={`w-full rounded-2xl px-4 py-2 text-sm font-medium ${full
            ? "cursor-not-allowed bg-gray-200 text-gray-500"
            : "bg-brand-600 text-white hover:shadow-card-hover"
          }`}
        >
          {loading ? "Mengirim..." : full ? "Kuota Penuh" : "Daftar Sekarang"}
        </button>

        {msg && <p className="text-sm text-green-700">{msg}</p>}
        {err && <p className="text-sm text-red-600">{err}</p>}
      </form>
    </div>
  )
}
