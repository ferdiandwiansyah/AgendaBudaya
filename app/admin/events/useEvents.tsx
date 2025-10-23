// File: app/admin/events/useEvents.ts

"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { supabaseClient } from "@/lib/supabaseClient";
import type { EventWithBanner, Stats } from "./types";
import { isUpcoming } from "./utils";

export function useEvents() {
  const supabase = supabaseClient;
  const [events, setEvents] = useState<EventWithBanner[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [q, setQ] = useState("");
  const [onlyUpcoming, setOnlyUpcoming] = useState(false);
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  useEffect(() => {
    const fetchEvents = async () => {
      setLoading(true);
      setErrorMsg(null);

      const { data, error } = await supabase
        .from("events")
        .select("*")
        .order("starts_at", { ascending: true });

      if (error) {
        console.error("[events/select*] ", error);
        setErrorMsg(error.message);
        setEvents([]);
        setLoading(false);
        return;
      }

      const rows = (data ?? []) as EventWithBanner[];

      const resolved = await Promise.all(
        rows.map(async (e) => {
          if (e.banner_url) return { ...e, _banner: e.banner_url };
          if (e.banner_path) {
            const { data: pub } = supabase.storage
              .from("event-banners")
              .getPublicUrl(e.banner_path);
            return { ...e, _banner: pub?.publicUrl ?? null };
          }
          return { ...e, _banner: null };
        })
      );

      setEvents(resolved);
      setLoading(false);
    };

    fetchEvents();
  }, [supabase]);

  const filtered = useMemo(() => {
    const qLower = q.trim().toLowerCase();
    const base = events.filter((e) => {
      const passQ =
        !qLower ||
        e.title?.toLowerCase().includes(qLower) ||
        e.location_name?.toLowerCase().includes(qLower) ||
        e.location?.toLowerCase().includes(qLower) ||
        e.slug?.toLowerCase().includes(qLower);
      const passUpcoming = !onlyUpcoming || isUpcoming(e.starts_at);
      return passQ && passUpcoming;
    });

    return base.sort((a, b) => {
      const da = a.starts_at ? new Date(a.starts_at).getTime() : 0;
      const db = b.starts_at ? new Date(b.starts_at).getTime() : 0;
      return sortDir === "asc" ? da - db : db - da;
    });
  }, [events, q, onlyUpcoming, sortDir]);

  const stats: Stats = useMemo(() => {
    const total = events.length;
    const upcoming = events.filter((e) => isUpcoming(e.starts_at)).length;
    const past = total - upcoming;
    return { total, upcoming, past };
  }, [events]);

  const handleDelete = useCallback(
    async (id: string, bannerPath?: string | null) => {
      if (!confirm("Yakin ingin menghapus event ini?")) return;

      const { error: dbError } = await supabase.from("events").delete().eq("id", id);
      if (dbError) {
        alert("Gagal menghapus dari database: " + dbError.message);
        return;
      }

      if (bannerPath) {
        const { error: storageError } = await supabase.storage
          .from("event-banners")
          .remove([bannerPath]);
        if (storageError) {
          console.error("Gagal hapus file banner:", storageError.message);
        }
      }

      setEvents((prev) => prev.filter((e) => e.id !== id));
      alert("Event berhasil dihapus");
    },
    [supabase]
  );

  return {
    state: { events, loading, errorMsg },
    filters: { q, setQ, onlyUpcoming, setOnlyUpcoming, sortDir, setSortDir },
    derived: { filtered, stats },
    actions: { handleDelete },
  } as const;
}
