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

function buildResidentsQuery({
  search = "",
  apartmentId = "",
  status = "",
  includeHistory = true,
} = {}) {
  const query = new URLSearchParams();
  const trimmedSearch = String(search || "").trim();
  if (trimmedSearch) query.set("search", trimmedSearch);
  if (apartmentId) query.set("apartmentId", String(apartmentId));
  if (status && RESIDENCY_STATUSES.includes(status)) query.set("status", status);
  if (includeHistory === false) query.set("includeHistory", "false");
  return query.size ? `?${query.toString()}` : "";
}

export default function ResidentsPage() {
  const today = getBusinessDate();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeSearch = searchParams.get("search") || "";
  const activeApartmentId = searchParams.get("apartmentId") || "";
  const activeRoomLabel = searchParams.get("room") || "";
  const rawStatus = searchParams.get("status") || "";
  const activeStatus = RESIDENCY_STATUSES.includes(rawStatus) ? rawStatus : "";

  const nameInputRef = useRef(null);
  const apartmentsSeqRef = useRef(0);
  const listRequestSeqRef = useRef(0);
  const headCheckSeqRef = useRef(0);
  const addDraftSeqRef = useRef(0);
  const filterKey = `${activeSearch}\u0000${activeApartmentId}\u0000${activeStatus}`;
  const [listRefresh, setListRefresh] = useState(0);
  const loadKey = `${filterKey}\u0000${listRefresh}`;
  const [apartments, setApartments] = useState([]);
  const [listState, setListState] = useState({
    filterKey: "",
    loadedKey: "",
    residents: [],
  });
  const residents =
    listState.filterKey === filterKey ? listState.residents : [];
  const loading = listState.loadedKey !== loadKey;
  const [showAddForm, setShowAddForm] = useState(false);
  const [apartmentId, setApartmentId] = useState(activeApartmentId);
  const [headCheck, setHeadCheck] = useState({
    apartmentId: "",
    status: "idle",
    hasHead: null,
    error: "",
  });
  const [fullName, setFullName] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [cccd, setCccd] = useState("");
  const [relationship, setRelationship] = useState("Chủ hộ");
  const [searchDraft, setSearchDraft] = useState({
    syncedSearch: activeSearch,
    value: activeSearch,
  });
  const searchInput =
    searchDraft.syncedSearch === activeSearch ? searchDraft.value : activeSearch;
  const [actionFilterKey, setActionFilterKey] = useState(filterKey);
  const isCurrentActionScope = actionFilterKey === filterKey;
  const [rawSelectedResidentId, setSelectedResidentId] = useState(null);
  const selectedResidentId = isCurrentActionScope ? rawSelectedResidentId : null;
  const [residencyStatus, setResidencyStatus] = useState("Thường trú");
  const [startDate, setStartDate] = useState(getBusinessDate);
  const [endDate, setEndDate] = useState("");
  const [rawEditingResidentId, setEditingResidentId] = useState(null);
  const editingResidentId = isCurrentActionScope ? rawEditingResidentId : null;
  const [editFullName, setEditFullName] = useState("");
  const [editBirthDate, setEditBirthDate] = useState("");
  const [editCccd, setEditCccd] = useState("");
  const [editRelationship, setEditRelationship] = useState("Con");
  const [rawConfirmDeleteId, setConfirmDeleteId] = useState(null);
  const confirmDeleteId = isCurrentActionScope ? rawConfirmDeleteId : null;
  const [rawConfirmHeadPayload, setConfirmHeadPayload] = useState(null);
  const confirmHeadPayload = isCurrentActionScope ? rawConfirmHeadPayload : null;
  const [deletingId, setDeletingId] = useState(null);
  const [addingResident, setAddingResident] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [exportDraft, setExportDraft] = useState({
    syncedStatus: activeStatus,
    value: activeStatus || "Thường trú",
  });
  const exportStatus =
    exportDraft.syncedStatus === activeStatus
      ? exportDraft.value
      : activeStatus || exportDraft.value;
  const [exporting, setExporting] = useState(false);

  async function inspectApartmentHead(targetAptId) {
    const normalizedId = String(targetAptId || "");
    const reqId = ++headCheckSeqRef.current;
    if (!normalizedId) {
      setHeadCheck({ apartmentId: "", status: "idle", hasHead: null, error: "" });
      return;
    }

    setHeadCheck({
      apartmentId: normalizedId,
      status: "loading",
      hasHead: null,
      error: "",
    });

    try {
      const suffix = buildResidentsQuery({
        apartmentId: normalizedId,
        includeHistory: false,
      });
      const data = await api(`/api/residents${suffix}`);
      if (reqId !== headCheckSeqRef.current) return;
      const aptResidents = data.residents || [];
      const hasHead = aptResidents.some(
        (r) => Boolean(r.householdHeadId) || r.relationship === "Chủ hộ",
      );
      setHeadCheck({
        apartmentId: normalizedId,
        status: "ready",
        hasHead,
        error: "",
      });
      setRelationship(hasHead ? "Con" : "Chủ hộ");
    } catch (checkError) {
      if (reqId !== headCheckSeqRef.current) return;
      setHeadCheck({
        apartmentId: normalizedId,
        status: "error",
        hasHead: null,
        error:
          checkError.message ||
          "Không thể kiểm tra chủ hộ của căn hộ này. Vui lòng thử lại.",
      });
    }
  }

  function handleApartmentSelect(nextAptId) {
    if (addingResident) return;
    addDraftSeqRef.current += 1;
    const normalizedId = String(nextAptId || "");
    setApartmentId(normalizedId);
    inspectApartmentHead(normalizedId);
  }

  function toggleAddForm() {
    if (addingResident) return;
    const nextOpen = !showAddForm;
    setShowAddForm(nextOpen);
    if (nextOpen) {
      const targetApt = activeApartmentId
        ? String(activeApartmentId)
        : String(apartmentId || "");
      if (targetApt) {
        handleApartmentSelect(targetApt);
      }
    } else {
      addDraftSeqRef.current += 1;
    }
  }

  useEffect(() => {
    if (rawStatus && !activeStatus) {
      const normalized = new URLSearchParams(searchParams);
      normalized.delete("status");
      setSearchParams(normalized, { replace: true });
    }
  }, [rawStatus, activeStatus, searchParams, setSearchParams]);

  useEffect(() => {
    const reqId = ++apartmentsSeqRef.current;
    api("/api/apartments")
      .then((apartmentData) => {
        if (reqId !== apartmentsSeqRef.current) return;
        setApartments(apartmentData.apartments || []);
      })
      .catch((loadError) => {
        if (reqId === apartmentsSeqRef.current) {
          setError((prev) => prev || loadError.message);
        }
      });

    return () => {
      apartmentsSeqRef.current += 1;
    };
  }, []);

  useEffect(() => {
    const reqId = ++listRequestSeqRef.current;
    const suffix = buildResidentsQuery({
      search: activeSearch,
      apartmentId: activeApartmentId,
      status: activeStatus,
    });

    api(`/api/residents${suffix}`)
      .then((residentData) => {
        if (reqId !== listRequestSeqRef.current) return;
        setListState({
          filterKey,
          loadedKey: loadKey,
          residents: residentData.residents || [],
        });
      })
      .catch((loadError) => {
        if (reqId === listRequestSeqRef.current) {
          setError(loadError.message);
          setListState({
            filterKey,
            loadedKey: loadKey,
            residents: [],
          });
        }
      });

    return () => {
      listRequestSeqRef.current += 1;
    };
  }, [activeSearch, activeApartmentId, activeStatus, listRefresh, filterKey, loadKey]);

  async function onExport(event) {
    event.preventDefault();
    const targetExportStatus = RESIDENCY_STATUSES.includes(exportStatus)
      ? exportStatus
      : "";
    if (!targetExportStatus) {
      setError("Chọn trạng thái cư trú hợp lệ để xuất Excel.");
      return;
    }

    setError("");
    setMessage("");
    setExporting(true);
    try {
      const query = new URLSearchParams({ status: targetExportStatus });
      if (activeSearch.trim()) query.set("search", activeSearch.trim());
      if (activeApartmentId) query.set("apartmentId", activeApartmentId);
      const blob = await api(`/api/residents/export?${query}`, {}, "blob");
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `nhan-khau-${targetExportStatus}.xlsx`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      const scopeParts = [];
      if (activeApartmentId) {
        scopeParts.push(`Phòng ${activeRoomLabel || activeApartmentId}`);
      }
      if (activeSearch.trim()) {
        scopeParts.push(`tìm "${activeSearch.trim()}"`);
      }
      setMessage(
        `Đã tải danh sách nhân khẩu (${targetExportStatus}${scopeParts.length ? ` · ${scopeParts.join(", ")}` : ""}).`,
      );
    } catch (exportError) {
      setError(exportError.message);
    } finally {
      setExporting(false);
    }
  }

  async function onAddResident(event) {
    event.preventDefault();
    if (
      addingResident ||
      !apartmentId ||
      headCheck.status !== "ready" ||
      headCheck.apartmentId !== String(apartmentId)
    ) {
      setError("Đang xác định chủ hộ của căn hộ hoặc chưa tải được dữ liệu chủ hộ.");
      return;
    }

    const targetAptId = String(apartmentId);
    const draftSeq = addDraftSeqRef.current;
    setError("");
    setMessage("");
    setAddingResident(true);
    setBusy(true);

    try {
      const data = await api("/api/residents", {
        method: "POST",
        body: JSON.stringify({
          apartmentId: targetAptId,
          fullName,
          birthDate,
          cccd,
          relationship,
        }),
      });
      setMessage(
        `Đã thêm ${data.resident.fullName} vào phòng ${data.resident.roomNumber}. Bạn có thể nhập tiếp thành viên khác của phòng này.`,
      );
      if (addDraftSeqRef.current === draftSeq) {
        setFullName("");
        setBirthDate("");
        setCccd("");
        setHeadCheck({
          apartmentId: targetAptId,
          status: "ready",
          hasHead: true,
          error: "",
        });
        setRelationship("Con");
        setTimeout(() => {
          nameInputRef.current?.focus();
        }, 20);
      }
      // Let the effect reload with the current URL, even if this save began before navigation.
      setListRefresh((value) => value + 1);
    } catch (submitError) {
      setError(submitError.message);
    } finally {
      setAddingResident(false);
      setBusy(false);
    }
  }

  function startEditResident(resident) {
    setActionFilterKey(filterKey);
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
      setActionFilterKey(filterKey);
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
      setListState((prev) =>
        prev.filterKey === filterKey
          ? {
              ...prev,
              residents: prev.residents.map((item) =>
                item.id === resident.id ? data.resident : item,
              ),
            }
          : prev,
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
      setListRefresh((value) => value + 1);
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
      if (editingResidentId === resident.id) setEditingResidentId(null);
      if (selectedResidentId === resident.id) closeResidencyModal();
      setListState((prev) =>
        prev.filterKey === filterKey
          ? {
              ...prev,
              residents: prev.residents.filter((item) => item.id !== resident.id),
            }
          : prev,
      );
      if (showAddForm && apartmentId && Number(apartmentId) === Number(resident.apartmentId)) {
        inspectApartmentHead(apartmentId);
      }
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
    const nextParams = new URLSearchParams();
    if (trimmed) {
      nextParams.set("search", trimmed);
    }
    if (activeStatus) {
      nextParams.set("status", activeStatus);
    }
    setSearchParams(nextParams);
  }

  function onStatusFilterChange(nextValue) {
    setError("");
    setMessage("");
    const nextStatus = RESIDENCY_STATUSES.includes(nextValue) ? nextValue : "";
    if (nextStatus) {
      setExportDraft({ syncedStatus: nextStatus, value: nextStatus });
    }
    const nextParams = new URLSearchParams();
    if (activeSearch) nextParams.set("search", activeSearch);
    if (activeApartmentId) nextParams.set("apartmentId", activeApartmentId);
    if (activeRoomLabel) nextParams.set("room", activeRoomLabel);
    if (nextStatus) nextParams.set("status", nextStatus);
    setSearchParams(nextParams);
  }

  function clearAllFilters() {
    setError("");
    setMessage("");
    setSearchDraft({ syncedSearch: "", value: "" });
    setSearchParams({});
  }

  function clearApartmentFilter() {
    setError("");
    setMessage("");
    const nextParams = new URLSearchParams();
    if (activeSearch) nextParams.set("search", activeSearch);
    if (activeStatus) nextParams.set("status", activeStatus);
    setSearchParams(nextParams);
  }

  function openResidencyModal(resident) {
    setActionFilterKey(filterKey);
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
      const movedOutOfFilter =
        activeStatus && data.resident.currentStatus !== activeStatus;
      setMessage(
        movedOutOfFilter
          ? `Đã ghi nhận biến động cư trú cho ${data.resident.fullName} (trạng thái hiệu lực hiện tại: ${data.resident.currentStatus}).`
          : `Đã ghi nhận biến động cư trú cho ${data.resident.fullName}.`,
      );
      closeResidencyModal();
      if (editingResidentId === data.resident.id) setEditingResidentId(null);
      if (confirmDeleteId === data.resident.id) setConfirmDeleteId(null);
      setListRefresh((value) => value + 1);
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
  const isCheckingSelectedHead =
    Boolean(apartmentId) &&
    (headCheck.status === "loading" || headCheck.apartmentId !== String(apartmentId));
  const hasHeadCheckError =
    Boolean(apartmentId) &&
    headCheck.status === "error" &&
    headCheck.apartmentId === String(apartmentId);
  const exportScopeParts = [];
  if (activeApartmentId) {
    exportScopeParts.push(`Phòng ${activeRoomLabel || activeApartmentId}`);
  }
  if (activeSearch) {
    exportScopeParts.push(`tìm "${activeSearch}"`);
  }

  return (
    <section>
      <h1>Hộ và nhân khẩu</h1>
      <p className="hint">
        Tra cứu nhanh theo số phòng, họ tên hoặc trạng thái cư trú. Bấm{" "}
        <strong>+ Thêm cư dân</strong> khi cần nhập chủ hộ hoặc thành viên mới.
      </p>

      {error && <p className="error" role="alert">{error}</p>}
      {message && <p className="ok" role="status">{message}</p>}

      <form className="search-form" onSubmit={onSearch}>
        <label>
          Tìm theo số phòng hoặc họ tên
          <input
            value={searchInput}
            onChange={(event) =>
              setSearchDraft({
                syncedSearch: activeSearch,
                value: event.target.value,
              })
            }
            placeholder="Nhập số phòng (vd: 050) hoặc họ tên cần tìm"
          />
        </label>
        <label>
          Trạng thái cư trú
          <select
            value={activeStatus}
            onChange={(event) => onStatusFilterChange(event.target.value)}
            disabled={loading}
          >
            <option value="">Tất cả trạng thái</option>
            {RESIDENCY_STATUSES.map((status) => (
              <option key={status} value={status}>{status}</option>
            ))}
          </select>
        </label>
        <button type="submit" disabled={loading}>
          {loading ? "Đang tìm…" : "Tìm"}
        </button>
        {(activeSearch || activeApartmentId || activeStatus) && (
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
          disabled={addingResident}
          onClick={toggleAddForm}
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
            onClick={clearApartmentFilter}
          >
            Xem tất cả các phòng
          </button>
        </p>
      )}

      <form className="search-form" onSubmit={onExport}>
        <label>
          Trạng thái xuất Excel{" "}
          {exportScopeParts.length > 0
            ? `(đồng bộ lọc: ${exportScopeParts.join(" · ")})`
            : "(toàn bộ danh sách)"}
          <select
            value={exportStatus}
            onChange={(event) =>
              setExportDraft({
                syncedStatus: activeStatus,
                value: event.target.value,
              })
            }
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
        <>
          {isCheckingSelectedHead && (
            <p className="muted" role="status">
              Đang kiểm tra chủ hộ của căn hộ đã chọn…
            </p>
          )}
          {hasHeadCheckError && (
            <p className="error" role="alert">
              {headCheck.error}{" "}
              <button
                type="button"
                className="link"
                onClick={() => inspectApartmentHead(apartmentId)}
              >
                Thử lại
              </button>
            </p>
          )}
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
            hasHeadForSelectedApartment={
              headCheck.status === "ready" &&
              headCheck.apartmentId === String(apartmentId) &&
              headCheck.hasHead === true
            }
            submitting={addingResident}
            busy={addingResident || busy || isCheckingSelectedHead || hasHeadCheckError}
            loading={loading}
            onSubmit={onAddResident}
            onClose={() => {
              if (addingResident) return;
              addDraftSeqRef.current += 1;
              setShowAddForm(false);
            }}
          />
        </>
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
        {activeStatus ? ` · Trạng thái: ${activeStatus}` : ""}
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
                                  setActionFilterKey(filterKey);
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
                                setActionFilterKey(filterKey);
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
