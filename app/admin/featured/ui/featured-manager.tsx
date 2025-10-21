// PATH: app/admin/featured/ui/featured-manager.tsx
"use client";

import { useState } from "react";

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
    location?: string | null;
    banner_url?: string | null;
    banner_path?: string | null;
  } | null;
};

export default function FeaturedManager({ initialRows }: { initialRows: Row[] }) {
  const [rows, setRows] = useState<Row[]>(initialRows);
  const [slug, setSlug] = useState("");
  const [rank, setRank] = useState<number>(Math.max(1, initialRows.length + 1));
  const [active, setActive] = useState(true);
  const [fromDate, setFromDate] = useState<string>("");
  const [toDate, setToDate] = useState<string>("");

  async function addFeatured() {
    const res = await fetch("/api/admin/featured", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        event_slug: slug.trim(),
        rank: Number.isFinite(rank) ? rank : 0,
        is_active: active,
        from_date: fromDate || null,
        to_date: toDate || null,
      }),
    });
    if (!res.ok) {
      alert("Gagal menambahkan: " + (await res.text()));
      return;
    }
    const created: Row = await res.json();
    setRows((r) => [...r, created].sort((a, b) => (a.rank ?? 0) - (b.rank ?? 0)));
    setSlug("");
    setRank((prev) => prev + 1);
    setFromDate("");
    setToDate("");
  }

  async function updateRow(id: string, patch: Partial<Row>) {
    const res = await fetch(`/api/admin/featured/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
    if (!res.ok) {
      alert("Gagal mengubah: " + (await res.text()));
      return;
    }
    const updated: Row = await res.json();
    setRows((r) =>
      r
        .map((x) => (x.id === id ? { ...x, ...updated } : x))
        .sort((a, b) => (a.rank ?? 0) - (b.rank ?? 0))
    );
  }

  async function removeRow(id: string) {
    if (!confirm("Hapus dari featured?")) return;
    const res = await fetch(`/api/admin/featured/${id}`, { method: "DELETE" });
    if (!res.ok) {
      alert("Gagal menghapus: " + (await res.text()));
      return;
    }
    setRows((r) => r.filter((x) => x.id !== id));
  }

  return (
    <div className="space-y-8">
      {/* Form tambah cepat */}
      <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
        <h2 className="text-base font-semibold text-zinc-900">Tambahkan Event</h2>
        <p className="mt-1 text-xs text-zinc-600">
          Masukkan <b>slug</b> dari event yang sudah ada pada tabel <code>events</code>.
        </p>

        <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <label className="block text-xs text-zinc-600">Slug Event</label>
            <input
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              placeholder="contoh: festival-seni-rakyat"
              className="mt-1 w-full rounded-2xl border border-zinc-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div>
            <label className="block text-xs text-zinc-600">Rank (urutan)</label>
            <input
              type="number"
              value={rank}
              onChange={(e) => setRank(parseInt(e.target.value, 10))}
              className="mt-1 w-full rounded-2xl border border-zinc-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div className="flex items-end gap-3">
            <label className="inline-flex items-center gap-2 text-sm text-zinc-700">
              <input
                type="checkbox"
                checked={active}
                onChange={(e) => setActive(e.target.checked)}
                className="h-4 w-4 rounded border-zinc-300 text-emerald-600 focus:ring-emerald-500"
              />
              Aktif
            </label>
          </div>

          <div>
            <label className="block text-xs text-zinc-600">Dari (opsional)</label>
            <input
              type="datetime-local"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="mt-1 w-full rounded-2xl border border-zinc-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div>
            <label className="block text-xs text-zinc-600">Sampai (opsional)</label>
            <input
              type="datetime-local"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="mt-1 w-full rounded-2xl border border-zinc-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div className="flex items-end">
            <button
              onClick={addFeatured}
              className="inline-flex w-full items-center justify-center rounded-2xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700"
            >
              Tambahkan
            </button>
          </div>
        </div>
      </div>

      {/* Data: Table (desktop) */}
      <div className="hidden overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm md:block">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-zinc-50 text-left text-xs text-zinc-600">
              <tr>
                <th className="px-4 py-3">Judul</th>
                <th className="px-4 py-3">Slug</th>
                <th className="px-4 py-3">Rank</th>
                <th className="px-4 py-3">Aktif</th>
                <th className="px-4 py-3">Periode</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} className="border-t">
                  <td className="px-4 py-3">{row.events?.title ?? "—"}</td>
                  <td className="px-4 py-3 text-zinc-500">{row.events?.slug ?? "—"}</td>
                  <td className="px-4 py-3">
                    <input
                      type="number"
                      value={row.rank ?? 0}
                      onChange={(e) =>
                        setRows((r) =>
                          r.map((x) => (x.id === row.id ? { ...x, rank: parseInt(e.target.value, 10) } : x))
                        )
                      }
                      onBlur={() => updateRow(row.id, { rank: row.rank ?? 0 })}
                      className="w-24 rounded-2xl border border-zinc-200 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <label className="inline-flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={row.is_active}
                        onChange={(e) => {
                          const val = e.target.checked;
                          setRows((r) => r.map((x) => (x.id === row.id ? { ...x, is_active: val } : x)));
                          updateRow(row.id, { is_active: val });
                        }}
                        className="h-4 w-4 rounded border-zinc-300 text-emerald-600 focus:ring-emerald-500"
                      />
                      <span className="text-xs text-zinc-600">Aktif</span>
                    </label>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-2">
                      <input
                        type="datetime-local"
                        value={row.from_date ? row.from_date.slice(0, 16) : ""}
                        onChange={(e) =>
                          setRows((r) => r.map((x) => (x.id === row.id ? { ...x, from_date: e.target.value } : x)))
                        }
                        onBlur={() => updateRow(row.id, { from_date: row.from_date })}
                        className="w-52 rounded-2xl border border-zinc-200 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                      <input
                        type="datetime-local"
                        value={row.to_date ? row.to_date.slice(0, 16) : ""}
                        onChange={(e) =>
                          setRows((r) => r.map((x) => (x.id === row.id ? { ...x, to_date: e.target.value } : x)))
                        }
                        onBlur={() => updateRow(row.id, { to_date: row.to_date })}
                        className="w-52 rounded-2xl border border-zinc-200 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => removeRow(row.id)}
                      className="rounded-2xl border border-red-200 px-3 py-1.5 text-sm font-medium text-red-700 transition hover:bg-red-50"
                    >
                      Hapus
                    </button>
                  </td>
                </tr>
              ))}

              {rows.length === 0 && (
                <tr>
                  <td className="px-4 py-8 text-center text-zinc-500" colSpan={6}>
                    Belum ada data featured.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Data: Cards (mobile) */}
      <ul className="grid grid-cols-1 gap-4 md:hidden">
        {rows.length === 0 && (
          <li className="rounded-2xl border border-zinc-200 bg-white p-6 text-center text-sm text-zinc-600">
            Belum ada data featured.
          </li>
        )}

        {rows.map((row) => (
          <li key={row.id} className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
            <div className="flex flex-col gap-1">
              <h3 className="text-sm font-semibold text-zinc-900">
                {row.events?.title ?? "—"}
              </h3>
              <p className="text-xs text-zinc-500 break-all">{row.events?.slug ?? "—"}</p>
            </div>

            <div className="mt-3 grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] text-zinc-600">Rank</label>
                <input
                  type="number"
                  value={row.rank ?? 0}
                  onChange={(e) =>
                    setRows((r) =>
                      r.map((x) => (x.id === row.id ? { ...x, rank: parseInt(e.target.value, 10) } : x))
                    )
                  }
                  onBlur={() => updateRow(row.id, { rank: row.rank ?? 0 })}
                  className="mt-1 w-full rounded-2xl border border-zinc-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div className="flex items-end">
                <label className="inline-flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={row.is_active}
                    onChange={(e) => {
                      const val = e.target.checked;
                      setRows((r) => r.map((x) => (x.id === row.id ? { ...x, is_active: val } : x)));
                      updateRow(row.id, { is_active: val });
                    }}
                    className="h-4 w-4 rounded border-zinc-300 text-emerald-600 focus:ring-emerald-500"
                  />
                  <span className="text-xs text-zinc-700">Aktif</span>
                </label>
              </div>

              <div className="col-span-2">
                <label className="block text-[11px] text-zinc-600">Dari</label>
                <input
                  type="datetime-local"
                  value={row.from_date ? row.from_date.slice(0, 16) : ""}
                  onChange={(e) =>
                    setRows((r) => r.map((x) => (x.id === row.id ? { ...x, from_date: e.target.value } : x)))
                  }
                  onBlur={() => updateRow(row.id, { from_date: row.from_date })}
                  className="mt-1 w-full rounded-2xl border border-zinc-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div className="col-span-2">
                <label className="block text-[11px] text-zinc-600">Sampai</label>
                <input
                  type="datetime-local"
                  value={row.to_date ? row.to_date.slice(0, 16) : ""}
                  onChange={(e) =>
                    setRows((r) => r.map((x) => (x.id === row.id ? { ...x, to_date: e.target.value } : x)))
                  }
                  onBlur={() => updateRow(row.id, { to_date: row.to_date })}
                  className="mt-1 w-full rounded-2xl border border-zinc-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            <div className="mt-4 flex justify-end">
              <button
                onClick={() => removeRow(row.id)}
                className="rounded-2xl border border-red-200 px-3 py-1.5 text-xs font-medium text-red-700 transition hover:bg-red-50"
              >
                Hapus
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
