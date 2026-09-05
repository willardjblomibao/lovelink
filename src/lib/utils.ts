import { clsx, type ClassValue } from 'clsx';

export function cx(...inputs: ClassValue[]) {
  return clsx(inputs);
}

export function initials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join('');
}

export function daysTogether(startDate: string | Date) {
  const start = new Date(startDate);
  const now = new Date();
  const ms = now.setHours(0, 0, 0, 0) - new Date(start).setHours(0, 0, 0, 0);
  return Math.max(0, Math.floor(ms / (1000 * 60 * 60 * 24)));
}

export function daysUntil(dateStr: string) {
  const target = new Date(dateStr);
  const now = new Date();
  target.setFullYear(now.getFullYear());
  if (target.getTime() < new Date(now.toDateString()).getTime()) {
    target.setFullYear(now.getFullYear() + 1);
  }
  const ms = target.setHours(0, 0, 0, 0) - new Date(now.toDateString()).setHours(0, 0, 0, 0);
  return Math.round(ms / (1000 * 60 * 60 * 24));
}

export function formatTime(dateStr: string) {
  return new Date(dateStr).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}

/** Great-circle distance between two lat/lon points, in kilometers. */
export function distanceKm(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/** Short "time ago" string like "just now", "5m ago", "3h ago", "2d ago". */
export function timeAgo(dateStr: string) {
  const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (seconds < 30) return 'just now';
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

/** Builds a key-free OpenStreetMap embed URL centered on a point with a marker. */
export function osmEmbedUrl(lat: number, lon: number, deltaDeg = 0.01) {
  const bbox = `${lon - deltaDeg}%2C${lat - deltaDeg}%2C${lon + deltaDeg}%2C${lat + deltaDeg}`;
  return `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${lat}%2C${lon}`;
}

export function googleMapsUrl(lat: number, lon: number) {
  return `https://www.google.com/maps?q=${lat},${lon}`;
}

/**
 * Converts coordinates into a short, readable place name (e.g. "SM City Cabanatuan")
 * using OpenStreetMap's free Nominatim reverse-geocoding API. Best-effort: falls back
 * to a short address, then to null if the lookup fails or times out.
 */
export async function reverseGeocode(lat: number, lon: number): Promise<string | null> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6000);

    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=jsonv2&addressdetails=1&zoom=18`,
      { headers: { Accept: 'application/json' }, signal: controller.signal }
    );
    clearTimeout(timeout);
    if (!res.ok) return null;

    const data = await res.json();
    const addr = data.address ?? {};

    // Prefer a named point of interest (mall, cafe, landmark) if the pin landed on one.
    const poiName: string | undefined = data.name || addr.mall || addr.shop || addr.amenity || addr.building;
    if (poiName) {
      const locality = addr.suburb || addr.city_district || addr.city || addr.town;
      return locality && locality !== poiName ? `${poiName}, ${locality}` : poiName;
    }

    const parts = [addr.road, addr.suburb || addr.city_district, addr.city || addr.town || addr.municipality].filter(
      Boolean
    );
    if (parts.length) return parts.join(', ');

    return data.display_name?.split(',').slice(0, 2).join(',') ?? null;
  } catch {
    return null;
  }
}

export const DAILY_QUOTES = [
  'Distance means so little when someone means so much.',
  'You are my today and all of my tomorrows.',
  'In a sea of people, my eyes will always search for you.',
  'Home isn’t a place, it’s a person.',
  'Every love story is beautiful, but ours is my favorite.',
  'You are my sun, my moon, and all my stars.',
  'I love you not only for what you are, but for what I am when I am with you.',
  'Together is a wonderful place to be.'
];

export function quoteForToday() {
  const day = Math.floor(Date.now() / (1000 * 60 * 60 * 24));
  return DAILY_QUOTES[day % DAILY_QUOTES.length];
}

/** Formats a Date as YYYYMMDD for all-day ICS events. */
function icsDate(d: Date) {
  return d.toISOString().slice(0, 10).replace(/-/g, '');
}

/**
 * Builds a minimal .ics file for a single all-day, yearly-recurring or
 * one-off event, so it can be imported into the phone's native calendar
 * (Apple Calendar, Google Calendar, Outlook all accept this format).
 */
export function buildICS({
  title,
  dateStr,
  description,
  recurringYearly
}: {
  title: string;
  dateStr: string; // YYYY-MM-DD
  description?: string;
  recurringYearly?: boolean;
}) {
  const start = new Date(dateStr);
  const end = new Date(start);
  end.setDate(end.getDate() + 1);
  const uid = `${crypto.randomUUID()}@lovelink.app`;
  const rrule = recurringYearly ? 'RRULE:FREQ=YEARLY\n' : '';

  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//LoveLink//EN',
    'CALSCALE:GREGORIAN',
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${icsDate(new Date())}T000000Z`,
    `DTSTART;VALUE=DATE:${icsDate(start)}`,
    `DTEND;VALUE=DATE:${icsDate(end)}`,
    rrule.trim(),
    `SUMMARY:${title.replace(/\n/g, ' ')}`,
    description ? `DESCRIPTION:${description.replace(/\n/g, ' ')}` : '',
    'END:VEVENT',
    'END:VCALENDAR'
  ]
    .filter(Boolean)
    .join('\r\n');
}

/** Triggers a browser download of an .ics file so the OS can offer to add it to Calendar. */
export function downloadICS(filename: string, icsContent: string) {
  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename.endsWith('.ics') ? filename : `${filename}.ics`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
