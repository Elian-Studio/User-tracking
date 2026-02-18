---
name: verify-requirements
description: 구현된 기능이 요구사항을 충족하는지 자체 점검합니다. 백엔드 API, 프론트엔드 대시보드, SDK 옵션, 공유 타입 등 전체 스택의 요구사항 만족도를 검사합니다.
disable-model-invocation: true
---

# 요구사항 만족도 검증

## 목적

구현된 기능이 원본 요구사항(PRD, 플랜)을 충족하는지 체계적으로 검증합니다:

- 백엔드 API 엔드포인트 존재 여부 및 응답 구조
- 프론트엔드 컴포넌트 존재 여부 및 API 연동
- SDK 옵션 및 공유 타입 정합성
- 프로젝트 설정 (스크립트, 의존성, 프록시)

## 실행 시점

- 기능 구현 완료 후 전체 점검
- PR 생성 전 요구사항 커버리지 확인
- 리팩토링 후 기존 기능 유지 여부 확인

## 관련 파일

| File | Purpose |
|------|---------|
| `packages/server/src/services/metrics.service.ts` | 메트릭 서비스 함수 |
| `packages/server/src/routes/metrics.ts` | 메트릭 API 라우트 |
| `packages/dashboard/src/api.ts` | 대시보드 API 클라이언트 |
| `packages/dashboard/src/App.tsx` | 대시보드 메인 레이아웃 |
| `packages/dashboard/src/components/*.tsx` | 대시보드 컴포넌트 |
| `packages/dashboard/package.json` | 대시보드 의존성 |
| `packages/dashboard/vite.config.ts` | Vite 프록시 설정 |
| `packages/sdk/src/core/client.ts` | SDK 클라이언트 (env 옵션) |
| `packages/shared/src/types/services.ts` | Environment 타입 및 유틸 |
| `package.json` | 루트 스크립트 |

## 워크플로우

---

### 영역 1: 백엔드 — 시계열 메트릭 API

#### Check 1-1: `getVisitorTrend()` 서비스 함수 존재

**탐지 명령어**: `metrics.service.ts`에서 함수 시그니처 확인

Grep 패턴:
```
export async function getVisitorTrend
```

대상: `packages/server/src/services/metrics.service.ts`

**PASS 기준**: 함수가 존재하고 `interval` 파라미터를 받음
**FAIL 기준**: 함수 미존재

#### Check 1-2: `getVisitorTrend()` SQL 구현 정확성

**탐지 명령어**: 함수 내부에서 핵심 SQL 패턴 확인

Grep 패턴:
```
date_trunc
```
```
COUNT\(DISTINCT session_id\)
```
```
FILTER.*WHERE type = 'page_view'
```

대상: `packages/server/src/services/metrics.service.ts`

**PASS 기준**: `date_trunc`로 기간 집계, `COUNT(DISTINCT session_id)` → UV, `COUNT(*) FILTER (WHERE type = 'page_view')` → PV 패턴 모두 존재
**FAIL 기준**: 핵심 SQL 패턴 하나라도 누락

#### Check 1-3: `getOverallBounceRate()` 서비스 함수 존재

**탐지 명령어**:

Grep 패턴:
```
export async function getOverallBounceRate
```

대상: `packages/server/src/services/metrics.service.ts`

**PASS 기준**: 함수가 존재하고 `page_count = 1` 로직으로 이탈률 계산
**FAIL 기준**: 함수 미존재

#### Check 1-4: `GET /api/metrics/trend` 라우트 등록

**탐지 명령어**:

Grep 패턴:
```
/api/metrics/trend
```

대상: `packages/server/src/routes/metrics.ts`

**PASS 기준**: 라우트가 등록되어 있고 `TrendQuery` 인터페이스 사용
**FAIL 기준**: 라우트 미등록

#### Check 1-5: interval 화이트리스트 검증

**탐지 명령어**:

Grep 패턴:
```
"day".*"week".*"month"
```

대상: `packages/server/src/routes/metrics.ts`

