import { sql } from "../db/client.js";

export async function getServiceByKey(serviceKey: string) {
  const result = await sql`
    SELECT id, name, service_key FROM services WHERE service_key = ${serviceKey}
  `;
  return result[0] ?? null;
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
