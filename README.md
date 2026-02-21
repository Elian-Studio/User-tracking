# FlowMVP

경량 웹 분석 시스템 — Google Analytics 대체

여러 React 프로젝트의 방문자 행동(페이지뷰, 스크롤, 이탈)을 수집하고 대시보드에서 시각화합니다.

## 기능

- **페이지뷰 추적** — 페이지 방문 및 SPA 라우트 변경 자동 감지
- **스크롤 추적** — 25%, 50%, 75%, 100% 마일스톤 도달 기록
- **이탈 추적** — 페이지 이탈 시 마지막 스크롤 위치 기록 (`sendBeacon` 사용)
- **멀티 테넌트** — `serviceKey`로 여러 프로젝트를 하나의 서버에서 관리
- **환경 분리** — `dev` / `staging` / `prod` 환경별 데이터 격리
- **분석 대시보드** — UV/PV 추이, 페이지별 통계, 이탈 스크롤 분석, 히트맵

## 퀵스타트

### 1. 저장소 클론 및 의존성 설치

```bash
git clone <repository-url>
cd flowmvp
pnpm install
```

### 2. 서버 + DB 실행 (Docker)

```bash
docker compose up -d
```

PostgreSQL과 API 서버가 함께 시작됩니다. 서버: `http://localhost:3100`

### 3. SDK 연동 (클라이언트 앱)

```tsx
import { Flow } from "@flowmvp/sdk";

Flow.init({
  serviceKey: "my-app",
  serverUrl: "http://localhost:3100",
});
```

### 4. 대시보드 실행

```bash
pnpm dev:dashboard
```

`http://localhost:5173`에서 분석 대시보드를 확인합니다.

## 프로젝트 구조

```
flowmvp/
├── packages/
│   ├── shared/       # 공유 타입 및 상수 (@flowmvp/shared)
│   ├── sdk/          # 브라우저 SDK (@flowmvp/sdk)
│   ├── server/       # Fastify API 서버 (@flowmvp/server)
│   └── dashboard/    # React 분석 대시보드 (@flowmvp/dashboard)
├── docker-compose.yml
├── turbo.json
└── package.json
```

| 패키지 | 설명 |
|--------|------|
| `@flowmvp/shared` | `AnalyticsEvent`, `Session`, `Service` 타입 및 상수 (세션 타임아웃 30분, 스크롤 마일스톤 등) |
| `@flowmvp/sdk` | `Flow.init()`으로 세션 관리 및 자동 추적 시작. `fetch` + `sendBeacon` 전송 |
| `@flowmvp/server` | Fastify v5 API 서버. PostgreSQL에 이벤트 저장, 메트릭 API 제공 |
| `@flowmvp/dashboard` | Vite + React + Recharts 기반 분석 대시보드 |

**데이터 흐름**: SDK → HTTP/beacon → Server → PostgreSQL → Dashboard

## 개발 환경 설정

### 요구사항

- Node.js 18+
- pnpm 10+
- Docker (PostgreSQL 실행용)

### 로컬 개발 (Docker 없이)

```bash
# 1. 환경변수 설정
cp packages/server/.env.example packages/server/.env
# .env에서 DATABASE_URL을 로컬 PostgreSQL에 맞게 수정

# 2. 빌드
pnpm build

# 3. 서버 실행 (hot reload)
pnpm dev:server

# 4. 대시보드 실행 (별도 터미널)
pnpm dev:dashboard
```

## 스크립트

| 명령어 | 설명 |
|--------|------|
| `pnpm build` | 전체 패키지 빌드 (Turbo, 의존성 순서 준수) |
| `pnpm dev:server` | Fastify 서버 실행 (tsx watch, hot reload) |
| `pnpm dev:dashboard` | 대시보드 개발 서버 실행 (Vite) |
| `pnpm build:shared` | @flowmvp/shared만 빌드 |
| `pnpm build:sdk` | @flowmvp/sdk만 빌드 |
| `pnpm build:server` | @flowmvp/server만 빌드 |
| `pnpm typecheck` | 전체 패키지 타입 검사 |
| `pnpm clean` | dist/ 및 tsbuildinfo 제거 |

빌드 순서: `shared` → `sdk` + `server` (병렬)

## 라이선스

MIT
