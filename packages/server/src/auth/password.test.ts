import { describe, it, expect } from "vitest";
import { hashPassword, verifyPassword, generateToken } from "./password.js";

describe("password", () => {
  it("해시는 salt:hash 형식", () => {
    expect(hashPassword("s3cret!").includes(":")).toBe(true);
  });

  it("정답 비밀번호는 검증 통과", () => {
    const stored = hashPassword("s3cret!");
    expect(verifyPassword("s3cret!", stored)).toBe(true);
  });

  it("오답 비밀번호는 검증 실패", () => {
    const stored = hashPassword("s3cret!");
    expect(verifyPassword("wrong", stored)).toBe(false);
  });

  it("변조/빈 해시는 검증 실패", () => {
    expect(verifyPassword("s3cret!", "garbage")).toBe(false);
    expect(verifyPassword("s3cret!", "")).toBe(false);
  });

  it("같은 비밀번호도 salt가 달라 매번 다른 해시", () => {
    expect(hashPassword("x")).not.toBe(hashPassword("x"));
  });

  it("토큰은 32바이트 hex(64자)이고 매번 랜덤", () => {
    expect(generateToken().length).toBe(64);
    expect(generateToken()).not.toBe(generateToken());
  });
});
