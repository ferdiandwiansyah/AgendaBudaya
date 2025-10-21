// PATH: app/admin/danger/page.tsx
"use client";

import { useActionState, useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { deleteAdminAction } from "../setup/actions"
import { ArrowLeft, AlertTriangle, Trash2 } from "lucide-react"

export default function DangerPage() {
  const router = useRouter()
  const [state, formAction] = useActionState(deleteAdminAction, { ok: false, message: "" })
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null)

  useEffect(() => {
    if (!state.message) return
    setToast({ type: state.ok ? "success" : "error", message: state.message })
    const t = setTimeout(() => setToast(null), 5000)
    return () => clearTimeout(t)
  }, [state])

  const handleBack = () => {
    try {
      if (document.referrer && new URL(document.referrer).origin === location.origin) {
        router.back(); return
      }
    } catch {}
    router.push("/admin/setup")
  }

  return (
    <>
      {/* Back */}
      <div className="mt-4 ml-4">
        <button
          type="button"
          onClick={handleBack}
          aria-label="Kembali"
          className="inline-flex items-center gap-2 rounded-xl border border-zinc-200 bg-white/70 px-3 py-1.5 text-sm font-medium text-zinc-800 shadow-sm transition hover:bg-zinc-50 focus:outline-none focus:ring-2 focus:ring-emerald-600"
        >
          <ArrowLeft className="h-4 w-4" />
          Kembali
        </button>
      </div>

      {/* Toast */}
      {toast && (
        <div
          role={toast.type === "success" ? "status" : "alert"}
          aria-live="polite"
          className={`fixed top-4 right-4 z-50 w-[calc(100%-2rem)] max-w-sm rounded-2xl px-4 py-3 text-sm shadow-lg ring-1 ${
            toast.type === "success" ? "bg-emerald-600 text-white ring-emerald-500/50" : "bg-red-600 text-white ring-red-500/50"
          }`}
        >
          <div className="flex items-start gap-3">
            <div className="flex-1">
              <p className="font-semibold">{toast.type === "success" ? "Berhasil" : "Gagal"}</p>
              <p className="mt-0.5 opacity-90">{toast.message}</p>
              <div className="mt-3 flex gap-2">
                <Link
                  href="/auth/sign-in"
                  className="inline-flex items-center rounded-xl bg-white/15 px-3 py-1.5 text-xs font-medium hover:bg-white/25"
                >
                  Ke halaman masuk
                </Link>
                <button
                  onClick={() => setToast(null)}
                  className="inline-flex items-center rounded-xl bg-white/10 px-3 py-1.5 text-xs font-medium hover:bg-white/20"
                >
                  Tutup
                </button>
              </div>
            </div>
            <button
              onClick={() => setToast(null)}
              aria-label="Tutup notifikasi"
              className="ml-2 inline-flex h-7 w-7 items-center justify-center rounded-lg bg-white/10 hover:bg-white/20"
            >
              ×
            </button>
          </div>
        </div>
      )}

      {/* Page content */}
      <div className="mx-auto max-w-md px-4 py-10">
        <div className="mb-4 flex items-center gap-2 text-red-700">
          <AlertTriangle className="h-5 w-5" />
          <h1 className="text-xl font-semibold">Danger Zone — Hapus Admin</h1>
        </div>
        <p className="text-sm text-zinc-600">
          Menghapus admin akan <span className="font-medium text-zinc-800">menghapus akun di Auth</span>
        </p>

        <form action={formAction} className="mt-6 space-y-3 rounded-2xl border border-red-200 bg-red-50 p-4">
          <label className="block text-sm font-medium text-red-900">
            Username admin yang akan dihapus
            <input
              name="del_username"
              type="text"
              required
              pattern="^[a-z0-9_.]{3,24}$"
              title="a–z, 0–9, underscore, titik; 3–24 karakter"
              className="mt-1 h-11 w-full rounded-2xl border border-red-200 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
              placeholder="mis. superadmin"
            />
          </label>

          <label className="block text-sm font-medium text-red-900">
            Kode Setup
            <input
              name="del_setup_code"
              type="password"
              required
              className="mt-1 h-11 w-full rounded-2xl border border-red-200 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
              placeholder="Masukkan kode rahasia"
            />
          </label>

          <button
            type="submit"
            className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-2xl bg-red-600 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-red-700"
          >
            <Trash2 className="h-4 w-4" />
            Hapus Admin
          </button>

          <p className="mt-1 text-xs text-red-700">
            Tindakan ini tidak bisa dibatalkan. Pastikan username & kodenya benar.
          </p>
        </form>
      </div>
    </>
  )
}
