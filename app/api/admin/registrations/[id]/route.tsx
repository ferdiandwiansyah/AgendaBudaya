// app/api/admin/registrations/[id]/route.ts
import { NextRequest, NextResponse } from "next/server"
import { createServerSupabase } from "@/lib/supabaseServer"

async function ensureAdmin() {
  const supabase = await createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { ok: false, supabase }
  const { data: isAdmin } = await supabase
    .from("admins")
    .select("user_id")
    .eq("user_id", user.id)
    .single()
  if (!isAdmin) return { ok: false, supabase }
  return { ok: true, supabase }
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const guard = await ensureAdmin()
  if (!guard.ok) return NextResponse.json({ message: "Forbidden" }, { status: 403 })
  const { supabase } = guard

  const { status } = await req.json()
  if (!["registered", "checked_in", "cancelled"].includes(status)) {
    return NextResponse.json({ message: "Status tidak valid" }, { status: 400 })
  }

  const { error } = await supabase
    .from("registrations")
    .update({ status })
    .eq("id", params.id)

  if (error) return NextResponse.json({ message: error.message }, { status: 400 })
  return NextResponse.json({ ok: true })
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const guard = await ensureAdmin()
  if (!guard.ok) return NextResponse.json({ message: "Forbidden" }, { status: 403 })
  const { supabase } = guard

  const { error } = await supabase
    .from("registrations")
    .delete()
    .eq("id", params.id)

  if (error) return NextResponse.json({ message: error.message }, { status: 400 })
  return NextResponse.json({ ok: true })
}
