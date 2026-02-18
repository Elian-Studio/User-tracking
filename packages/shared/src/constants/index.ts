export const SESSION_TIMEOUT_MS = 30 * 60 * 1000; // 30분

export const SCROLL_MILESTONES = [25, 50, 75, 100] as const;

export const SCROLL_THROTTLE_MS = 3000; // 3초

export const STORAGE_KEYS = {
  SESSION_ID: "flowmvp_session_id",
  SESSION_LAST_ACTIVE: "flowmvp_session_last_active",
} as const;

export const API_PATHS = {
  SESSIONS_START: "/api/sessions/start",
  SESSIONS_END: "/api/sessions/end",
  EVENTS: "/api/events",
} as const;
