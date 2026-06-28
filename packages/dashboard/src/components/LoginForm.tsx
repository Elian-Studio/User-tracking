import { useState } from "react";
import { login } from "../api";

interface Props {
  onSuccess: () => void;
}

export function LoginForm({ onSuccess }: Props) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) return;
    setLoading(true);
    setError("");
    const ok = await login(username, password);
    setLoading(false);
    if (ok) {
      onSuccess();
    } else {
      setError("아이디 또는 비밀번호가 올바르지 않습니다.");
    }
  };

  return (
    <div className="login-wrap">
      <form className="login-card" onSubmit={handleSubmit}>
        <h1>FlowMVP Analytics</h1>
        <p className="login-sub">로그인이 필요합니다</p>

        <input
          type="text"
          placeholder="아이디"
          autoComplete="username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />

        <div className="login-password">
          <input
            type={showPassword ? "text" : "password"}
            placeholder="비밀번호"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button
            type="button"
            className="btn-sm"
            onClick={() => setShowPassword((v) => !v)}
          >
            {showPassword ? "숨김" : "표시"}
          </button>
        </div>

        {error && <div className="login-error">{error}</div>}

        <button type="submit" disabled={loading}>
          {loading ? "로그인 중..." : "로그인"}
        </button>
      </form>
    </div>
  );
}
