// PATH: lib/ics.ts
export type CalendarEvent = {
  id: string | number
  slug: string
  title: string
  starts_at: string // ISO
  ends_at?: string | null // ISO optional
  location?: string | null
  description?: string | null
}

/** Escape karakter khusus ICS */
function escapeICS(text: string) {
  return text
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\r?\n/g, "\\n")
}

/** YYYYMMDDTHHmmssZ (UTC) */
function toICSDateTimeUTC(iso: string) {
  const d = new Date(iso)
  const yyyy = d.getUTCFullYear()
  const mm = String(d.getUTCMonth() + 1).padStart(2, "0")
  const dd = String(d.getUTCDate()).padStart(2, "0")
  const hh = String(d.getUTCHours()).padStart(2, "0")
  const mi = String(d.getUTCMinutes()).padStart(2, "0")
  const ss = String(d.getUTCSeconds()).padStart(2, "0")
  return `${yyyy}${mm}${dd}T${hh}${mi}${ss}Z`
}

function makeUID(ev: CalendarEvent, baseUrl: string) {
  try {
    const host = new URL(baseUrl).host
    return `${ev.id || ev.slug}@${host}`
  } catch {
    return String(ev.id || ev.slug)
  }
}

// PATH: lib/ics.ts  (ganti fungsi ini saja)
export function buildGoogleCalURL(ev: CalendarEvent, baseUrl: string) {
  const start = toICSDateTimeUTC(ev.starts_at)
  const end = ev.ends_at ? toICSDateTimeUTC(ev.ends_at) : start
  const url = `${baseUrl.replace(/\/$/, "")}/events/${ev.slug}`
  const desc = ev.description ? `${ev.description}\n\n${url}` : url

  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: ev.title || "Event",          // biarkan mentah, nanti di-encode otomatis
    dates: `${start}/${end}`,
    details: desc,                      // biarkan mentah
    location: ev.location ? String(ev.location) : "",
    trp: "false",
  })

  return `https://www.google.com/calendar/render?${params.toString()}`
}


export function buildEventICS(ev: CalendarEvent, baseUrl: string) {
  const now = toICSDateTimeUTC(new Date().toISOString())
  const uid = makeUID(ev, baseUrl)
  const url = `${baseUrl.replace(/\/$/, "")}/events/${ev.slug}`

  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Majabudaya//Events//ID",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "X-WR-TIMEZONE:UTC",

    "BEGIN:VEVENT",
    `UID:${uid}`,
    `DTSTAMP:${now}`,
    `DTSTART:${toICSDateTimeUTC(ev.starts_at)}`,
    ev.ends_at ? `DTEND:${toICSDateTimeUTC(ev.ends_at)}` : undefined,
    `SUMMARY:${escapeICS(ev.title || "Event")}`,
    ev.description ? `DESCRIPTION:${escapeICS(ev.description)}` : undefined,
    ev.location ? `LOCATION:${escapeICS(ev.location)}` : undefined,
    `URL:${escapeICS(url)}`,
    "END:VEVENT",

    "END:VCALENDAR",
  ].filter(Boolean)

  // CRLF agar kompatibel
  return lines.join("\r\n")
}

export function buildFeedICS(list: CalendarEvent[], baseUrl: string) {
  const now = toICSDateTimeUTC(new Date().toISOString())
  const head = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Majabudaya//Events//ID",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "X-WR-CALNAME:Agenda Budaya Majalengka",
    "X-WR-TIMEZONE:UTC",
    `DTSTAMP:${now}`,
  ]

  const body = list.flatMap((ev) => {
    const url = `${baseUrl.replace(/\/$/, "")}/events/${ev.slug}`
    return [
      "BEGIN:VEVENT",
      `UID:${makeUID(ev, baseUrl)}`,
      `DTSTART:${toICSDateTimeUTC(ev.starts_at)}`,
      ev.ends_at ? `DTEND:${toICSDateTimeUTC(ev.ends_at)}` : undefined,
      `SUMMARY:${escapeICS(ev.title || "Event")}`,
      ev.description ? `DESCRIPTION:${escapeICS(ev.description)}` : undefined,
      ev.location ? `LOCATION:${escapeICS(ev.location)}` : undefined,
      `URL:${escapeICS(url)}`,
      "END:VEVENT",
    ].filter(Boolean) as string[]
  })

  const tail = ["END:VCALENDAR"]
  return [...head, ...body, ...tail].join("\r\n")
}
