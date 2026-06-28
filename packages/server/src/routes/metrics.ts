import type { FastifyInstance } from "fastify";
import { getServiceByKey } from "../services/service.service.js";
import { getUniqueVisitors, getPageViews, getOverallBounceRate, getPageViewsByPath, getBounceRate, getExitScrollDistribution, getVisitorTrend, getAcquisitionChannels, getEventsForExport } from "../services/metrics.service.js";
import { rowsToCsv } from "../services/csv.js";

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

interface ExportQuery extends MetricsQuery {
  format?: string;
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

  app.get<{ Querystring: MetricsQuery }>("/api/metrics/acquisition", async (request, reply) => {
    const { serviceKey, startDate, endDate } = request.query;

    const service = await getServiceByKey(serviceKey);
    if (!service) {
      return reply.status(404).send({ error: "Service not found" });
    }

    return getAcquisitionChannels(service.id, startDate, endDate);
  });

  app.get<{ Querystring: ExportQuery }>("/api/metrics/export", async (request, reply) => {
    const { serviceKey, startDate, endDate, format } = request.query;

    const service = await getServiceByKey(serviceKey);
    if (!service) {
      return reply.status(404).send({ error: "Service not found" });
    }

    const rows = await getEventsForExport(service.id, startDate, endDate);
    if (format === "json") {
      return rows;
    }

    reply.header("Content-Type", "text/csv; charset=utf-8");
    reply.header("Content-Disposition", `attachment; filename="flowmvp-${serviceKey}-events.csv"`);
    return rowsToCsv(rows as Array<Record<string, unknown>>);
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
