/** Shared reminder-offset helpers used by the event form, the admin page and settings. */

export const REMINDER_PRESETS = [
  { minutes: 10080, mm: "၁ ပတ် အလို", en: "1 week before" },
  { minutes: 4320, mm: "၃ ရက် အလို", en: "3 days before" },
  { minutes: 1440, mm: "၁ ရက် အလို", en: "1 day before" },
  { minutes: 720, mm: "၁၂ နာရီ အလို", en: "12 hours before" },
  { minutes: 360, mm: "၆ နာရီ အလို", en: "6 hours before" },
  { minutes: 60, mm: "၁ နာရီ အလို", en: "1 hour before" },
  { minutes: 30, mm: "၃၀ မိနစ် အလို", en: "30 minutes before" },
  { minutes: 10, mm: "၁၀ မိနစ် အလို", en: "10 minutes before" },
  { minutes: 5, mm: "၅ မိနစ် အလို", en: "5 minutes before" },
] as const;

export function formatOffset(minutes: number, lang: "mm" | "en") {
  const preset = REMINDER_PRESETS.find((p) => p.minutes === minutes);
  if (preset) return preset[lang];
  const days = Math.floor(minutes / 1440);
  const hours = Math.floor((minutes % 1440) / 60);
  const mins = minutes % 60;
  const parts: string[] = [];
  if (lang === "mm") {
    if (days) parts.push(`${days} ရက်`);
    if (hours) parts.push(`${hours} နာရီ`);
    if (mins) parts.push(`${mins} မိနစ်`);
    return `${parts.join(" ")} အလို`;
  }
  if (days) parts.push(`${days}d`);
  if (hours) parts.push(`${hours}h`);
  if (mins) parts.push(`${mins}m`);
  return `${parts.join(" ")} before`;
}

export function remindAtFor(startsAt: string, offsetMinutes: number) {
  return new Date(new Date(startsAt).getTime() - offsetMinutes * 60_000).toISOString();
}
