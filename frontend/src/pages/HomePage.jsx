import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
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
    });
  } catch {
    return isoString;
  }
}

export default function HomePage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [showAddForm, setShowAddForm] = useState(false);
  const [searchRoom, setSearchRoom] = useState("");
  const [roomNumber, setRoomNumber] = useState("");
  const [area, setArea] = useState("");
  const [apartments, setApartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editRoomNumber, setEditRoomNumber] = useState("");
  const [editArea, setEditArea] = useState("");
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

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
      setApartments((prev) =>
        [...prev, data.apartment].sort((a, b) =>
          String(a.roomNumber).localeCompare(String(b.roomNumber), "vi", {
            numeric: true,
          }),
        ),
      );
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  function startEdit(apt) {
    setConfirmDeleteId(null);
    setEditingId(apt.id);
    setEditRoomNumber(apt.roomNumber);
    setEditArea(String(apt.area));
  }

  async function onSaveEdit(aptId) {
    setError("");
    setMessage("");
    setBusy(true);
    try {
      const data = await api(`/api/apartments/${aptId}`, {
        method: "PUT",
        body: JSON.stringify({
          roomNumber: editRoomNumber,
          area: Number(editArea),
        }),
      });
      setMessage(
        `Đã cập nhật căn hộ ${data.apartment.roomNumber} (${data.apartment.area} m²).`,
      );
      setEditingId(null);
      setApartments((prev) =>
        prev.map((item) => (item.id === aptId ? data.apartment : item)),
      );
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function onDeleteApartment(apt) {
    setError("");
    setMessage("");
    setDeletingId(apt.id);
    try {
      await api(`/api/apartments/${apt.id}`, { method: "DELETE" });
      setMessage(`Đã xóa căn hộ ${apt.roomNumber}.`);
      setConfirmDeleteId(null);
      setApartments((prev) => prev.filter((item) => item.id !== apt.id));
    } catch (err) {
      setError(err.message);
      setConfirmDeleteId(null);
    } finally {
      setDeletingId(null);
    }
  }

  const filteredApartments = searchRoom.trim()
    ? apartments.filter((apt) =>
        String(apt.roomNumber)
          .toLowerCase()
          .includes(searchRoom.trim().toLowerCase()),
      )
    : apartments;

  return (
    <section>
      <h1>Quản lý căn hộ</h1>
      <p>
        Xin chào <strong>{user.fullName}</strong> (
        {user.role === "ADMIN" ? "Quản trị viên" : "Thành viên BQT"}). Chọn{" "}
        <strong>Nhân khẩu</strong> trên dòng căn hộ để xem thành viên của riêng phòng đó.
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

      <div className="search-form">
        <label>
          Tìm nhanh theo số phòng
          <input
            type="text"
            value={searchRoom}
            onChange={(e) => setSearchRoom(e.target.value)}
            placeholder="Nhập số phòng cần lọc (vd: 050, 101)"
          />
        </label>
        {searchRoom && (
          <button
            type="button"
            className="link"
            onClick={() => setSearchRoom("")}
          >
            Xóa lọc
          </button>
        )}
        <button
          type="button"
          onClick={() => setShowAddForm((prev) => !prev)}
        >
          {showAddForm ? "Ẩn form thêm" : "+ Thêm căn hộ"}
        </button>
      </div>

      {showAddForm && (
        <form className="card form" onSubmit={onSubmit}>
          <h2>Thêm căn hộ mới</h2>
          <p className="hint">
            Nhập số phòng và diện tích thực tế (&gt; 0 m²) của căn hộ để quản lý nhân khẩu và tính phí.
          </p>
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
          </label>

          <div className="row-actions">
            <button type="submit" disabled={busy}>
              {busy ? "Đang lưu…" : "Lưu căn hộ"}
            </button>
            <button
              type="button"
              className="link"
              onClick={() => setShowAddForm(false)}
            >
              Đóng
            </button>
          </div>
        </form>
      )}

      <h2>Danh mục căn hộ ({filteredApartments.length})</h2>
      {loading ? (
        <p className="muted">Đang tải danh mục căn hộ…</p>
      ) : filteredApartments.length === 0 ? (
        <p className="muted">
          {searchRoom
            ? `Không có căn hộ nào khớp số phòng "${searchRoom}".`
            : 'Chưa có căn hộ nào trong danh mục. Hãy bấm "+ Thêm căn hộ" để tạo mới.'}
        </p>
      ) : (
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th style={{ width: "60px" }}>STT</th>
                <th>Số phòng</th>
                <th>Diện tích (m²)</th>
                <th>Ngày tạo</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {filteredApartments.map((apt, index) => (
                <tr key={apt.id}>
                  <td>{index + 1}</td>
                  <td>
                    {editingId === apt.id ? (
                      <input
                        value={editRoomNumber}
                        onChange={(e) => setEditRoomNumber(e.target.value)}
                      />
                    ) : (
                      <strong>{apt.roomNumber}</strong>
                    )}
                  </td>
                  <td>
                    {editingId === apt.id ? (
                      <input
                        type="number"
                        step="any"
                        min="0.01"
                        value={editArea}
                        onChange={(e) => setEditArea(e.target.value)}
                      />
                    ) : (
                      `${apt.area} m²`
                    )}
                  </td>
                  <td className="muted">{formatDate(apt.createdAt)}</td>
                  <td>
                    {editingId === apt.id ? (
                      <span className="row-actions">
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => onSaveEdit(apt.id)}
                        >
                          Lưu
                        </button>
                        <button
                          type="button"
                          className="link"
                          onClick={() => setEditingId(null)}
                        >
                          Hủy
                        </button>
                      </span>
                    ) : confirmDeleteId === apt.id ? (
                      <span className="row-actions">
                        <button
                          type="button"
                          className="danger"
                          disabled={deletingId === apt.id}
                          onClick={() => onDeleteApartment(apt)}
                        >
                          {deletingId === apt.id ? "Đang xóa…" : "Xác nhận xóa"}
                        </button>
                        <button
                          type="button"
                          className="link"
                          onClick={() => setConfirmDeleteId(null)}
                        >
                          Hủy
                        </button>
                      </span>
                    ) : (
                      <span className="row-actions">
                        <button
                          type="button"
                          className="link"
                          onClick={() =>
                            navigate(
                              `/residents?apartmentId=${apt.id}&room=${encodeURIComponent(apt.roomNumber)}`,
                            )
                          }
                        >
                          Nhân khẩu
                        </button>
                        <button
                          type="button"
                          className="link"
                          onClick={() => startEdit(apt)}
                        >
                          Sửa
                        </button>
                        <button
                          type="button"
                          className="danger"
                          onClick={() => setConfirmDeleteId(apt.id)}
                        >
                          Xóa
                        </button>
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
