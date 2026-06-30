import type { FastifyInstance } from "fastify";
import type { AnalyticsEvent } from "@flowmvp/shared";
import { insertEvent } from "../services/event.service.js";
import { getOrCreateService } from "../services/service.service.js";
import { ensureSession } from "../services/session.service.js";

export async function eventsRoutes(app: FastifyInstance): Promise<void> {
  app.post<{ Body: AnalyticsEvent }>("/api/events", async (request, reply) => {
    const event = request.body;

    const service = await getOrCreateService(event.serviceKey);
    if (!service) {
      return reply.status(400).send({ error: "Invalid serviceKey" });
    }

    // sessions/start보다 이벤트가 먼저 도착해도 FK로 죽지 않게 세션을 보장한다.
    await ensureSession(event.sessionId, service.id);
    await insertEvent(event, service.id);
    return reply.status(204).send();
  });
}