**PASS 기준**: `day`, `week`, `month` 화이트리스트로 interval 검증
**FAIL 기준**: 화이트리스트 검증 없이 사용자 입력을 SQL에 직접 전달

#### Check 1-6: overview 응답에 bounceRate 포함

**탐지 명령어**:

Grep 패턴:
```
bounceRate
```

대상: `packages/server/src/routes/metrics.ts`

**PASS 기준**: `/api/metrics/overview` 응답에 `bounceRate` 필드 포함
**FAIL 기준**: `bounceRate` 미포함

---

### 영역 2: 프론트엔드 — 대시보드 패키지

#### Check 2-1: 대시보드 패키지 구조

**탐지 명령어**: 필수 파일 존재 확인

Glob 패턴:
```
packages/dashboard/package.json
packages/dashboard/tsconfig.json
packages/dashboard/vite.config.ts
packages/dashboard/index.html
packages/dashboard/src/main.tsx
packages/dashboard/src/App.tsx
packages/dashboard/src/api.ts
packages/dashboard/src/index.css
packages/dashboard/src/components/OverviewCards.tsx
packages/dashboard/src/components/TrendChart.tsx
packages/dashboard/src/components/PagesTable.tsx
packages/dashboard/src/components/ExitScrollChart.tsx
```

**PASS 기준**: 위 12개 파일 모두 존재
**FAIL 기준**: 하나 이상 누락

#### Check 2-2: 기술 스택 의존성

**탐지 명령어**: `packages/dashboard/package.json` 읽기

확인 항목:
- `react` 의존성 존재
- `recharts` 의존성 존재
- `vite` devDependency 존재
- `@vitejs/plugin-react` devDependency 존재

**PASS 기준**: 4개 의존성 모두 선언
**FAIL 기준**: 하나 이상 누락

#### Check 2-3: Vite 프록시 설정

**탐지 명령어**:

Grep 패턴:
```
proxy.*\/api.*localhost:3100
```

대상: `packages/dashboard/vite.config.ts`

또는 멀티라인 패턴:
```
proxy[\s\S]*?/api[\s\S]*?localhost:3100
```

**PASS 기준**: `/api` → `http://localhost:3100` 프록시 설정 존재
**FAIL 기준**: 프록시 미설정 (CORS 문제 발생)

#### Check 2-4: API 클라이언트 함수 4개

**탐지 명령어**:

Grep 패턴:
```
export async function fetch(Overview|Trend|Pages|ExitScroll)
```

대상: `packages/dashboard/src/api.ts`

**PASS 기준**: `fetchOverview`, `fetchTrend`, `fetchPages`, `fetchExitScroll` 4개 함수 모두 존재
**FAIL 기준**: 하나 이상 누락

#### Check 2-5: 컴포넌트 — OverviewCards

**탐지 명령어**:

Grep 패턴:
```
Unique Visitors
```
```
Page Views
```
```
Bounce Rate
```

대상: `packages/dashboard/src/components/OverviewCards.tsx`

**PASS 기준**: UV, PV, Bounce Rate 3개 카드 모두 표시
**FAIL 기준**: 카드 누락

#### Check 2-6: 컴포넌트 — TrendChart

**탐지 명령어**:

Grep 패턴:
```
LineChart
```
```
일별|주별|월별
```

대상: `packages/dashboard/src/components/TrendChart.tsx`

**PASS 기준**: Recharts `LineChart` 사용, 일/주/월 인터벌 토글 존재
**FAIL 기준**: 차트 또는 토글 누락

#### Check 2-7: 컴포넌트 — PagesTable

**탐지 명령어**:

Grep 패턴:
```
onSelectPath
```
```
분석
```

대상: `packages/dashboard/src/components/PagesTable.tsx`

**PASS 기준**: 페이지별 테이블 + 분석 버튼 (이탈 스크롤 연동) 존재
**FAIL 기준**: 테이블 또는 분석 버튼 누락

#### Check 2-8: 컴포넌트 — ExitScrollChart

**탐지 명령어**:

