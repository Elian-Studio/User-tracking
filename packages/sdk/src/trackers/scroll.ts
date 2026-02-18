import { SCROLL_MILESTONES, SCROLL_THROTTLE_MS } from "@flowmvp/shared";
import { refreshSession } from "../core/session.js";
import { sendEvent } from "../core/transport.js";

let currentServiceKey = "";
let reachedMilestones = new Set<number>();
let throttleTimer: ReturnType<typeof setTimeout> | null = null;
let scrollHandler: (() => void) | null = null;

export function initScrollTracker(serviceKey: string): void {
  currentServiceKey = serviceKey;
}

function getScrollPercent(): number {
  const docHeight = document.documentElement.scrollHeight - window.innerHeight;
  if (docHeight <= 0) return 100;
  return Math.round((window.scrollY / docHeight) * 100);
}

function handleScroll(): void {
  if (throttleTimer) return;

  throttleTimer = setTimeout(() => {
    throttleTimer = null;
    const percent = getScrollPercent();

    for (const milestone of SCROLL_MILESTONES) {
      if (percent >= milestone && !reachedMilestones.has(milestone)) {
        reachedMilestones.add(milestone);
        const sessionId = refreshSession();

        sendEvent({
          serviceKey: currentServiceKey,
          sessionId,
          type: "scroll",
          path: window.location.pathname,
          scrollPercent: milestone,
          timestamp: new Date().toISOString(),
        });
      }
    }
  }, SCROLL_THROTTLE_MS);
}

export function startScrollTracking(): void {
  reachedMilestones.clear();
  scrollHandler = handleScroll;
  window.addEventListener("scroll", scrollHandler, { passive: true });
}

export function stopScrollTracking(): void {
  if (scrollHandler) {
    window.removeEventListener("scroll", scrollHandler);
    scrollHandler = null;
  }
  if (throttleTimer) {
    clearTimeout(throttleTimer);
    throttleTimer = null;
  }
}

export function resetScrollTracking(): void {
  stopScrollTracking();
  startScrollTracking();
}
