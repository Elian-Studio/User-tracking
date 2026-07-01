import { describe, it, expect } from "vitest";
import { classifyChannel } from "./channel.js";

describe("classifyChannel", () => {
  it("referrer와 utm이 모두 없으면 direct", () => {
    expect(classifyChannel(null, null)).toBe("direct");
    expect(classifyChannel("", undefined)).toBe("direct");
  });

  it("검색엔진 referrer를 식별한다", () => {
    expect(classifyChannel("https://www.google.com/search?q=청년적금")).toBe("google");
    expect(classifyChannel("https://search.naver.com/search.naver?query=x")).toBe("naver");
    expect(classifyChannel("https://m.search.daum.net/")).toBe("daum");
  });

  it("소셜 referrer를 식별한다", () => {
    expect(classifyChannel("https://www.instagram.com/")).toBe("social");
    expect(classifyChannel("https://t.co/abc")).toBe("social");
  });

  it("그 외 외부 referrer는 referral", () => {
    expect(classifyChannel("https://example.com/blog/post")).toBe("referral");
  });

  it("스킴 없는 referrer도 도메인으로 판별한다", () => {
    expect(classifyChannel("naver.com")).toBe("naver");
  });

  it("UTM 값이 있으면 referrer보다 우선한다", () => {
    expect(classifyChannel("https://www.google.com/", "newsletter")).toBe("newsletter");
  });
});
