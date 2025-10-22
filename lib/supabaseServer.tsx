// PATH: lib/supabaseServer.tsx
import { createServerClient, type CookieOptions } from "@supabase/ssr"
import { createClient } from "@supabase/supabase-js"
import { cookies } from "next/headers"

/**
 * Client Supabase untuk App Router:
 * - Tanpa session (pengunjung belum login) → pakai client "stateless"
 *   (persistSession/autoRefreshToken = false) supaya tidak ada error refresh_token_not_found.
 * - Ada session (admin/user login) → pakai SSR client penuh (otomatis refresh token).
 */
export async function createServerSupabase() {
  const cookieStore = await cookies()

  // Ketikkan struktur cookie agar TS tidak error
  type ReqCookie = { name: string; value: string }

  let all: ReqCookie[] = []
  try {
    // getAll() sudah mengembalikan {name, value}[]
    all = cookieStore.getAll() as unknown as ReqCookie[]
  } catch {
    all = []
  }

  // Deteksi ada cookie refresh-token Supabase
  const hasSession = all.some(
    (c) => c.name.startsWith("sb-") && c.name.endsWith("-refresh-token")
  )

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

  // MODE 1: publik/stateless (tidak simpan/refresh session)
  if (!hasSession) {
    return createClient(url, anon, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    })
  }

  // MODE 2: ada session → SSR client penuh
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
          // Abaikan jika dipanggil dari RSC biasa
        }
      },
    },
  })

  return client
}
