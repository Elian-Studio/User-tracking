import { sql } from "../db/client.js";

export async function getServiceByKey(serviceKey: string) {
  const result = await sql`
    SELECT id, name, service_key FROM services WHERE service_key = ${serviceKey}
  `;
  return result[0] ?? null;
}

// 대시보드 서비스 드롭다운용 — 등록된 서비스 전체 목록.
export async function listServices() {
  return sql`
    SELECT id, name, service_key, domain FROM services ORDER BY name
  `;
}

// 서비스의 히트맵 기준 도메인 저장(드롭다운 선택 시 사이트 URL 자동 채움용).
export async function setServiceDomain(serviceKey: string, domain: string | null) {
  await sql`
    UPDATE services SET domain = ${domain} WHERE service_key = ${serviceKey}
  `;
}

export async function getOrCreateService(serviceKey: string) {
  let service = await getServiceByKey(serviceKey);

  if (!service) {
    const result = await sql`
      INSERT INTO services (name, service_key)
      VALUES (${serviceKey}, ${serviceKey})
      ON CONFLICT (service_key) DO UPDATE SET name = EXCLUDED.name
      RETURNING id, name, service_key
    `;
    service = result[0];
  }

  return service;
}
