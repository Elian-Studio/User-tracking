---
name: generate-docs
description: 사용자 가이드 문서를 생성하거나 업데이트합니다. SDK 연동 가이드, 서버 설치, 대시보드 사용법, API 레퍼런스 등 프로젝트의 사용자 문서를 코드 기반으로 자동 생성합니다.
---

# 사용자 가이드 문서 생성

## 목적

FlowMVP 프로젝트의 사용자 가이드 문서를 코드에서 추출한 정보를 기반으로 생성/업데이트합니다:

- 루트 README.md (프로젝트 소개, 퀵스타트)
- SDK 연동 가이드 (React 앱에 SDK 설치 및 초기화)
- 서버 설치/배포 가이드 (PostgreSQL, 환경변수, Docker)
- 대시보드 사용 가이드 (기능 설명, 스크린샷 위치)
- API 레퍼런스 (엔드포인트, 요청/응답 형식)

## 실행 시점

- 새 기능 구현 후 문서 업데이트 필요 시
- 최초 문서 생성 시
- API 엔드포인트 추가/변경 후
- SDK 옵션 추가/변경 후

## 관련 파일

### 소스 (읽기 대상)

| File | Purpose |
|------|---------|
| `packages/sdk/src/core/client.ts` | SDK 초기화 옵션 (FlowInitOptions) |
| `packages/sdk/src/core/transport.ts` | SDK 전송 방식 (fetch, sendBeacon) |
| `packages/sdk/src/trackers/*.ts` | 트래커 목록 (pageview, scroll, exit) |
| `packages/server/src/routes/*.ts` | API 엔드포인트 정의 |
| `packages/server/src/services/*.ts` | 서비스 로직 |
| `packages/server/src/db/migrations/*.sql` | DB 스키마 |
| `packages/server/.env.example` | 환경변수 목록 |
| `packages/dashboard/src/App.tsx` | 대시보드 기능 구조 |
| `packages/dashboard/src/components/*.tsx` | 대시보드 컴포넌트 |
| `packages/shared/src/**/*.ts` | 공유 타입 및 상수 |
| `docker-compose.yml` | Docker 실행 설정 |
| `package.json` | 루트 스크립트 |

### 출력 (쓰기 대상)

| File | Purpose |
|------|---------|
| `README.md` | 프로젝트 루트 소개 |
| `packages/sdk/README.md` | SDK 연동 가이드 |
| `packages/server/README.md` | 서버 설치/배포 가이드 |
| `packages/dashboard/README.md` | 대시보드 사용 가이드 |
| `docs/api-reference.md` | API 레퍼런스 (선택) |

## 워크플로우

### Step 1: 코드 분석

소스 파일에서 문서에 필요한 정보를 추출합니다:

#### 1a. SDK 옵션 추출

Grep 패턴:
```
interface FlowInitOptions
```

대상: `packages/sdk/src/core/client.ts`

추출 항목:
- 초기화 옵션 (serviceKey, env 등)
- 트래커 목록 (pageview, scroll, exit)

#### 1b. API 엔드포인트 추출

Grep 패턴:
```
app\.(get|post|put|delete)
```

대상: `packages/server/src/routes/*.ts`

추출 항목:
- HTTP 메서드 + 경로
- Query/Body 인터페이스
- 응답 형식

#### 1c. 환경변수 추출

대상: `packages/server/.env.example`

추출 항목:
- 변수명, 기본값, 설명

#### 1d. 스크립트 추출

대상: `package.json` (루트)

추출 항목:
- 빌드/개발 명령어

### Step 2: 문서 생성/업데이트

각 대상 파일에 대해:

1. 파일이 존재하면 → 기존 내용 읽고, 변경이 필요한 섹션만 업데이트
2. 파일이 없으면 → 템플릿 기반으로 신규 생성

#### README.md 템플릿 구조

```markdown
# FlowMVP

경량 웹 분석 시스템 — Google Analytics 대체

## 기능
## 퀵스타트
## 프로젝트 구조
## 개발 환경 설정
## 스크립트
## 라이선스
```

#### SDK README 템플릿 구조

```markdown
# @flowmvp/sdk

## 설치
## 초기화
## 옵션
## 환경 구분 (dev/staging/prod)
## 자동 추적 항목
## 수동 이벤트 전송
```

#### Server README 템플릿 구조

```markdown
# @flowmvp/server

## 요구사항
## 설치
## 환경변수
## Docker 실행
## API 엔드포인트
## 데이터베이스 스키마
```

#### Dashboard README 템플릿 구조

```markdown
# @flowmvp/dashboard

## 실행
## 기능
## 컴포넌트 설명
## 개발
```

### Step 3: 사용자 확인

생성/업데이트할 파일 목록과 변경 내용 요약을 표시하고 AskUserQuestion으로 확인합니다.

### Step 4: 파일 쓰기

승인된 파일만 Write 도구로 생성/업데이트합니다.

## 출력 형식

```markdown
### generate-docs 결과

| 파일 | 액션 | 상세 |
|------|------|------|
| README.md | CREATE/UPDATE | 섹션 N개 생성 |
| packages/sdk/README.md | CREATE/UPDATE | ... |
| ... | ... | ... |
```

## 예외사항

1. **CLAUDE.md** -- 이 스킬의 범위 밖 (manage-skills가 관리)
2. **FlowMVP_PRD_v1.md** -- PRD는 수정하지 않음
3. **node_modules 내 README** -- 무시
4. **.claude/skills/*/SKILL.md** -- 스킬 문서는 manage-skills가 관리
5. **CHANGELOG, LICENSE** -- 이 스킬 범위 밖
6. **코드 주석** -- 인라인 문서는 이 스킬 범위 밖
