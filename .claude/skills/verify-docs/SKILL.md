---
name: verify-docs
description: 사용자 가이드 문서의 완전성과 정확성을 검증합니다. 필수 문서 존재 여부, 코드와의 동기화 상태, 필수 섹션 포함 여부를 검사합니다.
---

# 문서 완전성 검증

## 목적

FlowMVP 프로젝트의 사용자 가이드 문서가 완전하고 코드와 동기화되어 있는지 검증합니다:

- 필수 문서 파일 존재 여부
- 각 문서의 필수 섹션 포함 여부
- API 문서와 실제 엔드포인트 동기화
- SDK 문서와 실제 옵션 동기화
- 환경변수 문서와 .env.example 동기화

## 실행 시점

- 문서 생성/수정 후 완전성 확인
- PR 생성 전 문서 커버리지 확인
- API나 SDK 옵션 변경 후 문서 동기화 확인

## 관련 파일

| File | Purpose |
|------|---------|
| `README.md` | 루트 프로젝트 소개 |
| `packages/sdk/README.md` | SDK 연동 가이드 |
| `packages/server/README.md` | 서버 설치/배포 가이드 |
| `packages/dashboard/README.md` | 대시보드 사용 가이드 |
| `packages/server/src/routes/*.ts` | API 엔드포인트 (동기화 대상) |
| `packages/sdk/src/core/client.ts` | SDK 옵션 (동기화 대상) |
| `packages/server/.env.example` | 환경변수 (동기화 대상) |

## 워크플로우

---

### 영역 1: 필수 문서 존재

#### Check 1-1: 루트 README.md 존재

Glob 패턴:
```
README.md
```

대상: 프로젝트 루트

**PASS 기준**: `README.md` 파일 존재
**FAIL 기준**: 파일 미존재

#### Check 1-2: SDK README 존재

Glob 패턴:
```
packages/sdk/README.md
```

**PASS 기준**: 파일 존재
**FAIL 기준**: 파일 미존재

#### Check 1-3: Server README 존재

Glob 패턴:
```
packages/server/README.md
```

**PASS 기준**: 파일 존재
**FAIL 기준**: 파일 미존재

#### Check 1-4: Dashboard README 존재

Glob 패턴:
```
packages/dashboard/README.md
```

**PASS 기준**: 파일 존재
**FAIL 기준**: 파일 미존재

---

### 영역 2: 루트 README 필수 섹션

#### Check 2-1: 프로젝트 소개 섹션

Grep 패턴:
```
# FlowMVP
```

대상: `README.md`

**PASS 기준**: 프로젝트 타이틀 존재
**FAIL 기준**: 타이틀 누락

#### Check 2-2: 퀵스타트 또는 설치 섹션

Grep 패턴:
```
## .*([Qq]uick\s*[Ss]tart|퀵스타트|설치|시작)
```

대상: `README.md`

**PASS 기준**: 설치/시작 관련 섹션 존재
**FAIL 기준**: 사용자가 시작하는 방법이 문서에 없음

#### Check 2-3: 프로젝트 구조 또는 패키지 설명

Grep 패턴:
```
## .*(구조|[Ss]tructure|패키지|[Pp]ackage)
```

대상: `README.md`

**PASS 기준**: 모노레포 구조 설명 존재
**FAIL 기준**: 패키지 구조 설명 없음

---

### 영역 3: SDK 문서 동기화

#### Check 3-1: SDK README에 초기화 예시

Grep 패턴:
```
Flow\.init|init\(
```

대상: `packages/sdk/README.md`

**PASS 기준**: `Flow.init()` 사용법 예시 존재
**FAIL 기준**: 초기화 방법 미기재

#### Check 3-2: SDK README에 env 옵션 설명

Grep 패턴:
```
env.*dev.*staging.*prod
```

대상: `packages/sdk/README.md`

**PASS 기준**: 환경 구분 옵션 설명 존재
**FAIL 기준**: env 옵션이 코드에 있지만 문서에 없음

#### Check 3-3: SDK README에 serviceKey 설명

Grep 패턴:
```
serviceKey|service.key|서비스.*키
```

대상: `packages/sdk/README.md`

**PASS 기준**: serviceKey 사용법 설명 존재
**FAIL 기준**: 핵심 옵션 설명 누락

---

### 영역 4: Server 문서 동기화

#### Check 4-1: Server README에 환경변수 목록

Grep 패턴:
```
DATABASE_URL|PORT|CORS_ORIGIN
```

대상: `packages/server/README.md`

**PASS 기준**: .env.example에 있는 주요 환경변수가 문서에 설명됨
**FAIL 기준**: 환경변수 설명 누락

#### Check 4-2: Server README에 API 엔드포인트 목록

Grep 패턴:
```
/api/metrics|/api/sessions|/api/events
```

대상: `packages/server/README.md`

**PASS 기준**: 주요 API 경로가 문서에 나열됨
**FAIL 기준**: API 엔드포인트 문서 누락

#### Check 4-3: Server README에 Docker 실행 방법

Grep 패턴:
```
docker.compose|docker compose
```

대상: `packages/server/README.md`

**PASS 기준**: Docker 실행 가이드 존재
**FAIL 기준**: Docker 설정이 있지만 문서에 설명 없음

---

### 영역 5: Dashboard 문서

#### Check 5-1: Dashboard README에 실행 방법

Grep 패턴:
```
dev:dashboard|pnpm.*dev|npm.*dev
```

대상: `packages/dashboard/README.md`

**PASS 기준**: 대시보드 실행 명령어 기재
**FAIL 기준**: 실행 방법 누락

#### Check 5-2: Dashboard README에 기능 설명

Grep 패턴:
```
히트맵|차트|통계|heatmap|chart|analytics
```

대상: `packages/dashboard/README.md`

**PASS 기준**: 대시보드 주요 기능 설명 존재
**FAIL 기준**: 기능 설명 없음

---

## 출력 형식

```markdown
## 문서 완전성 검증 보고서

### 요약

| 영역 | 검사 수 | 통과 | 실패 | 만족도 |
|------|---------|------|------|--------|
| 필수 문서 존재 | 4 | X | Y | XX% |
| 루트 README 섹션 | 3 | X | Y | XX% |
| SDK 문서 동기화 | 3 | X | Y | XX% |
| Server 문서 동기화 | 3 | X | Y | XX% |
| Dashboard 문서 | 2 | X | Y | XX% |
| **전체** | **15** | **X** | **Y** | **XX%** |

### 상세 결과

| # | 영역 | 검사 | 상태 | 비고 |
|---|------|------|------|------|
| 1-1 | 필수 문서 | 루트 README | PASS/FAIL | ... |
| ... | ... | ... | ... | ... |
```

## 예외사항

1. **CLAUDE.md** -- 이 스킬 범위 밖 (개발자 도구 설정 파일)
2. **FlowMVP_PRD_v1.md** -- PRD는 사용자 가이드가 아님
3. **SKILL.md 파일** -- 스킬 문서는 manage-skills 범위
4. **node_modules 내 README** -- 외부 패키지 무시
5. **인라인 코드 주석** -- TSDoc/JSDoc은 이 스킬 범위 밖
6. **CHANGELOG, LICENSE** -- 별도 관리 문서
