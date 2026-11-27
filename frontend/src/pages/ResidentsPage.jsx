import { useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { api } from "../services/api.js";
import { AddResidentForm, ResidencyStatusForm } from "./ResidentForms.jsx";
import { getBusinessDate } from "../../../shared/businessDate.mjs";

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

function formatDateVN(isoDate) {
  if (!isoDate) return "—";
  const parts = String(isoDate).slice(0, 10).split("-");
  if (parts.length !== 3) return isoDate;
  return `${parts[2]}/${parts[1]}/${parts[0]}`;
}

function formatRangeVN(startDate, endDate) {
  if (!startDate) return "";
  return endDate
    ? `${formatDateVN(startDate)} – ${formatDateVN(endDate)}`
    : `Từ ${formatDateVN(startDate)}`;
}

export default function ResidentsPage() {
  const today = getBusinessDate();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeSearch = searchParams.get("search") || "";
  const activeApartmentId = searchParams.get("apartmentId") || "";
  const activeRoomLabel = searchParams.get("room") || "";

  const nameInputRef = useRef(null);
  const [apartments, setApartments] = useState([]);
  const [residents, setResidents] = useState([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [apartmentId, setApartmentId] = useState(activeApartmentId);
  const [fullName, setFullName] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [cccd, setCccd] = useState("");
  const [relationship, setRelationship] = useState("Chủ hộ");
  const [searchInput, setSearchInput] = useState(activeSearch);
  const [selectedResidentId, setSelectedResidentId] = useState(null);
  const [residencyStatus, setResidencyStatus] = useState("Thường trú");
  const [startDate, setStartDate] = useState(getBusinessDate);
  const [endDate, setEndDate] = useState("");
  const [editingResidentId, setEditingResidentId] = useState(null);
  const [editFullName, setEditFullName] = useState("");
  const [editBirthDate, setEditBirthDate] = useState("");
  const [editCccd, setEditCccd] = useState("");
  const [editRelationship, setEditRelationship] = useState("Con");
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [confirmHeadPayload, setConfirmHeadPayload] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [exportStatus, setExportStatus] = useState("Thường trú");
  const [exporting, setExporting] = useState(false);

  function apartmentHasHead(targetAptId, list = residents) {
    const numId = Number(targetAptId);
    if (!numId) return false;
    return list.some(
      (r) =>
        Number(r.apartmentId) === numId &&
        (r.relationship === "Chủ hộ" || Boolean(r.householdHeadId)),
    );
  }

  function handleApartmentSelect(nextAptId, list = residents) {
    setApartmentId(nextAptId);
    if (!nextAptId) return;
    setRelationship(apartmentHasHead(nextAptId, list) ? "Con" : "Chủ hộ");
  }

  async function fetchResidentsList(searchVal = activeSearch, aptIdVal = activeApartmentId) {
    const query = new URLSearchParams();
    if (searchVal.trim()) query.set("search", searchVal.trim());
    if (aptIdVal) query.set("apartmentId", String(aptIdVal));
    const suffix = query.size ? `?${query.toString()}` : "";
    const data = await api(`/api/residents${suffix}`);
    const nextList = data.residents || [];
    setResidents(nextList);
    return nextList;
  }

  useEffect(() => {
    let active = true;
    const query = new URLSearchParams();
    if (activeSearch.trim()) query.set("search", activeSearch.trim());
    if (activeApartmentId) query.set("apartmentId", String(activeApartmentId));
    const suffix = query.size ? `?${query.toString()}` : "";

    Promise.all([api("/api/apartments"), api(`/api/residents${suffix}`)])
      .then(([apartmentData, residentData]) => {
        if (!active) return;
        const apts = apartmentData.apartments || [];
        const resList = residentData.residents || [];
        setApartments(apts);
        setResidents(resList);
        if (activeApartmentId) {
          setApartmentId(String(activeApartmentId));
          setRelationship(
            resList.some(
              (r) =>
                Number(r.apartmentId) === Number(activeApartmentId) &&
                (r.relationship === "Chủ hộ" || Boolean(r.householdHeadId)),
            )
              ? "Con"
              : "Chủ hộ",
          );
        }
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
  }, [activeSearch, activeApartmentId]);

  async function onExport(event) {
    event.preventDefault();
    setError("");
    setMessage("");
    setExporting(true);
    try {
      const query = new URLSearchParams({ status: exportStatus });
      const effectiveSearch = activeSearch.trim() || activeRoomLabel.trim();
      if (activeSearch.trim()) query.set("search", activeSearch.trim());
      if (activeApartmentId) query.set("apartmentId", activeApartmentId);
      const blob = await api(`/api/residents/export?${query}`, {}, "blob");
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `nhan-khau-${exportStatus}.xlsx`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      setMessage(
        `Đã tải danh sách nhân khẩu (${exportStatus}${effectiveSearch ? ` · lọc: "${effectiveSearch}"` : ""}).`,
      );
    } catch (exportError) {
      setError(exportError.message);
    } finally {
      setExporting(false);
    }
  }

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
          cccd,
          relationship,
        }),
      });
      setMessage(
        `Đã thêm ${data.resident.fullName} vào phòng ${data.resident.roomNumber}. Bạn có thể nhập tiếp thành viên khác của phòng này.`,
      );
      setFullName("");
      setBirthDate("");
      setCccd("");
      setRelationship("Con");
      await fetchResidentsList();
      setTimeout(() => {
        nameInputRef.current?.focus();
      }, 20);
    } catch (submitError) {
      setError(submitError.message);
    } finally {
      setBusy(false);
    }
  }

  function startEditResident(resident) {
    setConfirmDeleteId(null);
    setConfirmHeadPayload(null);
    setEditingResidentId(resident.id);
    setEditFullName(resident.fullName);
    setEditBirthDate(resident.birthDate);
    setEditCccd(resident.cccd || "");
    setEditRelationship(resident.relationship);
  }

  async function onSaveResidentEdit(resident) {
    if (resident.relationship !== "Chủ hộ" && editRelationship === "Chủ hộ") {
      setEditingResidentId(null);
      setConfirmHeadPayload({
        resident,
        fullName: editFullName,
        birthDate: editBirthDate,
        cccd: editCccd,
      });
      return;
    }

    setError("");
    setMessage("");
    setBusy(true);
    try {
      const data = await api(`/api/residents/${resident.id}`, {
        method: "PUT",
        body: JSON.stringify({
          fullName: editFullName,
          birthDate: editBirthDate,
          cccd: editCccd,
          relationship: editRelationship,
        }),
      });
      setMessage(`Đã cập nhật thông tin nhân khẩu ${data.resident.fullName}.`);
      setEditingResidentId(null);
      setResidents((prev) =>
        prev.map((item) => (item.id === resident.id ? data.resident : item)),
      );
    } catch (editError) {
      setError(editError.message);
    } finally {
      setBusy(false);
    }
  }

  async function onConfirmMakeHead() {
    if (!confirmHeadPayload) return;
    const { resident, fullName: nextName, birthDate: nextBirth, cccd: nextCccd } =
      confirmHeadPayload;
    setError("");
    setMessage("");
    setBusy(true);
    try {
      const data = await api(`/api/residents/${resident.id}`, {
        method: "PUT",
        body: JSON.stringify({
          fullName: nextName,
          birthDate: nextBirth,
          cccd: nextCccd,
          relationship: "Chủ hộ",
        }),
      });
      setMessage(
        `Đã chuyển quyền Chủ hộ phòng ${data.resident.roomNumber} sang ${data.resident.fullName}.`,
      );
      setConfirmHeadPayload(null);
      await fetchResidentsList();
    } catch (headError) {
      setError(headError.message);
      setConfirmHeadPayload(null);
    } finally {
      setBusy(false);
    }
  }

  async function onDeleteResident(resident) {
    setError("");
    setMessage("");
    setDeletingId(resident.id);
    try {
      await api(`/api/residents/${resident.id}`, { method: "DELETE" });
      setMessage(`Đã xóa nhân khẩu ${resident.fullName} (phòng ${resident.roomNumber}).`);
      setConfirmDeleteId(null);
      if (selectedResidentId === resident.id) closeResidencyModal();
      setResidents((prev) => prev.filter((item) => item.id !== resident.id));
    } catch (delError) {
      setError(delError.message);
      setConfirmDeleteId(null);
    } finally {
      setDeletingId(null);
    }
  }

  function onSearch(event) {
    event.preventDefault();
    setError("");
    setMessage("");
    const trimmed = searchInput.trim();
    if (trimmed !== activeSearch || activeApartmentId) {
      setLoading(true);
    }
    const nextParams = new URLSearchParams();
    if (trimmed) {
      nextParams.set("search", trimmed);
    }
    setSearchParams(nextParams);
  }

  function clearAllFilters() {
    setSearchInput("");
    if (activeSearch || activeApartmentId) {
      setLoading(true);
    }
    setSearchParams({});
  }

  function openResidencyModal(resident) {
    setSelectedResidentId(resident.id);
    setResidencyStatus(resident.currentStatus || "Thường trú");
    setStartDate(getBusinessDate());
    setEndDate("");
  }

  function closeResidencyModal() {
    setSelectedResidentId(null);
    setResidencyStatus("Thường trú");
    setStartDate(getBusinessDate());
    setEndDate("");
  }

  async function onUpdateResidency(event) {
    event.preventDefault();
    setError("");
    setMessage("");
    setBusy(true);

    try {
      const data = await api(`/api/residents/${selectedResidentId}/residency-events`, {
        method: "POST",
        body: JSON.stringify({
          status: residencyStatus,
          startDate,
          endDate,
        }),
      });
      setMessage(`Đã ghi nhận biến động cư trú cho ${data.resident.fullName}.`);
      closeResidencyModal();
      setResidents((prev) =>
        prev.map((item) => (item.id === data.resident.id ? data.resident : item)),
      );
    } catch (statusError) {
      setError(statusError.message);
    } finally {
      setBusy(false);
    }
  }

  const selectedResident = residents.find(
    (resident) => resident.id === selectedResidentId,
  );
  const pendingHeadResident = confirmHeadPayload?.resident || null;
  const currentHeadName = pendingHeadResident
    ? pendingHeadResident.householdHeadName ||
      residents.find(
        (r) =>
          r.householdId === pendingHeadResident.householdId &&
          r.relationship === "Chủ hộ",
      )?.fullName ||
      "Chưa có chủ hộ"
    : "";

  return (
    <section>
      <h1>Hộ và nhân khẩu</h1>
      <p className="hint">
        Tra cứu nhanh theo số phòng hoặc họ tên. Bấm{" "}
        <strong>+ Thêm cư dân</strong> khi cần nhập chủ hộ hoặc thành viên mới.
      </p>

      {error && <p className="error" role="alert">{error}</p>}
      {message && <p className="ok" role="status">{message}</p>}

      <form className="search-form" onSubmit={onSearch}>
        <label>
          Tìm theo số phòng hoặc họ tên
          <input
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            placeholder="Nhập số phòng (vd: 050) hoặc họ tên cần tìm"
          />
        </label>
        <button type="submit" disabled={loading}>
          {loading ? "Đang tìm…" : "Tìm"}
        </button>
        {(activeSearch || activeApartmentId) && (
          <button
            type="button"
            className="link"
            disabled={loading}
            onClick={clearAllFilters}
          >
            Xóa lọc
          </button>
        )}
        <button
          type="button"
          onClick={() => {
            setShowAddForm((prev) => {
              const nextOpen = !prev;
              if (nextOpen && activeApartmentId) {
                handleApartmentSelect(String(activeApartmentId));
              }
              return nextOpen;
            });
          }}
        >
          {showAddForm ? "Ẩn form thêm" : "+ Thêm cư dân"}
        </button>
      </form>

      {activeApartmentId && (
        <p className="ok" role="status">
          Đang lọc riêng các nhân khẩu của{" "}
          <strong>Phòng {activeRoomLabel || activeApartmentId}</strong>.{" "}
          <button
            type="button"
            className="link"
            onClick={clearAllFilters}
          >
            Xem tất cả các phòng
          </button>
        </p>
      )}

      <form className="search-form" onSubmit={onExport}>
        <label>
          Xuất Excel theo trạng thái cư trú{" "}
          {activeSearch || activeRoomLabel
            ? `(đồng bộ bộ lọc "${activeSearch || activeRoomLabel}")`
            : "(toàn bộ danh sách)"}
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

      {showAddForm && (
        <AddResidentForm
          apartments={apartments}
          apartmentId={apartmentId}
          onApartmentChange={(nextId) => handleApartmentSelect(nextId)}
          fullName={fullName}
          setFullName={setFullName}
          nameInputRef={nameInputRef}
          birthDate={birthDate}
          setBirthDate={setBirthDate}
          cccd={cccd}
          setCccd={setCccd}
          relationship={relationship}
          setRelationship={setRelationship}
          hasHeadForSelectedApartment={apartmentHasHead(apartmentId)}
          busy={busy}
          loading={loading}
          onSubmit={onAddResident}
          onClose={() => setShowAddForm(false)}
        />
      )}

      {pendingHeadResident && (
        <div className="modal-backdrop" role="dialog" aria-modal="true">
          <div className="modal-card">
            <h2>
              Xác nhận đổi Chủ hộ (Phòng {pendingHeadResident.roomNumber})
            </h2>
            <p>
              Chủ hộ hiện tại: <strong>{currentHeadName}</strong>
              {" → "}
              Chủ hộ mới: <strong>{confirmHeadPayload.fullName}</strong>
            </p>
            <p className="hint">
              Lưu ý nghiệp vụ: Khi xác nhận, chủ hộ cũ ({currentHeadName}) sẽ chuyển sang quan hệ{" "}
              <strong>&quot;Khác&quot;</strong>. Bạn có thể bấm Sửa trên các thành viên trong hộ để cập nhật lại quan hệ với chủ hộ mới nếu cần.
            </p>
            <div className="row-actions">
              <button
                type="button"
                disabled={busy}
                onClick={onConfirmMakeHead}
              >
                {busy ? "Đang lưu…" : "Xác nhận đổi Chủ hộ"}
              </button>
              <button
                type="button"
                className="link"
                onClick={() => setConfirmHeadPayload(null)}
              >
                Hủy
              </button>
            </div>
          </div>
        </div>
      )}

      {selectedResident && (
        <ResidencyStatusForm
          resident={selectedResident}
          residencyStatus={residencyStatus}
          setResidencyStatus={setResidencyStatus}
          startDate={startDate}
          setStartDate={setStartDate}
          endDate={endDate}
          setEndDate={setEndDate}
          busy={busy}
          onSubmit={onUpdateResidency}
          onCancel={closeResidencyModal}
        />
      )}

      <h2>
        Danh sách nhân khẩu ({residents.length})
        {activeSearch ? ` · Tìm: "${activeSearch}"` : ""}
        {activeRoomLabel ? ` · Phòng: ${activeRoomLabel}` : ""}
      </h2>
      {loading ? (
        <p className="muted">Đang tải danh sách…</p>
      ) : residents.length === 0 ? (
        <p className="muted">Không tìm thấy hộ hoặc nhân khẩu phù hợp.</p>
      ) : (
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th style={{ width: "80px" }}>Phòng</th>
                <th>Họ và tên & Hồ sơ</th>
                <th style={{ width: "130px" }}>Quan hệ</th>
                <th style={{ width: "180px" }}>Trạng thái cư trú</th>
                <th style={{ width: "260px" }}>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {residents.map((resident) => (
                <tr key={resident.id}>
                  <td><strong>{resident.roomNumber}</strong></td>
                  <td>
                    {editingResidentId === resident.id ? (
                      <div style={{ display: "grid", gap: "0.4rem" }}>
                        <input
                          value={editFullName}
                          onChange={(e) => setEditFullName(e.target.value)}
                          placeholder="Họ và tên"
                        />
                        <input
                          type="date"
                          max={today}
                          value={editBirthDate}
                          onChange={(e) => setEditBirthDate(e.target.value)}
                        />
                        <input
                          value={editCccd}
                          placeholder="Số CCCD/CMND (9 hoặc 12 số)"
                          onChange={(e) => setEditCccd(e.target.value)}
                        />
                      </div>
                    ) : (
                      <>
                        <strong>{resident.fullName}</strong>
                        <details>
                          <summary className="hint">
                            Chi tiết & Lịch sử ({resident.residencyHistory.length})
                          </summary>
                          <p className="hint" style={{ margin: "0.25rem 0" }}>
                            Ngày sinh: <strong>{formatDateVN(resident.birthDate)}</strong>
                            {" · "}
                            CCCD: <strong>{resident.cccd || "Chưa cấp"}</strong>
                            {resident.householdHeadName && (
                              <>
                                {" · "}
                                Chủ hộ: <strong>{resident.householdHeadName}</strong>
                              </>
                            )}
                          </p>
                          {resident.residencyHistory.length === 0 ? (
                            <p className="muted" style={{ margin: "0.2rem 0" }}>
                              Chưa có lịch sử biến động cư trú.
                            </p>
                          ) : (
                            <ul className="history-list" style={{ margin: "0.25rem 0" }}>
                              {resident.residencyHistory.map((item) => (
                                <li key={item.id}>
                                  {item.status}: {formatRangeVN(item.startDate, item.endDate)}
                                </li>
                              ))}
                            </ul>
                          )}
                        </details>
                      </>
                    )}
                  </td>
                  <td>
                    {editingResidentId === resident.id ? (
                      <select
                        value={editRelationship}
                        onChange={(e) => setEditRelationship(e.target.value)}
                      >
                        {RELATIONSHIPS.map((rel) => (
                          <option key={rel} value={rel}>
                            {rel}
                          </option>
                        ))}
                      </select>
                    ) : (
                      resident.relationship
                    )}
                  </td>
                  <td>
                    <strong>{resident.currentStatus}</strong>
                    {resident.statusStartDate && (
                      <span className="muted">
                        <br />
                        {formatRangeVN(resident.statusStartDate, resident.statusEndDate)}
                      </span>
                    )}
                  </td>
                  <td>
                    {editingResidentId === resident.id ? (
                      <span className="row-actions">
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => onSaveResidentEdit(resident)}
                        >
                          Lưu
                        </button>
                        <button
                          type="button"
                          className="link"
                          onClick={() => setEditingResidentId(null)}
                        >
                          Hủy
                        </button>
                      </span>
                    ) : confirmDeleteId === resident.id ? (
                      <span className="row-actions">
                        <button
                          type="button"
                          className="danger"
                          disabled={deletingId === resident.id}
                          onClick={() => onDeleteResident(resident)}
                        >
                          {deletingId === resident.id ? "Đang xóa…" : "Xác nhận xóa"}
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
                          onClick={() => openResidencyModal(resident)}
                        >
                          Đổi cư trú
                        </button>
                        <button
                          type="button"
                          className="link"
                          onClick={() => startEditResident(resident)}
                        >
                          Sửa
                        </button>
                        <details>
                          <summary className="hint" style={{ cursor: "pointer" }}>
                            Thêm ▾
                          </summary>
                          <div className="row-actions" style={{ marginTop: "0.35rem" }}>
                            {resident.relationship !== "Chủ hộ" && (
                              <button
                                type="button"
                                className="link"
                                disabled={busy}
                                onClick={() => {
                                  setConfirmDeleteId(null);
                                  setEditingResidentId(null);
                                  setConfirmHeadPayload({
                                    resident,
                                    fullName: resident.fullName,
                                    birthDate: resident.birthDate,
                                    cccd: resident.cccd || "",
                                  });
                                }}
                              >
                                Đặt chủ hộ
                              </button>
                            )}
                            {resident.currentStatus !== "Chuyển đi" && (
                              <button
                                type="button"
                                className="link"
                                onClick={() =>
                                  navigate(
                                    `/resident-accounts?residentId=${resident.id}&room=${encodeURIComponent(resident.roomNumber)}`,
                                  )
                                }
                              >
                                Cấp TK
                              </button>
                            )}
                            <button
                              type="button"
                              className="danger"
                              onClick={() => {
                                setConfirmHeadPayload(null);
                                setEditingResidentId(null);
                                setConfirmDeleteId(resident.id);
                              }}
                            >
                              Xóa
                            </button>
                          </div>
                        </details>
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
