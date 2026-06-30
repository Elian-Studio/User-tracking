import { useEffect, useState } from "react";
import { fetchOverview, fetchTrend } from "../api";
import { Sparkline } from "./Sparkline";

interface Props {
  serviceKey: string;
  startDate: string;
  endDate: string;
  onLoaded?: (hasData: boolean) => void;
}

interface Overview {
  uv: number;
  pv: number;
  bounceRate: number;
}

// 직전 동일 길이 기간 계산 [prevStart, prevEnd=현재 start)
function prevRange(startISO: string, endISO: string): [string, string] {
  const start = new Date(startISO).getTime();
  const end = new Date(endISO).getTime();
  const len = end - start;
  return [new Date(start - len).toISOString(), startISO];
}

// 증감 배지: positive=값이 클수록 좋은 지표(UV/PV)면 ↑녹, 이탈률이면 ↑적
function Delta({ cur, prev, unit, goodWhenUp }: { cur: number; prev: number | null; unit: "pct" | "pt"; goodWhenUp: boolean }) {
  if (prev === null || prev === 0) return null;
  const diff = unit === "pct" ? Math.round(((cur - prev) / prev) * 100) : cur - prev;
  if (diff === 0) return <span className="delta delta-flat">0{unit === "pct" ? "%" : "p"}</span>;
  const up = diff > 0;
  const good = up === goodWhenUp;
  return (
    <span className={`delta ${good ? "delta-up" : "delta-down"}`}>
      {up ? "▲" : "▼"} {Math.abs(diff)}{unit === "pct" ? "%" : "p"}
    </span>
  );
}

export function OverviewCards({ serviceKey, startDate, endDate, onLoaded }: Props) {
  const [cur, setCur] = useState<Overview | null>(null);
  const [prev, setPrev] = useState<Overview | null>(null);
  const [trend, setTrend] = useState<{ uv: number; pv: number }[]>([]);

  useEffect(() => {
    if (!serviceKey) return;
    setCur(null);
    setPrev(null);
    setTrend([]);
    const [ps, pe] = prevRange(startDate, endDate);
    Promise.all([
      fetchOverview(serviceKey, startDate, endDate),
      fetchOverview(serviceKey, ps, pe),
      fetchTrend(serviceKey, startDate, endDate, "day"),
    ]).then(([c, p, t]) => {
      setCur(c);
      setPrev(p);
      setTrend(t?.data ?? []);
      onLoaded?.(!!c && (c.uv > 0 || c.pv > 0));
    });
  }, [serviceKey, startDate, endDate]);

  const fmt = (v: number | null | undefined) => (v !== null && v !== undefined ? v.toLocaleString() : "—");

  return (
    <div className="cards">
      <div className="card">
        <div className="label">Unique Visitors</div>
        <div className="value-row">
          <div className="value">{fmt(cur?.uv)}</div>
          {cur && <Delta cur={cur.uv} prev={prev?.uv ?? null} unit="pct" goodWhenUp={true} />}
        </div>
        <Sparkline data={trend.map((d) => d.uv)} color="#4f8cff" />
      </div>
      <div className="card">
        <div className="label">Page Views</div>
        <div className="value-row">
          <div className="value">{fmt(cur?.pv)}</div>
          {cur && <Delta cur={cur.pv} prev={prev?.pv ?? null} unit="pct" goodWhenUp={true} />}
        </div>
        <Sparkline data={trend.map((d) => d.pv)} color="#34d399" />
      </div>
      <div className="card">
        <div className="label">Bounce Rate</div>
        <div className="value-row">
          <div className="value">{cur ? `${cur.bounceRate}%` : "—"}</div>
          {cur && <Delta cur={cur.bounceRate} prev={prev?.bounceRate ?? null} unit="pt" goodWhenUp={false} />}
        </div>
      </div>
    </div>
  );
}
