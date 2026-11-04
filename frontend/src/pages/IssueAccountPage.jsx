import { useEffect, useState } from "react";
import { api } from "../api.js";
import { useAuth } from "../AuthContext.jsx";

export default function IssueAccountPage() {
  const { user } = useAuth();
  const [username, setUsername] = useState("");
  const [fullName, setFullName] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [users, setUsers] = useState([]);
  const [busy, setBusy] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [confirmId, setConfirmId] = useState(null);

  async function load() {
    const data = await api("/api/accounts");
    setUsers(data.users);
  }

  useEffect(() => {
    load().catch((err) => setError(err.message));
  }, []);

  async function onSubmit(e) {
    e.preventDefault();
    setError("");
    setMessage("");
    setBusy(true);
    try {
      const data = await api("/api/accounts", {
        method: "POST",
        body: JSON.stringify({ username, fullName, password }),
      });
      setMessage(`Đã cấp tài khoản ${data.user.username}.`);
      setUsername("");
      setFullName("");
      setPassword("");
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function onDelete(target) {
    if (target.id === user.id) return;
    setError("");
    setMessage("");
    setDeletingId(target.id);
    try {
      await api(`/api/accounts/${target.id}`, { method: "DELETE" });
      setMessage(`Đã xóa tài khoản ${target.username}.`);
      setConfirmId(null);
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <section>
      <h1>Cấp tài khoản thành viên BQT</h1>
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
      <form className="card form" onSubmit={onSubmit}>
        <label>
          Tên đăng nhập
          <input value={username} onChange={(e) => setUsername(e.target.value)} required />
        </label>
        <label>
          Họ tên
          <input value={fullName} onChange={(e) => setFullName(e.target.value)} required />
        </label>
        <label>
          Mật khẩu khởi tạo
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
          />
        </label>
        <button type="submit" disabled={busy}>
          Cấp
        </button>
      </form>
      <h2>Tài khoản đã cấp</h2>
      <table>
        <thead>
          <tr>
            <th>Tên đăng nhập</th>
            <th>Họ tên</th>
            <th>Vai trò</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {users.map((u) => (
            <tr key={u.id}>
              <td>{u.username}</td>
              <td>{u.fullName}</td>
              <td>{u.role === "ADMIN" ? "Quản trị" : "Thành viên BQT"}</td>
              <td>
                {u.id === user.id ? (
                  <span className="muted">Đang dùng</span>
                ) : confirmId === u.id ? (
                  <span className="row-actions">
                    <button
                      type="button"
                      className="danger"
                      disabled={deletingId === u.id}
                      onClick={() => onDelete(u)}
                    >
                      {deletingId === u.id ? "Đang xóa…" : "Xác nhận"}
                    </button>
                    <button type="button" className="link" onClick={() => setConfirmId(null)}>
                      Hủy
                    </button>
                  </span>
                ) : (
                  <button type="button" className="danger" onClick={() => setConfirmId(u.id)}>
                    Xóa
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
