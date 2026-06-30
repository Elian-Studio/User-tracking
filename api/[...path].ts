// 단일 Vercel 프로젝트용 진입점 — 프론트(정적)와 같은 도메인에서 /api/* 처리.
// 기존 Fastify 앱(buildApp)을 그대로 위임한다.
import type { IncomingMessage, ServerResponse } from "node:http";

// ponytail: 디버그용 동적 import — 모듈 로드 단계 에러까지 try/catch로 잡아 응답에 노출.
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
  try {
    const app = await getApp();
    app.server.emit("request", req, res);
  } catch (e) {
    const err = e as Error;
    res.statusCode = 500;
    res.setHeader("content-type", "text/plain; charset=utf-8");
    res.end("DEBUG_ERROR:\n" + (err?.stack ?? String(err)));
  }
}
