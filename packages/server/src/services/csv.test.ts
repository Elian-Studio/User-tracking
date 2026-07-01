import { describe, it, expect } from "vitest";
import { rowsToCsv } from "./csv.js";

describe("rowsToCsv", () => {
  it("빈 배열은 빈 문자열", () => {
    expect(rowsToCsv([])).toBe("");
  });

  it("단일 행을 헤더+값으로 직렬화", () => {
    expect(rowsToCsv([{ a: 1, b: "x" }])).toBe("a,b\n1,x");
  });

  it("null/undefined는 빈 칸으로 처리", () => {
    expect(rowsToCsv([{ a: null, b: undefined }])).toBe("a,b\n,");
  });

  it("쉼표/따옴표가 포함된 값은 이스케이프한다", () => {
    expect(rowsToCsv([{ a: "x,y", b: 'q"q' }])).toBe('a,b\n"x,y","q""q"');
  });

  it("줄바꿈이 포함된 값은 따옴표로 감싼다", () => {
    expect(rowsToCsv([{ a: "line\nbreak" }])).toBe('a\n"line\nbreak"');
  });

  it("Date 값은 ISO 문자열로 직렬화", () => {
    expect(rowsToCsv([{ t: new Date("2026-06-28T00:00:00.000Z") }])).toBe(
      "t\n2026-06-28T00:00:00.000Z"
    );
  });
});
