import { useEffect, useState } from "react";
import { api } from "../services/api.js";
import { useAuth } from "../contexts/useAuth.js";

function AccountActions({
  account,
  currentUserId,
  confirmId,
  deletingId,
  onDelete,
  onConfirm,
  onCancel,
}) {
  if (account.id === currentUserId) {
    return <span className="muted">Đang dùng</span>;
  }

  if (confirmId === account.id) {
    return (
      <span className="row-actions">
        <button
          type="button"
          className="danger"
          disabled={deletingId === account.id}
          onClick={() => onDelete(account)}
        >
          {deletingId === account.id ? "Đang xóa…" : "Xác nhận"}
        </button>
        <button type="button" className="link" onClick={onCancel}>
          Hủy
        </button>
      </span>
    );
  }

  return (
    <button
      type="button"
      className="danger"
      onClick={() => onConfirm(account.id)}
    >
      Xóa
    </button>
  );
}

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
    let active = true;
    api("/api/accounts")
      .then((data) => {
        if (active) setUsers(data.users);
      })
      .catch((err) => {
        if (active) setError(err.message);
      });
    return () => {
      active = false;
    };
  }, []);

  async function onSubmit(event) {
    event.preventDefault();
    setError("");
    setMessage("");
    setBusy(true);
    try {
      const data = await api("/api/accounts", {
        method: "POST",
        body: JSON.stringify({
          username,
          fullName,
          password,
        }),
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
          <input
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            required
          />
        </label>
        <label>
          Họ tên
          <input
            value={fullName}
            onChange={(event) => setFullName(event.target.value)}
            required
          />
        </label>
        <label>
          Mật khẩu khởi tạo
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
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
          {users.map((account) => (
            <tr key={account.id}>
              <td>{account.username}</td>
              <td>{account.fullName}</td>
              <td>
                {account.role === "ADMIN" ? "Quản trị" : "Thành viên BQT"}
              </td>
              <td>
                <AccountActions
                  account={account}
                  currentUserId={user.id}
                  confirmId={confirmId}
                  deletingId={deletingId}
                  onDelete={onDelete}
                  onConfirm={setConfirmId}
                  onCancel={() => setConfirmId(null)}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
