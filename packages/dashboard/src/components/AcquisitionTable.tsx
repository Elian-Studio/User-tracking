import { useEffect, useState } from "react";
import { fetchAcquisition } from "../api";

interface Props {
  serviceKey: string;
  startDate: string;
  endDate: string;
}

interface Row {
  channel: string;
  sessions: number;
  percent: number;
}

const CHANNEL_LABELS: Record<string, string> = {
  direct: "직접 유입",
  naver: "네이버",
  google: "구글",
  daum: "다음",
  social: "소셜",
  referral: "기타 사이트",
};

export function AcquisitionTable({ serviceKey, startDate, endDate }: Props) {
  const [rows, setRows] = useState<Row[]>([]);

  useEffect(() => {
    if (!serviceKey) return;
    fetchAcquisition(serviceKey, startDate, endDate).then(setRows);
  }, [serviceKey, startDate, endDate]);

  return (
    <div className="section">
      <h2>유입 경로</h2>
      {rows.length === 0 ? (
        <div className="empty">데이터가 없습니다</div>
      ) : (
        <table className="pages-table">
          <thead>
            <tr>
              <th>채널</th>
              <th>세션</th>
              <th>비중</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.channel}>
                <td>{CHANNEL_LABELS[r.channel] ?? r.channel}</td>
                <td>{Number(r.sessions).toLocaleString()}</td>
                <td>{r.percent}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
