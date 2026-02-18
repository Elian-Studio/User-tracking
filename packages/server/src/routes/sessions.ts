import type { FastifyInstance } from "fastify";
import type { SessionStartPayload, SessionEndPayload } from "@flowmvp/shared";
import { startSession, endSession } from "../services/session.service.js";
import { getOrCreateService } from "../services/service.service.js";

export async function sessionsRoutes(app: FastifyInstance): Promise<void> {
  app.post<{ Body: SessionStartPayload }>("/api/sessions/start", async (request, reply) => {
    const payload = request.body;

    const service = await getOrCreateService(payload.serviceKey);
    if (!service) {
      return reply.status(400).send({ error: "Invalid serviceKey" });
    }

    const ipAddress = request.ip;
    await startSession(payload, service.id, ipAddress);
    return reply.status(204).send();
  });

  app.post<{ Body: SessionEndPayload }>("/api/sessions/end", async (request, reply) => {
    const payload = request.body;
    await endSession(payload);
    return reply.status(204).send();
  });
}
