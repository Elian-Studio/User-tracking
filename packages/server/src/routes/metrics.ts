import type { FastifyInstance } from "fastify";
import { getServiceByKey } from "../services/service.service.js";
import { getUniqueVisitors, getPageViews, getOverallBounceRate, getPageViewsByPath, getBounceRate, getExitScrollDistribution, getVisitorTrend } from "../services/metrics.service.js";

interface MetricsQuery {
  serviceKey: string;
  startDate: string;
  endDate: string;
}

interface TrendQuery extends MetricsQuery {
  interval?: string;
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

    const [uv, pv, bounceRate] = await Promise.all([
      getUniqueVisitors(service.id, startDate, endDate),
      getPageViews(service.id, startDate, endDate),
      getOverallBounceRate(service.id, startDate, endDate),
    ]);

    return { uv, pv, bounceRate: Math.round(bounceRate * 100) };
  });

  app.get<{ Querystring: TrendQuery }>("/api/metrics/trend", async (request, reply) => {
    const { serviceKey, startDate, endDate, interval } = request.query;

    const validIntervals = ["day", "week", "month"] as const;
    const resolvedInterval = validIntervals.includes(interval as any)
      ? (interval as "day" | "week" | "month")
      : "day";

    const service = await getServiceByKey(serviceKey);
    if (!service) {
      return reply.status(404).send({ error: "Service not found" });
    }

    const data = await getVisitorTrend(service.id, startDate, endDate, resolvedInterval);
    return { interval: resolvedInterval, data };
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

  app.get<{ Querystring: BounceRateQuery }>("/api/metrics/exit-scroll", async (request, reply) => {
    const { serviceKey, path, startDate, endDate } = request.query;

    const service = await getServiceByKey(serviceKey);
    if (!service) {
      return reply.status(404).send({ error: "Service not found" });
    }

    const result = await getExitScrollDistribution(service.id, path, startDate, endDate);
    return { path, ...result };
  });
}
