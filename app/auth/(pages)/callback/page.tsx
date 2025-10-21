// app/auth/(pages)/callback/page.tsx
"use client"

import { Suspense, useEffect, useState } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { supabaseClient } from "@/lib/supabaseClient"

function AuthCallbackInner() {
  const router = useRouter()
  const sp = useSearchParams()
  const go = sp.get("redirect") || "/admin/events"
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const run = async () => {
      // Tukar code → session di client
      const { error } = await supabaseClient.auth.exchangeCodeForSession(window.location.href)
      if (error) {
        setError(error.message)
        return
      }

      // ⬇️ Sinkronkan session ke cookie server
      const { data: { session } } = await supabaseClient.auth.getSession()
      await fetch("/auth/callback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ event: "SIGNED_IN", session }),
      })

      router.replace(go)
    }
    run()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="mx-auto max-w-md px-4 py-16 text-center">
      <div className="text-3xl">🔐</div>
      <h1 className="mt-2 text-xl font-semibold">Memproses Login…</h1>
      {!error ? (
        <p className="mt-2 text-sm text-gray-600">
          Sebentar ya, Anda akan diarahkan otomatis.
        </p>
      ) : (
        <p className="mt-2 text-sm text-red-600">{error}</p>
      )}
    </div>
  )
}

export default function AuthCallbackPage() {
  // ✅ Bungkus di dalam Suspense agar useSearchParams() valid
  return (
    <Suspense fallback={<div className="p-10 text-center">Memuat...</div>}>
      <AuthCallbackInner />
    </Suspense>
  )
}
