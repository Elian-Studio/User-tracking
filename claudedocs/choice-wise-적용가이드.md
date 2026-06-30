# choice-wise 분석(FlowMVP) 적용 가이드

choice-wise 앱에 방문자 분석(페이지뷰·스크롤·이탈)을 붙이는 방법입니다.
**서비스 사전 등록은 필요 없습니다** — 첫 이벤트가 들어오면 서버가 `serviceKey`를 자동 등록합니다.

## 1. SDK 추가

`@flowmvp/sdk` 패키지를 의존성으로 추가합니다. (사내 배포본 또는 빌드된 dist)

## 2. 앱 진입점에서 1회 초기화

`main.tsx`(또는 최상위 진입점) 맨 위에 추가:

```tsx
import { Flow } from "@flowmvp/sdk";

Flow.init({
  serviceKey: "choice-wise",        // 우리 서비스 식별자 (고정)
  serverUrl: "https://<분석서버주소>", // 운영자에게 전달받기
  env: "prod",                       // dev | staging | prod
});
```

- `init` 호출만으로 페이지뷰·스크롤(25/50/75/100%)·이탈이 **자동 추적**됩니다.
- `env`가 prod가 아니면 키에 자동으로 붙어(`choice-wise-dev`) 환경별 데이터가 분리됩니다.
- 로그인 사용자를 구분하려면 `userId: "<유저ID>"`를 추가하세요(선택).

## 3. SPA 라우터 연동 (React Router 등)

라우트가 바뀔 때 페이지뷰를 다시 잡으려면 1회 등록:

```tsx
Flow.setupRouterListener();
```

## 4. ⚠️ CORS 등록 요청 (필수)

분석 서버는 **허용된 origin만** 이벤트를 받습니다(현재 단일 origin).
choice-wise 도메인 `https://choicewise.kr`을
**분석 서버 운영자에게 전달**해 `CORS_ORIGIN`에 등록받으세요.
등록 전에는 브라우저 CORS 정책으로 이벤트 전송이 차단됩니다.

## 체크리스트

- [ ] `@flowmvp/sdk` 추가
- [ ] 진입점에 `Flow.init({ serviceKey: "choice-wise", serverUrl, env })`
- [ ] (SPA면) `Flow.setupRouterListener()`
- [ ] `https://choicewise.kr` 도메인을 운영자에게 전달해 CORS 등록
- [ ] 배포 후 대시보드에서 `choice-wise` 데이터 유입 확인
