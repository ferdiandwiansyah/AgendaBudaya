// app/auth/callback/route.ts
import { NextResponse } from "next/server"
import { createServerSupabase } from "@/lib/supabaseServer"

export async function GET(req: Request) {
  const supabase = await createServerSupabase()
  const url = new URL(req.url)
  const code = url.searchParams.get("code")
  const redirectTo = url.searchParams.get("redirect") || "/admin/events"

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (error) {
      return NextResponse.redirect(new URL(`/auth/sign-in?error=${encodeURIComponent(error.message)}`, req.url))
    }
  }
  return NextResponse.redirect(new URL(redirectTo, req.url))
}

export async function POST(req: Request) {
  const supabase = await createServerSupabase()
  const { event, session } = await req.json()

  if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED") {
    await supabase.auth.setSession({
      access_token: session?.access_token,
      refresh_token: session?.refresh_token,
    })
  } else if (event === "SIGNED_OUT") {
    await supabase.auth.signOut()
  }

  return NextResponse.json({ ok: true })
}
