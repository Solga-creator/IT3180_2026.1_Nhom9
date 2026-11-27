import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/useAuth.js";
import { api } from "../services/api.js";

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [roomNumber, setRoomNumber] = useState("");
  const [fullName, setFullName] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    setError("");
    setMessage("");
    setBusy(true);
    try {
      if (isRegisterMode) {
        await api("/api/auth/register-resident", {
          method: "POST",
          body: JSON.stringify({
            roomNumber,
            fullName,
            username,
            password,
          }),
        });
        setMessage(
          "Đã gửi yêu cầu đăng ký tài khoản cư dân. Vui lòng chờ Ban quản trị phê duyệt.",
        );
        setIsRegisterMode(false);
        setPassword("");
      } else {
        await login(username, password);
        navigate(location.state?.from || "/", { replace: true });
      }
    } catch (err) {
      setError(err.message || "Thao tác thất bại.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="auth">
      <form className="card" onSubmit={onSubmit}>
        <h1>{isRegisterMode ? "Đăng ký tài khoản cư dân" : "Đăng nhập BlueMoon"}</h1>
        <p className="muted">
          {isRegisterMode
            ? "Nhập đúng số phòng và họ tên đã khai báo với Ban quản trị để gửi yêu cầu duyệt tài khoản."
            : "Dành cho thành viên Ban quản trị và cư dân đã được duyệt tài khoản."}
        </p>
        {error && (
          <p className="error" role="alert">
            {error}
          </p>
        )}
        {message && (
          <p className="ok" role="status">
            {message}
          </p>
        )}
        {isRegisterMode && (
          <>
            <label>
              Số phòng căn hộ
              <input
                name="roomNumber"
                placeholder="Ví dụ: 050, 101"
                value={roomNumber}
                onChange={(e) => setRoomNumber(e.target.value)}
                required
              />
            </label>
            <label>
              Họ và tên nhân khẩu
              <input
                name="fullName"
                placeholder="Nhập đúng họ tên trong hồ sơ hộ"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
              />
            </label>
          </>
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
            autoComplete={isRegisterMode ? "new-password" : "current-password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={isRegisterMode ? 6 : undefined}
          />
        </label>
        <div className="row-actions">
          <button type="submit" disabled={busy}>
            {busy
              ? "Đang xử lý…"
              : isRegisterMode
                ? "Gửi yêu cầu duyệt"
                : "Đăng nhập"}
          </button>
          <button
            type="button"
            className="link"
            disabled={busy}
            onClick={() => {
              setError("");
              setMessage("");
              setIsRegisterMode((prev) => !prev);
            }}
          >
            {isRegisterMode ? "Quay lại đăng nhập" : "Cư dân tự đăng ký tài khoản"}
          </button>
        </div>
      </form>
    </div>
  );
}
