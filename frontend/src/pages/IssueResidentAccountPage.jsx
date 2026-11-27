import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { api } from "../services/api.js";

export default function IssueResidentAccountPage() {
  const [searchParams] = useSearchParams();
  const preselectedResidentId = searchParams.get("residentId") || "";
  const preselectedRoom = searchParams.get("room") || "";

  const [candidates, setCandidates] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [candidateFilter, setCandidateFilter] = useState(preselectedRoom);
  const [residentId, setResidentId] = useState(preselectedResidentId);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [confirmId, setConfirmId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [actionId, setActionId] = useState(null);

  const filteredCandidates = candidateFilter.trim()
    ? candidates.filter((person) => {
        const kw = candidateFilter.trim().toLowerCase();
        return (
          String(person.fullName).toLowerCase().includes(kw) ||
          String(person.roomNumber).toLowerCase().includes(kw)
        );
      })
    : candidates;

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
        const list = people.residents || [];
        setCandidates(list);
        setAccounts(issued.accounts || []);
        if (
          preselectedResidentId &&
          list.some((p) => String(p.id) === String(preselectedResidentId))
        ) {
          setResidentId(String(preselectedResidentId));
        } else {
          setResidentId(list[0] ? String(list[0].id) : "");
        }
      })
      .catch((err) => {
        if (active) setError(err.message);
      });
    return () => {
      active = false;
    };
  }, [preselectedResidentId]);

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
      setMessage(`Đã cấp tài khoản ${data.account.username} (phòng ${data.account.roomNumber}).`);
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

  async function onApprove(account) {
    setError("");
    setMessage("");
    setActionId(account.id);
    try {
      await api(`/api/resident-accounts/${account.id}/approve`, {
        method: "PATCH",
      });
      setMessage(`Đã duyệt tài khoản cư dân ${account.username}.`);
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setActionId(null);
    }
  }

  async function onResetPassword(account) {
    setError("");
    setMessage("");
    setActionId(account.id);
    try {
      const data = await api(`/api/resident-accounts/${account.id}/reset-password`, {
        method: "POST",
      });
      const tempPw = data.temporaryPassword || data.defaultPassword;
      setMessage(
        `Đã cấp mật khẩu tạm thời "${tempPw}" cho tài khoản ${data.username} (đã thu hồi các phiên đăng nhập cũ và yêu cầu đổi mật khẩu khi đăng nhập).`,
      );
    } catch (err) {
      setError(err.message);
    } finally {
      setActionId(null);
    }
  }

  const pendingAccounts = accounts.filter((a) => a.accountStatus === "PENDING");
  const activeAccounts = accounts.filter((a) => a.accountStatus !== "PENDING");

  return (
    <section>
      <h1>Cấp và duyệt tài khoản cư dân</h1>
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

      {pendingAccounts.length > 0 && (
        <>
          <h2>Yêu cầu cư dân tự đăng ký chờ duyệt ({pendingAccounts.length})</h2>
          <table>
            <thead>
              <tr>
                <th>Tên đăng nhập</th>
                <th>Họ tên</th>
                <th>Phòng</th>
                <th>Thao tác nhanh</th>
              </tr>
            </thead>
            <tbody>
              {pendingAccounts.map((account) => (
                <tr key={account.id}>
                  <td><strong>{account.username}</strong></td>
                  <td>{account.fullName}</td>
                  <td>{account.roomNumber}</td>
                  <td>
                    <span className="row-actions">
                      <button
                        type="button"
                        disabled={actionId === account.id || deletingId === account.id}
                        onClick={() => onApprove(account)}
                      >
                        {actionId === account.id ? "Đang duyệt…" : "Duyệt"}
                      </button>
                      <button
                        type="button"
                        className="danger"
                        disabled={actionId === account.id || deletingId === account.id}
                        onClick={() => onDelete(account)}
                      >
                        Từ chối
                      </button>
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}

      <details open={Boolean(preselectedResidentId)}>
        <summary><strong>BQT chủ động cấp nhanh tài khoản cư dân</strong></summary>
        <form className="card form" onSubmit={onSubmit}>
          <label>
            Tìm nhanh nhân khẩu theo tên hoặc số phòng
            <input
              value={candidateFilter}
              onChange={(event) => {
                const nextKw = event.target.value;
                setCandidateFilter(nextKw);
                const matches = nextKw.trim()
                  ? candidates.filter((p) => {
                      const kw = nextKw.trim().toLowerCase();
                      return (
                        String(p.fullName).toLowerCase().includes(kw) ||
                        String(p.roomNumber).toLowerCase().includes(kw)
                      );
                    })
                  : candidates;
                if (matches[0]) {
                  setResidentId(String(matches[0].id));
                }
              }}
              placeholder="Gõ số phòng (vd: 050) hoặc tên để lọc danh sách bên dưới"
            />
          </label>
          <label>
            Nhân khẩu ({filteredCandidates.length} người phù hợp)
            <select
              value={residentId}
              onChange={(event) => setResidentId(event.target.value)}
              required
              disabled={filteredCandidates.length === 0}
            >
              {filteredCandidates.length === 0 ? (
                <option value="">Không có nhân khẩu chưa cấp tài khoản khớp bộ lọc</option>
              ) : (
                filteredCandidates.map((person) => (
                  <option key={person.id} value={person.id}>
                    Phòng {person.roomNumber} · {person.fullName} ({person.relationship})
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
          <button type="submit" disabled={busy || filteredCandidates.length === 0}>
            Cấp ngay
          </button>
        </form>
      </details>

      <h2>Tài khoản cư dân đang hoạt động ({activeAccounts.length})</h2>
      <table>
        <thead>
          <tr>
            <th>Tên đăng nhập</th>
            <th>Họ tên</th>
            <th>Phòng</th>
            <th>Thao tác</th>
          </tr>
        </thead>
        <tbody>
          {activeAccounts.map((account) => (
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
                  <span className="row-actions">
                    <button
                      type="button"
                      className="link"
                      disabled={actionId === account.id}
                      onClick={() => onResetPassword(account)}
                    >
                      Đặt lại MK
                    </button>
                    <button type="button" className="danger" onClick={() => setConfirmId(account.id)}>
                      Xóa
                    </button>
                  </span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
