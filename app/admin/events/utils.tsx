// File: app/admin/events/utils.ts
// ------------------------------
export const fmt = (iso?: string | null) => {
if (!iso) return "Tanggal belum ditentukan";
const d = new Date(iso);
return d.toLocaleString("id-ID", {
timeZone: "Asia/Jakarta",
weekday: "long",
day: "2-digit",
month: "long",
year: "numeric",
hour: "2-digit",
minute: "2-digit",
});
};


export const isUpcoming = (iso?: string | null) => {
if (!iso) return false;
return new Date(iso).getTime() >= Date.now();
};