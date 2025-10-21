// File: app/admin/events/types.ts
// ------------------------------
export type EventRow = {
id: string;
slug?: string | null;
title: string;
starts_at?: string | null;
location_name?: string | null;
location?: string | null;
banner_url?: string | null;
banner_path?: string | null;
views?: number | null;
popularity?: number | null;
is_published?: boolean | null;
[key: string]: any;
};


export type EventWithBanner = EventRow & { _banner?: string | null };


export type Stats = { total: number; upcoming: number; past: number };