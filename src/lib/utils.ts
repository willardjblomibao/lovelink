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
