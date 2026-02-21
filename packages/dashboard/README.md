# @flowmvp/dashboard

FlowMVP 분석 대시보드 — 수집된 메트릭을 시각화합니다.

## 실행

```bash
# 프로젝트 루트에서
pnpm dev:dashboard

# 또는 패키지 디렉토리에서
pnpm dev
```

`http://localhost:5173`에서 접속합니다. API 서버(`http://localhost:3100`)가 실행 중이어야 합니다.

> Vite 프록시가 `/api` 요청을 `http://localhost:3100`으로 전달하므로 CORS 설정이 불필요합니다.

## 기능

### 필터 패널

- **Service Key** — 조회할 서비스 키 입력
- **사이트 URL** — 히트맵 iframe에 사용할 사이트 URL
- **기간 선택** — 시작일/종료일 날짜 선택
- **환경 배지** — 서비스 키에 따라 DEV/STAGING/PROD 배지 자동 표시

### 개요 카드

UV(순방문자), PV(페이지뷰), Bounce Rate(이탈률) 3개 지표를 카드로 표시합니다.

### 방문자 추이 차트

일별/주별/월별 UV, PV 추이를 라인 차트로 시각화합니다. 인터벌 토글로 전환 가능합니다.

### 페이지별 통계 테이블

경로별 조회수(Views)와 순방문수(UV)를 테이블로 표시합니다. 각 행에서:
- **분석** 버튼 — 해당 경로의 이탈 스크롤 분석 차트를 열기
- **히트맵** 버튼 — 해당 경로의 스크롤 히트맵 모달을 열기

### 이탈 스크롤 분석

선택한 페이지의 스크롤 구간별(0-10%, 11-20%, ...) 이탈 수를 바 차트로 시각화합니다. 평균, 중앙값, 총 이탈 건수를 함께 표시합니다.

### 스크롤 히트맵

선택한 페이지의 실제 사이트를 iframe으로 로드하고, 스크롤 구간별 이탈 밀도를 색상 오버레이로 시각화합니다.
- 녹색(낮은 이탈) → 빨간색(높은 이탈) 그라데이션
- 우측 범례에 이탈 통계 및 URL 정보 표시
- iframe 차단 시 안내 메시지 표시

## 컴포넌트 설명

| 컴포넌트 | API 호출 | 시각화 |
|----------|---------|--------|
| `OverviewCards` | `/api/metrics/overview` | UV, PV, Bounce Rate 숫자 카드 |
| `TrendChart` | `/api/metrics/trend` | 일/주/월 토글 + UV/PV 라인 차트 (Recharts `LineChart`) |
| `PagesTable` | `/api/metrics/pages` | 경로별 조회수 테이블 + 분석/히트맵 버튼 |
| `ExitScrollChart` | `/api/metrics/exit-scroll` | 스크롤 구간별 이탈 바 차트 (Recharts `BarChart`) + 통계 |
| `ScrollHeatmap` | `/api/metrics/exit-scroll` | iframe + 색상 오버레이 히트맵 모달 |

## 개발

### 기술 스택

- **Vite** — 번들러 + 개발 서버
- **React 18** — UI
- **Recharts** — 차트 (LineChart, BarChart)
- **TypeScript** — 타입 안전성

### 파일 구조

```
packages/dashboard/
├── package.json
├── tsconfig.json
├── vite.config.ts
├── index.html
└── src/
    ├── main.tsx          # 진입점
    ├── App.tsx           # 메인 레이아웃 + 필터 + 상태 관리
    ├── api.ts            # API 클라이언트 (fetchOverview, fetchTrend, fetchPages, fetchExitScroll)
    ├── index.css         # 전역 스타일
    └── components/
        ├── OverviewCards.tsx
        ├── TrendChart.tsx
        ├── PagesTable.tsx
        ├── ExitScrollChart.tsx
        └── ScrollHeatmap.tsx
```

### 빌드

```bash
pnpm build    # TypeScript 컴파일 + Vite 빌드
```
