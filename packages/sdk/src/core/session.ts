import { SESSION_TIMEOUT_MS } from "@flowmvp/shared";
import { getSessionId, setSessionId, getLastActive, setLastActive, clearSession } from "../utils/storage.js";
import { sendSessionStart, sendSessionEnd } from "./transport.js";

let currentServiceKey = "";
let currentUserId: string | undefined;

export function initSession(serviceKey: string, userId?: string): string {
  currentServiceKey = serviceKey;
  currentUserId = userId;

  const existingId = getSessionId();
  const lastActive = getLastActive();
  const now = Date.now();

  if (existingId && lastActive && now - lastActive < SESSION_TIMEOUT_MS) {
    setLastActive(now);
    return existingId;
  }

  if (existingId) {
    sendSessionEnd({ serviceKey, sessionId: existingId });
    clearSession();
  }

  const sessionId = crypto.randomUUID();
  setSessionId(sessionId);
  setLastActive(now);

  sendSessionStart({
    serviceKey,
    sessionId,
    userId,
    referrer: document.referrer || undefined,
    userAgent: navigator.userAgent,
  });

  return sessionId;
}

export function getCurrentSessionId(): string | null {
  const sessionId = getSessionId();
  const lastActive = getLastActive();
  const now = Date.now();

  if (!sessionId || !lastActive || now - lastActive >= SESSION_TIMEOUT_MS) {
    return null;
  }

  setLastActive(now);
  return sessionId;
}

export function refreshSession(): string {
  const existing = getCurrentSessionId();
  if (existing) return existing;
  return initSession(currentServiceKey, currentUserId);
}

export function endSession(): void {
  const sessionId = getSessionId();
  if (sessionId && currentServiceKey) {
    sendSessionEnd({ serviceKey: currentServiceKey, sessionId });
  }
  clearSession();
}
