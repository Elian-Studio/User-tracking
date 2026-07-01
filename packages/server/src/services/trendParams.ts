export const VALID_INTERVALS = ["day", "week", "month", "hour"] as const;
export type Interval = (typeof VALID_INTERVALS)[number];

// Intl.supportedValuesOf("timeZone")는 "UTC"를 포함하지 않아 수동으로 유니온한다.
const SUPPORTED_TZ = new Set<string>([
  "UTC",
  ...(typeof Intl.supportedValuesOf === "function" ? Intl.supportedValuesOf("timeZone") : []),
]);

export function resolveInterval(raw: string | undefined): Interval {
  return VALID_INTERVALS.includes(raw as Interval) ? (raw as Interval) : "day";
}

export function resolveTimezone(raw: string | undefined): string {
  return raw && SUPPORTED_TZ.has(raw) ? raw : "UTC";
}
