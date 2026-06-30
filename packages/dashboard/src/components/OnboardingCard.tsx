// 선택한 서비스에 데이터가 0일 때 — SDK 연동 방법을 바로 안내.
export function OnboardingCard({ serviceKey }: { serviceKey: string }) {
  const serverUrl = window.location.origin;
  const snippet = `import { Flow } from "@flowmvp/sdk";

Flow.init({
  serviceKey: "${serviceKey}",
  serverUrl: "${serverUrl}",
  env: "prod",
});`;

  return (
    <div className="section onboarding">
      <h2>아직 수집된 데이터가 없습니다</h2>
      <p className="onboarding-sub">
        앱 진입점에 아래 코드를 한 번 추가하면 방문 데이터가 수집됩니다.
        SPA라면 <code>Flow.setupRouterListener()</code>도 함께 호출하세요.
      </p>
      <pre className="code-block">{snippet}</pre>
    </div>
  );
}
