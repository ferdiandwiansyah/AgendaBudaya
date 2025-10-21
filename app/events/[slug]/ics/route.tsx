// PATH: app/events/[slug]/ics/route.ts
import { createServerSupabase } from "@/lib/supabaseServer"
import { buildEventICS, type CalendarEvent } from "@/lib/ics"

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ slug: string }> }
) {
  const { slug } = await ctx.params
  const supabase = await createServerSupabase()

  // Cari sebagai slug, kalau tidak ada coba sebagai id
  let { data: ev } = await supabase
    .from("events")
    .select("id, slug, title, starts_at, ends_at, location, location_name, address, description")
    .eq("slug", slug)
    .maybeSingle()

  if (!ev) {
    const byId = await supabase
      .from("events")
      .select("id, slug, title, starts_at, ends_at, location, location_name, address, description")
      .eq("id", slug)
      .maybeSingle()
    ev = byId.data ?? null
  }

  if (!ev) return new Response("Event not found", { status: 404 })

  const baseUrl =
    process.env.NEXT_PUBLIC_SITE_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000")

  const item: CalendarEvent = {
    id: ev.id,
    slug: ev.slug,
    title: ev.title,
    starts_at: ev.starts_at,
    ends_at: ev.ends_at ?? null,
    location: ev.location ?? ev.location_name ?? ev.address ?? null,
    description: ev.description ?? null,
  }

  const ics = buildEventICS(item, baseUrl)

  return new Response(ics, {
    status: 200,
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `attachment; filename="${ev.slug || ev.id}.ics"`,
      "Cache-Control": "no-store",
    },
  })
}
