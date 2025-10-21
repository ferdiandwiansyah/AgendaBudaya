// PATH: app/admin/setup/actions.ts
"use server";

import { createClient } from "@supabase/supabase-js"
import { timingSafeEqual } from "crypto"

export type SetupState = { ok: boolean; message: string }

export async function createAdminAction(
  _prevState: SetupState,
  formData: FormData
): Promise<SetupState> {
  const email    = String(formData.get("email") || "").trim().toLowerCase()
  const password = String(formData.get("password") || "")
  const username = String(formData.get("username") || "").trim().toLowerCase()
  const code     = String(formData.get("setup_code") || "")

  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return { ok: false, message: "SUPABASE_SERVICE_ROLE_KEY belum di-set di .env.local." }
  }
  if (!process.env.ADMIN_SETUP_CODE) {
    return { ok: false, message: "ADMIN_SETUP_CODE belum di-set di .env.local." }
  }
  if (!email || !password || !username || !code) {
    return { ok: false, message: "Mohon isi email, username, password, dan kode." }
  }
  if (!/^[a-z0-9_.]{3,24}$/.test(username)) {
    return { ok: false, message: "Username hanya a–z, 0–9, underscore, titik; 3–24." }
  }

  // Validasi kode rahasia (constant-time compare)
  const expected = Buffer.from(process.env.ADMIN_SETUP_CODE)
  const provided = Buffer.from(code)
  const codeOk = expected.length === provided.length && timingSafeEqual(expected, provided)
  if (!codeOk) return { ok: false, message: "Kode tidak valid." }

  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const serviceKey  = process.env.SUPABASE_SERVICE_ROLE_KEY!
    const admin = createClient(supabaseUrl, serviceKey)

    // 1) Buat user auth (auto-confirm)
    const { data: created, error: cErr } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    })
    if (cErr) return { ok: false, message: `Gagal membuat user: ${cErr.message}` }

    const userId = created.user?.id
    if (!userId) return { ok: false, message: "User ID tidak tersedia setelah createUser." }

    // 2) Insert ke tabel admins (username unik)
    const { error: iErr } = await admin.from("admins").insert({ user_id: userId, username })
    if (iErr) {
      // rollback user bila insert gagal (mis. username duplikat)
      await admin.auth.admin.deleteUser(userId)
      return { ok: false, message: `Gagal insert baris admins: ${iErr.message}` }
    }

    return { ok: true, message: `Admin berhasil dibuat. user_id: ${userId}` }
  } catch {
    return { ok: false, message: "SERVER_ERROR saat membuat admin." }
  }
}

// ⬇️ AKSI BARU: Hapus admin berdasarkan username (hapus Auth user → admins ikut terhapus via CASCADE)
export async function deleteAdminAction(
  _prevState: SetupState,
  formData: FormData
): Promise<SetupState> {
  const username = String(formData.get("del_username") || "").trim().toLowerCase()
  const code     = String(formData.get("del_setup_code") || "")

  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return { ok: false, message: "SUPABASE_SERVICE_ROLE_KEY belum di-set di .env.local." }
  }
  if (!process.env.ADMIN_SETUP_CODE) {
    return { ok: false, message: "ADMIN_SETUP_CODE belum di-set di .env.local." }
  }
  if (!username || !code) {
    return { ok: false, message: "Mohon isi username dan kode." }
  }
  if (!/^[a-z0-9_.]{3,24}$/.test(username)) {
    return { ok: false, message: "Format username tidak valid." }
  }

  // Verifikasi kode rahasia
  const expected = Buffer.from(process.env.ADMIN_SETUP_CODE)
  const provided = Buffer.from(code)
  const codeOk = expected.length === provided.length && timingSafeEqual(expected, provided)
  if (!codeOk) return { ok: false, message: "Kode tidak valid." }

  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const serviceKey  = process.env.SUPABASE_SERVICE_ROLE_KEY!
    const admin = createClient(supabaseUrl, serviceKey)

    // Cari user_id dari tabel admins
    const { data: row, error: qErr } = await admin
      .from("admins")
      .select("user_id")
      .eq("username", username)
      .single()

    if (qErr || !row?.user_id) {
      return { ok: false, message: "Admin tidak ditemukan." }
    }

    // Hapus user di Auth (INI YANG MEMICU CASCADE KE `admins`)
    const { error: dErr } = await admin.auth.admin.deleteUser(row.user_id)
    if (dErr) return { ok: false, message: `Gagal menghapus user Auth: ${dErr.message}` }

    // Tidak perlu delete manual di `admins`: FK ON DELETE CASCADE sudah mengurus
    return { ok: true, message: `Admin '${username}' berhasil dihapus.` }
  } catch {
    return { ok: false, message: "SERVER_ERROR saat menghapus admin." }
  }
}
