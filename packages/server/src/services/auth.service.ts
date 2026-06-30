import { sql } from "../db/client.js";
import { hashPassword, verifyPassword, generateToken } from "../auth/password.js";

const TOKEN_TTL_DAYS = Number(process.env.AUTH_TOKEN_TTL_DAYS ?? 7);

export interface AuthUser {
  id: number;
  username: string;
}

export async function getUserByUsername(username: string) {
  const result = await sql`
    SELECT id, username, password_hash FROM admin_users WHERE username = ${username}
  `;
  return result[0] ?? null;
}

// 시드 스크립트용 — 관리자 계정 생성/비번 갱신
export async function createAdminUser(username: string, password: string): Promise<void> {
  const passwordHash = hashPassword(password);
  await sql`
    INSERT INTO admin_users (username, password_hash)
    VALUES (${username}, ${passwordHash})
    ON CONFLICT (username) DO UPDATE SET password_hash = EXCLUDED.password_hash
  `;
}

// 로그인: 검증 성공 시 토큰 발급(DB 저장), 실패 시 null
export async function login(username: string, password: string): Promise<string | null> {
  const user = await getUserByUsername(username);
  if (!user || !verifyPassword(password, user.password_hash)) {
    return null;
  }

  const token = generateToken();
  await sql`
    INSERT INTO auth_tokens (token, user_id, expires_at)
    VALUES (${token}, ${user.id}, NOW() + ${`${TOKEN_TTL_DAYS} days`}::interval)
  `;
  return token;
}

// 토큰 유효성 검사 — 만료 안 됐으면 사용자 반환
export async function validateToken(token: string): Promise<AuthUser | null> {
  const result = await sql`
    SELECT u.id, u.username
    FROM auth_tokens t
    JOIN admin_users u ON u.id = t.user_id
    WHERE t.token = ${token} AND t.expires_at > NOW()
  `;
  return (result[0] as AuthUser | undefined) ?? null;
}

export async function deleteToken(token: string): Promise<void> {
  await sql`DELETE FROM auth_tokens WHERE token = ${token}`;
}
