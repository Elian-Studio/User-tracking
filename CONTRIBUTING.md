# Contributing to FlowMVP

## Git 전략: GitHub Flow

`main` 브랜치는 항상 배포 가능한 상태를 유지합니다. 모든 작업은 feature 브랜치에서 진행하고 PR을 통해 main에 머지합니다.

```
main (always deployable)
 │
 ├── feat/scroll-heatmap
 ├── fix/session-timeout
 └── docs/api-reference
```

## 브랜치 규칙

### main 브랜치

- **직접 push 금지** — 반드시 PR을 통해 머지
- 항상 빌드 가능하고 배포 가능한 상태 유지
- squash merge만 사용 (커밋 히스토리 정리)

### Feature 브랜치

`main`에서 분기하여 작업 후 PR로 머지합니다.

**네이밍 컨벤션:**

| 접두사 | 용도 | 예시 |
|--------|------|------|
| `feat/` | 새 기능 | `feat/scroll-heatmap` |
| `fix/` | 버그 수정 | `fix/session-timeout` |
| `refactor/` | 코드 개선 | `refactor/metrics-service` |
| `docs/` | 문서 변경 | `docs/api-reference` |
| `chore/` | 설정/빌드 | `chore/ci-pipeline` |
| `test/` | 테스트 추가 | `test/metrics-api` |

**규칙:**
- 소문자 + 하이픈 사용 (`feat/my-feature`)
- 작업 완료 후 브랜치 삭제
- 하나의 브랜치에 하나의 목적

## 작업 흐름

### 1. 브랜치 생성

```bash
git checkout main
git pull origin main
git checkout -b feat/feature-name
```

### 2. 작업 + 커밋

```bash
# 작업 후 관련 파일만 스테이징
git add packages/server/src/routes/metrics.ts
git commit -m "feat(metrics): add trend API endpoint"
```

### 3. 푸시 + PR 생성

```bash
git push -u origin feat/feature-name
gh pr create --base main --title "feat(metrics): add trend API" --body "..."
```

### 4. 리뷰 + 머지

- PR 리뷰 완료 후 **Squash and merge**
- 머지 후 feature 브랜치 자동 삭제

### 5. 로컬 정리

```bash
git checkout main
git pull origin main
git branch -d feat/feature-name
```

## 커밋 메시지

[Conventional Commits](https://www.conventionalcommits.org/) 형식을 따릅니다.

```
<type>(<scope>): <description>

<body>
```

### Type

| type | 설명 |
|------|------|
| `feat` | 새 기능 |
| `fix` | 버그 수정 |
| `refactor` | 동작 변경 없는 코드 개선 |
| `docs` | 문서 변경 |
| `style` | 포맷, 린트, 스타일 |
| `test` | 테스트 추가/수정 |
| `chore` | 빌드, 설정, 의존성 |
| `perf` | 성능 개선 |

### Scope

패키지명 또는 모듈명을 사용합니다.

| scope | 대상 |
|-------|------|
| `sdk` | `packages/sdk/` |
| `server` | `packages/server/` |
| `dashboard` | `packages/dashboard/` |
| `shared` | `packages/shared/` |
| `metrics` | 메트릭 관련 (서비스/라우트) |
| `deps` | 의존성 변경 |
| 생략 | 전체 프로젝트 또는 루트 설정 |

### 예시

```
feat(dashboard): add scroll heatmap component
fix(sdk): prevent session creation on SSR
refactor(server): extract bounce rate calculation
docs: add SDK integration guide
chore(deps): bump recharts to 2.15
```

## Pull Request

### 제목

커밋 메시지와 동일한 형식: `type(scope): description`

### 본문 템플릿

```markdown
## Summary
- 변경 내용 1-3줄 요약

## Changes
- 구체적 변경 사항 목록

## Test
- [ ] `pnpm typecheck` 통과
- [ ] `pnpm build` 성공
- [ ] `pnpm test` 통과 (Vitest, CI에서 자동 실행 — `TESTING.md` 참고)
```

### 머지 규칙

- **Squash and merge** 사용 (feature 브랜치의 여러 커밋을 하나로 압축)
- 머지 커밋 메시지는 PR 제목을 사용
- 머지 후 feature 브랜치 삭제

## 배포

### 현재 (MVP 단계)

```bash
# Docker로 로컬/스테이징 배포
docker compose up --build -d
```

### 향후 (CI/CD 도입 시)

```
main에 머지 → CI 자동 실행 (typecheck + build) → 배포
```

## 코드 품질 체크리스트

PR 머지 전 확인 항목:

- [ ] `pnpm typecheck` — 타입 에러 없음
- [ ] `pnpm build` — 빌드 성공
- [ ] `pnpm test` — 테스트 통과 (CI에서 자동 실행)
- [ ] ES module import에 `.js` 확장자 포함
- [ ] `@flowmvp/shared`를 통한 cross-package import
- [ ] SDK: try-catch로 호스트 앱 크래시 방지
- [ ] Server: SQL injection 방지 (tagged template 사용)
- [ ] 민감 정보 (.env, credentials) 커밋하지 않음
