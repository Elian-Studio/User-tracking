// 유입 referrer/UTM → 채널 분류 (순수 함수, DB 의존 없음 → 단독 테스트 가능)

const SOCIAL_HOSTS = [
  "instagram",
  "facebook",
  "fb.",
  "t.co",
  "twitter",
  "x.com",
  "youtube",
  "youtu.be",
  "threads",
  "linkedin",
  "kakao",
  "band.us",
] as const;

function hostOf(referrer: string): string | null {
  try {
    return new URL(referrer).hostname.toLowerCase();
  } catch {
    // referrer가 호스트만(스킴 없이) 들어온 경우 대비
    const m = referrer.toLowerCase().match(/^[a-z0-9.-]+/);
    return m ? m[0] : null;
  }
}

/**
 * 세션 진입의 referrer와 utm_source로 유입 채널을 분류한다.
 * UTM이 있으면 캠페인 유입이므로 utm_source를 우선한다.
 * 검색 "키워드"는 HTTPS referrer로 알 수 없으므로 여기선 채널(매체)까지만 구분한다.
 */
export function classifyChannel(referrer?: string | null, utmSource?: string | null): string {
  const utm = utmSource?.trim();
  if (utm) return utm.toLowerCase();

  if (!referrer?.trim()) return "direct";

  const host = hostOf(referrer);
  if (!host) return "referral";

  if (host.includes("naver.")) return "naver";
  if (host.includes("google.")) return "google";
  if (host.includes("daum.")) return "daum";
  if (SOCIAL_HOSTS.some((s) => host.includes(s))) return "social";
  return "referral";
}
