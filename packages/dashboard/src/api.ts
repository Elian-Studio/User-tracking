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

function buildParams(params: Record<string, string>) {
  return new URLSearchParams(params).toString();
}

export async function fetchAcquisition(
  serviceKey: string,
  startDate: string,
  endDate: string,
): Promise<AcquisitionData[]> {
  try {
    const qs = buildParams({ serviceKey, startDate, endDate });
    const res = await fetch(`/api/metrics/acquisition?${qs}`);
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
    const res = await fetch(`/api/metrics/overview?${qs}`);
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
    const res = await fetch(`/api/metrics/trend?${qs}`);
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
    const res = await fetch(`/api/metrics/pages?${qs}`);
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
    const res = await fetch(`/api/metrics/exit-scroll?${qs}`);
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}
