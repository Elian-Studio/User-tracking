# TODOS

## Dashboard

### 트렌드 차트 일/주/월별 집계가 선택된 타임존을 반영하지 않음

**What:** `DateRangePicker`로 고른 타임존이 캘린더/프리셋 UI에는 정확히 반영되지만, `/api/metrics/trend`의 `day`/`week`/`month` 버킷팅(`getVisitorTrend`, `packages/server/src/services/metrics.service.ts`)은 여전히 DB 세션 타임존(UTC) 기준 `date_trunc`를 그대로 쓴다.

**Why:** Step 9 스페셜리스트 3명(Testing/Maintainability/API-Contract)과 Step 11 Codex 구조화 리뷰가 각각 독립적으로 [P1]로 지적. 예: Asia/Seoul 사용자가 "오늘"을 고르면 UI는 로컬 하루를 정확히 보여주지만, 트렌드 차트는 그 하루를 UTC 기준 두 날짜로 쪼개서 집계한다. `feat/trend-hourly-view`(PR #16)가 `interval=hour`에는 이미 타임존 인지 버킷팅을 추가했지만, day/week/month는 그 PR도 손대지 않았다 — 여전히 열려 있는 갭.

**Context:** 사용자가 2026-07-02 명시적으로 결정: 이번 PR(`feat/calendar-range-picker`)은 프론트엔드만 다루고(원래 계획에서 "백엔드/DB 변경 없음"을 확정한 스코프), day/week/month 타임존 인지 버킷팅은 별도 후속 PR로 분리. 구현 방향은 `getVisitorTrend`에 이미 있는 `interval==="hour"` 분기의 `AT TIME ZONE` 패턴(단, DST 가을철 버킷 병합 버그를 UTC 인스턴트 기준 `date_trunc` 후 표시용으로만 타임존 변환하는 방식으로 고친 버전)을 day/week/month에도 동일하게 적용하면 될 것.

**Effort:** M
**Priority:** P2
**Depends on:** None

### 프리셋 활성(active) 표시가 타임존 드롭다운 변경 중에는 갱신되지 않음

**What:** 패널이 열린 상태에서 타임존 드롭다운을 바꾸면 draft 날짜/시간은 새 타임존 벽시계로 다시 표시되지만, 프리셋 버튼의 `active` 하이라이트는 여전히 커밋된 `start`/`end`/`timezone`(Apply 이전 값) 기준으로만 판정된다.

**Why:** Step 11 Codex 구조화 리뷰 [P3]. 다만 이건 타임존 드롭다운만의 문제가 아니라 `active`가 원래부터 캘린더 클릭이나 날짜/시간 입력 편집 중에도 draft를 전혀 반영하지 않고 "커밋된 값과 일치하는가"만 보는 기존 설계 특성이다. `p.range(timezone)`을 `p.range(draftTz)`로만 바꾸면 타임존 경로만 draft를 반영하고 캘린더/입력 편집 경로는 여전히 안 하는 불일치가 생겨 오히려 더 혼란스러워질 수 있다 — "active가 draft 전체를 실시간 반영해야 하는가, 커밋된 상태만 반영해야 하는가"는 디자인 판단이 필요해 이번 PR에서는 보류.

**Context:** 코스메틱 이슈, 데이터 정확성과 무관. Apply를 누르면 결과는 항상 올바르다.

**Effort:** S (다만 "active의 의미"를 먼저 정해야 함)
**Priority:** P4
**Depends on:** None
