interface OverviewData {
  uv: number;
  pv: number;
  bounceRate: number;
}

interface TrendPoint {
  date: string;
  uv: number;
  pv: number;
}

interface TrendData {
  interval: string;
  data: TrendPoint[];
}

interface PageData {
  path: string;
  views: number;
  unique_views: number;
}

interface ScrollDistribution {
  range: string;
  count: number;
  percent: number;
}

interface ExitScrollData {
  path: string;
  distribution: ScrollDistribution[];
  average: number;
  median: number;
  total: number;
}

interface AcquisitionData {
  channel: string;
  sessions: number;
  percent: number;
}

interface ServiceItem {
  id: number;
  name: string;
  service_key: string;
  domain: string | null;
}

function buildParams(params: Record<string, string>) {
  return new URLSearchParams(params).toString();
}

const TOKEN_KEY = "flowmvp_token";

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

function clearToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}

function authHeaders(): HeadersInit {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

// 보호된 API 호출 — 토큰 헤더 주입, 401이면 토큰 폐기 후 재로그인 유도
async function authedFetch(url: string): Promise<Response> {
  const res = await fetch(url, { headers: authHeaders() });
  if (res.status === 401) {
    clearToken();
    window.dispatchEvent(new Event("flowmvp-unauthorized"));
  }
  return res;
}

export async function login(username: string, password: string): Promise<boolean> {
  try {
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });
    if (!res.ok) return false;
    const { token } = await res.json();
    setToken(token);
    return true;
  } catch {
    return false;
  }
}

export async function logout(): Promise<void> {
  try {
    await fetch("/api/auth/logout", { method: "POST", headers: authHeaders() });
  } catch {
    // 무시 — 어차피 로컬 토큰은 제거
  }
  clearToken();
}

export async function checkAuth(): Promise<boolean> {
  if (!getToken()) return false;
  try {
    const res = await fetch("/api/auth/me", { headers: authHeaders() });
    if (!res.ok) {
      clearToken();
      return false;
    }
    return true;
  } catch {
    return false;
  }
}

export async function listServices(): Promise<ServiceItem[]> {
  try {
    const res = await authedFetch("/api/services");
    if (!res.ok) return [];
    return res.json();
  } catch {
    return [];
  }
}

// 선택한 서비스의 히트맵 기준 도메인 저장.
export async function saveServiceDomain(serviceKey: string, domain: string): Promise<void> {
  try {
    await fetch(`/api/services/${encodeURIComponent(serviceKey)}/domain`, {
      method: "PUT",
      headers: { ...authHeaders(), "Content-Type": "application/json" },
      body: JSON.stringify({ domain }),
    });
  } catch {
    // 무시 — 도메인 저장 실패가 조회를 막지 않도록
  }
}

export type { ServiceItem };

export async function fetchAcquisition(
  serviceKey: string,
  startDate: string,
  endDate: string,
): Promise<AcquisitionData[]> {
  try {
    const qs = buildParams({ serviceKey, startDate, endDate });
    const res = await authedFetch(`/api/metrics/acquisition?${qs}`);
    if (!res.ok) return [];
    return res.json();
  } catch {
    return [];
  }
}

export async function fetchOverview(
  serviceKey: string,
  startDate: string,
  endDate: string,
): Promise<OverviewData | null> {
  try {
    const qs = buildParams({ serviceKey, startDate, endDate });
    const res = await authedFetch(`/api/metrics/overview?${qs}`);
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export async function fetchTrend(
  serviceKey: string,
  startDate: string,
  endDate: string,
  interval: string,
): Promise<TrendData | null> {
  try {
    const qs = buildParams({ serviceKey, startDate, endDate, interval });
    const res = await authedFetch(`/api/metrics/trend?${qs}`);
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export async function fetchPages(
  serviceKey: string,
  startDate: string,
  endDate: string,
): Promise<PageData[]> {
  try {
    const qs = buildParams({ serviceKey, startDate, endDate });
    const res = await authedFetch(`/api/metrics/pages?${qs}`);
    if (!res.ok) return [];
    return res.json();
  } catch {
    return [];
  }
}

export async function fetchExitScroll(
  serviceKey: string,
  path: string,
  startDate: string,
  endDate: string,
): Promise<ExitScrollData | null> {
  try {
    const qs = buildParams({ serviceKey, path, startDate, endDate });
    const res = await authedFetch(`/api/metrics/exit-scroll?${qs}`);
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}
