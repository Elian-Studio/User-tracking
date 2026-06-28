// 관리자 계정 시드 — `ADMIN_USERNAME`/`ADMIN_PASSWORD` env로 1회 실행
//   ADMIN_USERNAME=admin ADMIN_PASSWORD=*** tsx scripts/seed-admin.ts
import { createAdminUser } from "../src/services/auth.service.js";
import { sql } from "../src/db/client.js";

const username = process.env.ADMIN_USERNAME;
const password = process.env.ADMIN_PASSWORD;

if (!username || !password) {
  console.error("ADMIN_USERNAME / ADMIN_PASSWORD 환경변수가 필요합니다.");
  process.exit(1);
}

await createAdminUser(username, password);
console.log(`관리자 계정 '${username}' 생성/갱신 완료`);
await sql.end();
