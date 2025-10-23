// PATH: lib/supabaseServer.tsx
import { createServerClient, type CookieOptions } from "@supabase/ssr"
import { createClient } from "@supabase/supabase-js"
import { cookies } from "next/headers"

type ReqCookie = { name: string; value: string }

type Mode = "auto" | "server" | "stateless"

/**
 * createServerSupabase
 *  - mode "auto" (default): kalau ada refresh-cookie → SSR client, kalau tidak → stateless client
 *  - mode "server": SELALU SSR client (dipakai di Route Handler yang nulis/hapus cookie)
 *  - mode "stateless": SELALU stateless client
 */
export async function createServerSupabase(mode: Mode = "auto") {
  const cookieStore = await cookies()

  let all: ReqCookie[] = []
  try {
    // Next.js cookies().getAll() mengembalikan array { name, value, ... }
    const raw = cookieStore.getAll()
    all = raw.map(c => ({ name: c.name, value: c.value }))
  } catch {
    all = []
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

  // Deteksi cookie refresh token (untuk mode auto)
  const hasSession =
    all.some((c) => c.name.startsWith("sb-") && c.name.endsWith("-refresh-token"))

  // Pilih mode
  const useServerClient =
    mode === "server" || (mode === "auto" && hasSession)

  if (!useServerClient) {
    // MODE stateless: tidak simpan/refresh session di server (buat halaman publik)
    return createClient(url, anon, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    })
  }

  // MODE server: SSR client penuh, bisa baca/tulis cookie
  const client = createServerClient(url, anon, {
    cookies: {
      getAll() {
        try {
          return cookieStore.getAll()
        } catch {
          return []
        }
      },
      setAll(cookiesToSet) {
        // Hanya bisa set cookie di Route Handler / Server Action
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options as CookieOptions)
          })
        } catch {
          // Di RSC biasa, abaikan
        }
      },
    },
  })

  return client
}
