import { useEffect, useState } from "react";
import { api } from "../services/api.js";
import { useAuth } from "../contexts/useAuth.js";

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

export default function ResidentHomePage() {
  const { user } = useAuth();
  const [residence, setResidence] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    api("/api/auth/residence")
      .then((data) => {
        if (active) setResidence(data.residence);
      })
      .catch((err) => {
        if (active) setError(err.message);
      });
    return () => {
      active = false;
    };
  }, []);

  return (
    <section>
      <h1>Căn hộ của tôi</h1>
      <p>
        Xin chào <strong>{residence?.fullName || user.fullName}</strong>.
      </p>
      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
      {residence && (
        <>
          <div className="card">
            <h2>Thông tin căn hộ</h2>
            <p>
              Căn hộ: <strong>{residence.roomNumber}</strong>
              {residence.area ? ` (${residence.area} m²)` : ""}
              {" · "}
              Chủ hộ: <strong>{residence.headName || residence.fullName}</strong>
              {" · "}
              Số nhân khẩu đang cư trú: <strong>{residence.memberCount || 1}</strong>
            </p>
            <p className="muted">
              Hồ sơ của bạn: {residence.fullName} ({residence.relationship}) · Trạng thái:{" "}
              <strong>{residence.currentStatus || "Thường trú"}</strong>
            </p>
          </div>

          {Array.isArray(residence.members) && residence.members.length > 0 && (
            <>
              <h2>Thành viên đang cư trú trong hộ</h2>
              <div className="table-scroll">
                <table>
                  <thead>
                    <tr>
                      <th>Họ và tên</th>
                      <th>Quan hệ với chủ hộ</th>
                      <th>Tình trạng cư trú</th>
                    </tr>
                  </thead>
                  <tbody>
                    {residence.members.map((member) => (
                      <tr key={member.id}>
                        <td><strong>{member.fullName}</strong></td>
                        <td>{member.relationship}</td>
                        <td>
                          {member.currentStatus}
                          {member.statusStartDate && (
                            <span className="muted">
                              <br />
                              {formatRangeVN(member.statusStartDate, member.statusEndDate)}
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <details style={{ marginTop: "1rem" }}>
                <summary>
                  <strong>Xem chi tiết hồ sơ hành chính & lịch sử biến động cư trú của hộ</strong>
                </summary>
                <div className="table-scroll" style={{ marginTop: "0.5rem" }}>
                  <table>
                    <thead>
                      <tr>
                        <th>Họ và tên</th>
                        <th>Ngày sinh</th>
                        <th>Số CCCD (đã bảo mật)</th>
                        <th>Quan hệ</th>
                      </tr>
                    </thead>
                    <tbody>
                      {residence.members.map((member) => (
                        <tr key={member.id}>
                          <td>{member.fullName}</td>
                          <td>{formatDateVN(member.birthDate)}</td>
                          <td>{member.cccd || "—"}</td>
                          <td>{member.relationship}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {Array.isArray(residence.residencyHistory) &&
                  residence.residencyHistory.length > 0 && (
                    <div style={{ marginTop: "1rem" }}>
                      <h2>Lịch sử biến động cư trú của hộ</h2>
                      <table>
                        <thead>
                          <tr>
                            <th>Thành viên</th>
                            <th>Trạng thái</th>
                            <th>Thời gian hiệu lực</th>
                          </tr>
                        </thead>
                        <tbody>
                          {residence.residencyHistory.map((item) => (
                            <tr key={item.id}>
                              <td>{item.residentName}</td>
                              <td>{item.status}</td>
                              <td>{formatRangeVN(item.startDate, item.endDate)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
              </details>
            </>
          )}
        </>
      )}
    </section>
  );
}
