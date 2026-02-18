---
name: verify-build
description: Turborepo 빌드 및 타입체크 검증. 모든 패키지가 오류 없이 빌드되고 TypeScript 타입이 통과하는지 확인합니다.
disable-model-invocation: true
---

# 빌드 검증

## 목적

Turborepo 모노레포의 빌드 체인과 타입 안전성을 검증합니다:

- 빌드 순서 (`shared` → `sdk` + `server`) 준수 확인
- TypeScript 컴파일 오류 검출
- 모든 패키지의 `dist/` 출력 생성 확인

## 실행 시점

- 새로운 코드를 작성한 후
- 타입 정의를 변경한 후
- 패키지 간 의존성을 수정한 후
- PR 생성 전 최종 확인

## 관련 파일

| File | Purpose |
|------|---------|
| `packages/shared/src/**/*.ts` | Foundation 타입 및 상수 |
| `packages/sdk/src/**/*.ts` | 브라우저 SDK 클라이언트 |
| `packages/server/src/**/*.ts` | Fastify API 서버 |
| `packages/*/tsconfig.json` | 각 패키지 TypeScript 설정 |
| `turbo.json` | Turborepo 파이프라인 설정 |

## 워크플로우

### Check 1: TypeScript 타입체크

**명령어:**

```bash
pnpm typecheck
```

**PASS 기준**: 종료 코드 0, 오류 메시지 없음
**FAIL 기준**: TypeScript 컴파일 오류 발생

### Check 2: 전체 빌드

**명령어:**

```bash
pnpm build
```

**PASS 기준**: 종료 코드 0, 모든 패키지의 `dist/` 디렉토리 생성
**FAIL 기준**: 빌드 오류 또는 `dist/` 누락

### Check 3: dist 출력 확인

**탐지 명령어:**

```bash
ls packages/shared/dist/ packages/sdk/dist/ packages/server/dist/
```

**PASS 기준**: 3개 패키지 모두 `dist/` 디렉토리에 파일 존재
**FAIL 기준**: 하나 이상의 패키지에서 `dist/` 누락 또는 빈 디렉토리

## 출력 형식

```markdown
### verify-build 결과

| 검사 | 상태 | 상세 |
|------|------|------|
| TypeScript 타입체크 | PASS/FAIL | 오류 내용 |
| 전체 빌드 | PASS/FAIL | 오류 내용 |
| dist 출력 확인 | PASS/FAIL | 누락 패키지 |
```

## 예외사항

1. `pnpm clean` 직후 `dist/` 부재는 정상 — 빌드 전이므로 Check 3만 면제
2. `DATABASE_URL` 미설정 시 서버 런타임 오류는 이 스킬 범위 밖
3. 개발 중 watch 모드(`pnpm dev:server`) 상태에서의 부분 빌드는 검증 대상 아님
