import { getCurrentSessionId, endSession } from "../core/session.js";
import { sendBeaconEvent } from "../core/transport.js";

let currentServiceKey = "";
let exitHandler: (() => void) | null = null;

export function initExitTracker(serviceKey: string): void {
  currentServiceKey = serviceKey;
}

function getScrollPercent(): number {
  const docHeight = document.documentElement.scrollHeight - window.innerHeight;
  if (docHeight <= 0) return 100;
  return Math.round((window.scrollY / docHeight) * 100);
}

function handleBeforeUnload(): void {
  const sessionId = getCurrentSessionId();
  if (!sessionId) return;

  sendBeaconEvent({
    serviceKey: currentServiceKey,
    sessionId,
    type: "exit",
    path: window.location.pathname,
    scrollPercent: getScrollPercent(),
    timestamp: new Date().toISOString(),
  });

  endSession();
}

export function startExitTracking(): void {
  exitHandler = handleBeforeUnload;
  window.addEventListener("beforeunload", exitHandler);
}

export function stopExitTracking(): void {
  if (exitHandler) {
    window.removeEventListener("beforeunload", exitHandler);
    exitHandler = null;
  }
}
