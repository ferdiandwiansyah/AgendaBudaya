// PATH: app/api/admin/featured/route.ts
import { NextRequest } from "next/server";
import { createServerSupabase } from "@/lib/supabaseServer";

async function requireAdmin() {
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { supabase, ok: false as const, status: 401, msg: "Unauthorized" };
  const { data: admin } = await supabase
    .from("admins")
    .select("user_id")
    .eq("user_id", user.id)
    .maybeSingle();
  if (!admin) return { supabase, ok: false as const, status: 403, msg: "Forbidden" };
  return { supabase, ok: true as const };
}

// ➜ Tambahkan helper kecil ini di file yang sama (di atas POST juga boleh)
function cleanSlug(input: string): string {
  let s = String(input || "").trim();

  // buang protokol & host jika ada
  s = s.replace(/^https?:\/\/[^/]+/i, "");
  // buang prefix / atau /events/
  s = s.replace(/^\/?(events\/)?/i, "");
  // buang querystring dan trailing slash
  s = s.split("?")[0].replace(/\/+$/g, "");
  // normalisasi ke lowercase
  s = s.toLowerCase();
  return s;
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function POST(req: NextRequest) {
  const gate = await requireAdmin();
  if (!gate.ok) return new Response(gate.msg, { status: gate.status });

  const body = await req.json().catch(() => ({}));
  const {
    event_id,
    event_slug,
    rank = 0,
    is_active = true,
    from_date = null,
    to_date = null,
  } = body ?? {};

  let finalEventId: string | null = event_id ?? null;

  // Jika tidak diberi event_id, coba pakai event_slug yang lebih “toleran”
  if (!finalEventId && event_slug) {
    const slug = cleanSlug(String(event_slug));

    // 1) Kalau input ternyata UUID, coba langsung pakai sebagai id
    if (UUID_RE.test(slug)) {
      const byId = await gate.supabase
        .from("events")
        .select("id, slug")
        .eq("id", slug)
        .maybeSingle();
      if (byId.data) {
        finalEventId = byId.data.id;
      }
    }

    // 2) Cari by slug exact (eq)
    if (!finalEventId) {
      const exact = await gate.supabase
        .from("events")
        .select("id, slug")
        .eq("slug", slug)
        .maybeSingle();
      if (exact.data) {
        finalEventId = exact.data.id;
      }
    }

    // 3) Fallback: cari case-insensitive (ilike) — butuh pattern, jadi pakai persis slug
    if (!finalEventId) {
      const loose = await gate.supabase
        .from("events")
        .select("id, slug")
        .ilike("slug", slug)
        .maybeSingle();
      if (loose.data) {
        finalEventId = loose.data.id;
      }
    }
  }

  if (!finalEventId) return new Response("Event tidak ditemukan dari slug", { status: 400 });

  const { data, error } = await gate.supabase
    .from("featured_events")
    .insert([{ event_id: finalEventId, rank, is_active, from_date, to_date }])
    .select(
      `id, rank, is_active, from_date, to_date,
       events:events ( id, slug, title, starts_at )`
    )
    .single();

  if (error) return new Response(error.message, { status: 500 });

  const normalized = {
    ...data,
    events: Array.isArray((data as any).events)
      ? (data as any).events[0] ?? null
      : (data as any).events ?? null,
  };

  return Response.json(normalized);
}
