import { useState, useEffect } from "react";
import { OverviewCards } from "./components/OverviewCards";
import { TrendChart } from "./components/TrendChart";
import { AcquisitionTable } from "./components/AcquisitionTable";
import { PagesTable } from "./components/PagesTable";
import { ExitScrollChart } from "./components/ExitScrollChart";
import { ScrollHeatmap } from "./components/ScrollHeatmap";
import { LoginForm } from "./components/LoginForm";
import { checkAuth, logout, listServices, saveServiceDomain, type ServiceItem } from "./api";

type Environment = "dev" | "staging" | "prod";

const ENV_LABELS: Record<Environment, string> = {
  dev: "DEV",
  staging: "STAGING",
  prod: "PROD",
};

function detectEnv(key: string): Environment {
  if (key.endsWith("-dev")) return "dev";
  if (key.endsWith("-staging")) return "staging";
  return "prod";
}

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function monthAgoISO() {
  const d = new Date();
  d.setMonth(d.getMonth() - 1);
  return d.toISOString().slice(0, 10);
}

export function App() {
  // null=확인중, false=미인증, true=인증
  const [authed, setAuthed] = useState<boolean | null>(null);

  useEffect(() => {
    checkAuth().then(setAuthed);
    const onUnauthorized = () => setAuthed(false);
    window.addEventListener("flowmvp-unauthorized", onUnauthorized);
    return () => window.removeEventListener("flowmvp-unauthorized", onUnauthorized);
  }, []);

  const handleLogout = async () => {
    await logout();
    setAuthed(false);
  };

  const [services, setServices] = useState<ServiceItem[]>([]);
  const [serviceKey, setServiceKey] = useState("");
  const [siteUrl, setSiteUrl] = useState("");

  // 인증되면 서비스 목록 로드 → 드롭다운 채우고 첫 서비스 자동 선택(도메인 자동 채움)
  useEffect(() => {
    if (authed !== true) return;
    listServices().then((list) => {
      setServices(list);
      if (list.length > 0) {
        setServiceKey(list[0].service_key);
        setSiteUrl(list[0].domain ?? "");
      }
    });
  }, [authed]);

  const handleSelectService = (key: string) => {
    setServiceKey(key);
    const svc = services.find((s) => s.service_key === key);
    setSiteUrl(svc?.domain ?? "");
  };
  const [startDate, setStartDate] = useState(monthAgoISO());
  const [endDate, setEndDate] = useState(todayISO());
  const [appliedKey, setAppliedKey] = useState("");
  const [appliedSiteUrl, setAppliedSiteUrl] = useState("");
  const [appliedStart, setAppliedStart] = useState("");
  const [appliedEnd, setAppliedEnd] = useState("");
  const [selectedPath, setSelectedPath] = useState("");
  const [heatmapPath, setHeatmapPath] = useState("");

  const handleApply = () => {
    if (!serviceKey) return;
    // 입력한 사이트 URL을 해당 서비스 도메인으로 저장 → 다음에 선택 시 자동 채움
    if (siteUrl) {
      saveServiceDomain(serviceKey, siteUrl);
      setServices((prev) =>
        prev.map((s) => (s.service_key === serviceKey ? { ...s, domain: siteUrl } : s)),
      );
    }
    setAppliedKey(serviceKey);
    setAppliedSiteUrl(siteUrl);
    setAppliedStart(startDate + "T00:00:00Z");
    setAppliedEnd(endDate + "T23:59:59Z");
    setSelectedPath("");
    setHeatmapPath("");
  };

  if (authed === null) {
    return <div className="dashboard"><div className="empty">로딩 중...</div></div>;
  }

  if (!authed) {
    return <LoginForm onSuccess={() => setAuthed(true)} />;
  }

  return (
    <div className="dashboard">
      <div className="header-row">
        <h1>FlowMVP Analytics</h1>
        {appliedKey && (
          <span className={`env-badge env-${detectEnv(appliedKey)}`}>
            {ENV_LABELS[detectEnv(appliedKey)]}
          </span>
        )}
        <button className="btn-logout" onClick={handleLogout}>로그아웃</button>
      </div>
      <div className="filters">
        <select
          className="select-service"
          value={serviceKey}
          onChange={(e) => handleSelectService(e.target.value)}
        >
          {services.length === 0 && <option value="">등록된 서비스 없음</option>}
          {services.map((s) => (
            <option key={s.service_key} value={s.service_key}>
              {s.service_key}
            </option>
          ))}
        </select>
        <input
          type="text"
          placeholder="사이트 URL (예: https://example.com)"
          className="input-site-url"
          value={siteUrl}
          onChange={(e) => setSiteUrl(e.target.value)}
        />
        <input
          type="date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
        />
        <input
          type="date"
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
        />
        <button onClick={handleApply}>조회</button>
      </div>

      {appliedKey && (
        <>
          <OverviewCards
            serviceKey={appliedKey}
            startDate={appliedStart}
            endDate={appliedEnd}
          />
          <TrendChart
            serviceKey={appliedKey}
            startDate={appliedStart}
            endDate={appliedEnd}
          />
          <AcquisitionTable
            serviceKey={appliedKey}
            startDate={appliedStart}
            endDate={appliedEnd}
          />
          <PagesTable
            serviceKey={appliedKey}
            startDate={appliedStart}
            endDate={appliedEnd}
            onSelectPath={setSelectedPath}
            onHeatmapPath={(path) => {
              if (!appliedSiteUrl) {
                alert("히트맵을 보려면 사이트 URL을 입력하세요.");
                return;
              }
              setHeatmapPath(path);
            }}
          />
          {selectedPath && (
            <ExitScrollChart
              serviceKey={appliedKey}
              path={selectedPath}
              startDate={appliedStart}
              endDate={appliedEnd}
            />
          )}
        </>
      )}

      {heatmapPath && appliedSiteUrl && (
        <ScrollHeatmap
          serviceKey={appliedKey}
          path={heatmapPath}
          siteUrl={appliedSiteUrl}
          startDate={appliedStart}
          endDate={appliedEnd}
          onClose={() => setHeatmapPath("")}
        />
      )}
    </div>
  );
}
