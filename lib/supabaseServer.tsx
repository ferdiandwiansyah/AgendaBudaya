// PATH: lib/supabaseServer.tsx
import { createServerClient, type CookieOptions } from "@supabase/ssr"
import { createClient } from "@supabase/supabase-js"
import { cookies } from "next/headers"

type Mode = "auto" | "server" | "stateless"

export async function createServerSupabase(mode: Mode = "auto") {
  const cookieStore = await cookies()

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

  // deteksi sesi: sb-...-auth-token
  const all = typeof (cookieStore as any).getAll === "function" ? (cookieStore as any).getAll() : []
  const hasSession = (all as Array<{ name: string }>).some(
    (c) => c.name.startsWith("sb-") && c.name.endsWith("-auth-token")
  )
  const useServerClient = mode === "server" || (mode === "auto" && hasSession)

  if (!useServerClient) {
    return createClient(url, anon, { auth: { persistSession: false, autoRefreshToken: false } })
  }

  // ✅ adaptor cookies aman: get OK, set/remove NO-OP di RSC (dibungkus try/catch)
  const safeGet = (name: string) => {
    try { return (cookieStore as any).get?.(name)?.value } catch { return undefined }
  }

  const safeSet = (name: string, value: string, options?: CookieOptions) => {
    try {
      (cookieStore as any).set?.(name, value, {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        ...options,
      })
    } catch {
      // Di RSC, Next akan melempar — kita abaikan supaya tidak crash.
    }
  }

  const safeRemove = (name: string, options?: CookieOptions) => {
    try {
      (cookieStore as any).set?.(name, "", {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        maxAge: 0,
        ...options,
      })
    } catch {
      // Di RSC, abaikan.
    }
  }

  return createServerClient(url, anon, {
    cookies: { get: safeGet, set: safeSet, remove: safeRemove },
  })
}
