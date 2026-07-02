import { memo, useEffect, useMemo, useState } from "react";

export interface Preset {
  label: string;
  range: (timezone: string) => [string, string];
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

function offsetAtInstant(instant: number, timeZone: string): number {
  const p = getZonedParts(instant, timeZone, true);
  return Date.UTC(+p.year, +p.month - 1, +p.day, +p.hour, +p.minute, +p.second) - instant;
}

function wallClockMatches(
  instant: number,
  timeZone: string,
  y: number,
  mo: number,
  d: number,
  h: number,
  mi: number
): boolean {
  const p = getZonedParts(instant, timeZone, true);
  return +p.year === y && +p.month === mo && +p.day === d && +p.hour === h && +p.minute === mi;
}

// 특정 타임존의 벽시계 시각(date+time)을 UTC 인스턴트로 변환.
// 오프셋 보정을 한 번만 하면 DST 전환일에 오답이 난다 — guess 시점 오프셋(off1)과 그
// 오프셋으로 보정한 인스턴트에서 다시 구한 오프셋(off2)이 전환 경계에서는 다를 수 있다.
// 두 후보(cand1, cand2)를 모두 만들고, 실제로 원래 벽시계 값을 재현하는 쪽을 택한다:
// - 유효한 시각(전환 직후 포함): cand2가 정확히 재현됨 — 그대로 반환.
// - 존재하지 않는 시각(봄철 갭, 예: 2:30am): 어느 후보도 재현 못 함 — cand1(전환 후
//   오프셋 기준, 갭만큼 앞으로 민 시각)을 반환한다(Luxon/moment-timezone과 동일한 관례).
// - 중복되는 시각(가을철, 예: 1:30am이 두 번): cand1==cand2로 수렴해 먼저 오는(이른) 쪽을
//   반환한다.
export function zonedTimeToUtcISO(dateStr: string, timeStr: string, timeZone: string): string {
  const [y, mo, d] = dateStr.split("-").map(Number);
  const [h, mi] = timeStr.split(":").map(Number);
  const target = Date.UTC(y, mo - 1, d, h, mi);

  const off1 = offsetAtInstant(target, timeZone);
  const cand1 = target - off1;
  const off2 = offsetAtInstant(cand1, timeZone);
  const cand2 = target - off2;

  const instant = wallClockMatches(cand2, timeZone, y, mo, d, h, mi) ? cand2 : cand1;
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
    const [s, e] = p.range(timezone);
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

function DateRangePickerImpl({ start, end, timezone, onChange, presets }: Props) {
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
    const rawStart = zonedTimeToUtcISO(draftStart, draftStartTime, draftTz);
    const rawEnd = zonedTimeToUtcISO(draftEnd, draftEndTime, draftTz);
    // 캘린더 클릭은 항상 순서를 맞춰주지만, 날짜/시간 입력란은 독립적으로 수정 가능해
    // Start가 End보다 뒤에 오는 값도 만들 수 있다 — 캘린더 클릭과 동일한 규칙(더 이른
    // 쪽을 Start로)으로 자동 정렬한다.
    const [lo, hi] = rawStart <= rawEnd ? [rawStart, rawEnd] : [rawEnd, rawStart];
    // hi는 최종 범위의 끝 — 서버는 created_at < endDate(미만)로 비교하므로, 사용자가
    // 고른 "분"을 그대로 보내면(예: 08:59:00) 08:59:00~08:59:59 데이터가 통째로 빠진다.
    // 기존 프리셋(...T23:59:59Z)과 동일한 관례로 선택한 분의 끝(:59초)까지 포함시킨다.
    const inclusiveHi = new Date(new Date(hi).getTime() + 59000).toISOString();
    onChange(lo, inclusiveHi, draftTz);
    setOpen(false);
  };

  const applyPreset = (p: Preset) => {
    // 방금 드롭다운에서 고른 draftTz를 써야 한다 — 아직 커밋되지 않은 timezone prop을
    // 쓰면 타임존만 바꾸고 프리셋을 클릭했을 때 사용자의 새 선택이 무시된다.
    const [s, e] = p.range(draftTz);
    onChange(s, e, draftTz);
    setOpen(false);
  };

  const days = useMemo(() => buildCalendarWeeks(viewDate), [viewDate]);
  const triggerLabel = useMemo(
    () => formatTriggerLabel(start, end, timezone, presets),
    [start, end, timezone, presets]
  );

  return (
    <div className="daterange">
      <button className="daterange-trigger" onClick={() => setOpen((o) => !o)}>
        <CalendarIcon />
        <span>{triggerLabel}</span>
        <ChevronIcon />
      </button>

      {open && (
        <>
          <div className="daterange-overlay" onClick={() => setOpen(false)} />
          <div className="daterange-panel">
            <div className="date-presets">
              {presets.map((p) => {
                const [s, e] = p.range(timezone);
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
              disabled={!draftStart || !draftEnd || !draftStartTime || !draftEndTime}
            >
              적용 ↵
            </button>

            <select
              className="daterange-tz"
              value={draftTz}
              onChange={(e) => {
                const newTz = e.target.value;
                // 그대로 draftTz만 바꾸면 handleApply가 같은 날짜/시간 문자열을 새
                // 타임존으로 재해석해 실제 전송되는 인스턴트가 조용히 바뀐다 — 현재
                // draft가 나타내는 인스턴트를 유지한 채 새 타임존의 벽시계로만 다시
                // 표시한다. 날짜/시간 입력란이 비어 있으면(Apply가 어차피 비활성화된
                // 상태) 재해석할 인스턴트가 없으므로 타임존만 바꾼다.
                if (draftStart && draftStartTime && draftEnd && draftEndTime) {
                  const currentStart = zonedTimeToUtcISO(draftStart, draftStartTime, draftTz);
                  const currentEnd = zonedTimeToUtcISO(draftEnd, draftEndTime, draftTz);
                  const sp = instantToZonedParts(currentStart, newTz);
                  const ep = instantToZonedParts(currentEnd, newTz);
                  setDraftStart(sp.date);
                  setDraftStartTime(sp.time);
                  setDraftEnd(ep.date);
                  setDraftEndTime(ep.time);
                }
                setDraftTz(newTz);
              }}
            >
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

export const DateRangePicker = memo(DateRangePickerImpl);
