import type { FastifyInstance } from "fastify";
import { login, deleteToken } from "../services/auth.service.js";
import { requireAuth } from "../auth/middleware.js";

interface LoginBody {
  username: string;
  password: string;
}

export async function authRoutes(app: FastifyInstance): Promise<void> {
  app.post<{ Body: LoginBody }>("/api/auth/login", async (request, reply) => {
    const { username, password } = request.body ?? ({} as LoginBody);
    if (!username || !password) {
      return reply.status(400).send({ error: "username and password required" });
    }

    const token = await login(username, password);
    if (!token) {
      return reply.status(401).send({ error: "Invalid credentials" });
    }

    return { token };
  });

  app.post("/api/auth/logout", { preHandler: requireAuth }, async (request, reply) => {
    const header = request.headers.authorization ?? "";
    const token = header.slice("Bearer ".length).trim();
    await deleteToken(token);
    return reply.status(204).send();
  });

  app.get("/api/auth/me", { preHandler: requireAuth }, async (request) => {
    return { username: request.user?.username };
  });
}
