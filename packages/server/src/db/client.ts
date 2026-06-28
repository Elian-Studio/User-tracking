import postgres from "postgres";

const databaseUrl = process.env.DATABASE_URL ?? "postgres://localhost:5432/flowmvp";

// 서버리스(Vercel + Neon 등 풀링 DB)에서는 PG_MAX=1, PG_PREPARE=false 로 설정.
// 기본값은 기존 동작과 동일(상시 구동 서버용).
export const sql = postgres(databaseUrl, {
  max: Number(process.env.PG_MAX ?? 10),
  prepare: process.env.PG_PREPARE !== "false",
});
