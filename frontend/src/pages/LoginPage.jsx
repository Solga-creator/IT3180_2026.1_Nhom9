import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/useAuth.js";

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      await login(username, password);
      navigate(location.state?.from || "/", { replace: true });
    } catch (err) {
      setError(err.message || "Đăng nhập thất bại.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="auth">
      <form className="card" onSubmit={onSubmit}>
        <h1>Đăng nhập BlueMoon</h1>
        <p className="muted">
          Chỉ thành viên Ban quản trị đã được cấp tài khoản.
        </p>
        {error && (
          <p className="error" role="alert">
            {error}
          </p>
        )}
        <label>
          Tên đăng nhập
          <input
            name="username"
            autoComplete="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
        </label>
        <label>
          Mật khẩu
          <input
            name="password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </label>
        <button type="submit" disabled={busy}>
          {busy ? "Đang vào…" : "Đăng nhập"}
        </button>
        <p className="hint">Tài khoản quản trị mẫu: admin / admin123</p>
      </form>
    </div>
  );
}
