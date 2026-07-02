import { useState, useEffect, useCallback } from "react";
import { DateRangePicker, type Preset, zonedTimeToUtcISO } from "./components/DateRangePicker";
import { OverviewCards } from "./components/OverviewCards";
import { OnboardingCard } from "./components/OnboardingCard";
import { TrendChart } from "./components/TrendChart";
import { AcquisitionTable } from "./components/AcquisitionTable";
import { PagesTable } from "./components/PagesTable";
import { ExitScrollChart } from "./components/ExitScrollChart";
import { ScrollHeatmap } from "./components/ScrollHeatmap";
import { LoginForm } from "./components/LoginForm";
import { Sidebar, type Section } from "./components/Sidebar";
import { SettingsPanel } from "./components/SettingsPanel";
import { RealtimePanel } from "./components/RealtimePanel";
import { checkAuth, logout, listServices, type ServiceItem } from "./api";

type Environment = "dev" | "staging" | "prod";

const ENV_LABELS: Record<Environment, string> = { dev: "DEV", staging: "STAGING", prod: "PROD" };

function detectEnv(key: string): Environment {
  if (key.endsWith("-dev")) return "dev";
  if (key.endsWith("-staging")) return "staging";
  return "prod";
}

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

// "오늘"의 기준은 브라우저가 아니라 선택된 타임존이어야 한다 — 그대로 두면 Asia/Seoul
// 사용자가 로컬 자정 근처에 "오늘"을 눌러도 UTC 자정 기준 날짜가 나와 로컬 오전 9시까지
// 누락된다.
function zonedTodayParts(timezone: string): { y: number; m: number; d: number } {
  const dtf = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const p = Object.fromEntries(dtf.formatToParts(new Date()).map((x) => [x.type, x.value])) as Record<
    string,
    string
  >;
  return { y: +p.year, m: +p.month, d: +p.day };
}

function todayInTz(timezone: string): string {
  const { y, m, d } = zonedTodayParts(timezone);
  return `${y}-${pad(m)}-${pad(d)}`;
}

function daysAgoInTz(n: number, timezone: string): string {
  const { y, m, d } = zonedTodayParts(timezone);
  const dt = new Date(Date.UTC(y, m - 1, d - n));
  return `${dt.getUTCFullYear()}-${pad(dt.getUTCMonth() + 1)}-${pad(dt.getUTCDate())}`;
}

function monthStartInTz(timezone: string): string {
  const { y, m } = zonedTodayParts(timezone);
  return `${y}-${pad(m)}-01`;
}

function toInstantRange(startDate: string, endDate: string, timezone: string): [string, string] {
  const s = zonedTimeToUtcISO(startDate, "00:00", timezone);
  const eRaw = zonedTimeToUtcISO(endDate, "23:59", timezone);
  const e = new Date(new Date(eRaw).getTime() + 59000).toISOString(); // 23:59:59까지 포함
  return [s, e];
}

const DATE_PRESETS: Preset[] = [
  { label: "오늘", range: (tz) => toInstantRange(todayInTz(tz), todayInTz(tz), tz) },
  { label: "7일", range: (tz) => toInstantRange(daysAgoInTz(6, tz), todayInTz(tz), tz) },
  { label: "30일", range: (tz) => toInstantRange(daysAgoInTz(29, tz), todayInTz(tz), tz) },
  { label: "이번 달", range: (tz) => toInstantRange(monthStartInTz(tz), todayInTz(tz), tz) },
];

const INITIAL_TZ = Intl.DateTimeFormat().resolvedOptions().timeZone;

// 날짜 필터를 쓰는 섹션
const DATE_SECTIONS: Section[] = ["overview", "pages", "acquisition", "heatmap"];

