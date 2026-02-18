import { STORAGE_KEYS } from "@flowmvp/shared";

export function getSessionId(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEYS.SESSION_ID);
  } catch {
    return null;
  }
}

export function setSessionId(id: string): void {
  try {
    localStorage.setItem(STORAGE_KEYS.SESSION_ID, id);
  } catch {
    // localStorage unavailable (SSR, private mode)
  }
}

export function getLastActive(): number | null {
  try {
    const value = localStorage.getItem(STORAGE_KEYS.SESSION_LAST_ACTIVE);
    return value ? Number(value) : null;
  } catch {
    return null;
  }
}

export function setLastActive(timestamp: number): void {
  try {
    localStorage.setItem(STORAGE_KEYS.SESSION_LAST_ACTIVE, String(timestamp));
  } catch {
    // localStorage unavailable
  }
}

export function clearSession(): void {
  try {
    localStorage.removeItem(STORAGE_KEYS.SESSION_ID);
    localStorage.removeItem(STORAGE_KEYS.SESSION_LAST_ACTIVE);
  } catch {
    // localStorage unavailable
  }
}
