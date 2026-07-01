import { useEffect, useState } from "react";

export interface Preset {
  label: string;
  range: () => [string, string];
}

interface Props {
  start: string; // ISO instant
  end: string; // ISO instant
  timezone: string; // IANA timezone name
  onChange: (start: string, end: string, timezone: string) => void;
  presets: Preset[];
}

const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];

const LOCAL_TZ = Intl.DateTimeFormat().resolvedOptions().timeZone;
const ALL_TZ: string[] = typeof Intl.supportedValuesOf === "function" ? Intl.supportedValuesOf("timeZone") : [];
const TZ_OPTIONS = [LOCAL_TZ, "UTC", ...ALL_TZ.filter((z) => z !== LOCAL_TZ && z !== "UTC")];

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

function dateKey(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function addMonths(d: Date, n: number): Date {
  return new Date(d.getFullYear(), d.getMonth() + n, 1);
}

function buildCalendarWeeks(viewDate: Date): Date[] {
  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const startOffset = new Date(year, month, 1).getDay();
  const gridStart = new Date(year, month, 1 - startOffset);
  return Array.from({ length: 42 }, (_, i) => {
    const day = new Date(gridStart);
    day.setDate(gridStart.getDate() + i);
    return day;
  });
}

// 주어진 인스턴트를 특정 타임존의 벽시계 부분(연/월/일/시/분/초)으로 분해 — 자정은 "24"로
// 나오는 Intl 표기를 "00"으로 정규화해 호출부에서 각자 처리하지 않게 한다.
function getZonedParts(instant: number, timeZone: string, withSeconds: boolean): Record<string, string> {
  const dtf = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hour12: false,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    ...(withSeconds ? { second: "2-digit" } : {}),
  });
  const p = Object.fromEntries(dtf.formatToParts(new Date(instant)).map((x) => [x.type, x.value])) as Record<
    string,
    string
  >;
  if (p.hour === "24") p.hour = "00";
  return p;
}

// 특정 타임존의 벽시계 시각(date+time)을 UTC 인스턴트로 변환.
// 오프셋 보정을 한 번만 하면 DST 전환일에 오답이 난다 — 예: America/New_York에서
// 봄철 전환(2am EST -> 3am EDT) 직후의 유효한 시각(예: 06:30)도 guess 시점(전환 전, EST)
// 오프셋으로 한 번만 보정하면 실제보다 1시간 어긋난 인스턴트가 나온다. 보정된 인스턴트에서
// 오프셋을 다시 구해 안정될 때까지 반복해야 한다(최대 3회, 실제 IANA 규칙에서는 2회면 수렴).
function zonedTimeToUtcISO(dateStr: string, timeStr: string, timeZone: string): string {
  const [y, mo, d] = dateStr.split("-").map(Number);
  const [h, mi] = timeStr.split(":").map(Number);
  const target = Date.UTC(y, mo - 1, d, h, mi);
  let instant = target;
  for (let i = 0; i < 3; i++) {
    const p = getZonedParts(instant, timeZone, true);
    const asUtc = Date.UTC(+p.year, +p.month - 1, +p.day, +p.hour, +p.minute, +p.second);
    const next = target - (asUtc - instant);
    if (next === instant) break;
    instant = next;
  }
  return new Date(instant).toISOString();
}

// UTC 인스턴트를 특정 타임존의 벽시계 date/time 문자열로 변환
function instantToZonedParts(instant: string, timeZone: string): { date: string; time: string } {
  const p = getZonedParts(new Date(instant).getTime(), timeZone, false);
  return { date: `${p.year}-${p.month}-${p.day}`, time: `${p.hour}:${p.minute}` };
}

function shortLabel(dateStr: string, timeStr: string): string {
  const [, m, d] = dateStr.split("-");
  return `${Number(m)}/${Number(d)} ${timeStr}`;
}

function formatTriggerLabel(start: string, end: string, timezone: string, presets: Preset[]): string {
  const preset = presets.find((p) => {
    const [s, e] = p.range();
    return s === start && e === end;
  });
  if (preset) return preset.label;
  const sp = instantToZonedParts(start, timezone);
  const ep = instantToZonedParts(end, timezone);
  return `${shortLabel(sp.date, sp.time)} ~ ${shortLabel(ep.date, ep.time)}`;
}

function CalendarIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  );
}

function ChevronIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}

