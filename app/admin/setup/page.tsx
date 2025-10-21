// PATH: app/admin/setup/page.tsx
"use client";

import { useActionState, useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { createAdminAction } from "./actions"
import { Eye, EyeOff, ArrowLeft, ShieldAlert } from "lucide-react"

export default function AdminSetupPage() {
  const router = useRouter()
  const [state, formAction] = useActionState(createAdminAction, { ok: false, message: "" })
  const [showPw, setShowPw] = useState(false)
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
    router.push("/auth/sign-in")
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
              {toast.type === "success" && (
                <div className="mt-3 flex gap-2">
                  <Link href="/auth/sign-in" className="inline-flex items-center rounded-xl bg-white/15 px-3 py-1.5 text-xs font-medium hover:bg-white/25">
                    Masuk sekarang
                  </Link>
                  <button onClick={() => setToast(null)} className="inline-flex items-center rounded-xl bg-white/10 px-3 py-1.5 text-xs font-medium hover:bg-white/20">
                    Tutup
                  </button>
                </div>
              )}
            </div>
            <button onClick={() => setToast(null)} aria-label="Tutup notifikasi" className="ml-2 inline-flex h-7 w-7 items-center justify-center rounded-lg bg-white/10 hover:bg-white/20">
              ×
            </button>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="mx-auto max-w-md px-4 py-10">
        <h1 className="text-2xl font-bold tracking-tight">Buat Admin</h1>
        <p className="mt-1 text-sm text-zinc-600">Silahkan buat data admin terlebih dahulu</p>

        {/* FORM: Buat Admin */}
        <form action={formAction} className="mt-6 space-y-4 rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
          <label className="block text-sm font-medium text-zinc-800">
            Email
            <input
              name="email"
              type="email"
              required
              className="mt-1 h-11 w-full rounded-2xl border border-zinc-200 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              placeholder="admin@contoh.com"
            />
          </label>

          <label className="block text-sm font-medium text-zinc-800">
            Username
            <input
              name="username"
              type="text"
              required
              pattern="^[a-z0-9_.]{3,24}$"
              title="a–z, 0–9, underscore, titik; 3–24 karakter"
              className="mt-1 h-11 w-full rounded-2xl border border-zinc-200 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              placeholder="superadmin"
            />
          </label>

          <label className="block text-sm font-medium text-zinc-800">
            Password
            <div className="mt-1 relative">
              <input
                name="password"
                type={showPw ? "text" : "password"}
                required
                className="h-11 w-full rounded-2xl border border-zinc-200 px-3 pr-12 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                placeholder="Minimal 6 karakter"
              />
              <button
                type="button"
                onClick={() => setShowPw(v => !v)}
                className="absolute inset-y-0 right-2 my-auto inline-flex h-8 w-8 items-center justify-center rounded-md text-zinc-600 hover:text-zinc-800 focus:outline-none"
                aria-label={showPw ? "Sembunyikan password" : "Tampilkan password"}
                title={showPw ? "Sembunyikan password" : "Tampilkan password"}
              >
                {showPw ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
          </label>

          {/* Kode setup rahasia */}
          <label className="block text-sm font-medium text-zinc-800">
            Kode Setup
            <input
              name="setup_code"
              type="password"
              required
              className="mt-1 h-11 w-full rounded-2xl border border-zinc-200 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              placeholder="Masukkan kode rahasia"
            />
          </label>

          <button
            type="submit"
            className="mt-2 inline-flex h-11 w-full items-center justify-center rounded-2xl bg-emerald-600 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700"
          >
            Buat Admin
          </button>
        </form>

        {/* NAV ke Danger Page */}
        <div className="mt-8 rounded-2xl border border-amber-200 bg-amber-50 p-4">
          <div className="mb-2 flex items-center gap-2 text-amber-900">
            <ShieldAlert className="h-5 w-5" />
            <p className="text-sm font-semibold">Butuh hapus admin?</p>
          </div>
          <p className="text-xs text-amber-800">
            Penghapusan akun admin (hapus email Auth + baris <code className="text-amber-900">admins</code>) ada di halaman khusus.
          </p>
          <Link
            href="/admin/danger"
            className="mt-3 inline-flex items-center gap-2 rounded-xl bg-amber-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-amber-700"
          >
            Buka Danger Zone
          </Link>
        </div>
      </div>
    </>
  )
}
