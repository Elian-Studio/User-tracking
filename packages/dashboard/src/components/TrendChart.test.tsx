import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, fireEvent, waitFor } from "@testing-library/react";
import { TrendChart, formatHourTick, computeSpansMultipleDays } from "./TrendChart";
import { fetchTrend } from "../api";

vi.mock("../api", () => ({
  fetchTrend: vi.fn(),
}));

const mockedFetchTrend = vi.mocked(fetchTrend);

const ONE_DAY_MS = 24 * 60 * 60 * 1000;

function setup(startDate: string, endDate: string) {
  return render(
    <TrendChart
      serviceKey="svc-1"
      startDate={startDate}
      endDate={endDate}
      timezone="Asia/Seoul"
    />
  );
}

beforeEach(() => {
  mockedFetchTrend.mockReset();
  // 데이터를 비워 "empty" 분기만 렌더 — 이 저장소엔 ResizeObserver 목이 없어
  // 실제 차트(ResponsiveContainer)를 마운트하면 jsdom에서 크래시한다. 이 테스트들은
  // 인터벌 토글/폴백 로직과 fetchTrend 호출 인자만 검증하면 충분하다.
  mockedFetchTrend.mockResolvedValue({ interval: "day", data: [] });
});

describe("formatHourTick", () => {
  it("같은 날짜 안이면 HH:mm만 표시", () => {
    expect(formatHourTick("2026-07-01T09:00:00", false)).toBe("09:00");
  });

  it("여러 날짜에 걸치면 M/D HH:mm 표시", () => {
    expect(formatHourTick("2026-07-01T09:00:00", true)).toBe("7/1 09:00");
  });

  it("Recharts가 틱 크기 측정 패스에서 T 없는 값으로 호출해도 크래시하지 않는다", () => {
    expect(formatHourTick("", false)).toBe("");
    expect(formatHourTick("auto", false)).toBe("auto");
  });
});

describe("computeSpansMultipleDays", () => {
  it("시간별이 아니면 항상 false", () => {
    expect(
      computeSpansMultipleDays("day", [
        { date: "2026-06-30T09:00:00" },
        { date: "2026-07-01T09:00:00" },
      ])
    ).toBe(false);
  });

  it("데이터가 없으면 false", () => {
    expect(computeSpansMultipleDays("hour", [])).toBe(false);
  });

  it("시간별 데이터가 같은 날짜 안이면 false", () => {
    expect(
      computeSpansMultipleDays("hour", [
        { date: "2026-07-01T09:00:00" },
        { date: "2026-07-01T14:00:00" },
      ])
    ).toBe(false);
  });

  it("시간별 데이터가 여러 날짜에 걸치면 true", () => {
    expect(
      computeSpansMultipleDays("hour", [
        { date: "2026-06-30T16:00:00" },
        { date: "2026-07-01T14:00:00" },
      ])
    ).toBe(true);
  });
});

