// app/api/admin/registrations/export/route.ts
import { NextRequest, NextResponse } from "next/server"
import { createServerSupabase } from "@/lib/supabaseServer"

function toCSV(rows: any[]) {
  const header = ["event_title","name","email","phone","status","created_at"]
  const escape = (v: any) => {
    if (v == null) return ""
    const s = String(v)
    if (s.includes(",") || s.includes('"') || s.includes("\n")) {
      return `"${s.replace(/"/g, '""')}"`
    }
    return s
  }
  const lines = [header.join(",")]
  for (const r of rows) {
    const ev = (r as any).events
    lines.push([
      escape(ev?.title ?? ""),
      escape(r.name),
      escape(r.email),
      escape(r.phone ?? ""),
      escape(r.status),
      escape(r.created_at),
    ].join(","))
  }
  return lines.join("\n")
}

export async function GET(req: NextRequest) {
  const supabase = await createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ message: "Unauthorized" }, { status: 401 })

  const { data: isAdmin } = await supabase
    .from("admins")
    .select("user_id")
    .eq("user_id", user.id)
    .single()
  if (!isAdmin) return NextResponse.json({ message: "Forbidden" }, { status: 403 })

  const url = new URL(req.url)
  const q = (url.searchParams.get("q") ?? "").trim()
  const status = (url.searchParams.get("status") ?? "").trim()
  const eventId = (url.searchParams.get("event") ?? "").trim()

  let query = supabase
    .from("registrations")
    .select("name,email,phone,status,created_at,events(title)")

  if (eventId) query = query.eq("event_id", eventId)
  if (status) query = query.eq("status", status)
  if (q) query = query.or(`name.ilike.%${q}%,email.ilike.%${q}%,phone.ilike.%${q}%`)

  const { data, error } = await query.order("created_at", { ascending: false })
  if (error) return NextResponse.json({ message: error.message }, { status: 400 })

  const csv = toCSV(data ?? [])
  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": "attachment; filename=registrations.csv",
      "Cache-Control": "no-store",
    },
  })
}
