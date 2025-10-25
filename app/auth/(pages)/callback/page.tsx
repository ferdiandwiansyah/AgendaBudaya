// app/auth/(pages)/callback/page.tsx
"use client"

import { Suspense, useEffect, useRef, useState } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { supabaseClient } from "@/lib/supabaseClient"

function AuthCallbackInner() {
  const router = useRouter()
  const sp = useSearchParams()
  const [error, setError] = useState<string | null>(null)

  // Hindari jalannya effect 2x di dev (React Strict Mode)
  const hasRun = useRef(false)

  // Pastikan redirect aman (hanya path relatif)
  const redirectParam = sp.get("redirect") || "/admin/events"
  const go = redirectParam.startsWith("/") ? redirectParam : "/admin/events"

  useEffect(() => {
    if (hasRun.current) return
    hasRun.current = true

    const run = async () => {
      try {
        const code = sp.get("code")
        if (!code) {
          // Tidak ada code → langsung arahkan
          router.replace(go)
          return
        }

        // 1) Tukar code → session di CLIENT
        const { error: exchErr } = await supabaseClient.auth.exchangeCodeForSession(
          typeof window !== "undefined" ? window.location.href : ""
        )
        if (exchErr) {
          setError(exchErr.message)
          return
        }

        // 2) Ambil session lalu POST ke server agar cookie httpOnly ditulis
        const {
          data: { session },
        } = await supabaseClient.auth.getSession()

        if (!session?.access_token || !session?.refresh_token) {
          // ✅ bersihkan jejak lokal agar tidak ada refresh loop
          await supabaseClient.auth.signOut({ scope: "local" })
          setError("Sesi tidak lengkap. Coba login ulang.")
          return
        }

        const resp = await fetch("/auth/callback/set", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ event: "SIGNED_IN", session }),
          cache: "no-store",
        })

        if (!resp.ok) {
          const msg = await resp.text().catch(() => "")
          setError(`Gagal menyimpan sesi di server. ${msg || ""}`.trim())
          return
        }

        // 3) Sukses → redirect
        router.replace(go)
      } catch (e: any) {
        setError(e?.message || "Terjadi kesalahan tak terduga.")
      }
    }

    run()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="mx-auto max-w-md px-4 py-16 text-center">
      <div className="text-3xl">🔐</div>
      <h1 className="mt-2 text-xl font-semibold">Memproses Login…</h1>
      {!error ? (
        <p className="mt-2 text-sm text-gray-600">Sebentar ya, Anda akan diarahkan otomatis.</p>
      ) : (
        <p className="mt-2 text-sm text-red-600">{error}</p>
      )}
    </div>
  )
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={<div className="p-10 text-center">Memuat...</div>}>
      <AuthCallbackInner />
    </Suspense>
  )
}
