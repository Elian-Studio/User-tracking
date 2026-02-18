export type Environment = "dev" | "staging" | "prod";

export interface Service {
  id: number;
  name: string;
  serviceKey: string;
}

export function buildServiceKey(base: string, env?: Environment): string {
  if (!env || env === "prod") return base;
  return `${base}-${env}`;
}

export function parseServiceKey(serviceKey: string): { base: string; env: Environment } {
  if (serviceKey.endsWith("-dev")) {
    return { base: serviceKey.slice(0, -4), env: "dev" };
  }
  if (serviceKey.endsWith("-staging")) {
    return { base: serviceKey.slice(0, -8), env: "staging" };
  }
  return { base: serviceKey, env: "prod" };
}
