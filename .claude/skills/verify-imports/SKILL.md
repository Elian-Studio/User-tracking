---
name: verify-imports
description: ES 모듈 임포트 규칙 검증. 상대 경로 임포트에 .js 확장자가 포함되어 있는지, 크로스 패키지 임포트가 @flowmvp/ 워크스페이스 프로토콜을 사용하는지 확인합니다.
disable-model-invocation: true
---

# 임포트 규칙 검증

## 목적

FlowMVP 모노레포의 ES 모듈 임포트 규칙 준수를 검증합니다:

- 상대 경로 임포트에 `.js` 확장자 필수 (ESM + bundler moduleResolution 요구사항)
- 크로스 패키지 임포트는 `@flowmvp/shared` 워크스페이스 프로토콜 사용
- 외부 패키지 임포트는 `package.json` dependencies에 등록된 것만 허용

## 실행 시점

- 새로운 파일을 추가하거나 임포트를 수정한 후
- 패키지 간 의존성을 변경한 후
- PR 생성 전 최종 확인

## 관련 파일

| File | Purpose |
|------|---------|
| `packages/shared/src/**/*.ts` | Foundation 타입 및 상수 |
| `packages/sdk/src/**/*.ts` | 브라우저 SDK 클라이언트 |
| `packages/server/src/**/*.ts` | Fastify API 서버 |
| `packages/*/package.json` | 패키지 의존성 선언 |

## 워크플로우

### Check 1: 상대 경로 임포트 .js 확장자 확인

**탐지 명령어**: 모든 `.ts` 파일에서 상대 경로 임포트를 검색하고 `.js` 확장자가 없는 것을 찾습니다.

Grep 패턴:
```
from\s+["']\./[^"']+(?<!\.js)["']
```

대상: `packages/*/src/**/*.ts`

**PASS 기준**: `.js` 확장자 없는 상대 경로 임포트가 0건
**FAIL 기준**: `.js` 확장자가 누락된 상대 경로 임포트 발견

**예시:**
```typescript
// PASS
import { AnalyticsEvent } from "./types/events.js";

// FAIL
import { AnalyticsEvent } from "./types/events";
import { AnalyticsEvent } from "./types/events.ts";
```

### Check 2: 크로스 패키지 임포트 규칙

**탐지 명령어**: `../` 를 사용한 패키지 경계 횡단 임포트를 검색합니다.

Grep 패턴:
```
from\s+["']\.\.\/\.\.\/
```

대상: `packages/*/src/**/*.ts`

**PASS 기준**: 패키지 경계를 넘는 상대 경로 임포트 0건 (모두 `@flowmvp/` 사용)
**FAIL 기준**: `../../` 로 다른 패키지를 참조하는 임포트 발견

**예시:**
```typescript
// PASS
import { SESSION_TIMEOUT } from "@flowmvp/shared";

// FAIL
import { SESSION_TIMEOUT } from "../../shared/src/constants";
```

### Check 3: @flowmvp/shared 임포트 일관성

**탐지 명령어**: `sdk` 와 `server` 패키지에서 `@flowmvp/shared` 임포트를 확인합니다.

Grep 패턴:
```
from\s+["']@flowmvp/shared["']
```

대상: `packages/sdk/src/**/*.ts`, `packages/server/src/**/*.ts`

**PASS 기준**: shared 타입/상수를 사용하는 파일이 모두 `@flowmvp/shared`에서 임포트
**FAIL 기준**: shared의 타입을 직접 재정의하거나 상대 경로로 참조

## 출력 형식

```markdown
### verify-imports 결과

| 검사 | 상태 | 상세 |
|------|------|------|
| .js 확장자 | PASS/FAIL | N건 누락 |
| 크로스 패키지 임포트 | PASS/FAIL | N건 위반 |
| @flowmvp/shared 일관성 | PASS/FAIL | N건 이슈 |
```

## 예외사항

1. `node_modules` 내 파일은 검사 대상 아님
2. `.d.ts` 선언 파일의 임포트는 면제
3. `package.json` 의 `"type": "module"` 선언은 이 스킬에서 검증하지 않음 (정적 설정)
4. 테스트 파일(`*.test.ts`, `*.spec.ts`)의 테스트 프레임워크 임포트는 면제
