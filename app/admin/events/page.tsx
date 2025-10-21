// File: app/admin/events/page.tsx
// ------------------------------
"use client";

import { useEvents } from "./useEvents";
import { ActionBar, EmptyState, EventCard, HeaderBar, SkeletonGrid, StatsBar } from "./components";

export default function AdminEventsPage() {
  const {
    state: { loading, errorMsg },
    filters: { q, setQ, onlyUpcoming, setOnlyUpcoming, sortDir, setSortDir },
    derived: { filtered, stats },
    actions: { handleDelete },
  } = useEvents();

  if (loading) {
    return (
      <div className="p-6">
        <HeaderBar />
        <StatsBar skeleton />
        <ActionBar
          q={q}
          onSearchChange={setQ}
          onlyUpcoming={onlyUpcoming}
          onToggleUpcoming={setOnlyUpcoming}
          sortDir={sortDir}
          onSortDirChange={setSortDir}
          disabled
        />
        <SkeletonGrid />
      </div>
    );
  }

  return (
    <div className="p-6">
      <HeaderBar />

      {errorMsg ? (
        <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 p-4 text-rose-800">
          <div className="font-semibold">Gagal memuat data</div>
          <div className="text-sm">{errorMsg}</div>
          <div className="mt-2 text-xs text-rose-700/80">
            Pastikan nama kolom (mis. <code>starts_at</code>, <code>location_name</code>, dsb.) sesuai dengan skema tabel Anda.
          </div>
        </div>
      ) : null}

      <StatsBar stats={stats} />

      <ActionBar
        q={q}
        onSearchChange={setQ}
        onlyUpcoming={onlyUpcoming}
        onToggleUpcoming={setOnlyUpcoming}
        sortDir={sortDir}
        onSortDirChange={setSortDir}
      />

      {filtered.length === 0 ? (
        <EmptyState />
      ) : (
        <ul className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((event) => (
            <EventCard key={event.id} event={event} onDelete={handleDelete} />
          ))}
        </ul>
      )}
    </div>
  );
}