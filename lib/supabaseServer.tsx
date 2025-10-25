// PATH: lib/supabaseServer.tsx
import { createServerClient, type CookieOptions } from "@supabase/ssr"
import { createClient } from "@supabase/supabase-js"
import { cookies } from "next/headers"

type Mode = "auto" | "server" | "stateless"

/**
 * createServerSupabase
 *  - mode "auto": kalau ada cookie sesi → SSR client, kalau tidak → stateless client
 *  - mode "server": selalu SSR client (untuk Route Handler/Server Action)
 *  - mode "stateless": selalu stateless client
 */
export async function createServerSupabase(mode: Mode = "auto") {
  // ✅ Environment kamu mengembalikan Promise<ReadonlyRequestCookies>
  const cookieStore = await cookies()

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

  // Ambil semua cookie bila tersedia (beberapa konteks hanya readonly)
  const all = typeof (cookieStore as any).getAll === "function"
    ? (cookieStore as any).getAll()
    : []

  // ✅ Deteksi sesi pakai sb-...-auth-token (paling stabil)
  const hasSession = (all as Array<{ name: string }>).some(
    (c) => c.name.startsWith("sb-") && c.name.endsWith("-auth-token")
  )

  const useServerClient = mode === "server" || (mode === "auto" && hasSession)

  if (!useServerClient) {
    // MODE stateless: untuk halaman publik (tanpa read/write cookie di server)
    return createClient(url, anon, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    })
  }

  // Wrapper aman: hanya set cookie jika API set() tersedia (Route Handler/Server Action)
  const safeSet = (name: string, value: string, options?: CookieOptions) => {
    if (typeof (cookieStore as any).set === "function") {
      (cookieStore as any).set(name, value, {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        ...options,
      })
    }
  }
  const safeGet = (name: string) =>
    typeof (cookieStore as any).get === "function"
      ? (cookieStore as any).get(name)?.value
      : undefined

  // MODE server: SSR client penuh (baca/tulis cookie httpOnly)
  return createServerClient(url, anon, {
    cookies: {
      get: safeGet,
      set: safeSet,
      remove: (name, options) => safeSet(name, "", { maxAge: 0, ...options }),
    },
  })
}
