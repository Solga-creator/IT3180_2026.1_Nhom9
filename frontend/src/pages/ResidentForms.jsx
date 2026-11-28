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

export function AddResidentForm({
  apartments,
  apartmentId,
  onApartmentChange,
  fullName,
  setFullName,
  nameInputRef,
  birthDate,
  setBirthDate,
  cccd,
  setCccd,
  relationship,
  setRelationship,
  hasHeadForSelectedApartment,
  submitting = false,
  busy,
  loading,
  onSubmit,
  onClose,
}) {
  const isSubmitting = Boolean(submitting);
  return (
    <form className="card form" onSubmit={onSubmit}>
      <h2>Thêm chủ hộ hoặc nhân khẩu</h2>
      <p className="hint">
        {hasHeadForSelectedApartment
          ? "Căn hộ này đã có Chủ hộ. Hệ thống đã chọn sẵn quan hệ thành viên để bạn nhập tiếp nhanh."
          : "Căn hộ chưa có Chủ hộ thì cần thêm Chủ hộ trước tiên."}
      </p>
      <label>
        Căn hộ
        <select
          required
          disabled={isSubmitting}
          value={apartmentId}
          onChange={(event) => onApartmentChange(event.target.value)}
        >
          <option value="">Chọn căn hộ</option>
          {apartments.map((apartment) => (
            <option key={apartment.id} value={apartment.id}>
              Phòng {apartment.roomNumber} ({apartment.area} m²)
            </option>
          ))}
        </select>
      </label>
      <label>
        Họ và tên
        <input
          ref={nameInputRef}
          required
          disabled={isSubmitting}
          minLength={2}
          maxLength={120}
          value={fullName}
          onChange={(event) => setFullName(event.target.value)}
          placeholder="Nhập họ và tên nhân khẩu"
        />
      </label>
      <label>
        Ngày sinh
        <input
          type="date"
          required
          disabled={isSubmitting}
          max={getBusinessDate()}
          value={birthDate}
          onChange={(event) => setBirthDate(event.target.value)}
        />
      </label>
      <label>
        Số CCCD/CMND (tùy chọn cho trẻ em, 9 hoặc 12 chữ số)
        <input
          disabled={isSubmitting}
          value={cccd}
          onChange={(event) => setCccd(event.target.value)}
          placeholder="Ví dụ: 001206012345"
          maxLength={20}
        />
      </label>
      <label>
        Quan hệ với chủ hộ
        <select
          required
          disabled={isSubmitting}
          value={relationship}
          onChange={(event) => setRelationship(event.target.value)}
        >
          {RELATIONSHIPS.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>
      </label>
      <div className="row-actions">
        <button
          type="submit"
          disabled={isSubmitting || Boolean(busy) || apartments.length === 0}
        >
          {isSubmitting ? "Đang lưu…" : "Lưu & Nhập tiếp"}
        </button>
        {onClose && (
          <button
            type="button"
            className="link"
            disabled={isSubmitting}
            onClick={onClose}
          >
            Đóng
          </button>
        )}
      </div>
      {apartments.length === 0 && !loading && (
        <p className="hint">Cần lưu căn hộ trước khi thêm chủ hộ.</p>
      )}
    </form>
  );
}

export function ResidencyStatusForm({
  resident,
  residencyStatus,
  setResidencyStatus,
  startDate,
  setStartDate,
  endDate,
  setEndDate,
  busy,
  onSubmit,
  onCancel,
}) {
  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true">
      <form className="modal-card" onSubmit={onSubmit}>
        <h2>
          Đổi cư trú: {resident.fullName} (Phòng {resident.roomNumber})
        </h2>
        <p className="hint">
          Trạng thái hiện tại: <strong>{resident.currentStatus}</strong>. Ngày bắt đầu đã được điền sẵn hôm nay; sự kiện tương lai hoặc đã qua sẽ tự tính theo ngày hiệu lực.
        </p>
        <label>
          Trạng thái mới
          <select
            value={residencyStatus}
            onChange={(event) => setResidencyStatus(event.target.value)}
          >
            {RESIDENCY_STATUSES.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </label>
        <label>
          Ngày bắt đầu hiệu lực
          <input
            type="date"
            required
            value={startDate}
            onChange={(event) => setStartDate(event.target.value)}
          />
        </label>
        <label>
          Ngày kết thúc (để trống nếu chưa xác định thời điểm kết thúc)
          <input
            type="date"
            min={startDate || undefined}
            value={endDate}
            onChange={(event) => setEndDate(event.target.value)}
          />
        </label>
        <div className="row-actions">
          <button type="submit" disabled={busy}>
            {busy ? "Đang lưu…" : "Lưu thay đổi"}
          </button>
          <button type="button" className="link" onClick={onCancel}>
            Hủy
          </button>
        </div>
      </form>
    </div>
  );
}
