import type { UtmParams } from "@flowmvp/shared";
import { refreshSession } from "../core/session.js";
import { sendEvent } from "../core/transport.js";

let currentServiceKey = "";

export function initPageViewTracker(serviceKey: string): void {
  currentServiceKey = serviceKey;
}

function parseUtmParams(): UtmParams | undefined {
  const params = new URLSearchParams(window.location.search);
  const utm: UtmParams = {};
  let hasUtm = false;

  for (const [key, field] of [
    ["utm_source", "source"],
    ["utm_medium", "medium"],
    ["utm_campaign", "campaign"],
    ["utm_term", "term"],
    ["utm_content", "content"],
  ] as const) {
    const value = params.get(key);
    if (value) {
      (utm as Record<string, string>)[field] = value;
      hasUtm = true;
    }
  }

  return hasUtm ? utm : undefined;
}

export function trackPageView(path?: string): void {
  const sessionId = refreshSession();
  const resolvedPath = path ?? window.location.pathname;

  sendEvent({
    serviceKey: currentServiceKey,
    sessionId,
    type: "page_view",
    path: resolvedPath,
    referrer: document.referrer || undefined,
    utm: parseUtmParams(),
    timestamp: new Date().toISOString(),
  });
}

export function setupRouterListener(onRouteChange: (callback: () => void) => () => void): () => void {
  return onRouteChange(() => {
    trackPageView();
  });
}
