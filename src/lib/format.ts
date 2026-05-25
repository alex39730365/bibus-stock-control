/** Fixed locale so dates/numbers never follow the browser OS language (e.g. Korean). */
export const APP_LOCALE = "en-US";

export function formatDateTime(value: string | Date): string {
  const date = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString(APP_LOCALE, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });
}

export function formatNumber(value: number): string {
  return value.toLocaleString(APP_LOCALE);
}
