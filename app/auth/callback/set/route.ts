// PATH: app/auth/callback/set/route.ts
import { NextResponse } from "next/server"
import { createServerSupabase } from "@/lib/supabaseServer"

export async function POST(req: Request) {
  const supabase = await createServerSupabase("server") // ⬅️ pastikan "server"

  const { event, session } = await req.json()

  if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED") {
    if (session?.access_token && session?.refresh_token) {
      await supabase.auth.setSession({
        access_token: session.access_token,
        refresh_token: session.refresh_token,
      })
    }
  } else if (event === "SIGNED_OUT") {
    await supabase.auth.signOut()
  }

  return NextResponse.json({ ok: true })
}
