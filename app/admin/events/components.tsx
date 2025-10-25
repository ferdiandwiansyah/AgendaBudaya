// File: app/admin/events/components.tsx
"use client";

import Link from "next/link";
import { useState } from "react";
import { supabaseClient } from "@/lib/supabaseClient";
import type { Stats, EventWithBanner } from "./types";
import { fmt, isUpcoming } from "./utils";

// Ikon lucide-react
import {
  Users,
  Star,
  Plus,
  LogOut,
  Search,
  CalendarClock,
  CalendarDays, // ⬅️ ditambahkan
  History,      // ⬅️ ditambahkan
  Pencil,
  Trash2,
  ExternalLink,
} from "lucide-react";

// ---------- HeaderBar ----------
export function HeaderBar() {
  const [signingOut, setSigningOut] = useState(false);

  const handleSignOut = async () => {
    try {
      setSigningOut(true);
      await supabaseClient.auth.signOut();
      window.location.href = "/";
    } finally {
      setSigningOut(false);
    }
  };

  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-neutral-900">Kelola Event</h1>
        <p className="mt-1 text-sm text-neutral-600">Buat, sunting, dan kelola event destinasi Anda.</p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Link
          href="/admin/registrations"
          className=" no-underline inline-flex items-center gap-2 rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-800 shadow-sm transition hover:bg-neutral-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
          aria-label="Buka registrasi peserta"
        >
          <Users className="h-4 w-4" />
          <span className="hidden sm:inline ">Registrasi Peserta</span>
          <span className="sm:hidden ">Registrasi</span>
        </Link>

        <Link
          href="/admin/featured"
          className=" no-underline inline-flex items-center gap-2 rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-800 shadow-sm transition hover:bg-neutral-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
          aria-label="Kelola featured"
        >
          <Star className="h-4 w-4" />
          <span>Unggulan</span>
        </Link>

        <Link
          href="/admin/events/create"
          className="no-underline inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-3.5 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-emerald-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
          aria-label="Tambah event baru"
        >
          <Plus className="h-4 w-4" />
          <span>Tambah Event</span>
        </Link>

        {/* Tombol Keluar — dibedakan warnanya (destruktif) */}
        <button
          onClick={handleSignOut}
          disabled={signingOut}
          className="inline-flex items-center gap-2 rounded-xl border border-rose-300 bg-rose-50 px-3 py-2 text-sm font-medium text-rose-700 shadow-sm transition hover:bg-rose-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 disabled:cursor-not-allowed disabled:opacity-70"
          aria-label="Keluar"
          title="Keluar"
        >
          <LogOut className="h-4 w-4" />
          <span>{signingOut ? "Keluar..." : "Keluar"}</span>
        </button>
      </div>
    </div>
  );
}

// ---------- StatsBar ----------
export function StatsBar({ stats, skeleton }: { stats?: Stats; skeleton?: boolean }) {
  const Item = ({ label, value, icon: Icon }: { label: string; value?: number; icon: React.ElementType }) => (
    <div className="flex items-center gap-3 rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm">
      <div className="grid h-9 w-9 place-items-center rounded-xl bg-emerald-50">
        <Icon className="h-4 w-4 text-emerald-700" />
      </div>
      <div>
        <div className="text-sm text-neutral-600">{label}</div>
        {skeleton ? (
          <div className="mt-2 h-7 w-16 animate-pulse rounded bg-neutral-200" />
        ) : (
          <div className="mt-1 text-2xl font-semibold text-neutral-900">{value ?? 0}</div>
        )}
      </div>
    </div>
  );

  return (
    <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
      <Item label="Total Event" value={stats?.total} icon={CalendarDays} />
      <Item label="Mendatang" value={stats?.upcoming} icon={CalendarClock} />
      <Item label="Lewat" value={stats?.past} icon={History} />
    </div>
  );
}

// ---------- ActionBar ----------
export function ActionBar({
  q,
  onSearchChange,
  onlyUpcoming,
  onToggleUpcoming,
  sortDir,
  onSortDirChange,
  disabled,
}: {
  q: string;
  onSearchChange: (v: string) => void;
  onlyUpcoming: boolean;
  onToggleUpcoming: (v: boolean) => void;
  sortDir: "asc" | "desc";
  onSortDirChange: (v: "asc" | "desc") => void;
  disabled?: boolean;
}) {
  return (
    <div className="mb-6 flex flex-col gap-3 rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
      <div className="flex-1">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-neutral-400" />
          <input
            disabled={disabled}
            value={q}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Cari judul, lokasi, atau slug…"
            aria-label="Cari event"
            className="w-full rounded-xl border border-neutral-200 bg-white px-9 py-2 text-sm outline-none ring-emerald-500 placeholder:text-neutral-400 focus:ring-2"
          />
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <label className="inline-flex items-center gap-2 rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm">
          <input
            type="checkbox"
            className="h-4 w-4"
            checked={onlyUpcoming}
            onChange={(e) => onToggleUpcoming(e.target.checked)}
            disabled={disabled}
            aria-label="Filter hanya event mendatang"
          />
          Hanya mendatang
        </label>

        <select
          disabled={disabled}
          value={sortDir}
          onChange={(e) => onSortDirChange(e.target.value as "asc" | "desc")}
          aria-label="Urutan event"
          className="rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
        >
          <option value="asc">Urutkan: Terdekat</option>
          <option value="desc">Urutkan: Terjauh</option>
        </select>
      </div>
    </div>
  );
}

