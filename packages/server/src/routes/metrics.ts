import type { FastifyInstance } from "fastify";
import { getServiceByKey } from "../services/service.service.js";
import { getUniqueVisitors, getPageViews, getPageViewsByPath, getBounceRate } from "../services/metrics.service.js";

interface MetricsQuery {
  serviceKey: string;
  startDate: string;
  endDate: string;
}

interface BounceRateQuery extends MetricsQuery {
  path: string;
}

export async function metricsRoutes(app: FastifyInstance): Promise<void> {
  app.get<{ Querystring: MetricsQuery }>("/api/metrics/overview", async (request, reply) => {
    const { serviceKey, startDate, endDate } = request.query;

    const service = await getServiceByKey(serviceKey);
    if (!service) {
      return reply.status(404).send({ error: "Service not found" });
    }

    const [uv, pv] = await Promise.all([
      getUniqueVisitors(service.id, startDate, endDate),
      getPageViews(service.id, startDate, endDate),
    ]);

    return { uv, pv };
  });

  app.get<{ Querystring: MetricsQuery }>("/api/metrics/pages", async (request, reply) => {
    const { serviceKey, startDate, endDate } = request.query;

    const service = await getServiceByKey(serviceKey);
    if (!service) {
      return reply.status(404).send({ error: "Service not found" });
    }

    return getPageViewsByPath(service.id, startDate, endDate);
  });

  app.get<{ Querystring: BounceRateQuery }>("/api/metrics/bounce-rate", async (request, reply) => {
    const { serviceKey, path, startDate, endDate } = request.query;

    const service = await getServiceByKey(serviceKey);
    if (!service) {
      return reply.status(404).send({ error: "Service not found" });
    }

    const rate = await getBounceRate(service.id, path, startDate, endDate);
    return { path, bounceRate: rate };
  });
}
