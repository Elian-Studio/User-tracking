export interface Session {
  id: string;
  serviceId: number;
  userId?: string;
  ipAddress: string;
  userAgent: string;
  referrer?: string;
  startedAt: string;
  endedAt?: string;
}

export interface SessionStartPayload {
  serviceKey: string;
  sessionId: string;
  userId?: string;
  referrer?: string;
  userAgent: string;
}

export interface SessionEndPayload {
  serviceKey: string;
  sessionId: string;
}
