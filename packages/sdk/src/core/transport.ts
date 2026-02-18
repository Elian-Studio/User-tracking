import { API_PATHS } from "@flowmvp/shared";
import type { AnalyticsEvent, SessionStartPayload, SessionEndPayload } from "@flowmvp/shared";

let serverUrl = "";

export function setServerUrl(url: string): void {
  serverUrl = url.replace(/\/$/, "");
}

export function getServerUrl(): string {
  return serverUrl;
}

export async function sendEvent(event: AnalyticsEvent): Promise<void> {
  const url = `${serverUrl}${API_PATHS.EVENTS}`;

  try {
    await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(event),
      keepalive: true,
    });
  } catch {
    // 네트워크 에러 무시 - 분석 이벤트 실패가 앱에 영향 주지 않도록
  }
}

export function sendBeaconEvent(event: AnalyticsEvent): void {
  const url = `${serverUrl}${API_PATHS.EVENTS}`;
  const blob = new Blob([JSON.stringify(event)], { type: "application/json" });

  if (typeof navigator.sendBeacon === "function") {
    navigator.sendBeacon(url, blob);
  }
}

export async function sendSessionStart(payload: SessionStartPayload): Promise<void> {
  const url = `${serverUrl}${API_PATHS.SESSIONS_START}`;

  try {
    await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  } catch {
    // 분석 실패 무시
  }
}

export function sendSessionEnd(payload: SessionEndPayload): void {
  const url = `${serverUrl}${API_PATHS.SESSIONS_END}`;
  const blob = new Blob([JSON.stringify(payload)], { type: "application/json" });

  if (typeof navigator.sendBeacon === "function") {
    navigator.sendBeacon(url, blob);
  }
}
