import { describe, it, expect } from "vitest";
import { resolveInterval, resolveTimezone } from "./trendParams.js";

describe("resolveInterval", () => {
  it("유효한 값(hour 포함)은 그대로 통과", () => {
    expect(resolveInterval("hour")).toBe("hour");
    expect(resolveInterval("day")).toBe("day");
    expect(resolveInterval("week")).toBe("week");
    expect(resolveInterval("month")).toBe("month");
  });

  it("잘못된 값이나 undefined는 day로 폴백", () => {
    expect(resolveInterval("nonsense")).toBe("day");
    expect(resolveInterval(undefined)).toBe("day");
  });
});

describe("resolveTimezone", () => {
  it("유효한 IANA 타임존은 그대로 통과", () => {
    expect(resolveTimezone("Asia/Seoul")).toBe("Asia/Seoul");
    expect(resolveTimezone("America/New_York")).toBe("America/New_York");
  });

  it("UTC는 통과한다 (Intl.supportedValuesOf가 UTC를 안 주는 갭 회귀 테스트)", () => {
    expect(resolveTimezone("UTC")).toBe("UTC");
  });

  it("잘못된 값이나 undefined는 UTC로 폴백", () => {
    expect(resolveTimezone("nonsense")).toBe("UTC");
    expect(resolveTimezone(undefined)).toBe("UTC");
  });
});
