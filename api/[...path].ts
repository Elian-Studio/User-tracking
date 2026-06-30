// 단일 Vercel 프로젝트용 진입점 — 프론트(정적)와 같은 도메인에서 /api/* 처리.
// 기존 Fastify 앱(buildApp)을 그대로 위임한다.
import type { IncomingMessage, ServerResponse } from "node:http";

// 콜드 스타트당 1회만 빌드 후 warm 인스턴스에서 재사용.
// 동적 import로 앱을 지연 로드한다(서버리스 번들 호환).
let appPromise: Promise<{ server: { emit: (e: string, ...a: unknown[]) => void } }> | null = null;

function getApp() {
  if (!appPromise) {
    appPromise = (async () => {
      const { buildApp } = await import("../packages/server/src/app.js");
      const app = await buildApp();
      await app.ready();
      return app as never;
    })();
  }
  return appPromise;
}

export default async function handler(req: IncomingMessage, res: ServerResponse): Promise<void> {
  const app = await getApp();
  app.server.emit("request", req, res);
}
