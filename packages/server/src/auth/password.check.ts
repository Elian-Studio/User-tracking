// password 해시/검증 런타임 체크 — `tsx src/auth/password.check.ts`
import assert from "node:assert/strict";
import { hashPassword, verifyPassword, generateToken } from "./password.js";

const stored = hashPassword("s3cret!");
assert.equal(stored.includes(":"), true, "salt:hash 형식");
assert.equal(verifyPassword("s3cret!", stored), true, "정답 비번 통과");
assert.equal(verifyPassword("wrong", stored), false, "오답 비번 실패");
assert.equal(verifyPassword("s3cret!", "garbage"), false, "변조 해시 실패");
assert.equal(verifyPassword("s3cret!", ""), false, "빈 해시 실패");
// 같은 비번도 salt가 달라 매번 다른 해시
assert.notEqual(hashPassword("x"), hashPassword("x"), "salt 랜덤");
assert.equal(generateToken().length, 64, "토큰 32바이트 hex");
assert.notEqual(generateToken(), generateToken(), "토큰 랜덤");

console.log("password.check OK");
