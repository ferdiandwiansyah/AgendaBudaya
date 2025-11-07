// PATH: app/events/[slug]/_parts/LocationSection.tsx
type Props = {
  locationName?: string | null
  address?: string | null
  mapsHref?: string | null
  addressIsUrl: boolean
}

export default function LocationSection({
  locationName,
  address,
  mapsHref,
  addressIsUrl,
}: Props) {
  return (
    <section className="rounded-2xl border border-emerald-100 bg-white p-5 shadow-sm ring-1 ring-black/5">
      <h2 className="text-base font-semibold text-zinc-900">Lokasi</h2>

      {locationName && (
        <p className="mt-2 text-sm text-zinc-700">{locationName}</p>
      )}

      {mapsHref && (
        <p className="mt-2 text-sm">
          <a
            href={mapsHref}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-emerald-700 underline-offset-2 hover:bg-emerald-100"
          >
            <span className="font-medium">
              {addressIsUrl ? "Buka di Google Maps" : "Lihat peta"}
            </span>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M14 3h7v7h-2V6.41l-9.29 9.3-1.42-1.42 9.3-9.29H14V3z" />
              <path d="M5 5h6V3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-6h-2v6H5V5z" />
            </svg>
          </a>
        </p>
      )}
    </section>
  )
}
