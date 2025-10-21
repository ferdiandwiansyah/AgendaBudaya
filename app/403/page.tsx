// app/403/page.tsx
export const dynamic = "force-dynamic"
export default function ForbiddenPage() {
  return (
    <div className="mx-auto max-w-xl px-4 py-20 text-center">
      <div className="text-6xl">🚫</div>
      <h1 className="mt-3 text-2xl font-semibold">Akses ditolak</h1>
      <p className="mt-2 text-gray-600">
        Anda tidak memiliki izin untuk mengakses halaman ini.
      </p>
    </div>
  )
}
