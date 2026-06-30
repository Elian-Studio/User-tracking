import { sql } from "../db/client.js";
import type { SessionStartPayload, SessionEndPayload } from "@flowmvp/shared";

export async function startSession(payload: SessionStartPayload, serviceId: number, ipAddress: string): Promise<void> {
  // 서버리스에서 이벤트가 sessions/start보다 먼저 도착해 빈 세션이 만들어질 수 있다.
  // 그 경우 DO UPDATE로 메타데이터를 채워 넣는다(순서 무관).
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
    ON CONFLICT (id) DO UPDATE SET
      user_id = COALESCE(sessions.user_id, EXCLUDED.user_id),
      ip_address = COALESCE(sessions.ip_address, EXCLUDED.ip_address),
      user_agent = COALESCE(sessions.user_agent, EXCLUDED.user_agent),
      referrer = COALESCE(sessions.referrer, EXCLUDED.referrer)
  `;
}

// 이벤트 수집 시 세션 row를 보장한다(FK 충족). sessions/start가 아직 안 왔거나
// 레이스로 늦게 도착해도 이벤트가 FK 위반으로 유실되지 않게 최소 row를 만든다.
export async function ensureSession(sessionId: string, serviceId: number): Promise<void> {
  await sql`
    INSERT INTO sessions (id, service_id)
    VALUES (${sessionId}, ${serviceId})
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
