import { useState, useEffect } from "react";
import { OverviewCards } from "./components/OverviewCards";
import { TrendChart } from "./components/TrendChart";
import { AcquisitionTable } from "./components/AcquisitionTable";
import { PagesTable } from "./components/PagesTable";
import { ExitScrollChart } from "./components/ExitScrollChart";
import { ScrollHeatmap } from "./components/ScrollHeatmap";
import { LoginForm } from "./components/LoginForm";
import { checkAuth, logout } from "./api";

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

  const [serviceKey, setServiceKey] = useState("test-app");
  const [siteUrl, setSiteUrl] = useState("https://example.com");
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
        <input
          type="text"
          placeholder="Service Key"
          value={serviceKey}
          onChange={(e) => setServiceKey(e.target.value)}
        />
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
