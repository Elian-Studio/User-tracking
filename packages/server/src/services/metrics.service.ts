import { sql } from "../db/client.js";
import { classifyChannel } from "./channel.js";
import type { Interval } from "./trendParams.js";

// 실시간 — 최근 5분 내 이벤트가 있는 고유 세션 수("지금 접속 중").
export async function getActiveSessions(serviceId: number) {
  const result = await sql`
    SELECT COUNT(DISTINCT session_id) AS active
    FROM events
    WHERE service_id = ${serviceId}
      AND created_at >= NOW() - INTERVAL '5 minutes'
  `;
  return Number(result[0].active);
}

export async function getUniqueVisitors(serviceId: number, startDate: string, endDate: string) {
  const result = await sql`
    SELECT COUNT(DISTINCT session_id) as uv
    FROM events
    WHERE service_id = ${serviceId}
      AND created_at >= ${startDate}
      AND created_at < ${endDate}
  `;
  return Number(result[0].uv);
}

export async function getPageViews(serviceId: number, startDate: string, endDate: string) {
  const result = await sql`
    SELECT COUNT(*) as pv
    FROM events
    WHERE service_id = ${serviceId}
      AND type = 'page_view'
      AND created_at >= ${startDate}
      AND created_at < ${endDate}
  `;
  return Number(result[0].pv);
}

export async function getOverallBounceRate(serviceId: number, startDate: string, endDate: string) {
  const result = await sql`
    WITH session_pages AS (
      SELECT session_id, COUNT(*) as page_count
      FROM events
      WHERE service_id = ${serviceId}
        AND type = 'page_view'
        AND created_at >= ${startDate}
        AND created_at < ${endDate}
      GROUP BY session_id
    )
    SELECT
      COUNT(*) FILTER (WHERE page_count = 1) as bounce,
      COUNT(*) as total
    FROM session_pages
  `;
  const { bounce, total } = result[0];
  if (Number(total) === 0) return 0;
  return Number(bounce) / Number(total);
}

export async function getPageViewsByPath(serviceId: number, startDate: string, endDate: string) {
  return sql`
    SELECT path, COUNT(*) as views, COUNT(DISTINCT session_id) as unique_views
    FROM events
    WHERE service_id = ${serviceId}
      AND type = 'page_view'
      AND created_at >= ${startDate}
      AND created_at < ${endDate}
    GROUP BY path
    ORDER BY views DESC
  `;
}

export async function getAcquisitionChannels(serviceId: number, startDate: string, endDate: string) {
  // 세션 진입 이벤트(가장 이른 created_at) 기준으로 유입 채널을 분류한다 — UV와 동일한 세션 grain.
  // ponytail: 진입 행을 JS에서 집계. 세션 수가 매우 커지면 SQL CASE 집계로 옮길 것.
  const rows = await sql`
    SELECT DISTINCT ON (session_id) session_id, referrer, utm_source
    FROM events
    WHERE service_id = ${serviceId}
      AND created_at >= ${startDate}
      AND created_at < ${endDate}
    ORDER BY session_id, created_at ASC
  `;

  const counts = new Map<string, number>();
  for (const r of rows) {
    const channel = classifyChannel(r.referrer, r.utm_source);
    counts.set(channel, (counts.get(channel) ?? 0) + 1);
  }

  const total = rows.length;
  return [...counts.entries()]
    .map(([channel, sessions]) => ({
      channel,
      sessions,
      percent: total === 0 ? 0 : Math.round((sessions / total) * 1000) / 10,
    }))
    .sort((a, b) => b.sessions - a.sessions);
}

export async function getEventsForExport(serviceId: number, startDate: string, endDate: string) {
  return sql`
    SELECT session_id, type, path, referrer, scroll_percent,
           utm_source, utm_medium, utm_campaign, utm_term, utm_content, created_at
    FROM events
    WHERE service_id = ${serviceId}
      AND created_at >= ${startDate}
      AND created_at < ${endDate}
    ORDER BY created_at ASC
  `;
}

export async function getBounceRate(serviceId: number, path: string, startDate: string, endDate: string) {
  const result = await sql`
    WITH page_sessions AS (
      SELECT DISTINCT session_id
      FROM events
      WHERE service_id = ${serviceId}
        AND type = 'page_view'
        AND path = ${path}
        AND created_at >= ${startDate}
        AND created_at < ${endDate}
    ),
    exit_sessions AS (
      SELECT e.session_id
      FROM events e
      INNER JOIN page_sessions ps ON e.session_id = ps.session_id
      WHERE e.type = 'page_view'
        AND e.service_id = ${serviceId}
      GROUP BY e.session_id
      HAVING MAX(e.created_at) = (
        SELECT MAX(e2.created_at)
        FROM events e2
        WHERE e2.session_id = e.session_id AND e2.type = 'page_view' AND e2.path = ${path}
      )
    )
    SELECT
      (SELECT COUNT(*) FROM exit_sessions) as exit_count,
      (SELECT COUNT(*) FROM page_sessions) as total_count
  `;

  const { exit_count, total_count } = result[0];
  if (Number(total_count) === 0) return 0;
  return Number(exit_count) / Number(total_count);
}