// ---------- EventCard ----------
export function EventCard({
  event,
  onDelete,
}: {
  event: EventWithBanner;
  onDelete: (id: string, bannerPath?: string | null) => void;
}) {
  const loc = event.location_name ?? event.location ?? "Lokasi menyusul";

  return (
    <li className="group overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm transition hover:shadow-md">
      <div className="relative aspect-[16/9] w-full overflow-hidden bg-zinc-100">
        {event._banner ? (
          <img
            src={event._banner}
            alt={event.title}
            className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.02]"
          />
        ) : (
          <div className="absolute inset-0 grid place-items-center bg-gradient-to-br from-emerald-50 to-teal-50 text-sm text-emerald-700">
            Tidak ada gambar
          </div>
        )}

        <div className="absolute left-3 top-3 flex items-center gap-2">
          <span className="rounded-xl bg-white/90 px-2.5 py-1 text-xs font-medium text-zinc-800 shadow">
            {fmt(event.starts_at)}
          </span>
          <span
            className={`rounded-xl px-2.5 py-1 text-xs font-medium shadow ${
              isUpcoming(event.starts_at) ? "bg-emerald-600 text-white" : "bg-zinc-800 text-white"
            }`}
          >
            {isUpcoming(event.starts_at) ? "Mendatang" : "Lewat"}
          </span>
        </div>
      </div>

      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <h3 className="line-clamp-2 text-base font-semibold text-zinc-900">{event.title}</h3>
          {typeof event.is_published === "boolean" && (
            <span
              className={`whitespace-nowrap rounded-full px-2 py-0.5 text-[11px] font-medium ${
                event.is_published ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"
              }`}
              title={event.is_published ? "Published" : "Draft"}
            >
              {event.is_published ? "Published" : "Draft"}
            </span>
          )}
        </div>

        <p className="mt-1 line-clamp-1 text-sm text-zinc-600">{loc}</p>

        {((typeof event.views === "number" && event.views >= 0) ||
          (typeof event.popularity === "number" && event.popularity >= 0)) && (
          <p className="mt-2 text-xs text-zinc-500">
            Populer:{" "}
            {typeof event.views === "number" && event.views >= 0 ? `${event.views} views` : `${event.popularity} pts`}
          </p>
        )}

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <Link
            href={`/admin/events/${event.id}/edit`}
            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-3 py-1.5 text-sm text-white shadow-sm transition hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
            aria-label={`Edit ${event.title}`}
          >
            <Pencil className="h-4 w-4" />
            Edit
          </Link>

          <button
            onClick={() => onDelete(event.id, event.banner_path)}
            className="inline-flex items-center gap-2 rounded-xl bg-rose-600 px-3 py-1.5 text-sm text-white shadow-sm transition hover:bg-rose-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500"
            aria-label={`Hapus ${event.title}`}
          >
            <Trash2 className="h-4 w-4" />
            Hapus
          </button>

          <Link
            href={`/events/${event.slug ?? event.id}`}
            target="_blank"
            className="ml-auto inline-flex items-center gap-2 rounded-xl border border-zinc-200 bg-white px-3 py-1.5 text-sm text-zinc-700 shadow-sm transition hover:bg-zinc-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
            aria-label={`Lihat publik ${event.title}`}
          >
            <ExternalLink className="h-4 w-4" />
            Lihat Publik
          </Link>
        </div>
      </div>
    </li>
  );
}

// ---------- SkeletonGrid ----------
export function SkeletonGrid() {
  return (
    <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm">
          <div className="h-40 w-full animate-pulse bg-neutral-200" />
          <div className="p-4">
            <div className="h-5 w-2/3 animate-pulse rounded bg-neutral-200" />
            <div className="mt-2 h-4 w-1/2 animate-pulse rounded bg-neutral-200" />
            <div className="mt-4 flex gap-2">
              <div className="h-8 w-16 animate-pulse rounded bg-neutral-200" />
              <div className="h-8 w-16 animate-pulse rounded bg-neutral-200" />
              <div className="ml-auto h-8 w-24 animate-pulse rounded bg-neutral-200" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ---------- EmptyState ----------
export function EmptyState() {
  return (
    <div className="grid place-items-center rounded-2xl border border-neutral-200 bg-white p-10 text-center shadow-sm">
      <div className="text-2xl">😶</div>
      <h3 className="mt-2 text-base font-semibold text-neutral-900">Belum ada event yang cocok</h3>
      <p className="mt-1 text-sm text-neutral-600">Coba ubah kata kunci, nonaktifkan filter, atau tambahkan event baru.</p>
      <Link
        href="/admin/events/create"
        className="mt-4 inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-emerald-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
      >
        <Plus className="h-4 w-4" />
        Tambah Event
      </Link>
    </div>
  );
}