describe("TrendChart", () => {
  it("범위가 3일 이하면 '시간별' 버튼이 노출된다", () => {
    const { getByText } = setup("2026-06-30T00:00:00Z", "2026-07-01T23:59:59Z");
    expect(getByText("시간별")).toBeTruthy();
  });

  it("범위가 3일을 넘으면 '시간별' 버튼이 노출되지 않는다", () => {
    const { queryByText } = setup("2026-06-01T00:00:00Z", "2026-07-01T23:59:59Z");
    expect(queryByText("시간별")).toBeNull();
  });

  it("'시간별' 선택 시 fetchTrend가 hour interval과 timezone으로 호출된다", async () => {
    const { getByText } = setup("2026-06-30T00:00:00Z", "2026-07-01T23:59:59Z");
    fireEvent.click(getByText("시간별"));

    await waitFor(() => {
      expect(mockedFetchTrend).toHaveBeenCalledWith(
        "svc-1",
        "2026-06-30T00:00:00Z",
        "2026-07-01T23:59:59Z",
        "hour",
        "Asia/Seoul"
      );
    });
  });

  it("'시간별' 선택 후 범위가 3일 넘게 넓어지면 버튼이 사라지고 day interval로 재요청한다", async () => {
    const { getByText, queryByText, rerender } = render(
      <TrendChart
        serviceKey="svc-1"
        startDate="2026-06-30T00:00:00Z"
        endDate="2026-07-01T23:59:59Z"
        timezone="Asia/Seoul"
      />
    );

    fireEvent.click(getByText("시간별"));
    await waitFor(() => {
      expect(mockedFetchTrend).toHaveBeenLastCalledWith(
        "svc-1",
        "2026-06-30T00:00:00Z",
        "2026-07-01T23:59:59Z",
        "hour",
        "Asia/Seoul"
      );
    });

    const widenedStart = new Date(
      new Date("2026-06-30T00:00:00Z").getTime() - 10 * ONE_DAY_MS
    ).toISOString();
    rerender(
      <TrendChart
        serviceKey="svc-1"
        startDate={widenedStart}
        endDate="2026-07-01T23:59:59Z"
        timezone="Asia/Seoul"
      />
    );

    expect(queryByText("시간별")).toBeNull();
    await waitFor(() => {
      expect(mockedFetchTrend).toHaveBeenLastCalledWith(
        "svc-1",
        widenedStart,
        "2026-07-01T23:59:59Z",
        "day",
        "Asia/Seoul"
      );
    });
  });

  it("범위가 정확히 3일이면(경계값 포함) '시간별' 버튼이 노출된다", () => {
    // spanMs === THREE_DAYS_MS(259200000ms) — isShortRange는 <= 이므로 경계값 자체는 포함되어야 한다.
    const { getByText } = setup("2026-06-28T00:00:00Z", "2026-07-01T00:00:00Z");
    expect(getByText("시간별")).toBeTruthy();
  });

  it("범위가 3일을 1초 초과하면 '시간별' 버튼이 노출되지 않는다", () => {
    // spanMs === THREE_DAYS_MS + 1000ms — 경계값 바로 다음 값에서 꺼지는지 확인.
    const { queryByText } = setup("2026-06-28T00:00:00Z", "2026-07-01T00:00:01Z");
    expect(queryByText("시간별")).toBeNull();
  });

  it("'시간별' 선택 후 범위가 넓어졌다가 다시 3일 이내로 좁아지면 '시간별'이 아닌 '일별'이 활성 상태다", async () => {
    // effectiveInterval의 폴백만으론 이 시나리오를 구분 못 한다 — 범위가 다시 짧아지면
    // effectiveInterval은 내부 interval 상태를 그대로 반영하므로, useEffect가 실제로
    // interval을 "day"로 리셋해두지 않으면 '시간별'이 사용자 재선택 없이 다시 활성화된다.
    const { getByText, rerender } = render(
      <TrendChart
        serviceKey="svc-1"
        startDate="2026-06-30T00:00:00Z"
        endDate="2026-07-01T23:59:59Z"
        timezone="Asia/Seoul"
      />
    );

    fireEvent.click(getByText("시간별"));
    await waitFor(() => {
      expect(getByText("시간별").className).toBe("active");
    });

    const widenedStart = new Date(
      new Date("2026-06-30T00:00:00Z").getTime() - 10 * ONE_DAY_MS
    ).toISOString();
    rerender(
      <TrendChart
        serviceKey="svc-1"
        startDate={widenedStart}
        endDate="2026-07-01T23:59:59Z"
        timezone="Asia/Seoul"
      />
    );
    await waitFor(() => {
      expect(mockedFetchTrend).toHaveBeenLastCalledWith(
        "svc-1",
        widenedStart,
        "2026-07-01T23:59:59Z",
        "day",
        "Asia/Seoul"
      );
    });

    rerender(
      <TrendChart
        serviceKey="svc-1"
        startDate="2026-06-30T00:00:00Z"
        endDate="2026-07-01T23:59:59Z"
        timezone="Asia/Seoul"
      />
    );

    await waitFor(() => {
      expect(getByText("일별").className).toBe("active");
    });
    expect(getByText("시간별").className).toBe("");
  });
});
