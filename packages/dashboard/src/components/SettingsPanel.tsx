import { useState } from "react";
import { saveServiceDomain, type ServiceItem } from "../api";

interface Props {
  services: ServiceItem[];
  onChanged: () => void;
}

function DomainRow({ svc, onChanged }: { svc: ServiceItem; onChanged: () => void }) {
  const [domain, setDomain] = useState(svc.domain ?? "");
  const [saved, setSaved] = useState(false);

  const save = async () => {
    await saveServiceDomain(svc.service_key, domain);
    setSaved(true);
    onChanged();
    setTimeout(() => setSaved(false), 1500);
  };

  return (
    <tr>
      <td>{svc.service_key}</td>
      <td>
        <input
          type="text"
          className="settings-input"
          placeholder="https://example.com"
          value={domain}
          onChange={(e) => setDomain(e.target.value)}
        />
      </td>
      <td>
        <button className="btn-sm" onClick={save}>{saved ? "저장됨" : "저장"}</button>
      </td>
    </tr>
  );
}

export function SettingsPanel({ services, onChanged }: Props) {
  const serverUrl = window.location.origin;

  return (
    <div className="section">
      <h2>서비스 설정</h2>
      <p className="settings-sub">
        분석 서버 주소: <code>{serverUrl}</code> — SDK <code>serverUrl</code>에 이 값을 사용하세요.
      </p>
      <p className="settings-sub">
        서비스별 <b>히트맵 기준 도메인</b>을 설정합니다. 설정하면 해당 서비스 선택 시 스크롤 히트맵이 실제 페이지 위에 표시됩니다.
      </p>

      {services.length === 0 ? (
        <div className="empty">등록된 서비스가 없습니다. 앱에 SDK를 연동하면 자동 등록됩니다.</div>
      ) : (
        <table className="pages-table settings-table">
          <thead>
            <tr>
              <th>Service Key</th>
              <th>히트맵 도메인</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {services.map((s) => (
              <DomainRow key={s.service_key} svc={s} onChanged={onChanged} />
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
