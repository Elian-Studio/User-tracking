# FlowMVP PRD

Version: 1.0 (MVP - Multi Service Ready) Owner: 성민 방 Last Updated:
2026-02-18

------------------------------------------------------------------------

# 1. Overview

## 1.1 Background

FlowMVP는 여러 React 기반 개인 프로젝트에서 공통으로 사용할 수 있는 경량
Analytics 시스템이다.

Google Analytics와 같은 외부 솔루션 대신, 직접 제어 가능하고 확장 가능한
내부 분석 시스템을 구축한다.

초기에는 단일 서버(Option A) 구조로 시작하며, 향후 통계 전용 서비스로
확장 가능하도록 설계한다.

------------------------------------------------------------------------

# 2. Goals

## Primary Goals

-   여러 서비스에서 공통 사용 가능
-   서비스별 방문 통계 분리
-   세션 기반 방문자 추적
-   페이지 이동 및 이탈 분석
-   로그인 사용자 행동 분석 (선택)
-   향후 통계 서비스로 확장 가능

## Non-Goals (MVP 제외)

-   실시간 스트리밍 분석
-   세션 리플레이
-   히트맵
-   A/B 테스트
-   분산 아키텍처(Kafka 등)

------------------------------------------------------------------------

# 3. System Architecture (MVP)

Service A (React) Service B (React) Service C (React) ↓ Single Analytics
Server (Node + Fastify) ↓ PostgreSQL

------------------------------------------------------------------------

# 4. Core Concepts

## 4.1 serviceKey

각 서비스는 고유한 serviceKey를 가진다.

``` ts
Flow.init({
  serviceKey: "escape-homepage",
  userId: optionalUserId
});
```

서버는 serviceKey를 기준으로 데이터를 분리한다.

------------------------------------------------------------------------

# 5. Functional Requirements

## 5.1 Session Tracking

-   최초 방문 시 sessionId(UUID) 생성
-   localStorage 또는 쿠키 저장
-   30분 비활성 시 세션 종료
-   세션 시작/종료 시간 기록

## 5.2 Page View Tracking

발생 조건: - 최초 로드 - React Router route 변경

저장 데이터: - service_id - session_id - user_id (nullable) - path -
referrer - utm 정보 - timestamp

## 5.3 Scroll Tracking

-   3\~5초 throttle 적용
-   25% / 50% / 75% / 100% 구간 도달 시 기록
-   마지막 스크롤 위치 저장

## 5.4 Exit Tracking

-   beforeunload 이벤트 사용
-   navigator.sendBeacon 활용
-   마지막 path + scrollPercent 저장

------------------------------------------------------------------------

# 6. Data Model

## 6.1 services

  column        description
  ------------- -------------
  id            primary key
  name          서비스 이름
  service_key   고유 키

## 6.2 sessions

  column       description
  ------------ ---------------
  id           session_id
  service_id   FK
  user_id      nullable
  ip_address   요청 IP
  user_agent   브라우저 정보
  referrer     최초 유입
  started_at   세션 시작
  ended_at     세션 종료

## 6.3 events

  column           description
  ---------------- ---------------------------
  id               event id
  service_id       FK
  session_id       FK
  type             page_view / scroll / exit
  path             페이지 경로
  scroll_percent   nullable
  created_at       timestamp

------------------------------------------------------------------------

# 7. Metrics Calculation

## 7.1 UV (Unique Visitors)

COUNT(DISTINCT session_id)

## 7.2 PV (Page Views)

COUNT(type = 'page_view')

## 7.3 체류 시간

다음 page_view timestamp - 현재 timestamp

마지막 페이지: exit timestamp - 마지막 page_view timestamp

## 7.4 이탈률

해당 페이지가 마지막 page_view 인 세션 수 / 해당 페이지 방문 세션 수

------------------------------------------------------------------------

# 8. Technical Stack (MVP)

-   Frontend: React
-   Backend: Node.js + Fastify
-   Database: PostgreSQL
-   Deployment: 단일 서버 구조

------------------------------------------------------------------------

# 9. Success Criteria

-   여러 React 프로젝트에 모듈 형태로 적용 가능
-   서비스별 통계 분리 가능
-   페이지 이동 및 이탈 분석 가능
-   로그인 사용자 행동 분석 가능
-   향후 통계 전용 서비스로 확장 가능

------------------------------------------------------------------------

# 10. Future Expansion

-   통계 전용 Dashboard 서비스
-   ClickHouse 도입
-   실시간 집계
-   AI 기반 사용자 행동 분석
-   Multi-Organization 구조 확장
