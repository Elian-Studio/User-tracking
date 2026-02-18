import { useEffect, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { fetchTrend } from "../api";

interface Props {
  serviceKey: string;
  startDate: string;
  endDate: string;
}

type Interval = "day" | "week" | "month";

const INTERVAL_LABELS: Record<Interval, string> = {
  day: "일별",
  week: "주별",
  month: "월별",
};

export function TrendChart({ serviceKey, startDate, endDate }: Props) {
  const [interval, setInterval] = useState<Interval>("day");
  const [data, setData] = useState<{ date: string; uv: number; pv: number }[]>(
    [],
  );

  useEffect(() => {
    if (!serviceKey) return;
    fetchTrend(serviceKey, startDate, endDate, interval).then((res) => {
      setData(res?.data ?? []);
    });
  }, [serviceKey, startDate, endDate, interval]);

  return (
    <div className="section">
      <h2>방문자 추이</h2>
      <div className="interval-toggle">
        {(["day", "week", "month"] as Interval[]).map((v) => (
          <button
            key={v}
            className={interval === v ? "active" : ""}
            onClick={() => setInterval(v)}
          >
            {INTERVAL_LABELS[v]}
          </button>
        ))}
      </div>
      {data.length === 0 ? (
        <div className="empty">데이터가 없습니다</div>
      ) : (
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" fontSize={12} />
            <YAxis fontSize={12} />
            <Tooltip />
            <Legend />
            <Line
              type="monotone"
              dataKey="uv"
              name="UV"
              stroke="#3b82f6"
              strokeWidth={2}
              dot={false}
            />
            <Line
              type="monotone"
              dataKey="pv"
              name="PV"
              stroke="#10b981"
              strokeWidth={2}
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
