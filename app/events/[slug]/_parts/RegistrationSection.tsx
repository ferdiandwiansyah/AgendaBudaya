// PATH: app/events/[slug]/_parts/RegistrationSection.tsx
import RegisterForm from "../RegisterForm"

type Props = {
  eventId: string | number
  capacity: number | null
  registeredCount: number
  paymentMode?: string | null
  whatsappContact?: string | null
  externalPaymentUrl?: string | null
  title: string
}

export default function RegistrationSection({
  eventId,
  capacity,
  registeredCount,
  paymentMode,
  whatsappContact,
  externalPaymentUrl,
  title,
}: Props) {
  return (
    <section
      id="registrasi"
      className="rounded-2xl border border-emerald-100 bg-white p-5 shadow-sm ring-1 ring-black/5"
    >
      <h2 className="mb-2 text-base font-semibold text-zinc-900">Pendaftaran</h2>

      {paymentMode === "external" ? (
        <>
          {whatsappContact ? (
            <a
              href={`https://wa.me/${whatsappContact}?text=${encodeURIComponent(
                `Halo panitia, saya ingin mendaftar event "${title}" untuk Pendaftaranya Gimana?.`
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-1 inline-flex h-10 items-center justify-center rounded-xl bg-emerald-600 px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
            >
              Daftar via WhatsApp
            </a>
          ) : null}

          {externalPaymentUrl ? (
            <a
              href={externalPaymentUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-1 ml-2 inline-flex h-10 items-center justify-center rounded-xl border border-emerald-200 bg-white px-5 text-sm font-semibold text-emerald-700 shadow-sm transition hover:bg-emerald-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
            >
              Daftar di Situs Resmi
            </a>
          ) : null}

          {!whatsappContact && !externalPaymentUrl && (
            <p className="mt-2 text-sm text-amber-700">
              Pendaftaran eksternal belum dikonfigurasi (WA/URL belum diisi).
            </p>
          )}
        </>
      ) : (
        <RegisterForm
          eventId={String(eventId)}
          capacity={capacity}
          registeredCount={registeredCount}
        />
      )}
    </section>
  )
}
