// PATH: app/page.tsx
import Link from "next/link";
import Image from "next/image";
import { createServerSupabase } from "@/lib/supabaseServer";
import Footer from "./components/ui/Footer";

// Paksa dynamic render agar data terbaru (dan cookie auth) selalu dipakai
export const dynamic = "force-dynamic";

/**
 * Landing page: modern, responsif, dan mudah digunakan.
 * Menampilkan:
 * 1) Hero
 * 2) About (deskripsi singkat)
 * 3) 3 Event populer (dari featured_events → fallback upcoming/latest)
 * 4) CTA besar ke /events
 */

type EventRow = {
  id: string | number;
  slug: string;
  title: string;
  starts_at: string | null;
  // Dibuat opsional supaya aman jika kolom tidak ada di DB
  location?: string | null;
  description?: string | null;
  banner_url?: string | null;
  banner_path?: string | null;
  views?: number | null;
  popularity?: number | null;
};

async function getPublicBannerUrl(
  bannerUrl: string | null | undefined,
  bannerPath: string | null | undefined
): Promise<string | null> {
  if (bannerUrl) return bannerUrl;
  if (!bannerPath) return null;
  const supabase = await createServerSupabase();
  const { data } = supabase.storage.from("event-banners").getPublicUrl(bannerPath);
  return data?.publicUrl ?? null;
}

// Tambahkan helper normalisasi ini
function normalizeEventForCard(ev: any): EventRow {
  // Lokasi: coba beberapa nama kolom umum
  const location =
    ev.location ??
    ev.venue ??
    ev.city ??
    ev.address ??
    ev.place ??
    ev.place_name ??
    null;

  // URL gambar langsung (http...)
  const urlCandidates = ["banner_url", "banner", "image_url", "cover_url", "thumbnail_url"];
  let banner_url: string | null = null;
  for (const k of urlCandidates) {
    const v = ev?.[k];
    if (typeof v === "string" && /^https?:\/\//i.test(v)) {
      banner_url = v;
      break;
    }
  }

  // Path file (butuh getPublicUrl)
  const pathCandidates = ["banner_path", "cover_path", "image_path", "storage_path", "bannerKey", "key", "path"];
  let banner_path: string | null = null;
  if (!banner_url) {
    for (const k of pathCandidates) {
      const v = ev?.[k];
      if (typeof v === "string" && v.length > 0) {
        banner_path = v;
        break;
      }
    }
  }

  return {
    id: ev.id,
    slug: ev.slug,
    title: ev.title,
    starts_at: ev.starts_at ?? null,
    location,
    description: ev.description ?? ev.summary ?? null,
    banner_url,
    banner_path,
    views: ev.views ?? null,
    popularity: ev.popularity ?? null,
  };
}

// REPLACE ONLY THIS FUNCTION
async function fetchPopularEvents(limit = 3): Promise<EventRow[]> {
  const supabase = await createServerSupabase();
  const now = new Date();
  const nowIso = now.toISOString();

  // 1) Featured: ambil event_id + filter periode aktif di kode
  const { data: featuredRaw } = await supabase
    .from("featured_events")
    .select("event_id, rank, from_date, to_date, is_active")
    .eq("is_active", true)
    .order("rank", { ascending: true })
    .limit(limit * 2);

  const active = (featuredRaw ?? []).filter((row: any) => {
    const fromOk = !row.from_date || new Date(row.from_date) <= now;
    const toOk = !row.to_date || new Date(row.to_date) >= now;
    return fromOk && toOk;
  });

  if (active.length > 0) {
    const ids: string[] = active.slice(0, limit).map((r: any) => r.event_id);
    // Ambil semua kolom supaya kompatibel dg skema apa pun
    const { data: full } = await supabase.from("events").select("*").in("id", ids);
    const byId = new Map((full ?? []).map((e: any) => [e.id, e]));
    const ordered = ids
      .map((id) => byId.get(id))
      .filter(Boolean)
      .map((ev: any) => normalizeEventForCard(ev));
    return ordered;
  }

  // 2) Fallback: upcoming terdekat
  const { data: upcoming } = await supabase
    .from("events")
    .select("*")
    .gte("starts_at", nowIso)
    .order("starts_at", { ascending: true })
    .limit(limit);

  if (upcoming && upcoming.length > 0) {
    return upcoming.map((ev: any) => normalizeEventForCard(ev));
  }

  // 3) Fallback terakhir: terbaru
  const { data: latest } = await supabase
    .from("events")
    .select("*")
    .order("starts_at", { ascending: false })
    .limit(limit);

  return (latest ?? []).map((ev: any) => normalizeEventForCard(ev));
}


