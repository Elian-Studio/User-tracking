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

  it("hour: 버킷은 타임존 변환 전(created_at)을 기준으로 자른다 — DST 가을철 중복 로컬 1시 병합 회귀 방지", async () => {
    // 버그였던 이전 쿼리는 date_trunc('hour', created_at AT TIME ZONE $1)로 먼저 타임존을
    // 씌운 뒤 잘랐다 — DST 종료일의 서로 다른 두 UTC 시각이 같은 로컬 벽시계로 겹쳐 GROUP BY가
    // 하나로 합쳐버렸다. 고친 쿼리는 date_trunc('hour', created_at)로 먼저 자르고(항상 유일함),
    // 그 결과만 표시용으로 타임존 변환해야 한다.
    mockSql.mockResolvedValue([]);

    await getVisitorTrend(1, "2026-11-01", "2026-11-02", "hour", "America/New_York");

    const text = queryText(mockSql.mock.calls[0]);
    expect(text).toContain("date_trunc('hour', created_at) as bucket");
    expect(text).not.toContain("created_at AT TIME ZONE");
    expect(text).toContain("created_at) AT TIME ZONE");
  });
});
