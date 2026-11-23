import { useEffect, useState } from "react";
import { api } from "../services/api.js";

export default function IssueResidentAccountPage() {
  const [candidates, setCandidates] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [residentId, setResidentId] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [confirmId, setConfirmId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  async function load() {
    const [people, issued] = await Promise.all([
      api("/api/resident-accounts/candidates"),
      api("/api/resident-accounts"),
    ]);
    setCandidates(people.residents);
    setAccounts(issued.accounts);
    setResidentId((current) => {
      const stillThere = people.residents.some((person) => String(person.id) === current);
      if (stillThere) return current;
      return people.residents[0] ? String(people.residents[0].id) : "";
    });
  }

  useEffect(() => {
    let active = true;
    Promise.all([
      api("/api/resident-accounts/candidates"),
      api("/api/resident-accounts"),
    ])
      .then(([people, issued]) => {
        if (!active) return;
        setCandidates(people.residents);
        setAccounts(issued.accounts);
        setResidentId(people.residents[0] ? String(people.residents[0].id) : "");
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
      const data = await api("/api/resident-accounts", {
        method: "POST",
        body: JSON.stringify({
          residentId: Number(residentId),
          username,
          password,
        }),
      });
      setMessage(`Đã cấp tài khoản ${data.account.username}.`);
      setUsername("");
      setPassword("");
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function onDelete(account) {
    setError("");
    setMessage("");
    setDeletingId(account.id);
    try {
      await api(`/api/resident-accounts/${account.id}`, { method: "DELETE" });
      setMessage(`Đã xóa tài khoản ${account.username}.`);
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
      <h1>Cấp tài khoản cư dân</h1>
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
          Nhân khẩu
          <select
            value={residentId}
            onChange={(event) => setResidentId(event.target.value)}
            required
            disabled={candidates.length === 0}
          >
            {candidates.length === 0 ? (
              <option value="">Mọi nhân khẩu đã có tài khoản</option>
            ) : (
              candidates.map((person) => (
                <option key={person.id} value={person.id}>
                  {person.fullName} · phòng {person.roomNumber}
                </option>
              ))
            )}
          </select>
        </label>
        <label>
          Tên đăng nhập
          <input
            value={username}
            onChange={(event) => setUsername(event.target.value)}
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
        <button type="submit" disabled={busy || candidates.length === 0}>
          Cấp
        </button>
      </form>
      <h2>Tài khoản cư dân đã cấp</h2>
      <table>
        <thead>
          <tr>
            <th>Tên đăng nhập</th>
            <th>Họ tên</th>
            <th>Phòng</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {accounts.map((account) => (
            <tr key={account.id}>
              <td>{account.username}</td>
              <td>{account.fullName}</td>
              <td>{account.roomNumber}</td>
              <td>
                {confirmId === account.id ? (
                  <span className="row-actions">
                    <button
                      type="button"
                      className="danger"
                      disabled={deletingId === account.id}
                      onClick={() => onDelete(account)}
                    >
                      {deletingId === account.id ? "Đang xóa…" : "Xác nhận"}
                    </button>
                    <button type="button" className="link" onClick={() => setConfirmId(null)}>
                      Hủy
                    </button>
                  </span>
                ) : (
                  <button type="button" className="danger" onClick={() => setConfirmId(account.id)}>
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
