# @flowmvp/server

FlowMVP API 서버 — SDK에서 전송된 분석 이벤트를 수신하고, 메트릭 API를 제공합니다.

## 요구사항

- Node.js 18+
- PostgreSQL 16+

## 설치

```bash
# 프로젝트 루트에서
pnpm install

# 환경변수 설정
cp packages/server/.env.example packages/server/.env
```

## 환경변수

| 변수 | 기본값 | 설명 |
|------|--------|------|
| `DATABASE_URL` | — | PostgreSQL 연결 문자열 (예: `postgres://user:password@localhost:5432/flowmvp`) |
| `PORT` | `3100` | 서버 포트 |
| `CORS_ORIGIN` | `http://localhost:3000` | CORS 허용 출처 |

## Docker 실행

`docker compose`로 PostgreSQL + 서버를 한 번에 실행합니다:

```bash
# 시작 (백그라운드)
docker compose up -d

# 로그 확인
docker compose logs -f server

# 종료 (데이터 유지)
docker compose down

# 종료 (데이터 포함 초기화)
docker compose down -v
```

Docker Compose 구성:
- **postgres**: PostgreSQL 16 Alpine, 포트 5432, 마이그레이션 자동 실행
- **server**: 빌드 후 포트 3100, postgres 헬스체크 대기 후 시작

## API 엔드포인트

### 데이터 수집 API

SDK에서 호출하는 엔드포인트입니다. 직접 호출할 필요는 없습니다.

| 메서드 | 경로 | 설명 |
|--------|------|------|
| POST | `/api/sessions/start` | 세션 시작 |
| POST | `/api/sessions/end` | 세션 종료 |
| POST | `/api/events` | 이벤트 기록 (page_view, scroll, exit) |

### 메트릭 API

대시보드 및 외부 시스템에서 호출하는 조회 API입니다.

#### `GET /api/metrics/overview`

기간별 UV, PV, 이탈률 요약을 반환합니다.

```
GET /api/metrics/overview?serviceKey=my-app&startDate=2026-02-01T00:00:00Z&endDate=2026-02-28T23:59:59Z
```

```json
{
  "uv": 150,
  "pv": 420,
  "bounceRate": 33
}
```

#### `GET /api/metrics/trend`

일별/주별/월별 UV, PV 추이를 반환합니다.

```
GET /api/metrics/trend?serviceKey=my-app&startDate=2026-02-01T00:00:00Z&endDate=2026-02-28T23:59:59Z&interval=day
```

| 파라미터 | 타입 | 기본값 | 설명 |
|---------|------|--------|------|
| `serviceKey` | string | — | 서비스 키 |
| `startDate` | string | — | 시작 날짜 (ISO 8601) |
| `endDate` | string | — | 종료 날짜 (ISO 8601) |
| `interval` | string | `"day"` | 집계 단위: `day`, `week`, `month`, `hour` |
| `timezone` | string | `"UTC"` | IANA 타임존 이름. `interval=hour`일 때만 시간 경계 계산에 반영됨 — day/week/month는 DB 세션 타임존(UTC) 기준 그대로 |

```json
{
  "interval": "day",
  "timezone": "UTC",
  "data": [
    { "date": "2026-02-01", "uv": 150, "pv": 420 },
    { "date": "2026-02-02", "uv": 135, "pv": 380 }
  ]
}
```

`interval=hour`일 때는 `date` 필드가 `"2026-02-01T09:00:00"` 형태(로컬 벽시계 문자열, 끝에 `Z` 없음)로 바뀐다 — UTC 인스턴트가 아니므로 클라이언트에서 `new Date()`로 재파싱하면 안 된다.

#### `GET /api/metrics/pages`

페이지별 조회수 및 순방문자수를 반환합니다.

```
GET /api/metrics/pages?serviceKey=my-app&startDate=2026-02-01T00:00:00Z&endDate=2026-02-28T23:59:59Z
```

```json
[
  { "path": "/", "views": 200, "unique_views": 80 },
  { "path": "/about", "views": 50, "unique_views": 30 }
]
```

#### `GET /api/metrics/bounce-rate`

특정 페이지의 이탈률을 반환합니다.

```
GET /api/metrics/bounce-rate?serviceKey=my-app&path=/&startDate=2026-02-01T00:00:00Z&endDate=2026-02-28T23:59:59Z
```

```json
{
  "path": "/",
  "bounceRate": 0.45
}
```

#### `GET /api/metrics/exit-scroll`

특정 페이지의 스크롤 구간별 이탈 분포를 반환합니다.

```
GET /api/metrics/exit-scroll?serviceKey=my-app&path=/&startDate=2026-02-01T00:00:00Z&endDate=2026-02-28T23:59:59Z
```

```json
{
  "path": "/",
  "distribution": [
    { "range": "0-10", "count": 5, "percent": 25 },
    { "range": "11-20", "count": 3, "percent": 15 }
  ],
  "average": 44,
  "median": 35,
  "total": 20
}
```

## 데이터베이스 스키마

3개 테이블로 구성됩니다. 마이그레이션: `src/db/migrations/001_init.sql`

### `services`

서비스(프로젝트) 등록 테이블. 첫 이벤트 수신 시 자동 생성됩니다.

| 컬럼 | 타입 | 설명 |
|------|------|------|
| `id` | SERIAL PK | 서비스 ID |
| `name` | VARCHAR(255) | 서비스명 |
| `service_key` | VARCHAR(255) UNIQUE | 서비스 키 |
| `created_at` | TIMESTAMPTZ | 생성일시 |

### `sessions`

사용자 세션 테이블.

| 컬럼 | 타입 | 설명 |
|------|------|------|
| `id` | UUID PK | 세션 ID |
| `service_id` | INTEGER FK | 서비스 참조 |
| `user_id` | VARCHAR(255) | 사용자 식별자 |
| `ip_address` | INET | IP 주소 |
| `user_agent` | TEXT | 브라우저 UA |
| `referrer` | TEXT | 유입 경로 |
| `started_at` | TIMESTAMPTZ | 세션 시작 |
| `ended_at` | TIMESTAMPTZ | 세션 종료 |

### `events`

분석 이벤트 테이블.

| 컬럼 | 타입 | 설명 |
|------|------|------|
| `id` | BIGSERIAL PK | 이벤트 ID |
| `service_id` | INTEGER FK | 서비스 참조 |
| `session_id` | UUID FK | 세션 참조 |
| `type` | VARCHAR(20) | 이벤트 타입: `page_view`, `scroll`, `exit` |
| `path` | TEXT | 페이지 경로 |
| `referrer` | TEXT | 유입 경로 |
| `scroll_percent` | SMALLINT | 스크롤 위치 (%) |
| `utm_source` | VARCHAR(255) | UTM 소스 |
| `utm_medium` | VARCHAR(255) | UTM 매체 |
| `utm_campaign` | VARCHAR(255) | UTM 캠페인 |
| `utm_term` | VARCHAR(255) | UTM 키워드 |
| `utm_content` | VARCHAR(255) | UTM 콘텐츠 |
| `created_at` | TIMESTAMPTZ | 생성일시 |

인덱스: `service_id`, `session_id`, `type`, `created_at` (events), `service_id`, `started_at` (sessions)
