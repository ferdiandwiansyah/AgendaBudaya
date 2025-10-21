import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const serviceKey  = process.env.SUPABASE_SERVICE_ROLE_KEY! // server-only

// Service role client → boleh akses Admin API & bypass RLS
const admin = createClient(supabaseUrl, serviceKey)

export async function POST(req: Request) {
  try {
    const { identifier } = (await req.json()) as { identifier?: string }
    const raw = (identifier ?? "").trim()
    if (!raw) return NextResponse.json({ error: "IDENTIFIER_REQUIRED" }, { status: 400 })

    // Jika input sudah email → normalize dan kembalikan
    if (raw.includes("@")) {
      return NextResponse.json({ email: raw.toLowerCase() })
    }

    // Validasi username sederhana
    const uname = raw.toLowerCase()
    if (!/^[a-z0-9_.]{3,24}$/.test(uname)) {
      return NextResponse.json({ error: "INVALID_USERNAME" }, { status: 400 })
    }

    // Cari user_id dari tabel ADMINS
    const { data: adminRow, error: adminErr } = await admin
      .from("admins")
      .select("user_id")
      .eq("username", uname)
      .single()

    if (adminErr || !adminRow) {
      // Hindari user enumeration
      return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 })
    }

    // Ambil email yang valid via Admin API
    const { data: userData, error: userErr } = await admin.auth.admin.getUserById(adminRow.user_id)
    const email = userData?.user?.email?.toLowerCase()
    if (userErr || !email) {
      return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 })
    }

    return NextResponse.json({ email })
  } catch {
    return NextResponse.json({ error: "SERVER_ERROR" }, { status: 500 })
  }
}