export function DateRangePicker({ start, end, timezone, onChange, presets }: Props) {
  const [open, setOpen] = useState(false);
  const [draftStart, setDraftStart] = useState("");
  const [draftStartTime, setDraftStartTime] = useState("00:00");
  const [draftEnd, setDraftEnd] = useState("");
  const [draftEndTime, setDraftEndTime] = useState("23:59");
  const [draftTz, setDraftTz] = useState(timezone);
  const [pendingStart, setPendingStart] = useState<string | null>(null);
  const [viewDate, setViewDate] = useState(() => new Date());

  useEffect(() => {
    if (!open) return;
    const sp = instantToZonedParts(start, timezone);
    const ep = instantToZonedParts(end, timezone);
    setDraftStart(sp.date);
    setDraftStartTime(sp.time);
    setDraftEnd(ep.date);
    setDraftEndTime(ep.time);
    setDraftTz(timezone);
    setPendingStart(null);
    const [y, m] = sp.date.split("-").map(Number);
    setViewDate(new Date(y, m - 1, 1));
  }, [open, start, end, timezone]);

  const handleDayClick = (day: Date) => {
    const key = dateKey(day);
    if (pendingStart === null) {
      setDraftStart(key);
      setDraftEnd(key);
      setPendingStart(key);
    } else {
      if (key < pendingStart) {
        setDraftStart(key);
        setDraftEnd(pendingStart);
      } else {
        setDraftStart(pendingStart);
        setDraftEnd(key);
      }
      setPendingStart(null);
    }
  };

  const handleApply = () => {
    const s = zonedTimeToUtcISO(draftStart, draftStartTime, draftTz);
    const e = zonedTimeToUtcISO(draftEnd, draftEndTime, draftTz);
    onChange(s, e, draftTz);
    setOpen(false);
  };

  const applyPreset = (p: Preset) => {
    const [s, e] = p.range();
    onChange(s, e, timezone);
    setOpen(false);
  };

  const days = buildCalendarWeeks(viewDate);

  return (
    <div className="daterange">
      <button className="daterange-trigger" onClick={() => setOpen((o) => !o)}>
        <CalendarIcon />
        <span>{formatTriggerLabel(start, end, timezone, presets)}</span>
        <ChevronIcon />
      </button>

      {open && (
        <>
          <div className="daterange-overlay" onClick={() => setOpen(false)} />
          <div className="daterange-panel">
            <div className="date-presets">
              {presets.map((p) => {
                const [s, e] = p.range();
                const active = start === s && end === e;
                return (
                  <button key={p.label} className={active ? "active" : ""} onClick={() => applyPreset(p)}>
                    {p.label}
                  </button>
                );
              })}
            </div>

            <div className="daterange-calendar">
              <div className="daterange-cal-header">
                <button onClick={() => setViewDate((d) => addMonths(d, -1))}>‹</button>
                <span>{viewDate.getFullYear()}년 {viewDate.getMonth() + 1}월</span>
                <button onClick={() => setViewDate((d) => addMonths(d, 1))}>›</button>
              </div>
              <div className="daterange-cal-weekdays">
                {WEEKDAYS.map((w) => <span key={w}>{w}</span>)}
              </div>
              <div className="daterange-cal-grid">
                {days.map((day) => {
                  const key = dateKey(day);
                  const inMonth = day.getMonth() === viewDate.getMonth();
                  const isEdge = key === draftStart || key === draftEnd;
                  const inRange = Boolean(draftStart && draftEnd && key > draftStart && key < draftEnd);
                  return (
                    <button
                      key={key}
                      className={`daterange-day${inMonth ? "" : " dim"}${isEdge ? " selected" : ""}${inRange ? " in-range" : ""}`}
                      onClick={() => handleDayClick(day)}
                    >
                      {day.getDate()}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="daterange-field-row">
              <label>Start</label>
              <input type="date" value={draftStart} onChange={(e) => setDraftStart(e.target.value)} />
              <input type="time" value={draftStartTime} onChange={(e) => setDraftStartTime(e.target.value)} />
            </div>
            <div className="daterange-field-row">
              <label>End</label>
              <input type="date" value={draftEnd} onChange={(e) => setDraftEnd(e.target.value)} />
              <input type="time" value={draftEndTime} onChange={(e) => setDraftEndTime(e.target.value)} />
            </div>

            <button
              className="daterange-apply"
              onClick={handleApply}
              disabled={!draftStart || !draftEnd}
            >
              적용 ↵
            </button>

            <select className="daterange-tz" value={draftTz} onChange={(e) => setDraftTz(e.target.value)}>
              {TZ_OPTIONS.map((tz) => (
                <option key={tz} value={tz}>{tz === LOCAL_TZ ? `Local (${tz})` : tz}</option>
              ))}
            </select>
          </div>
        </>
      )}
    </div>
  );
}
