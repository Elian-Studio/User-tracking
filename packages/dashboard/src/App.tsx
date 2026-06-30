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

function daysAgoISO(n: number) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
}

function monthStartISO() {
  const d = new Date();
  d.setDate(1);
  return d.toISOString().slice(0, 10);
}

const DATE_PRESETS: { label: string; range: () => [string, string] }[] = [
  { label: "오늘", range: () => [todayISO(), todayISO()] },
  { label: "7일", range: () => [daysAgoISO(6), todayISO()] },
  { label: "30일", range: () => [daysAgoISO(29), todayISO()] },
  { label: "이번 달", range: () => [monthStartISO(), todayISO()] },
];

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
  const [startDate, setStartDate] = useState(daysAgoISO(29));
  const [endDate, setEndDate] = useState(todayISO());
  const [appliedKey, setAppliedKey] = useState("");
  const [appliedSiteUrl, setAppliedSiteUrl] = useState("");
  const [appliedStart, setAppliedStart] = useState("");
  const [appliedEnd, setAppliedEnd] = useState("");
  const [selectedPath, setSelectedPath] = useState("");
  const [heatmapPath, setHeatmapPath] = useState("");

  // 조회 실행 — applied* 갱신(컴포넌트들이 이걸 보고 fetch)
  const applyFilters = (key: string, url: string, start: string, end: string) => {
    setAppliedKey(key);
    setAppliedSiteUrl(url);
    setAppliedStart(start + "T00:00:00Z");
    setAppliedEnd(end + "T23:59:59Z");
    setSelectedPath("");
    setHeatmapPath("");
  };

  // 인증되면 서비스 목록 로드 → 첫 서비스 자동 선택 + 자동 조회(빈 화면 제거)
  useEffect(() => {
    if (authed !== true) return;
    listServices().then((list) => {
      setServices(list);
      if (list.length > 0) {
        const first = list[0];
        setServiceKey(first.service_key);
        setSiteUrl(first.domain ?? "");
        applyFilters(first.service_key, first.domain ?? "", startDate, endDate);
      }
    });
  }, [authed]);

  // 서비스 변경 → 도메인 자동 채움 + 자동 조회
  const handleSelectService = (key: string) => {
    const svc = services.find((s) => s.service_key === key);
    const url = svc?.domain ?? "";
    setServiceKey(key);
    setSiteUrl(url);
    applyFilters(key, url, startDate, endDate);
  };

  // 날짜 변경 → 자동 조회
  const handleDateChange = (which: "start" | "end", val: string) => {
    const start = which === "start" ? val : startDate;
    const end = which === "end" ? val : endDate;
    if (which === "start") setStartDate(val);
    else setEndDate(val);
    if (serviceKey) applyFilters(serviceKey, siteUrl, start, end);
  };

  // 날짜 프리셋 → 기간 설정 + 자동 조회
  const applyPreset = (start: string, end: string) => {
    setStartDate(start);
    setEndDate(end);
    if (serviceKey) applyFilters(serviceKey, siteUrl, start, end);
  };

  // 조회 버튼: 입력한 사이트 URL을 서비스 도메인으로 저장 + 적용(URL 수동 변경 반영용)
  const handleApply = () => {
    if (!serviceKey) return;
    if (siteUrl) {
      saveServiceDomain(serviceKey, siteUrl);
      setServices((prev) =>
        prev.map((s) => (s.service_key === serviceKey ? { ...s, domain: siteUrl } : s)),
      );
    }
    applyFilters(serviceKey, siteUrl, startDate, endDate);
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
        <h1>사용자 분석</h1>
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
          onChange={(e) => handleDateChange("start", e.target.value)}
        />
        <input
          type="date"
          value={endDate}
          onChange={(e) => handleDateChange("end", e.target.value)}
        />
        <div className="date-presets">
          {DATE_PRESETS.map((p) => {
            const [s, e] = p.range();
            const active = startDate === s && endDate === e;
            return (
              <button
                key={p.label}
                className={active ? "active" : ""}
                onClick={() => applyPreset(s, e)}
              >
                {p.label}
              </button>
            );
          })}
        </div>
        <button className="btn-apply" onClick={handleApply}>조회</button>
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
