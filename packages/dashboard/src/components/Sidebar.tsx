import type { ServiceItem } from "../api";
import { RealtimeBadge } from "./RealtimeBadge";

export type Section = "overview" | "pages" | "acquisition" | "heatmap" | "realtime" | "settings";

const NAV: { id: Section; label: string }[] = [
  { id: "overview", label: "개요" },
  { id: "pages", label: "페이지별 통계" },
  { id: "acquisition", label: "유입 경로" },
  { id: "heatmap", label: "스크롤 히트맵" },
  { id: "realtime", label: "실시간" },
  { id: "settings", label: "설정" },
];

interface Props {
  services: ServiceItem[];
  serviceKey: string;
  onSelectService: (key: string) => void;
  section: Section;
  onSection: (s: Section) => void;
  onLogout: () => void;
}

export function Sidebar({ services, serviceKey, onSelectService, section, onSection, onLogout }: Props) {
  return (
    <aside className="sidebar">
      <div className="sidebar-brand">사용자 분석</div>

      <select
        className="sidebar-service"
        value={serviceKey}
        onChange={(e) => onSelectService(e.target.value)}
      >
        {services.length === 0 && <option value="">서비스 없음</option>}
        {services.map((s) => (
          <option key={s.service_key} value={s.service_key}>
            {s.service_key}
          </option>
        ))}
      </select>

      {serviceKey && <RealtimeBadge serviceKey={serviceKey} />}

      <nav className="sidebar-nav">
        {NAV.map((n) => (
          <button
            key={n.id}
            className={`nav-item ${section === n.id ? "active" : ""}`}
            onClick={() => onSection(n.id)}
          >
            {n.label}
          </button>
        ))}
      </nav>

      <button className="sidebar-logout" onClick={onLogout}>로그아웃</button>
    </aside>
  );
}
