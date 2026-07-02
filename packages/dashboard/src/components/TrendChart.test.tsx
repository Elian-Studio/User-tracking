import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, fireEvent, waitFor } from "@testing-library/react";
import { TrendChart, formatHourTick, computeSpansMultipleDays, localDayIndex } from "./TrendChart";
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

describe("localDayIndex", () => {
  it("같은 로컬 날짜면 같은 인덱스를 반환한다", () => {
    expect(localDayIndex("2026-07-01T00:00:00Z", "Asia/Seoul")).toBe(
      localDayIndex("2026-07-01T14:00:00Z", "Asia/Seoul")
    );
  });

  it("UTC 인스턴트가 로컬 자정을 넘어가면 인덱스가 하루 늘어난다", () => {
    // Asia/Seoul(UTC+9)에서 로컬 자정은 UTC 15:00 — 14:00Z는 06-30 23:00 KST, 15:00Z는 07-01 00:00 KST.
    const before = localDayIndex("2026-06-30T14:00:00Z", "Asia/Seoul");
    const after = localDayIndex("2026-06-30T15:00:00Z", "Asia/Seoul");
    expect(after - before).toBe(1);
  });

  it("DST 종료일(2026-11-01, 25시간)을 걸쳐도 인덱스 차이는 달력일 수와 같다", () => {
    // 2026-10-31T04:00:00Z = 로컬 자정(EDT, UTC-4) / 2026-11-02T05:00:00Z = 로컬 자정(EST, UTC-5).
    // 실제 경과는 49시간이지만 달력일 차이는 정확히 2여야 한다.
    expect(
      localDayIndex("2026-11-02T05:00:00Z", "America/New_York") -
        localDayIndex("2026-10-31T04:00:00Z", "America/New_York")
    ).toBe(2);
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
  it("1일 범위에서는 클릭 없이 '일별' 탭이 자동으로 hour interval을 요청한다", async () => {
    const { getByText } = setup("2026-07-01T00:00:00Z", "2026-07-01T23:59:59Z");

    await waitFor(() => {
      expect(mockedFetchTrend).toHaveBeenCalledWith(
        "svc-1",
        "2026-07-01T00:00:00Z",
        "2026-07-01T23:59:59Z",
        "hour",
        "Asia/Seoul"
      );
    });
    expect(getByText("일별").className).toBe("active");
    // "시간별" 버튼 자체가 더 이상 존재하지 않는다
    expect(() => getByText("시간별")).toThrow();
  });

  it("범위가 정확히 3일(선택 타임존 기준 달력일)이면(경계값 포함) '일별' 탭이 hour interval을 요청한다", async () => {
    // localDayIndex 차이가 정확히 3 — <=이므로 경계값 자체는 포함되어야 한다.
    setup("2026-06-28T00:00:00Z", "2026-07-01T00:00:00Z");

    await waitFor(() => {
      expect(mockedFetchTrend).toHaveBeenCalledWith(
        "svc-1",
        "2026-06-28T00:00:00Z",
        "2026-07-01T00:00:00Z",
        "hour",
        "Asia/Seoul"
      );
    });
  });

  it("범위가 4번째 달력일로 넘어가면 '일별' 탭이 day interval을 요청한다", async () => {
    setup("2026-06-28T00:00:00Z", "2026-07-02T00:00:00Z");

    await waitFor(() => {
      expect(mockedFetchTrend).toHaveBeenCalledWith(
        "svc-1",
        "2026-06-28T00:00:00Z",
        "2026-07-02T00:00:00Z",
        "day",
        "Asia/Seoul"
      );
    });
  });

  it("DST 종료 주말처럼 실제 경과시간이 73시간이어도 로컬 달력 기준 3일이면 '일별' 탭이 hour interval을 요청한다", async () => {
    // America/New_York은 2026-11-01 새벽 2시에 서머타임이 끝나 그 날이 25시간이 된다.
    // 10/31 00:00 ~ 11/2 23:59(로컬)은 실제 UTC 경과 기준 73시간에 가깝지만, 사용자에게는
    // 여전히 "3일"이므로 시간별 조회가 유지돼야 한다 — ms 기준 비교였다면 실패했을 케이스.
    render(
      <TrendChart
        serviceKey="svc-1"
        startDate="2026-10-31T04:00:00Z"
        endDate="2026-11-03T04:59:00Z"
        timezone="America/New_York"
      />
    );

    await waitFor(() => {
      expect(mockedFetchTrend).toHaveBeenCalledWith(
        "svc-1",
        "2026-10-31T04:00:00Z",
        "2026-11-03T04:59:00Z",
        "hour",
        "America/New_York"
      );
    });
  });

  it("'일별' 탭에서 범위가 3일 넘게 넓어지면 클릭 없이 day interval로 자동 재요청한다", async () => {
    const { rerender } = render(
      <TrendChart
        serviceKey="svc-1"
        startDate="2026-06-30T00:00:00Z"
        endDate="2026-07-01T23:59:59Z"
        timezone="Asia/Seoul"
      />
    );

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

  it("'주별'/'월별' 탭을 고르면 범위가 짧아도 hour로 전환되지 않고 그대로 조회된다", async () => {
    const { getByText } = setup("2026-07-01T00:00:00Z", "2026-07-01T23:59:59Z");

    fireEvent.click(getByText("주별"));
    await waitFor(() => {
      expect(mockedFetchTrend).toHaveBeenLastCalledWith(
        "svc-1",
        "2026-07-01T00:00:00Z",
        "2026-07-01T23:59:59Z",
        "week",
        "Asia/Seoul"
      );
    });

    fireEvent.click(getByText("월별"));
    await waitFor(() => {
      expect(mockedFetchTrend).toHaveBeenLastCalledWith(
        "svc-1",
        "2026-07-01T00:00:00Z",
        "2026-07-01T23:59:59Z",
        "month",
        "Asia/Seoul"
      );
    });
  });
});