export function App() {
  const [authed, setAuthed] = useState<boolean | null>(null);

  useEffect(() => {
    checkAuth().then(setAuthed);
    const onUnauthorized = () => setAuthed(false);
    window.addEventListener("flowmvp-unauthorized", onUnauthorized);
    return () => window.removeEventListener("flowmvp-unauthorized", onUnauthorized);
  }, []);

  const [services, setServices] = useState<ServiceItem[]>([]);
  const [serviceKey, setServiceKey] = useState("");
  // 기본 범위(최근 7일)도 "7일" 프리셋과 동일한 타임존 기준 계산을 써야 한다 — UTC 자정
  // 기준으로 하드코딩하면 최초 로드 시점에 이미 로컬 기준으로는 어긋난 범위가 조회된다.
  const [startInstant, setStartInstant] = useState(() => DATE_PRESETS[1].range(INITIAL_TZ)[0]);
  const [endInstant, setEndInstant] = useState(() => DATE_PRESETS[1].range(INITIAL_TZ)[1]);
  const [timezone, setTimezone] = useState(INITIAL_TZ);
  const [section, setSection] = useState<Section>("overview");
  const handleDateRangeChange = useCallback((s: string, e: string, tz: string) => {
    setStartInstant(s);
    setEndInstant(e);
    setTimezone(tz);
  }, []);
  const [hasData, setHasData] = useState(true);
  const [selectedPath, setSelectedPath] = useState("");
  const [heatmapPath, setHeatmapPath] = useState("");

  const reloadServices = () => {
    listServices().then((list) => {
      setServices(list);
      if (list.length > 0) {
        setServiceKey((cur) => cur || list[0].service_key);
      }
    });
  };

  useEffect(() => {
    if (authed === true) reloadServices();
  }, [authed]);

  // 서비스/날짜 바뀌면 선택 경로 초기화
  useEffect(() => {
    setSelectedPath("");
    setHeatmapPath("");
  }, [serviceKey, startInstant, endInstant]);

  const handleLogout = async () => {
    await logout();
    setAuthed(false);
  };

  if (authed === null) {
    return <div className="login-wrap"><div className="empty">로딩 중...</div></div>;
  }
  if (!authed) {
    return <LoginForm onSuccess={() => setAuthed(true)} />;
  }

  const startISO = startInstant;
  const endISO = endInstant;
  const selectedSvc = services.find((s) => s.service_key === serviceKey);
  const siteUrl = selectedSvc?.domain ?? "";

  const dataProps = { serviceKey, startDate: startISO, endDate: endISO };

  return (
    <div className="app-shell">
      <Sidebar
        services={services}
        serviceKey={serviceKey}
        onSelectService={setServiceKey}
        section={section}
        onSection={setSection}
        onLogout={handleLogout}
      />

      <main className="main">
        <div className="topbar">
          {serviceKey && (
            <span className={`env-badge env-${detectEnv(serviceKey)}`}>
              {ENV_LABELS[detectEnv(serviceKey)]}
            </span>
          )}
          <span className="topbar-title">
            {{ overview: "개요", pages: "페이지별 통계", acquisition: "유입 경로", heatmap: "스크롤 히트맵", realtime: "실시간", settings: "설정" }[section]}
          </span>
          {DATE_SECTIONS.includes(section) && (
            <div className="topbar-filters">
              <DateRangePicker
                start={startInstant}
                end={endInstant}
                timezone={timezone}
                presets={DATE_PRESETS}
                onChange={handleDateRangeChange}
              />
            </div>
          )}
        </div>

        <div className="content">
          {!serviceKey ? (
            <div className="empty">서비스가 없습니다. 앱에 SDK를 연동하면 자동 등록됩니다.</div>
          ) : (
            <>
              {section === "overview" && (
                <>
                  <OverviewCards {...dataProps} onLoaded={setHasData} />
                  {!hasData && <OnboardingCard serviceKey={serviceKey} />}
                  <TrendChart {...dataProps} />
                </>
              )}

              {section === "pages" && (
                <>
                  <PagesTable {...dataProps} onSelectPath={setSelectedPath} onHeatmapPath={setHeatmapPath} />
                  {selectedPath && <ExitScrollChart serviceKey={serviceKey} path={selectedPath} startDate={startISO} endDate={endISO} />}
                </>
              )}

              {section === "acquisition" && <AcquisitionTable {...dataProps} />}

              {section === "heatmap" && (
                <>
                  <div className="section">
                    <h2>스크롤 히트맵</h2>
                    <p className="settings-sub">
                      {siteUrl
                        ? "페이지 행의 '히트맵' 버튼을 누르면 실제 페이지 위에 스크롤 분포가 표시됩니다."
                        : "히트맵을 보려면 설정에서 이 서비스의 도메인을 먼저 등록하세요."}
                    </p>
                  </div>
                  <PagesTable {...dataProps} onSelectPath={setSelectedPath} onHeatmapPath={(p) => { if (siteUrl) setHeatmapPath(p); }} />
                </>
              )}

              {section === "realtime" && <RealtimePanel serviceKey={serviceKey} />}

              {section === "settings" && <SettingsPanel services={services} onChanged={reloadServices} />}
            </>
          )}
        </div>
      </main>

      {heatmapPath && siteUrl && (
        <ScrollHeatmap
          serviceKey={serviceKey}
          path={heatmapPath}
          siteUrl={siteUrl}
          startDate={startISO}
          endDate={endISO}
          onClose={() => setHeatmapPath("")}
        />
      )}
    </div>
  );
}
