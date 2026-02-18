import { sql } from "../db/client.js";
import type { SessionStartPayload, SessionEndPayload } from "@flowmvp/shared";

export async function startSession(payload: SessionStartPayload, serviceId: number, ipAddress: string): Promise<void> {
  await sql`
    INSERT INTO sessions (id, service_id, user_id, ip_address, user_agent, referrer)
    VALUES (
      ${payload.sessionId},
      ${serviceId},
      ${payload.userId ?? null},
      ${ipAddress},
      ${payload.userAgent},
      ${payload.referrer ?? null}
    )
    ON CONFLICT (id) DO NOTHING
  `;
}

export async function endSession(payload: SessionEndPayload): Promise<void> {
  await sql`
    UPDATE sessions
    SET ended_at = NOW()
    WHERE id = ${payload.sessionId} AND ended_at IS NULL
  `;
}
