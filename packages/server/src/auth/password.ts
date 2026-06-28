// 비밀번호 해시/검증 (node:crypto scrypt, 신규 의존성 없음)
import { scryptSync, randomBytes, timingSafeEqual } from "node:crypto";

const KEYLEN = 64;

export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, KEYLEN).toString("hex");
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;
  const expected = Buffer.from(hash, "hex");
  const candidate = scryptSync(password, salt, KEYLEN);
  // 길이 다르면 timingSafeEqual이 throw하므로 먼저 비교
  return expected.length === candidate.length && timingSafeEqual(expected, candidate);
}

export function generateToken(): string {
  return randomBytes(32).toString("hex");
}
