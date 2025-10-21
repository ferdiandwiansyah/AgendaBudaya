// app/api/register/route.ts
import { NextResponse, NextRequest } from "next/server"
import { createServerSupabase } from "@/lib/supabaseServer"

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { event_id, name, email, phone } = body ?? {}

    if (!event_id || !name || !email) {
      return NextResponse.json({ ok: false, message: "Data tidak lengkap." }, { status: 400 })
    }
    if (!isValidEmail(email)) {
      return NextResponse.json({ ok: false, message: "Format email tidak valid." }, { status: 400 })
    }
    if (String(name).trim().length < 2) {
      return NextResponse.json({ ok: false, message: "Nama terlalu pendek." }, { status: 400 })
    }

    const supabase = await createServerSupabase()

    // optional: ambil event untuk pesan kapasitas/validasi soft
    const { data: ev } = await supabase
      .from("events")
      .select("id, title, capacity, registrations_count")
      .eq("id", event_id)
      .single()

    if (!ev) {
      return NextResponse.json({ ok: false, message: "Event tidak ditemukan." }, { status: 404 })
    }

    // Insert – tunduk pada RLS (akan gagal jika kuota penuh / tidak admin diubah)
    const { error } = await supabase.from("registrations").insert({
      event_id,
      name: String(name).trim(),
      email: String(email).trim().toLowerCase(),
      phone: phone ? String(phone).trim() : null,
      status: "registered",
    })

    if (error) {
      // unique violation
      if ((error as any).code === "23505") {
        return NextResponse.json({ ok: false, message: "Email ini sudah terdaftar untuk event ini." }, { status: 409 })
      }
      // RLS block (mis. kuota penuh)
      if (error.message?.toLowerCase().includes("row-level security") || error.code === "42501") {
        return NextResponse.json({ ok: false, message: "Pendaftaran ditutup atau kuota sudah penuh." }, { status: 403 })
      }
      return NextResponse.json({ ok: false, message: error.message || "Gagal mendaftar." }, { status: 400 })
    }

    return NextResponse.json({ ok: true, message: "Pendaftaran berhasil. Cek email Anda bila diperlukan." })
  } catch (e: any) {
    return NextResponse.json({ ok: false, message: "Permintaan tidak valid." }, { status: 400 })
  }
}
