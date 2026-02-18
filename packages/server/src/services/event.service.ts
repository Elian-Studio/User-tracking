import { sql } from "../db/client.js";
import type { AnalyticsEvent } from "@flowmvp/shared";

export async function insertEvent(event: AnalyticsEvent, serviceId: number): Promise<void> {
  await sql`
    INSERT INTO events (service_id, session_id, type, path, referrer, scroll_percent, utm_source, utm_medium, utm_campaign, utm_term, utm_content, created_at)
    VALUES (
      ${serviceId},
      ${event.sessionId},
      ${event.type},
      ${event.path},
      ${event.referrer ?? null},
      ${event.scrollPercent ?? null},
      ${event.utm?.source ?? null},
      ${event.utm?.medium ?? null},
      ${event.utm?.campaign ?? null},
      ${event.utm?.term ?? null},
      ${event.utm?.content ?? null},
      ${event.timestamp}
    )
  `;
}
