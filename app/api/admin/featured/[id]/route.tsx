// PATH: app/api/admin/featured/[id]/route.tsx
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

// ⬇ Next.js 15: params adalah Promise — Wajib di-await
export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const gate = await requireAdmin();
  if (!gate.ok) return new Response(gate.msg, { status: gate.status });

  const { id } = await ctx.params;

  const patch = await req.json().catch(() => ({}));
  const payload: any = {};
  if ("rank" in patch) payload.rank = patch.rank;
  if ("is_active" in patch) payload.is_active = patch.is_active;
  if ("from_date" in patch) payload.from_date = patch.from_date || null;
  if ("to_date" in patch) payload.to_date = patch.to_date || null;

  const { data, error } = await gate.supabase
    .from("featured_events")
    .update(payload)
    .eq("id", id)
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

export async function DELETE(_: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const gate = await requireAdmin();
  if (!gate.ok) return new Response(gate.msg, { status: gate.status });

  const { id } = await ctx.params;

  const { error } = await gate.supabase.from("featured_events").delete().eq("id", id);
  if (error) return new Response(error.message, { status: 500 });
  return new Response(null, { status: 204 });
}
