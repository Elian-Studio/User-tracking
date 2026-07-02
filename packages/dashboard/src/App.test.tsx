import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, fireEvent, waitFor } from "@testing-library/react";
import { App } from "./App";
import { checkAuth, listServices, fetchOverview, fetchTrend, fetchRealtime } from "./api";

vi.mock("./api", () => ({
  checkAuth: vi.fn(),
  listServices: vi.fn(),
  logout: vi.fn(),
  fetchOverview: vi.fn(),
  fetchTrend: vi.fn(),
  fetchRealtime: vi.fn(),
}));

const mockedCheckAuth = vi.mocked(checkAuth);
const mockedListServices = vi.mocked(listServices);
const mockedFetchOverview = vi.mocked(fetchOverview);
const mockedFetchTrend = vi.mocked(fetchTrend);
const mockedFetchRealtime = vi.mocked(fetchRealtime);

// App은 이제 로컬 타임존(Intl.DateTimeFormat().resolvedOptions().timeZone) 기준으로 기본
// 범위/프리셋을 계산한다 — UTC 자정으로 하드코딩하는 것은 그 자체가 고쳐야 했던 버그였다.
// 그래서 검증도 테스트 환경의 실제 로컬 타임존 기준 벽시계 값으로 비교해야 한다.
const LOCAL_TZ = Intl.DateTimeFormat().resolvedOptions().timeZone;
function localWallClock(iso: string): string {
  const dtf = new Intl.DateTimeFormat("en-US", {
    timeZone: LOCAL_TZ,
    hour12: false,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
  const p = Object.fromEntries(dtf.formatToParts(new Date(iso)).map((x) => [x.type, x.value]));
  return `${p.year}-${p.month}-${p.day}T${p.hour}:${p.minute}:${p.second}`;
}

beforeEach(() => {
  mockedCheckAuth.mockReset().mockResolvedValue(true);
  mockedListServices
    .mockReset()
    .mockResolvedValue([{ id: 1, name: "svc", service_key: "svc-1", domain: null }]);
  mockedFetchOverview.mockReset().mockResolvedValue({ uv: 1, pv: 1, bounceRate: 0 });
  mockedFetchTrend.mockReset().mockResolvedValue({ interval: "day", data: [] });
  mockedFetchRealtime.mockReset().mockResolvedValue(0);
});

describe("App — DateRangePicker 배선", () => {
  it("초기 렌더 시 기본 프리셋(최근 7일) 범위로 fetchOverview를 호출한다", async () => {
    render(<App />);

    await waitFor(() => expect(mockedFetchOverview).toHaveBeenCalled());

    const [serviceKey, startDate, endDate] = mockedFetchOverview.mock.calls[0];
    expect(serviceKey).toBe("svc-1");
    // 로컬 타임존 기준 자정 시작 ~ 23:59:59 끝이어야 한다(과거엔 UTC 자정으로 하드코딩돼
    // 있어 UTC가 아닌 타임존에서는 하루의 앞부분이 누락됐다)
    expect(localWallClock(startDate).slice(11)).toBe("00:00:00");
    expect(localWallClock(endDate).slice(11)).toBe("23:59:59");
  });

  it("프리셋을 클릭하면 새 범위로 다시 조회한다 (DATE_PRESETS -> toInstantRange 배선 확인)", async () => {
    const { container, getByText } = render(<App />);
    await waitFor(() => expect(mockedFetchOverview).toHaveBeenCalled());
    mockedFetchOverview.mockClear();

    fireEvent.click(container.querySelector(".daterange-trigger")!);
    fireEvent.click(getByText("오늘"));

    await waitFor(() => expect(mockedFetchOverview).toHaveBeenCalled());
    const [, startDate, endDate] = mockedFetchOverview.mock.calls[0];
    const localStart = localWallClock(startDate);
    const localEnd = localWallClock(endDate);
    // "오늘" 프리셋은 로컬 타임존 기준 오늘 00:00:00 ~ 23:59:59여야 한다
    expect(localStart.slice(0, 10)).toBe(localEnd.slice(0, 10));
    expect(localStart.slice(11)).toBe("00:00:00");
    expect(localEnd.slice(11)).toBe("23:59:59");
  });

  it("커스텀 범위 Apply 시 onChange(s, e, tz)의 s/e가 TrendChart에도 동일하게 전달된다", async () => {
    const { container } = render(<App />);
    await waitFor(() => expect(mockedFetchOverview).toHaveBeenCalled());
    mockedFetchOverview.mockClear();
    mockedFetchTrend.mockClear();

    fireEvent.click(container.querySelector(".daterange-trigger")!);
    const setNativeValue = (el: Element, value: string) => {
      const setter = Object.getOwnPropertyDescriptor(
        Object.getPrototypeOf(el),
        "value"
      )!.set!;
      setter.call(el, value);
      el.dispatchEvent(new Event("input", { bubbles: true }));
    };
    const [startDateInput] = container.querySelectorAll(".daterange-field-row input");
    setNativeValue(startDateInput, "2026-06-15");
    fireEvent.click(container.querySelector(".daterange-apply")!);

    await waitFor(() => expect(mockedFetchOverview).toHaveBeenCalled());
    const [, overviewStart] = mockedFetchOverview.mock.calls[0];
    const [, trendStart] = mockedFetchTrend.mock.calls[0];
    expect(overviewStart).toBe(trendStart);
  });

  it("DateRangePicker에 App의 기본 타임존(Intl 로컬 타임존)이 전달된다", async () => {
    const { container } = render(<App />);
    await waitFor(() => expect(mockedFetchOverview).toHaveBeenCalled());

    fireEvent.click(container.querySelector(".daterange-trigger")!);
    const tzSelect = container.querySelector(".daterange-tz") as HTMLSelectElement;
    expect(tzSelect.value).toBe(Intl.DateTimeFormat().resolvedOptions().timeZone);
  });
});
