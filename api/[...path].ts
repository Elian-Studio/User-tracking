// 단일 Vercel 프로젝트용 진입점 — 프론트(정적)와 같은 도메인에서 /api/* 처리.
// 기존 Fastify 앱(buildApp)을 그대로 위임한다.
import type { IncomingMessage, ServerResponse } from "node:http";
import { buildApp } from "../packages/server/src/app.js";

type App = Awaited<ReturnType<typeof buildApp>>;

// 콜드 스타트당 1회만 빌드 후 warm 인스턴스에서 재사용
let appPromise: Promise<App> | null = null;

function getApp(): Promise<App> {
  if (!appPromise) {
    appPromise = buildApp().then(async (app) => {
      await app.ready();
      return app;
    });
  }
  return appPromise;
}

export default async function handler(req: IncomingMessage, res: ServerResponse): Promise<void> {
  const app = await getApp();
  app.server.emit("request", req, res);
}