function formatDate(dateIso: string | null): string {
  if (!dateIso) return "Tanggal belum ditentukan";
  // Tampilkan WIB untuk konsistensi audiens
  const d = new Date(dateIso);
  return d.toLocaleString("id-ID", {
    timeZone: "Asia/Jakarta",
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default async function Page() {
  const events = await fetchPopularEvents(3);

  // Bangun URL banner jika ada banner_path (opsional, aman jika tidak ada kolomnya)
  const withBanners = await Promise.all(
    events.map(async (e) => ({
      ...e,
      _banner: await getPublicBannerUrl(e.banner_url ?? null, e.banner_path ?? null),
    }))
  );

  return (
    <main className="min-h-screen bg-gradient-to-b from-white to-emerald-50/40 text-zinc-900">
      {/* HERO */}
      <section id="/" className="relative overflow-hidden">
        <Image
          src="/card1.jpg"
          alt="Hero background"
          fill
          priority
          sizes="100vw"
          className="absolute inset-0 z-0 object-cover pointer-events-none"
        />
        <div aria-hidden className="pointer-events-none absolute inset-0 z-0">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(16,185,129,0.08),transparent_60%)]" />
          <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(16,185,129,0.06),transparent)]" />
          <div className="absolute inset-0 bg-black/70" />
        </div>

        <div className="container mx-auto max-w-6xl px-4 pt-20 pb-16 sm:pt-24 sm:pb-20 relative z-10">
          <div className="mx-auto text-center ">
            <span className="inline-block rounded-full border border-emerald-200/70 bg-white/50 px-3 py-1 text-xs font-medium text-white backdrop-blur">
              Hallo
            </span>
            <h1 className="mt-4 text-3xl font-extrabold leading-tight sm:text-4xl md:text-5xl text-white">
              Selamat Datang di{" "}
              <span className="bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                Portal Event & Budaya Majalengka
              </span>
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-base text-zinc-200 sm:text-lg">
              Temukan agenda budaya, festival, dan kegiatan komunitas terbaru.
              Jelajahi ragam acara yang memperkaya identitas dan kebersamaan Majalengka.
            </p>

            <div className="mt-8 flex justify-center gap-3">
              <Link
                href="/events"
                className="no-underline inline-flex items-center rounded-2xl bg-emerald-600 px-5 py-3 text-white shadow-md transition hover:bg-emerald-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 "
              >
                Jelajahi Agenda
              </Link>
              <Link
                href="/events?mode=upcoming"
                className="no-underline inline-flex items-center rounded-2xl border border-emerald-200 bg-white px-5 py-3 text-emerald-700 shadow-sm transition hover:bg-emerald-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
              >
                Lihat Event Terdekat
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ABOUT */}
      <section id="about"  className="container mx-auto max-w-5xl mt-20 px-4 py-10 sm:py-12">
        <div className="rounded-3xl border border-emerald-100 bg-white/70 p-6 shadow-sm backdrop-blur sm:p-8">
          <h2 className="text-xl font-semibold text-zinc-900 sm:text-2xl">
            Tentang Portal Ini
          </h2>
          <p className="mt-3 text-zinc-600">
            Website ini dibuat untuk memudahkan masyarakat dalam menemukan dan mengikuti kegiatan
            budaya di Majalengka mulai dari festival, pameran, hingga lokakarya. Dengan kurasi
            event yang rapi, dan informasi jelas. kami berharap semakin banyak
            kolaborasi terjalin, seni berkembang, dan komunitas tumbuh saling menguatkan.
          </p>
        </div>
      </section>

      {/* POPULAR EVENTS */}
      <section className="container mx-auto max-w-6xl px-4 pb-10 sm:pb-12">
        <div className="mb-6 flex items-end justify-between">
          <div>
            <h2 className="text-xl font-semibold text-zinc-900 sm:text-2xl">Event Populer</h2>
          </div>
          <Link
            href="/events"
            className=" no-underline hidden rounded-xl border border-emerald-200 bg-white px-4 py-2 text-sm text-emerald-700 shadow-sm transition hover:bg-emerald-50 sm:inline-flex"
          >
            Lihat Semua
          </Link>
        </div>

        {withBanners.length === 0 ? (
          <div className="rounded-2xl border border-zinc-200 bg-white p-6 text-zinc-600">
            Belum ada event unggulan untuk ditampilkan.{" "}
            <Link href="/events" className="text-emerald-700 underline underline-offset-2">
              Jelajahi event lain
            </Link>
            .
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {withBanners.map((e) => (
              <Link
                key={e.id}
                href={`/events/${e.slug}`}
                className="no-underline group overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm transition hover:shadow-md hover:scale-105 "
              >
                <div className="relative aspect-[16/9] w-full overflow-hidden bg-zinc-100">
                  {e._banner ? (
                    <Image
                      src={e._banner}
                      alt={e.title}
                      fill
                      unoptimized 
                      priority={false}
                      placeholder="blur"
                      blurDataURL="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADElEQVR42mP8/5+hHgAH4QJ7D6wzVQAAAABJRU5ErkJggg=="
                      sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw"
                      className="object-cover transition duration-300 group-hover:scale-[1.03]"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-emerald-50 to-teal-50 text-sm text-emerald-700">
                      Tidak ada gambar
                    </div>
                  )}

                  {/* Date Badge */}
                  <div className="absolute left-3 top-3 rounded-xl bg-white/90 px-3 py-1 text-xs font-medium text-zinc-800 shadow">
                    {formatDate(e.starts_at)}
                  </div>
                </div>

                <div className="p-4">
                  <h3 className="line-clamp-2 text-base font-semibold text-zinc-900">{e.title}</h3>
                  <p className="mt-1 line-clamp-2 text-sm text-zinc-600">
                    {e.location || "Lokasi menyusul"}
                  </p>

                  {(typeof e.views === "number" && e.views >= 0) ||
                  (typeof e.popularity === "number" && e.popularity >= 0) ? (
                    <p className="mt-2 text-xs text-zinc-500">
                      Populer:{" "}
                      {typeof e.views === "number" && e.views >= 0
                        ? `${e.views} views`
                        : `${e.popularity} pts`}
                    </p>
                  ) : null}
                </div>
              </Link>
            ))}
          </div>
        )}

        <div className="mt-6 flex justify-center sm:hidden">
          <Link
            href="/events"
            className="no-underline rounded-xl border border-emerald-200 bg-white px-4 py-2 text-sm text-emerald-700 shadow-sm transition hover:bg-emerald-50"
          >
            Lihat Semua
          </Link>
        </div>
      </section>

      {/* CTA */}
      <section className="relative">
        <div className="container mx-auto max-w-6xl px-4 pb-16 sm:pb-20">
          <div className="overflow-hidden rounded-3xl bg-gradient-to-r from-emerald-600 to-teal-600 p-8 text-center text-white shadow-md sm:p-12">
            <h2 className="text-2xl font-bold sm:text-3xl">Siap Menjelajahi Agenda Budaya Majalengka?</h2>
            <p className="mx-auto mt-2 max-w-2xl text-white/90">
              Temukan acara terkini, dan dukung pelaku budaya lokal.
            </p>
            <div className="mt-6">
              <Link
                href="/events"
                className="no-underline inline-flex items-center rounded-2xl bg-white px-6 py-3 font-semibold text-emerald-700 shadow-sm transition hover:bg-emerald-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
              >
                Jelajahi Agenda Budaya
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
