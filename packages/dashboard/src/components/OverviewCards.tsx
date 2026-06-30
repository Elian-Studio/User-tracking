import { useEffect, useState } from "react";
import { fetchOverview } from "../api";

interface Props {
  serviceKey: string;
  startDate: string;
  endDate: string;
}

export function OverviewCards({ serviceKey, startDate, endDate }: Props) {
  const [uv, setUv] = useState<number | null>(null);
  const [pv, setPv] = useState<number | null>(null);
  const [bounceRate, setBounceRate] = useState<number | null>(null);

  useEffect(() => {
    if (!serviceKey) return;
    // 서비스/기간 변경 시 즉시 리셋 → 이전 값이 남는 stale 방지 + 로딩 표시("—")
    setUv(null);
    setPv(null);
    setBounceRate(null);
    fetchOverview(serviceKey, startDate, endDate).then((data) => {
      setUv(data?.uv ?? null);
      setPv(data?.pv ?? null);
      setBounceRate(data?.bounceRate ?? null);
    });
  }, [serviceKey, startDate, endDate]);

  return (
    <div className="cards">
      <div className="card">
        <div className="label">Unique Visitors</div>
        <div className="value">{uv !== null ? uv.toLocaleString() : "—"}</div>
      </div>
      <div className="card">
        <div className="label">Page Views</div>
        <div className="value">{pv !== null ? pv.toLocaleString() : "—"}</div>
      </div>
      <div className="card">
        <div className="label">Bounce Rate</div>
        <div className="value">{bounceRate !== null ? `${bounceRate}%` : "—"}</div>
      </div>
    </div>
  );
}
