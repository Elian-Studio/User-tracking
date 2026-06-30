import type { FastifyInstance } from "fastify";
import { listServices, setServiceDomain } from "../services/service.service.js";
import { requireAuth } from "../auth/middleware.js";

export async function servicesRoutes(app: FastifyInstance): Promise<void> {
  // 이 플러그인(=/api/services*)에만 인증 적용.
  app.addHook("preHandler", requireAuth);

  app.get("/api/services", async () => listServices());

  app.put<{ Params: { serviceKey: string }; Body: { domain?: string } }>(
    "/api/services/:serviceKey/domain",
    async (request, reply) => {
      const { serviceKey } = request.params;
      const domain = request.body.domain?.trim() || null;
      await setServiceDomain(serviceKey, domain);
      return reply.status(204).send();
    },
  );
}
