import { useEffect, useState } from "react";
import { fetchExitScroll } from "../api";

// TODO: Phase 2 — 스크린샷 기반 히트맵 오버레이로 전환
// iframe 방식은 X-Frame-Options/CSP로 차단되는 사이트가 있음.
// html2canvas 또는 서버사이드 Puppeteer 캡처로 페이지 스크린샷을 저장하고,
// 스크린샷 이미지 위에 히트맵을 렌더링하는 방식으로 개선 예정.

interface Props {
  serviceKey: string;
  path: string;
  siteUrl: string;
  startDate: string;
  endDate: string;
  onClose: () => void;
}

interface Band {
  startPercent: number;
  endPercent: number;
  count: number;
  intensity: number;
}

function rangeToBand(range: string, count: number, maxCount: number): Band {
  const [start, end] = range.split("-").map(Number);
  return {
    startPercent: start,
    endPercent: end,
    count,
    intensity: maxCount > 0 ? count / maxCount : 0,
  };
}

function intensityColor(intensity: number): string {
  if (intensity === 0) return "rgba(16, 185, 129, 0.05)";
  const r = Math.round(239 * intensity + 16 * (1 - intensity));
  const g = Math.round(68 * intensity + 185 * (1 - intensity));
  const b = Math.round(68 * intensity + 129 * (1 - intensity));
  return `rgba(${r}, ${g}, ${b}, ${0.08 + intensity * 0.35})`;
}

export function ScrollHeatmap({
  serviceKey,
  path,
  siteUrl,
  startDate,
  endDate,
  onClose,
}: Props) {
  const [bands, setBands] = useState<Band[]>([]);
  const [stats, setStats] = useState({ average: 0, median: 0, total: 0 });
  const [iframeError, setIframeError] = useState(false);

  const fullUrl = siteUrl.replace(/\/$/, "") + path;

  useEffect(() => {
    if (!serviceKey || !path) return;
    fetchExitScroll(serviceKey, path, startDate, endDate).then((data) => {
      if (!data || data.total === 0) {
        setBands([]);
        setStats({ average: 0, median: 0, total: 0 });
        return;
      }
      const maxCount = Math.max(...data.distribution.map((d) => d.count));
      const allBands: Band[] = [];
      for (let i = 0; i < 100; i += 10) {
        const rangeKey = i === 0 ? "0-10" : `${i + 1}-${i + 10}`;
        const found = data.distribution.find((d) => d.range === rangeKey);
        allBands.push(rangeToBand(rangeKey, found?.count ?? 0, maxCount));
      }
      setBands(allBands);
      setStats({
        average: data.average,
        median: data.median,
        total: data.total,
      });
    });
  }, [serviceKey, path, startDate, endDate]);

  return (
    <div className="heatmap-overlay" onClick={onClose}>
      <div className="heatmap-modal" onClick={(e) => e.stopPropagation()}>
        <div className="heatmap-header">
          <h2>스크롤 히트맵 — {path}</h2>
          <button className="heatmap-close" onClick={onClose}>
            닫기
          </button>
        </div>

        <div className="heatmap-body">
          <div className="heatmap-iframe-wrap">
            {iframeError ? (
              <div className="heatmap-iframe-blocked">
                <p>이 사이트는 iframe 로드가 차단되었습니다.</p>
                <p className="heatmap-blocked-sub">
                  X-Frame-Options 또는 CSP 정책으로 인해 미리보기를 표시할 수
                  없습니다. 아래 히트맵 데이터를 참고하세요.
                </p>
              </div>
            ) : (
              <iframe
                src={fullUrl}
                title={`Preview: ${path}`}
                className="heatmap-iframe"
                sandbox="allow-same-origin allow-scripts"
                onError={() => setIframeError(true)}
              />
            )}

            <div className="heatmap-bands">
              {bands.map((band) => (
                <div
                  key={band.startPercent}
                  className="heatmap-band"
                  style={{
                    top: `${band.startPercent}%`,
                    height: "10%",
                    background: intensityColor(band.intensity),
                  }}
                  title={`${band.startPercent}-${band.endPercent}%: ${band.count}건 이탈`}
                >
                  {band.count > 0 && (
                    <span className="heatmap-band-label">{band.count}</span>
                  )}
                </div>
              ))}
            </div>

            <div className="heatmap-ruler">
              {[0, 25, 50, 75, 100].map((pct) => (
                <div
                  key={pct}
                  className="heatmap-ruler-mark"
                  style={{ top: `${pct}%` }}
                >
                  {pct}%
                </div>
              ))}
            </div>
          </div>

          <div className="heatmap-legend">
            <div className="heatmap-legend-title">이탈 밀도</div>
            <div className="heatmap-gradient">
              <span>낮음</span>
              <div className="heatmap-gradient-bar" />
              <span>높음</span>
            </div>
            <div className="heatmap-stats-box">
              <div>
                평균 이탈: <strong>{stats.average}%</strong>
              </div>
              <div>
                중앙값: <strong>{stats.median}%</strong>
              </div>
              <div>
                총 이탈: <strong>{stats.total}건</strong>
              </div>
            </div>
            <div className="heatmap-url-info">
              <span className="heatmap-url-label">URL</span>
              <a href={fullUrl} target="_blank" rel="noopener noreferrer">
                {fullUrl}
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
