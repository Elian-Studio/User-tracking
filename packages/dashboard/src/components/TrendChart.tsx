import { useEffect, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { fetchTrend } from "../api";
import { axisTick, axisLine, gridStroke, tooltipStyle } from "./chartTheme";

interface Props {
  serviceKey: string;
  startDate: string;
  endDate: string;
  timezone: string;
}

type Interval = "day" | "week" | "month" | "hour";

const INTERVAL_LABELS: Record<Interval, string> = {
  day: "일별",
  week: "주별",
  month: "월별",
  hour: "시간별",
};

const MAX_SHORT_RANGE_DAYS = 3;
const MS_PER_DAY = 24 * 60 * 60 * 1000;

// 선택된 타임존 기준 달력 날짜(YYYY-MM-DD)를 UTC 자정 기준 일수로 변환 — DST 구간에서
// 실제 경과 ms(24h가 아닌 23h/25h)로 범위를 판정하면 사용자가 고른 "3일"이 어긋난다.
export function localDayIndex(instant: string, timezone: string): number {
  const dtf = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const p = Object.fromEntries(dtf.formatToParts(new Date(instant)).map((x) => [x.type, x.value]));
  return Date.UTC(Number(p.year), Number(p.month) - 1, Number(p.day)) / MS_PER_DAY;
}

// bucket 형태: "YYYY-MM-DDTHH:MM:SS" (서버가 이미 선택된 타임존으로 로컬라이즈한 문자열,
// 끝에 Z가 없음 — new Date()로 재파싱하면 안 됨, 문자열 슬라이싱만 사용)
export function formatHourTick(bucket: string, spansMultipleDays: boolean): string {
  const [datePart, timePart] = bucket.split("T");
  // Recharts는 틱 크기 측정 패스에서 실제 데이터 값이 아닌 값으로도 tickFormatter를 호출한다 —
  // "T"가 없는 입력은 그대로 돌려준다.
  if (!timePart) return bucket;
  const hhmm = timePart.slice(0, 5);
  if (!spansMultipleDays) return hhmm;
  const [, m, d] = datePart.split("-");
  return `${Number(m)}/${Number(d)} ${hhmm}`;
}

export function computeSpansMultipleDays(
  effectiveInterval: Interval,
  data: { date: string }[],
): boolean {
  return (
    effectiveInterval === "hour" &&
    data.length > 0 &&
    data[0].date.slice(0, 10) !== data[data.length - 1].date.slice(0, 10)
  );
}

export function TrendChart({ serviceKey, startDate, endDate, timezone }: Props) {
  const [interval, setInterval] = useState<Interval>("day");
  const [data, setData] = useState<{ date: string; uv: number; pv: number }[]>(
    [],
  );

  const isShortRange =
    localDayIndex(endDate, timezone) - localDayIndex(startDate, timezone) <= MAX_SHORT_RANGE_DAYS;
  const effectiveInterval: Interval = interval === "hour" && !isShortRange ? "day" : interval;

  // 토글 버튼 표시 상태 정리용 — 쿼리 안전성은 effectiveInterval 파생값이 이미 보장하므로
  // 여기선 화면에 남은 "시간별" 활성 표시만 되돌린다.
  useEffect(() => {
    if (interval === "hour" && !isShortRange) setInterval("day");
  }, [isShortRange, interval]);

  useEffect(() => {
    if (!serviceKey) return;
    fetchTrend(serviceKey, startDate, endDate, effectiveInterval, timezone).then((res) => {
      setData(res?.data ?? []);
    });
  }, [serviceKey, startDate, endDate, effectiveInterval, timezone]);

  const spansMultipleDays = computeSpansMultipleDays(effectiveInterval, data);

  const intervals: Interval[] = isShortRange
    ? ["day", "week", "month", "hour"]
    : ["day", "week", "month"];

  return (
    <div className="section">
      <h2>방문자 추이</h2>
      <div className="interval-toggle">
        {intervals.map((v) => (
          <button
            key={v}
            className={effectiveInterval === v ? "active" : ""}
            onClick={() => setInterval(v)}
          >
            {INTERVAL_LABELS[v]}
          </button>
        ))}
      </div>
      {data.length === 0 ? (
        <div className="empty">데이터가 없습니다</div>
      ) : (
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
            <XAxis
              dataKey="date"
              tick={axisTick}
              axisLine={axisLine}
              tickLine={axisLine}
              tickFormatter={
                effectiveInterval === "hour"
                  ? (v: string) => formatHourTick(v, spansMultipleDays)
                  : undefined
              }
            />
            <YAxis tick={axisTick} axisLine={axisLine} tickLine={axisLine} />
            <Tooltip {...tooltipStyle} />
            <Legend wrapperStyle={{ color: "#9aa3b8", fontSize: 12 }} />
            <Line
              type="monotone"
              dataKey="uv"
              name="UV"
              stroke="#4f8cff"
              strokeWidth={2}
              dot={false}
            />
            <Line
              type="monotone"
              dataKey="pv"
              name="PV"
              stroke="#34d399"
              strokeWidth={2}
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