Grep 패턴:
```
BarChart
```
```
평균|중앙값
```

대상: `packages/dashboard/src/components/ExitScrollChart.tsx`

**PASS 기준**: Recharts `BarChart` 사용, 평균/중앙값/총 건수 통계 표시
**FAIL 기준**: 차트 또는 통계 누락

---

### 영역 3: SDK — 환경 네이밍 컨벤션

#### Check 3-1: FlowInitOptions에 env 옵션

**탐지 명령어**:

Grep 패턴:
```
env\?.*"dev".*"staging".*"prod"
```

대상: `packages/sdk/src/core/client.ts`

**PASS 기준**: `env?: "dev" | "staging" | "prod"` 옵션 존재
**FAIL 기준**: env 옵션 미존재

#### Check 3-2: env에 따른 serviceKey suffix 부착

**탐지 명령어**:

Grep 패턴:
```
rawKey.*-.*env
```

대상: `packages/sdk/src/core/client.ts`

**PASS 기준**: `env`가 `dev`/`staging`이면 키에 `-dev`/`-staging` suffix 추가, `prod`이면 suffix 없음
**FAIL 기준**: suffix 로직 미구현

#### Check 3-3: shared 패키지 Environment 타입

**탐지 명령어**:

Grep 패턴:
```
export type Environment
```
```
export function buildServiceKey
```
```
export function parseServiceKey
```

대상: `packages/shared/src/types/services.ts`

**PASS 기준**: `Environment` 타입, `buildServiceKey`, `parseServiceKey` 3개 모두 export
**FAIL 기준**: 하나 이상 누락

---

### 영역 4: 프로젝트 설정

#### Check 4-1: 루트 dev:dashboard 스크립트

**탐지 명령어**:

Grep 패턴:
```
dev:dashboard
```

대상: `package.json`

**PASS 기준**: `"dev:dashboard": "pnpm --filter @flowmvp/dashboard dev"` 스크립트 존재
**FAIL 기준**: 스크립트 미등록

#### Check 4-2: 대시보드 환경 배지

**탐지 명령어**:

Grep 패턴:
```
env-badge
```

대상: `packages/dashboard/src/App.tsx`

Grep 패턴:
```
env-dev|env-staging|env-prod
```

대상: `packages/dashboard/src/index.css`

**PASS 기준**: App.tsx에 환경 배지 렌더링, CSS에 dev/staging/prod 색상 정의
**FAIL 기준**: 배지 또는 CSS 누락

---

## 출력 형식

```markdown
## 요구사항 만족도 검증 보고서

### 요약

| 영역 | 검사 수 | 통과 | 실패 | 만족도 |
|------|---------|------|------|--------|
| 백엔드 — 시계열 메트릭 API | 6 | X | Y | XX% |
| 프론트엔드 — 대시보드 | 8 | X | Y | XX% |
| SDK — 환경 네이밍 | 3 | X | Y | XX% |
| 프로젝트 설정 | 2 | X | Y | XX% |
| **전체** | **19** | **X** | **Y** | **XX%** |

### 상세 결과

| # | 영역 | 검사 | 상태 | 비고 |
|---|------|------|------|------|
| 1-1 | 백엔드 | getVisitorTrend 함수 | PASS/FAIL | ... |
| 1-2 | 백엔드 | SQL 구현 정확성 | PASS/FAIL | ... |
| ... | ... | ... | ... | ... |
```

## 예외사항

1. **런타임 테스트 제외** — 이 스킬은 코드 정적 검사만 수행. 실제 API 호출이나 브라우저 테스트는 범위 밖
2. **CSS 세부 스타일 제외** — 색상값, 폰트 크기 등 시각적 세부사항은 검증하지 않음
3. **테스트 데이터 제외** — DB에 테스트 데이터가 있는지 여부는 검증하지 않음
4. **Docker/인프라 제외** — Dockerfile, docker-compose.yml 등 인프라 파일은 별도 검증 영역
5. **pnpm-lock.yaml** — 자동 생성 파일이므로 내용 검증 제외
