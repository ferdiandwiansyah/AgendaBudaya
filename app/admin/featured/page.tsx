// PATH: app/admin/featured/page.tsx
import { createServerSupabase } from "@/lib/supabaseServer";
import Link from "next/link";
import FeaturedManager from "./ui/featured-manager";

export const dynamic = "force-dynamic";

type Row = {
  id: string;
  rank: number | null;
  is_active: boolean;
  from_date: string | null;
  to_date: string | null;
  events: {
    id: string;
    slug: string;
    title: string;
    starts_at: string | null;
    banner_url?: string | null;
    banner_path?: string | null;
    location?: string | null;
  } | null;
};

async function requireAdmin() {
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false as const, reason: "UNAUTH" as const };

  const { data: admin } = await supabase
    .from("admins")
    .select("user_id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!admin) return { ok: false as const, reason: "FORBIDDEN" as const };
  return { ok: true as const };
}

export default async function Page() {
  const gate = await requireAdmin();
  if (!gate.ok) {
    return (
      <main className="mx-auto grid min-h-[60svh] max-w-xl place-items-center px-4 py-12">
        <div className="w-full rounded-2xl border border-zinc-200 bg-white p-6 text-center shadow-sm">
          <h1 className="text-lg font-semibold text-zinc-900">Tidak memiliki akses</h1>
          <p className="mt-2 text-sm text-zinc-600">Silakan login sebagai admin.</p>
          <div className="mt-4">
            <Link
              href="/auth/sign-in"
              className="inline-flex items-center rounded-2xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
            >
              Masuk Admin
            </Link>
          </div>
        </div>
      </main>
    );
  }

  const supabase = await createServerSupabase();
  const { data, error } = await supabase
    .from("featured_events")
    .select(
      `id, rank, is_active, from_date, to_date,
       events:events ( id, slug, title, starts_at )`
    )
    .order("rank", { ascending: true });

  if (error) {
    return (
      <main className="mx-auto max-w-6xl px-4 py-10">
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          Gagal memuat data: {error.message}
        </div>
      </main>
    );
  }

  const rows: Row[] =
    (data ?? []).map((r: any) => ({
      id: String(r.id),
      rank: r.rank ?? 0,
      is_active: Boolean(r.is_active),
      from_date: r.from_date ?? null,
      to_date: r.to_date ?? null,
      events: Array.isArray(r.events) ? r.events[0] ?? null : r.events ?? null,
    })) ?? [];

  return (
    <main className="min-h-[100svh] bg-gradient-to-b from-white to-emerald-50/30">
      {/* Top bar */}
      <header className="border-b border-zinc-200/70 bg-white/70 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <Link
              href="/admin/events"
              className="inline-flex items-center rounded-xl border border-zinc-200 bg-white px-3 py-1.5 text-sm text-zinc-800 shadow-sm hover:bg-zinc-50"
            >
              ← Kembali
            </Link>
            
          </div>
          <Link
            href="/events"
            className="inline-flex items-center rounded-2xl border border-emerald-200 bg-white px-4 py-2 text-sm font-medium text-emerald-700 shadow-sm transition hover:bg-emerald-50"
          >
            Lihat Halaman Publik
          </Link>
        </div>
      </header>

      {/* Header section */}
      <section className="mx-auto max-w-6xl px-4 py-8">
        <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white/90 p-6 shadow-sm">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-zinc-900">Featured Events</h1>
              <p className="mt-1 text-sm text-zinc-600">
                Pilih hingga <b>3 event</b> untuk ditampilkan di beranda. Urutan mengikuti nilai <code>rank</code>.
              </p>
            </div>
            <div className="inline-flex items-center gap-2 rounded-xl bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700 ring-1 ring-emerald-200">
              {rows.length} item terdaftar
            </div>
          </div>
        </div>
      </section>

      {/* Manager */}
      <section className="mx-auto max-w-6xl px-4 pb-12">
        <FeaturedManager initialRows={rows} />
      </section>
    </main>
  );
}
