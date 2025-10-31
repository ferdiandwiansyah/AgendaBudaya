// app/api/register/route.ts
import { NextResponse, NextRequest } from "next/server"
import { createServerSupabase } from "@/lib/supabaseServer"

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}
const toPhone = (s?: string | null) => (s ? s.replace(/[^\d]/g, "") : "")

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

    // endpoint publik → jangan utak-atik cookie server
    const supabase = await createServerSupabase("stateless")

    // Ambil mode & harga event
    const { data: ev, error: evErr } = await supabase
      .from("events")
      .select("id, title, slug, capacity, registrations_count, price, currency, payment_mode, whatsapp_contact, external_payment_url")
      .eq("id", event_id)
      .single()

    if (evErr || !ev) {
      return NextResponse.json({ ok: false, message: "Event tidak ditemukan." }, { status: 404 })
    }

    const amount = Number.isFinite(ev.price) ? Number(ev.price) : 0
    const cleanPhone = phone ? String(phone).replace(/[^\d+]/g, "").slice(0, 20) : null

    // ===== FREE =====
    if (ev.payment_mode === "free" || amount <= 0) {
      const { error } = await supabase.from("registrations").insert({
        event_id,
        name: String(name).trim(),
        email: String(email).trim().toLowerCase(),
        phone: cleanPhone,
        status: "registered",
        amount: 0,
      })

      if (error) {
        // unique violation
        if ((error as any).code === "23505") {
          return NextResponse.json({ ok: false, message: "Email ini sudah terdaftar untuk event ini." }, { status: 409 })
        }
        // RLS block (mis. kuota penuh)
        if (error.message?.toLowerCase().includes("row-level security") || (error as any).code === "42501") {
          return NextResponse.json({ ok: false, message: "Pendaftaran ditutup atau kuota sudah penuh." }, { status: 403 })
        }
        return NextResponse.json({ ok: false, message: error.message || "Gagal mendaftar." }, { status: 400 })
      }

      return NextResponse.json({ ok: true, message: "Pendaftaran berhasil. Sampai jumpa di acara!" })
    }

    // ===== EXTERNAL (manual via WA/URL panitia) =====
    if (ev.payment_mode === "external") {
      const { data: reg, error } = await supabase
        .from("registrations")
        .insert({
          event_id,
          name: String(name).trim(),
          email: String(email).trim().toLowerCase(),
          phone: cleanPhone,
          status: "pending",
          amount,
        })
        .select("id")
        .single()

      if (error) {
        if ((error as any).code === "23505") {
          return NextResponse.json({ ok: false, message: "Email ini sudah terdaftar untuk event ini." }, { status: 409 })
        }
        return NextResponse.json({ ok: false, message: error.message || "Gagal membuat pendaftaran." }, { status: 400 })
      }

      // WhatsApp panitia
      const wa = toPhone(ev.whatsapp_contact)
      if (wa) {
        const amountLabel = new Intl.NumberFormat("id-ID", { style: "currency", currency: ev.currency || "IDR" }).format(amount)
        const text = [
          `Halo panitia ${ev.title}, saya ingin konfirmasi pembelian tiket.`,
          `Nama: ${name}`,
          `Email: ${email}`,
          phone ? `HP: ${phone}` : "",
          `Kode: ${reg?.id}`,
          `Jumlah: 1 tiket`,
          `Harga: ${amountLabel}`,
          `Link acara: ${APP_URL}/events/${ev.slug ?? ev.id}`,
        ].filter(Boolean).join("\n")

        const whatsapp_url = `https://wa.me/${wa}?text=${encodeURIComponent(text)}`
        return NextResponse.json({ ok: true, redirect: "whatsapp", whatsapp_url, message: "Silakan lanjutkan via WhatsApp panitia." })
      }

      // URL eksternal lain (form/landing panitia)
      if (ev.external_payment_url) {
        return NextResponse.json({ ok: true, redirect: "external", external_url: ev.external_payment_url, message: "Lanjutkan pembayaran/konfirmasi di tautan berikut." })
      }

      // fallback
      return NextResponse.json({ ok: true, message: "Pendaftaran pending. Panitia akan menghubungi Anda." })
    }

    return NextResponse.json({ ok: false, message: "Mode pembayaran event tidak dikenali." }, { status: 400 })
  } catch {
    return NextResponse.json({ ok: false, message: "Permintaan tidak valid." }, { status: 400 })
  }
}

