import { useEffect, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { fetchExitScroll } from "../api";
import { axisTick, axisLine, gridStroke, tooltipStyle } from "./chartTheme";

interface Props {
  serviceKey: string;
  path: string;
  startDate: string;
  endDate: string;
}

interface ScrollData {
  distribution: { range: string; count: number; percent: number }[];
  average: number;
  median: number;
  total: number;
}

export function ExitScrollChart({
  serviceKey,
  path,
  startDate,
  endDate,
}: Props) {
  const [data, setData] = useState<ScrollData | null>(null);

  useEffect(() => {
    if (!serviceKey || !path) return;
    fetchExitScroll(serviceKey, path, startDate, endDate).then(setData);
  }, [serviceKey, path, startDate, endDate]);

  if (!path) return null;

  return (
    <div className="section">
      <h2>이탈 스크롤 분석 — {path}</h2>
      {!data || data.total === 0 ? (
        <div className="empty">데이터가 없습니다</div>
      ) : (
        <>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={data.distribution}>
              <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
              <XAxis dataKey="range" tick={{ ...axisTick, fontSize: 11 }} axisLine={axisLine} tickLine={axisLine} />
              <YAxis tick={axisTick} axisLine={axisLine} tickLine={axisLine} />
              <Tooltip {...tooltipStyle} />
              <Bar dataKey="count" name="이탈 수" fill="#fbbf24" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
          <div className="scroll-stats">
            <span>평균: {data.average}%</span>
            <span>중앙값: {data.median}%</span>
            <span>총 {data.total}건</span>
          </div>
        </>
      )}
    </div>
  );
}