export async function getVisitorTrend(
  serviceId: number,
  startDate: string,
  endDate: string,
  interval: Interval,
  timezone: string,
) {
  if (interval === "hour") {
    // to_char로 고정 포맷 텍스트를 직접 반환 — date_trunc(... AT TIME ZONE)의 결과(timestamp without
    // time zone)를 postgres.js가 Date 객체로 파싱하면 오프셋 없는 문자열이라 Node 프로세스의 로컬
    // 타임존으로 재해석되어(ECMA Date 스펙) 사용자가 고른 타임존과 무관하게 값이 달라진다.
    const rows = await sql`
      SELECT
        to_char(
          date_trunc('hour', created_at AT TIME ZONE ${timezone}),
          'YYYY-MM-DD"T"HH24:MI:SS'
        ) as date,
        COUNT(DISTINCT session_id) as uv,
        COUNT(*) FILTER (WHERE type = 'page_view') as pv
      FROM events
      WHERE service_id = ${serviceId}
        AND created_at >= ${startDate}
        AND created_at < ${endDate}
      GROUP BY 1
      ORDER BY 1
    `;
    return rows.map((r) => ({ date: String(r.date), uv: Number(r.uv), pv: Number(r.pv) }));
  }

  const rows = await sql`
    SELECT
      date_trunc(${interval}, created_at)::date as date,
      COUNT(DISTINCT session_id) as uv,
      COUNT(*) FILTER (WHERE type = 'page_view') as pv
    FROM events
    WHERE service_id = ${serviceId}
      AND created_at >= ${startDate}
      AND created_at < ${endDate}
    GROUP BY 1
    ORDER BY 1
  `;
  return rows.map((r) => ({
    date: r.date instanceof Date
      ? r.date.toISOString().slice(0, 10)
      : String(r.date).slice(0, 10),
    uv: Number(r.uv),
    pv: Number(r.pv),
  }));
}

export async function getExitScrollDistribution(
  serviceId: number,
  path: string,
  startDate: string,
  endDate: string,
) {
  const rows = await sql`
    WITH exit_scrolls AS (
      SELECT scroll_percent
      FROM events
      WHERE service_id = ${serviceId}
        AND type = 'exit'
        AND path = ${path}
        AND scroll_percent IS NOT NULL
        AND created_at >= ${startDate}
        AND created_at < ${endDate}
    ),
    total AS (
      SELECT COUNT(*) as cnt FROM exit_scrolls
    )
    SELECT
      CASE
        WHEN scroll_percent BETWEEN 0  AND 10  THEN '0-10'
        WHEN scroll_percent BETWEEN 11 AND 20  THEN '11-20'
        WHEN scroll_percent BETWEEN 21 AND 30  THEN '21-30'
        WHEN scroll_percent BETWEEN 31 AND 40  THEN '31-40'
        WHEN scroll_percent BETWEEN 41 AND 50  THEN '41-50'
        WHEN scroll_percent BETWEEN 51 AND 60  THEN '51-60'
        WHEN scroll_percent BETWEEN 61 AND 70  THEN '61-70'
        WHEN scroll_percent BETWEEN 71 AND 80  THEN '71-80'
        WHEN scroll_percent BETWEEN 81 AND 90  THEN '81-90'
        WHEN scroll_percent BETWEEN 91 AND 100 THEN '91-100'
      END as range,
      COUNT(*) as count,
      ROUND(COUNT(*)::numeric / GREATEST(total.cnt, 1) * 100, 1) as percent
    FROM exit_scrolls, total
    GROUP BY range, total.cnt
    ORDER BY range
  `;

  const stats = await sql`
    SELECT
      ROUND(AVG(scroll_percent)) as average,
      PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY scroll_percent) as median,
      COUNT(*) as total
    FROM events
    WHERE service_id = ${serviceId}
      AND type = 'exit'
      AND path = ${path}
      AND scroll_percent IS NOT NULL
      AND created_at >= ${startDate}
      AND created_at < ${endDate}
  `;

  return {
    distribution: rows.map((r) => ({
      range: r.range,
      count: Number(r.count),
      percent: Number(r.percent),
    })),
    average: Number(stats[0].average ?? 0),
    median: Number(stats[0].median ?? 0),
    total: Number(stats[0].total),
  };
}
