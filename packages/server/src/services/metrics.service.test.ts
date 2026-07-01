import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../db/client.js", () => ({ sql: vi.fn() }));

import { sql } from "../db/client.js";
import { getVisitorTrend } from "./metrics.service.js";

// postgres.js의 Sql 타입은 오버로드가 깊어 vi.mocked()로 추론하면
// "Type instantiation is excessively deep" 에러가 난다 — unknown을 거쳐 캐스팅.
const mockSql = sql as unknown as {
  mockReset(): void;
  mockResolvedValue(v: unknown): void;
  mock: { calls: unknown[][] };
};

function queryText(call: unknown[]): string {
  const [strings] = call as [TemplateStringsArray];
  return strings.join("");
}

describe("getVisitorTrend", () => {
  beforeEach(() => {
    mockSql.mockReset();
  });

  it("hour: date는 문자열 그대로 유지하고 uv/pv만 숫자로 캐스팅한다 (Date 재파싱 회귀 방지)", async () => {
    mockSql.mockResolvedValue([{ date: "2026-07-01T09:00:00", uv: "3", pv: "5" }]);

    const result = await getVisitorTrend(1, "2026-07-01", "2026-07-02", "hour", "Asia/Seoul");

    expect(result).toEqual([{ date: "2026-07-01T09:00:00", uv: 3, pv: 5 }]);
    expect(typeof result[0].date).toBe("string");
  });

  it("hour: 쿼리가 AT TIME ZONE을 쓰고 timezone 값을 바인딩한다", async () => {
    mockSql.mockResolvedValue([]);

    await getVisitorTrend(1, "2026-07-01", "2026-07-02", "hour", "America/New_York");

    const call = mockSql.mock.calls[0];
    expect(queryText(call)).toContain("AT TIME ZONE");
    expect(call.slice(1)).toContain("America/New_York");
  });

  it("day/week/month: timezone은 쿼리에 반영되지 않는다 (의도된 비대칭 — hour만 타임존 인지)", async () => {
    mockSql.mockResolvedValue([]);

    await getVisitorTrend(1, "2026-07-01", "2026-07-02", "day", "Asia/Seoul");

    const call = mockSql.mock.calls[0];
    expect(queryText(call)).not.toContain("AT TIME ZONE");
    expect(call.slice(1)).not.toContain("Asia/Seoul");
  });
});
