// PATH: app/events/[slug]/_parts/DescriptionSection.tsx
type Props = { description?: string | null }

export default function DescriptionSection({ description }: Props) {
  return (
    <section className="md:col-span-2 rounded-2xl border border-emerald-100 bg-white p-5 shadow-sm ring-1 ring-black/5">
      <h2 className="text-base font-semibold text-zinc-900">Deskripsi</h2>
      <div className="prose prose-sm mt-2 max-w-none text-zinc-700">
        {description ? (
          <p>{description}</p>
        ) : (
          <p className="italic text-zinc-500">Belum ada deskripsi.</p>
        )}
      </div>
    </section>
  )
}
