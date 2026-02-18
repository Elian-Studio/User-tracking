import { useEffect, useState } from "react";
import { fetchPages } from "../api";

interface Props {
  serviceKey: string;
  startDate: string;
  endDate: string;
  onSelectPath: (path: string) => void;
}

interface Page {
  path: string;
  views: number;
  unique_views: number;
}

export function PagesTable({
  serviceKey,
  startDate,
  endDate,
  onSelectPath,
}: Props) {
  const [pages, setPages] = useState<Page[]>([]);

  useEffect(() => {
    if (!serviceKey) return;
    fetchPages(serviceKey, startDate, endDate).then(setPages);
  }, [serviceKey, startDate, endDate]);

  return (
    <div className="section">
      <h2>페이지별 통계</h2>
      {pages.length === 0 ? (
        <div className="empty">데이터가 없습니다</div>
      ) : (
        <table className="pages-table">
          <thead>
            <tr>
              <th>Path</th>
              <th>Views</th>
              <th>UV</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {pages.map((p) => (
              <tr key={p.path}>
                <td>{p.path}</td>
                <td>{Number(p.views).toLocaleString()}</td>
                <td>{Number(p.unique_views).toLocaleString()}</td>
                <td>
                  <button
                    className="btn-sm"
                    onClick={() => onSelectPath(p.path)}
                  >
                    분석
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
