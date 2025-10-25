// PATH: app/auth/sign-in/SignInContent.tsx
"use client"

import { useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { supabaseClient } from "@/lib/supabaseClient"
import { Eye, EyeOff, ArrowLeft, Home } from "lucide-react"

export default function SignInContent() {
  const router = useRouter()
  const sp = useSearchParams()
  const redirectTo = sp.get("redirect") || "/admin/events"

  const [identifier, setIdentifier] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [showPw, setShowPw] = useState(false)

  const handleBack = () => {
    if (document.referrer && new URL(document.referrer).origin === location.origin) {
      router.back()
    } else {
      router.push("/")
    }
  }

  async function resolveEmail(id) {
    const res = await fetch("/api/auth/resolve-identifier", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ identifier: id }),
    })
    const json = await res.json()
    if (!res.ok) throw new Error(json?.error || "RESOLVE_FAILED")
    return json.email
  }

  const signIn = async () => {
    setLoading(true)
    setError(null)
    try {
      const email = await resolveEmail(identifier)
      const { error } = await supabaseClient.auth.signInWithPassword({ email, password })
      if (error) throw new Error("INVALID_CREDENTIALS")

      const { data: { session } } = await supabaseClient.auth.getSession()
      await fetch("/auth/callback/set", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ event: "SIGNED_IN", session }),
      })

      window.location.href = redirectTo
    } catch {
      setError("Email/username atau kata sandi salah.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative min-h-[100svh] bg-gradient-to-b from-emerald-50/60 via-white to-white">
      <header className="border-b border-zinc-200/70 bg-white/60 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
          <button
            type="submit"
            onClick={handleBack}
            className="inline-flex items-center gap-2 rounded-xl border border-zinc-200 bg-white/70 px-3 py-1.5 text-sm font-medium text-zinc-800 shadow-sm transition hover:bg-zinc-50 focus:outline-none focus:ring-2 focus:ring-emerald-600"
          >
            <ArrowLeft className="h-4 w-4" />
            Kembali
          </button>
          <span className="text-xs text-zinc-500">Login</span>
        </div>
      </header>

      <main className="mx-auto grid max-w-7xl grid-cols-1 place-items-center px-4 py-12 sm:py-16">
        <div className="w-full max-w-md">
          <div className="mb-6 text-center">
            <span className="inline-flex items-center rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700 ring-1 ring-emerald-200">
              Akses Admin
            </span>
            <h1 className="mt-3 text-2xl font-extrabold tracking-tight text-zinc-900 sm:text-3xl">
              Masuk Admin
            </h1>
            <p className="mt-1 text-sm text-zinc-600">Hanya admin yang dapat mengakses dashboard.</p>
          </div>

          <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
            <label className="block text-sm font-medium text-zinc-800">
              Email atau Username
              <input
                type="text"
                className="mt-1 h-11 w-full rounded-2xl border border-zinc-200 px-3 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="email atau nama"
              />
            </label>

            <label className="mt-4 block text-sm font-medium text-zinc-800">
              Kata sandi
              <div className="mt-1 relative">
                <input
                  type={showPw ? "text" : "password"}
                  className="h-11 w-full rounded-2xl border border-zinc-200 px-3 pr-12 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPw(v => !v)}
                  className="absolute inset-y-0 right-2 my-auto inline-flex h-8 w-8 items-center justify-center rounded-xl text-zinc-600 hover:text-zinc-800 focus:outline-none focus:ring-2 focus:ring-emerald-600"
                >
                  {showPw ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </label>

            <div className="mt-5">
              <button
                onClick={signIn}
                disabled={loading || !identifier || !password}
                className="inline-flex h-11 w-full items-center justify-center rounded-2xl bg-emerald-600 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 disabled:opacity-50"
              >
                {loading ? "Memproses..." : "Masuk"}
              </button>
            </div>

            {error && (
              <p className="mt-3 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">
                {error}
              </p>
            )}

          </div>
          <p className="mt-6 text-center text-sm">
            <Link href="/" className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1 font-semibold text-zinc-800 hover:text-emerald-700">
              <Home className="h-5 w-5" />
              Kembali ke beranda
            </Link>
          </p>
        </div>
      </main>
    </div>
  )
}
