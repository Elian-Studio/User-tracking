import Fastify from "fastify";
import cors from "@fastify/cors";
import { eventsRoutes } from "./routes/events.js";
import { sessionsRoutes } from "./routes/sessions.js";
import { metricsRoutes } from "./routes/metrics.js";
import { authRoutes } from "./routes/auth.js";

export async function buildApp() {
  const app = Fastify({
    logger: true,
    trustProxy: true,
  });

  await app.register(cors, {
    origin: process.env.CORS_ORIGIN ?? "http://localhost:3000",
    methods: ["GET", "POST"],
  });

  await app.register(authRoutes);
  await app.register(eventsRoutes);
  await app.register(sessionsRoutes);
  await app.register(metricsRoutes);

  app.get("/health", async () => ({ status: "ok" }));

  return app;
}
