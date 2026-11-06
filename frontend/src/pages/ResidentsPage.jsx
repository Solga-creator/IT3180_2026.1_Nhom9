import { useEffect, useState } from "react";
import { api } from "../services/api.js";

const RELATIONSHIPS = [
  "Chủ hộ",
  "Vợ/chồng",
  "Con",
  "Cha/mẹ",
  "Anh/chị/em",
  "Khác",
];

const RESIDENCY_STATUSES = [
  "Thường trú",
  "Tạm trú",
  "Tạm vắng",
  "Chuyển đến",
  "Chuyển đi",
];
const MAX_BIRTH_DATE = new Date().toISOString().slice(0, 10);

export default function ResidentsPage() {
  const [apartments, setApartments] = useState([]);
  const [residents, setResidents] = useState([]);
  const [apartmentId, setApartmentId] = useState("");
  const [fullName, setFullName] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [relationship, setRelationship] = useState("Chủ hộ");
  const [searchInput, setSearchInput] = useState("");
  const [activeSearch, setActiveSearch] = useState("");
  const [selectedResidentId, setSelectedResidentId] = useState(null);
  const [residencyStatus, setResidencyStatus] = useState("Thường trú");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [exportStatus, setExportStatus] = useState("Thường trú");
  const [exporting, setExporting] = useState(false);

  async function onExport(event) {
    event.preventDefault();
    setError("");
    setMessage("");
    setExporting(true);
    try {
      const query = new URLSearchParams({ status: exportStatus });
      const blob = await api(`/api/residents/export?${query}`, {}, "blob");
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `nhan-khau-${exportStatus}.xlsx`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      setMessage(`Đã tải danh sách nhân khẩu: ${exportStatus}.`);
    } catch (exportError) {
      setError(exportError.message);
    } finally {
      setExporting(false);
    }
  }

  async function loadResidents(search = activeSearch) {
    const query = new URLSearchParams();
    if (search.trim()) query.set("search", search.trim());
    const suffix = query.size ? `?${query.toString()}` : "";
    const data = await api(`/api/residents${suffix}`);
    setResidents(data.residents || []);
  }

  useEffect(() => {
    let active = true;
    Promise.all([api("/api/apartments"), api("/api/residents")])
      .then(([apartmentData, residentData]) => {
        if (!active) return;
        setApartments(apartmentData.apartments || []);
        setResidents(residentData.residents || []);
      })
      .catch((loadError) => {
        if (active) setError(loadError.message);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  async function onAddResident(event) {
    event.preventDefault();
    setError("");
    setMessage("");
    setBusy(true);

    try {
      const data = await api("/api/residents", {
        method: "POST",
        body: JSON.stringify({
          apartmentId,
          fullName,
          birthDate,
          relationship,
        }),
      });
      setMessage(`Đã thêm ${data.resident.fullName} vào căn ${data.resident.roomNumber}.`);
      setFullName("");
      setBirthDate("");
      if (relationship === "Chủ hộ") setRelationship("Con");
      await loadResidents();
    } catch (submitError) {
      setError(submitError.message);
    } finally {
      setBusy(false);
    }
  }

  async function onSearch(event) {
    event.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);
    try {
      const search = searchInput.trim();
      await loadResidents(search);
      setActiveSearch(search);
    } catch (searchError) {
      setError(searchError.message);
    } finally {
      setLoading(false);
    }
  }

  async function onUpdateResidency(event) {
    event.preventDefault();
    setError("");
    setMessage("");
    setBusy(true);

    try {
      await api(`/api/residents/${selectedResidentId}/residency-events`, {
        method: "POST",
        body: JSON.stringify({
          status: residencyStatus,
          startDate,
          endDate,
        }),
      });
      setMessage("Đã cập nhật tình trạng cư trú và lưu lịch sử.");
      setSelectedResidentId(null);
      setStartDate("");
      setEndDate("");
      await loadResidents();
    } catch (statusError) {
      setError(statusError.message);
    } finally {
      setBusy(false);
    }
  }

  const selectedResident = residents.find(
    (resident) => resident.id === selectedResidentId,
  );

  return (
    <section>
      <h1>Hộ và nhân khẩu</h1>
      <p className="hint">
        Lưu chủ hộ trước, sau đó thêm các nhân khẩu còn lại của căn hộ.
      </p>

      {error && <p className="error" role="alert">{error}</p>}
      {message && <p className="ok" role="status">{message}</p>}

      <form className="card form" onSubmit={onAddResident}>
        <h2>Thêm chủ hộ hoặc nhân khẩu</h2>
        <label>
          Căn hộ
          <select
            required
            value={apartmentId}
            onChange={(event) => setApartmentId(event.target.value)}
          >
            <option value="">Chọn căn hộ</option>
            {apartments.map((apartment) => (
              <option key={apartment.id} value={apartment.id}>
                {apartment.roomNumber} ({apartment.area} m²)
              </option>
            ))}
          </select>
        </label>
        <label>
          Họ và tên
          <input
            required
            minLength={2}
            maxLength={120}
            value={fullName}
            onChange={(event) => setFullName(event.target.value)}
          />
        </label>
        <label>
          Ngày sinh
          <input
            type="date"
            required
            max={MAX_BIRTH_DATE}
            value={birthDate}
            onChange={(event) => setBirthDate(event.target.value)}
          />
        </label>
        <label>
          Quan hệ với chủ hộ
          <select
            required
            value={relationship}
            onChange={(event) => setRelationship(event.target.value)}
          >
            {RELATIONSHIPS.map((item) => (
              <option key={item} value={item}>{item}</option>
            ))}
          </select>
        </label>
        <button type="submit" disabled={busy || apartments.length === 0}>
          {busy ? "Đang lưu…" : "Thêm nhân khẩu"}
        </button>
        {apartments.length === 0 && !loading && (
          <p className="hint">Cần lưu căn hộ trước khi thêm chủ hộ.</p>
        )}
      </form>

      <form className="card form" onSubmit={onExport}>
        <h2>Xuất danh sách nhân khẩu</h2>
        <p className="hint">
          Xuất toàn bộ nhân khẩu theo trạng thái hiện tại, kèm căn hộ trong hồ sơ.
          Kết quả xuất không phụ thuộc ô tìm kiếm bên dưới.
        </p>
        <label>
          Trạng thái cư trú cần xuất
          <select
            value={exportStatus}
            onChange={(event) => setExportStatus(event.target.value)}
            disabled={exporting}
          >
            {RESIDENCY_STATUSES.map((status) => (
              <option key={status} value={status}>{status}</option>
            ))}
          </select>
        </label>
        <button type="submit" disabled={exporting || busy || loading}>
          {exporting ? "Đang xuất…" : "Xuất Excel"}
        </button>
      </form>

      <h2>Tra cứu hộ và nhân khẩu</h2>
      <form className="search-form" onSubmit={onSearch}>
        <label>
          Số phòng hoặc họ tên
          <input
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            placeholder="Nhập số phòng hoặc tên cần tìm"
          />
        </label>
        <button type="submit" disabled={loading}>
          {loading ? "Đang tìm…" : "Tìm"}
        </button>
        {activeSearch && (
          <button
            type="button"
            className="link"
            disabled={loading}
            onClick={() => {
              setSearchInput("");
              setActiveSearch("");
              setLoading(true);
              loadResidents("")
                .catch((loadError) => setError(loadError.message))
                .finally(() => setLoading(false));
            }}
          >
            Xóa tìm kiếm
          </button>
        )}
      </form>

      {loading ? (
        <p className="muted">Đang tải danh sách…</p>
      ) : residents.length === 0 ? (
        <p className="muted">Không tìm thấy hộ hoặc nhân khẩu phù hợp.</p>
      ) : (
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>Căn hộ</th>
                <th>Họ tên</th>
                <th>Ngày sinh</th>
                <th>Quan hệ</th>
                <th>Tình trạng cư trú</th>
                <th>Lịch sử</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {residents.map((resident) => (
                <tr key={resident.id}>
                  <td>{resident.roomNumber}</td>
                  <td><strong>{resident.fullName}</strong></td>
                  <td>{resident.birthDate}</td>
                  <td>{resident.relationship}</td>
                  <td>
                    {resident.currentStatus}
                    {resident.statusStartDate && (
                      <span className="muted">
                        <br />{resident.statusStartDate} – {resident.statusEndDate}
                      </span>
                    )}
                  </td>
                  <td>
                    <details>
                      <summary>{resident.residencyHistory.length} lần</summary>
                      {resident.residencyHistory.length === 0 ? (
                        <p className="muted">Chưa có lịch sử thay đổi.</p>
                      ) : (
                        <ul className="history-list">
                          {resident.residencyHistory.map((item) => (
                            <li key={item.id}>
                              {item.status}: {item.startDate} – {item.endDate}
                            </li>
                          ))}
                        </ul>
                      )}
                    </details>
                  </td>
                  <td>
                    <button
                      type="button"
                      className="link"
                      onClick={() => setSelectedResidentId(resident.id)}
                    >
                      Cập nhật trạng thái
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {selectedResident && (
        <form className="card form" onSubmit={onUpdateResidency}>
          <h2>Cập nhật cư trú: {selectedResident.fullName}</h2>
          <label>
            Trạng thái
            <select
              value={residencyStatus}
              onChange={(event) => setResidencyStatus(event.target.value)}
            >
              {RESIDENCY_STATUSES.map((item) => (
                <option key={item} value={item}>{item}</option>
              ))}
            </select>
          </label>
          <label>
            Ngày bắt đầu
            <input
              type="date"
              required
              value={startDate}
              onChange={(event) => setStartDate(event.target.value)}
            />
          </label>
          <label>
            Ngày kết thúc
            <input
              type="date"
              required
              min={startDate || undefined}
              value={endDate}
              onChange={(event) => setEndDate(event.target.value)}
            />
          </label>
          <div className="row-actions">
            <button type="submit" disabled={busy}>
              {busy ? "Đang lưu…" : "Xác nhận"}
            </button>
            <button
              type="button"
              className="link"
              onClick={() => setSelectedResidentId(null)}
            >
              Hủy
            </button>
          </div>
        </form>
      )}
    </section>
  );
}
