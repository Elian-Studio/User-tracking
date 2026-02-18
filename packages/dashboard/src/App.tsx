import { useState } from "react";
import { OverviewCards } from "./components/OverviewCards";
import { TrendChart } from "./components/TrendChart";
import { PagesTable } from "./components/PagesTable";
import { ExitScrollChart } from "./components/ExitScrollChart";

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
  const [serviceKey, setServiceKey] = useState("");
  const [startDate, setStartDate] = useState(monthAgoISO());
  const [endDate, setEndDate] = useState(todayISO());
  const [appliedKey, setAppliedKey] = useState("");
  const [appliedStart, setAppliedStart] = useState("");
  const [appliedEnd, setAppliedEnd] = useState("");
  const [selectedPath, setSelectedPath] = useState("");

  const handleApply = () => {
    if (!serviceKey) return;
    setAppliedKey(serviceKey);
    setAppliedStart(startDate + "T00:00:00Z");
    setAppliedEnd(endDate + "T23:59:59Z");
    setSelectedPath("");
  };

  return (
    <div className="dashboard">
      <div className="header-row">
        <h1>FlowMVP Analytics</h1>
        {appliedKey && (
          <span className={`env-badge env-${detectEnv(appliedKey)}`}>
            {ENV_LABELS[detectEnv(appliedKey)]}
          </span>
        )}
      </div>
      <div className="filters">
        <input
          type="text"
          placeholder="Service Key"
          value={serviceKey}
          onChange={(e) => setServiceKey(e.target.value)}
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
          <PagesTable
            serviceKey={appliedKey}
            startDate={appliedStart}
            endDate={appliedEnd}
            onSelectPath={setSelectedPath}
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
    </div>
  );
}
