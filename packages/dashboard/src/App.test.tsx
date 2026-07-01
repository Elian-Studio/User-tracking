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
    expect(startDate).toMatch(/^\d{4}-\d{2}-\d{2}T00:00:00Z$/);
    expect(endDate).toMatch(/^\d{4}-\d{2}-\d{2}T23:59:59Z$/);
  });

  it("프리셋을 클릭하면 새 범위로 다시 조회한다 (DATE_PRESETS -> toInstantRange 배선 확인)", async () => {
    const { container, getByText } = render(<App />);
    await waitFor(() => expect(mockedFetchOverview).toHaveBeenCalled());
    mockedFetchOverview.mockClear();

    fireEvent.click(container.querySelector(".daterange-trigger")!);
    fireEvent.click(getByText("오늘"));

    await waitFor(() => expect(mockedFetchOverview).toHaveBeenCalled());
    const [, startDate, endDate] = mockedFetchOverview.mock.calls[0];
    const today = new Date().toISOString().slice(0, 10);
    expect(startDate).toBe(`${today}T00:00:00Z`);
    expect(endDate).toBe(`${today}T23:59:59Z`);
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
