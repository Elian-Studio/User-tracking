import type { FastifyReply, FastifyRequest } from "fastify";
import { validateToken, type AuthUser } from "../services/auth.service.js";

declare module "fastify" {
  interface FastifyRequest {
    user?: AuthUser;
  }
}

function extractBearer(header: string | undefined): string | null {
  if (!header || !header.startsWith("Bearer ")) return null;
  const token = header.slice("Bearer ".length).trim();
  return token || null;
}

// /api/metrics/* 보호용 preHandler — Authorization: Bearer <token> 검증
export async function requireAuth(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  const token = extractBearer(request.headers.authorization);
  if (!token) {
    await reply.status(401).send({ error: "Unauthorized" });
    return;
  }

  const user = await validateToken(token);
  if (!user) {
    await reply.status(401).send({ error: "Unauthorized" });
    return;
  }

  request.user = user;
}
