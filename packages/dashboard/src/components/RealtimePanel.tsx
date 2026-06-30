import { useEffect, useState } from "react";
import { fetchRealtime } from "../api";

// 실시간 섹션 — 최근 5분 활성 세션 수를 10초마다 갱신해 크게 표시.
export function RealtimePanel({ serviceKey }: { serviceKey: string }) {
  const [active, setActive] = useState<number | null>(null);

  useEffect(() => {
    if (!serviceKey) return;
    let alive = true;
    const tick = () =>
      fetchRealtime(serviceKey).then((n) => {
        if (alive) setActive(n);
      });
    tick();
    const id = setInterval(tick, 10000);
    return () => {
      alive = false;
      clearInterval(id);
    };
  }, [serviceKey]);

  return (
    <div className="section realtime-panel">
      <h2>실시간 접속</h2>
      <div className="realtime-big">
        <span className="realtime-dot" />
        <span className="realtime-count">{active ?? "—"}</span>
        <span className="realtime-unit">명 접속 중</span>
      </div>
      <p className="settings-sub">최근 5분 내 활동한 고유 세션 수입니다. 10초마다 갱신됩니다.</p>
    </div>
  );
}
