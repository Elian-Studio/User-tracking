export type EventType = "page_view" | "scroll" | "exit";

export interface AnalyticsEvent {
  serviceKey: string;
  sessionId: string;
  userId?: string;
  type: EventType;
  path: string;
  referrer?: string;
  scrollPercent?: number;
  utm?: UtmParams;
  timestamp: string;
}

export interface UtmParams {
  source?: string;
  medium?: string;
  campaign?: string;
  term?: string;
  content?: string;
}
