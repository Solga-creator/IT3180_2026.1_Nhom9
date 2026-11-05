import { useEffect, useState } from "react";
import { useAuth } from "../contexts/useAuth.js";
import { api } from "../services/api.js";

function formatDate(isoString) {
  if (!isoString) return "—";
  try {
    const d = new Date(isoString);
    return d.toLocaleDateString("vi-VN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return isoString;
  }
}

export default function HomePage() {
  const { user } = useAuth();
  const [roomNumber, setRoomNumber] = useState("");
  const [area, setArea] = useState("");
  const [apartments, setApartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function loadApartments() {
    try {
      const data = await api("/api/apartments");
      setApartments(data.apartments || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let active = true;
    api("/api/apartments")
      .then((data) => {
        if (active) setApartments(data.apartments || []);
      })
      .catch((err) => {
        if (active) setError(err.message);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  async function onSubmit(event) {
    event.preventDefault();
    setError("");
    setMessage("");

    const trimmedRoom = String(roomNumber).trim();
    if (!trimmedRoom) {
      setError("Vui lòng nhập số phòng.");
      return;
    }

    const numArea = Number(area);
    if (!Number.isFinite(numArea) || numArea <= 0) {
      setError("Diện tích căn hộ bắt buộc phải là số lớn hơn 0 m².");
      return;
    }

    setBusy(true);
    try {
      const data = await api("/api/apartments", {
        method: "POST",
        body: JSON.stringify({
          roomNumber: trimmedRoom,
          area: numArea,
        }),
      });

      setMessage(
        `Đã lưu căn hộ ${data.apartment.roomNumber} (${data.apartment.area} m²).`,
      );
      setRoomNumber("");
      setArea("");
      await loadApartments();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <section>
      <h1>Màn hình chính</h1>
      <p>
        Xin chào <strong>{user.fullName}</strong> (
        {user.role === "ADMIN" ? "Quản trị viên" : "Thành viên BQT"}).
      </p>

      <h2>Lưu căn hộ và diện tích</h2>
      <p className="hint">
        Nhập số phòng và diện tích thực tế của từng căn hộ trong chung cư BlueMoon để phục vụ quản lý nhân khẩu và tính phí.
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

      <form className="card form" onSubmit={onSubmit}>
        <label>
          Số phòng
          <input
            type="text"
            value={roomNumber}
            onChange={(e) => setRoomNumber(e.target.value)}
            placeholder="Ví dụ: 050, 101, 12A04"
            required
            autoComplete="off"
          />
          <span className="hint">Mã định danh phòng, không được trùng lặp.</span>
        </label>

        <label>
          Diện tích (m²)
          <input
            type="number"
            step="any"
            min="0.01"
            value={area}
            onChange={(e) => setArea(e.target.value)}
            placeholder="Ví dụ: 60"
            required
          />
          <span className="hint">Diện tích từng căn hộ (&gt; 0 m²).</span>
        </label>

        <button type="submit" disabled={busy}>
          {busy ? "Đang lưu…" : "Lưu"}
        </button>
      </form>

      <h2>Danh mục căn hộ</h2>
      {loading ? (
        <p className="muted">Đang tải danh mục căn hộ…</p>
      ) : apartments.length === 0 ? (
        <p className="muted">
          Chưa có căn hộ nào trong danh mục. Hãy nhập số phòng và diện tích ở trên rồi bấm "Lưu".
        </p>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table>
            <thead>
              <tr>
                <th style={{ width: "60px" }}>STT</th>
                <th>Số phòng</th>
                <th>Diện tích (m²)</th>
                <th>Ngày tạo</th>
              </tr>
            </thead>
            <tbody>
              {apartments.map((apt, index) => (
                <tr key={apt.id}>
                  <td>{index + 1}</td>
                  <td>
                    <strong>{apt.roomNumber}</strong>
                  </td>
                  <td>{apt.area} m²</td>
                  <td className="muted">{formatDate(apt.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
