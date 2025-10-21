// PATH: app/events.ics/route.ts
import { createServerSupabase } from "@/lib/supabaseServer"
import { buildFeedICS, type CalendarEvent } from "@/lib/ics"

export async function GET(req: Request) {
  const url = new URL(req.url)
  const mode = url.searchParams.get("mode") || "upcoming" // upcoming | all | past
  const supabase = await createServerSupabase()

  const nowIso = new Date().toISOString()
  let q = supabase
    .from("events")
    .select("id, slug, title, starts_at, ends_at, location, location_name, address, description")

  if (mode === "upcoming") q = q.gte("starts_at", nowIso).order("starts_at", { ascending: true })
  else if (mode === "past") q = q.lt("starts_at", nowIso).order("starts_at", { ascending: false })
  else q = q.order("starts_at", { ascending: false })

  const { data, error } = await q.limit(500)
  if (error) return new Response(error.message, { status: 500 })

  const baseUrl =
    process.env.NEXT_PUBLIC_SITE_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000")

  const list: CalendarEvent[] = (data ?? []).map((ev: any) => ({
    id: ev.id,
    slug: ev.slug,
    title: ev.title,
    starts_at: ev.starts_at,
    ends_at: ev.ends_at ?? null,
    location: ev.location ?? ev.location_name ?? ev.address ?? null,
    description: ev.description ?? null,
  }))

  const ics = buildFeedICS(list, baseUrl)

  return new Response(ics, {
    status: 200,
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `attachment; filename="events.ics"`,
      "Cache-Control": "no-store",
    },
  })
}
