# @flowmvp/sdk

FlowMVP 브라우저 SDK — React 앱에 분석 추적을 추가합니다.

## 설치

```bash
pnpm add @flowmvp/sdk
# 또는
npm install @flowmvp/sdk
```

> **Peer dependency**: React 18 또는 19가 필요합니다.

## 초기화

앱의 진입점(예: `main.tsx`)에서 `Flow.init()`을 호출합니다:

```tsx
import { Flow } from "@flowmvp/sdk";

Flow.init({
  serviceKey: "my-app",
  serverUrl: "http://localhost:3100",
});
```

초기화 시 자동으로:
1. 세션이 생성되거나 복원됩니다 (localStorage 기반, 30분 타임아웃)
2. 페이지뷰 추적이 시작됩니다
3. 스크롤 추적이 시작됩니다 (25%, 50%, 75%, 100% 마일스톤)
4. 이탈 추적이 시작됩니다 (`beforeunload` 이벤트)

## 옵션

`Flow.init()`에 전달하는 `FlowInitOptions` 인터페이스:

| 옵션 | 타입 | 필수 | 기본값 | 설명 |
|------|------|------|--------|------|
| `serviceKey` | `string` | O | — | 서비스 식별 키 (서버에서 자동 등록) |
| `serverUrl` | `string` | O | — | FlowMVP 서버 URL |
| `env` | `"dev" \| "staging" \| "prod"` | X | — | 환경 구분 (아래 참조) |
| `userId` | `string` | X | — | 사용자 식별자 (로그인 사용자 추적용) |
| `autoTrackPageView` | `boolean` | X | `true` | 페이지뷰 자동 추적 |
| `autoTrackScroll` | `boolean` | X | `true` | 스크롤 자동 추적 |
| `autoTrackExit` | `boolean` | X | `true` | 이탈 자동 추적 |

## 환경 구분 (dev/staging/prod)

`env` 옵션으로 환경별 데이터를 분리합니다:

```tsx
// 개발 환경 — serviceKey가 "my-app-dev"로 전송됨
Flow.init({
  serviceKey: "my-app",
  serverUrl: "http://localhost:3100",
  env: "dev",
});

// 스테이징 — "my-app-staging"
Flow.init({
  serviceKey: "my-app",
  serverUrl: "https://analytics.staging.example.com",
  env: "staging",
});

// 프로덕션 — "my-app" (suffix 없음)
Flow.init({
  serviceKey: "my-app",
  serverUrl: "https://analytics.example.com",
  env: "prod",
});
```

| env | 실제 전송되는 serviceKey |
|-----|------------------------|
| `"dev"` | `my-app-dev` |
| `"staging"` | `my-app-staging` |
| `"prod"` 또는 미지정 | `my-app` |

## 자동 추적 항목

### 페이지뷰 (`page_view`)

- 초기화 시 현재 페이지 자동 기록
- `setupRouterListener()`로 SPA 라우트 변경 감지 가능

### 스크롤 (`scroll`)

- 25%, 50%, 75%, 100% 마일스톤 도달 시 기록
- 3초 쓰로틀로 과도한 이벤트 방지

### 이탈 (`exit`)

- 페이지 이탈(`beforeunload`) 시 마지막 스크롤 위치 기록
- `navigator.sendBeacon` 사용으로 페이지 닫힘에서도 전송 보장

## 수동 이벤트 전송

자동 추적 외에 수동으로 제어할 수 있습니다:

```tsx
import { Flow } from "@flowmvp/sdk";

// 페이지뷰 수동 기록 (SPA 라우트 변경 시)
Flow.trackPageView();

// SPA 라우터 리스너 등록 (popstate 이벤트)
Flow.setupRouterListener();

// 스크롤 추적 시작/중지/리셋
Flow.startScrollTracking();
Flow.stopScrollTracking();
Flow.resetScrollTracking();

// 이탈 추적 시작/중지
Flow.startExitTracking();
Flow.stopExitTracking();

// SDK 종료 (모든 추적 중지 + 세션 종료)
Flow.destroy();
```

## 전송 방식

| 이벤트 | 전송 방법 | 이유 |
|--------|----------|------|
| 세션 시작, 페이지뷰, 스크롤 | `fetch` + `keepalive` | 일반 이벤트 전송 |
| 이탈, 세션 종료 | `navigator.sendBeacon` | 페이지 닫힘에서도 전송 보장 |

> SDK의 모든 네트워크/localStorage 호출은 `try-catch`로 감싸져 있어 분석 실패가 호스트 앱을 크래시하지 않습니다.
