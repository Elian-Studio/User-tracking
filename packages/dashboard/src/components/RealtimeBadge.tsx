import { useEffect, useState } from "react";
import { fetchRealtime } from "../api";

// 헤더 실시간 배지 — 최근 5분 활성 세션 수를 15초마다 폴링.
export function RealtimeBadge({ serviceKey }: { serviceKey: string }) {
  const [active, setActive] = useState<number | null>(null);

  useEffect(() => {
    if (!serviceKey) return;
    let alive = true;
    const tick = () =>
      fetchRealtime(serviceKey).then((n) => {
        if (alive) setActive(n);
      });
    tick();
    const id = setInterval(tick, 15000);
    return () => {
      alive = false;
      clearInterval(id);
    };
  }, [serviceKey]);

  if (active === null) return null;

  return (
    <span className="realtime-badge" title="최근 5분 활성 세션">
      <span className="realtime-dot" />
      {active} 접속 중
    </span>
  );
}
