import { sql } from "../db/client.js";

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
