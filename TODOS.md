# TODOS

## Dashboard

### 캘린더 피커 모바일 클리핑 미검증

**What:** `DateRangePicker`의 드롭다운 패널(`.daterange-panel`, 300px 고정폭)이 ≤760px 모바일 폭에서 화면 밖으로 잘리지 않는지 실제 브라우저에서 확인.

**Why:** 계획 단계에서 명시한 검증 항목이었으나, 이 세션의 브라우저 자동화 도구가 뷰포트 리사이즈를 실제로 반영하지 못해(`resize_window` 호출 후에도 `window.innerWidth`가 그대로) 라이브 검증을 못 했다.

**Context:** `packages/dashboard/src/components/DateRangePicker.tsx` + `index.css`의 `.daterange-panel`. `.topbar-filters`는 모바일에서 `width:100%`로 넓어지지만 트리거 버튼 자체는 콘텐츠 크기라 우측 정렬(`right:0`) 기준 패널이 걸칠 수 있음. 실기기 또는 Chrome DevTools 디바이스 모드로 직접 확인 필요.

**Effort:** S
**Priority:** P3
**Depends on:** None

### fetchTrend의 timezone 생략 분기 테스트 없음

**What:** `packages/dashboard/src/api.ts`의 `fetchTrend`에서 `timezone` 인자를 안 넘기는 경로(`if (timezone) params.timezone = ...`)가 어떤 테스트에서도 실행되지 않는다.

**Why:** Step 7 커버리지 감사에서 발견된 갭. `TrendChart`가 항상 `timezone`을 넘기므로 실제로는 이 분기가 안 쓰이지만, 회귀 시 조용히 깨질 수 있다.

**Context:** 이 저장소엔 `fetch` 모킹 테스트 관습이 전혀 없다(`api.test.ts` 없음). 이거 하나 때문에 새 테스트 인프라를 만들기엔 과한 범위라 판단해 보류했다. `fetch`를 모킹하는 패턴이 다른 이유로 이미 도입되면 그때 같이 닫을 것.

**Effort:** S
**Priority:** P4
**Depends on:** 프로젝트에 fetch 모킹 테스트 관습 도입

### DST 가을철 종료일 시간별 차트 라벨 중복 표시

**What:** `interval=hour`에서 DST가 끝나는 날(예: America/New_York 11월 첫 일요일)의 중복되는 두 로컬 1시가 데이터상으로는 정확히 분리되지만(수정 완료), X축 라벨은 둘 다 동일한 텍스트("...T01:00:00")로 보인다.

**Why:** `packages/server/src/services/metrics.service.ts`의 hour 버킷팅을 UTC 인스턴트 기준으로 고쳐서 데이터 병합 버그는 해결했지만(2026-07-01 어드버서리얼 리뷰에서 Codex 2개 패스 + Claude 1개 패스가 독립 발견, 실제 Postgres로 재현/검증함), 두 버킷을 구분하는 라벨(예: 오프셋 표시)까지는 손대지 않았다.

**Context:** 연 1회, 해당 타임존을 쓰는 사용자에게만 발생하는 코스메틱 이슈. 데이터 정확성 문제는 아님. 필요해지면 `formatHourTick`에 UTC 오프셋을 라벨에 포함시키는 방식으로 구분 가능.

**Effort:** M
**Priority:** P4
**Depends on:** None

### `/api/metrics/trend`에 서버 쪽 range-length 제한 없음

**What:** `interval=hour`로 아주 넓은 날짜 범위를 요청해도 서버가 막지 않는다. UI는 3일 이하에서만 버튼을 보여주지만 API 자체엔 제한이 없다.

**Why:** Codex 어드버서리얼 리뷰가 [HIGH]로 지적. hour 버킷은 day 대비 24~30배 많은 행을 GROUP BY하므로, 이 앱의 기존 "범위 제한 없음" posture(다른 모든 엔드포인트도 동일)가 hour에서는 리스크가 더 크다.

**Context:** 계획 단계에서 이미 명시적으로 범위 제외로 확정(2026-07-01, 캘린더 피커+시간별 보기 기능 설계 시). 인증된 사용자만 접근 가능하고 내부 분석 도구라 우선순위 낮게 책정했으나, 사용자 수가 늘거나 외부 노출이 생기면 재검토 필요.

**Effort:** M
**Priority:** P3
**Depends on:** None

## Infrastructure

### VERSION/CHANGELOG 관례 미도입

**What:** 이 저장소는 최상위 `VERSION` 파일이나 `CHANGELOG.md`가 없다. 각 패키지 `package.json`은 독립적으로 `0.1.0` 고정.

**Why:** `/ship` 워크플로 실행 중 발견 — gstack의 버전 범프/CHANGELOG 자동화는 `VERSION` 파일 존재를 전제로 한다.

**Context:** 2026-07-01, 사용자가 이번 PR 범위에서는 도입하지 않기로 명시적으로 결정. 도입하려면 서버/SDK/shared 패키지의 독립 버전 체계와의 관계도 같이 정리해야 함.

**Effort:** M
**Priority:** P4
**Depends on:** None

## Completed
