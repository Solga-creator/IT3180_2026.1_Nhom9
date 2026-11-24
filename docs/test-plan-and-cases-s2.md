# Kế hoạch Kiểm thử & Bộ Test Cases Chuẩn bị cho Sprint 2 (Test Plan & Cases S2 — Planned)

> **Trạng thái:** Tài liệu chuẩn bị trước khi triển khai code Sprint 2 (TDD/BDD). Nhóm SE09 hiện đã hoàn thành **100% kiểm thử Sprint 1 (`48/48` PASS)** và **chưa bắt đầu thực thi Sprint 2 (`0/11 US`)**.

---

## 1. Phạm vi & Mục tiêu Kiểm thử Sprint 2 (11 User Stories)
- **Phạm vi chức năng:** Kiểm thử toàn bộ phân hệ thu phí bắt buộc (`US-006`, `US-008`, `US-009`, `US-010`, `US-012`), quỹ đóng góp tự nguyện (`US-007`, `US-011`), lịch sử & báo cáo Excel (`US-013`, `US-014`), phân quyền chi tiết & nhật ký kiểm toán (`US-018`, `US-019`).
- **Hồi quy (Regression):** Đảm bảo 100% `48/48` automated tests của Sprint 1 không bị ảnh hưởng khi thêm 10 bảng CSDL và 12 REST API mới.

---

## 2. Bộ Functional Test Cases Trọng tâm (22 FTC cho 11 US Sprint 2)

| Mã TC | US ID | Tình huống kiểm thử | Dữ liệu đầu vào | Kết quả mong đợi | Trạng thái |
|---|---|---|---|---|---|
| `FTC-S2-01` | `US-006` | Chốt đơn giá phí dịch vụ & phí quản lý hợp lệ | Dịch vụ `6.000 đ/m²`, Quản lý `7.500 đ/m²` | HTTP 200, lưu vào `fee_rate_configs` | Planned |
| `FTC-S2-02` | `US-006` | Từ chối phí dịch vụ ngoài khung $2.500\text{–}16.500\text{ đ/m}^2$ | Dịch vụ `2.000` hoặc `18.000` | HTTP 400, báo lỗi đúng khung giá | Planned |
| `FTC-S2-03` | `US-006` | Từ chối phí quản lý dưới $7.000\text{ đ/m}^2$ | Quản lý `6.500` | HTTP 400, yêu cầu $\ge 7.000\text{ đ/m}^2$ | Planned |
| `FTC-S2-04` | `US-007` | Tạo đợt đóng góp tự nguyện hợp lệ | Tên *"Quỹ khuyến học 2026"*, `01/11`–`30/11` | HTTP 201, tách biệt khỏi bảng phí bắt buộc | Planned |
| `FTC-S2-05` | `US-007` | Từ chối đợt đóng góp có ngày kết thúc trước ngày bắt đầu | `start_date > end_date` | HTTP 400, báo lỗi khoảng ngày | Planned |
| `FTC-S2-06` | `US-008` | Sinh bảng thu đầu tháng cho tất cả căn hộ | Kỳ `2026-11`, căn `050` ($60\text{ m}^2$) | Phí DV $= 360.000$, Phí QL $= 450.000$, Tổng $= 810.000$ | Planned |
| `FTC-S2-07` | `US-008` | Chặn sinh trùng bảng thu cho kỳ đã tạo | Gọi sinh kỳ `2026-11` lần 2 | HTTP 409, không tạo hóa đơn trùng lặp | Planned |
| `FTC-S2-08` | `US-009` | Lấy dữ liệu & xem bản in Giấy báo phí theo căn | `billId` của căn `050` | Đủ số phòng `050`, chủ hộ, diện tích, chi tiết phí | Planned |
| `FTC-S2-09` | `US-010` | Ghi nhận nộp đủ phí bắt buộc bằng Tiền mặt | `amount = 810.000`, `method = CASH` | Lưu giao dịch, `status = PAID`, trả mã biên lai | Planned |
| `FTC-S2-10` | `US-010` | Ghi nhận nộp một phần bằng Chuyển khoản | `amount = 500.000`, `method = BANK_TRANSFER` | `total_paid = 500.000`, `debt = 310.000`, `status = PARTIAL` | Planned |
| `FTC-S2-11` | `US-010` | Chặn ghi nhận số tiền âm hoặc vượt quá số còn nợ | `amount <= 0` hoặc `amount > debt_amount` | HTTP 400, không thay đổi công nợ | Planned |
| `FTC-S2-12` | `US-011` | Ghi nhận hộ gia đình ủng hộ quỹ tự nguyện | Căn `050`, Quỹ khuyến học, `200.000 đ` | Lưu vào `voluntary_contributions`, không trừ vào nợ bắt buộc | Planned |
| `FTC-S2-13` | `US-012` | Lọc danh sách căn hộ chưa nộp đủ trong kỳ | Kỳ `2026-11` | Chỉ trả về các căn `UNPAID` & `PARTIAL` kèm số tiền thiếu | Planned |
| `FTC-S2-14` | `US-013` | Xem lịch sử đóng tiền của một căn hộ | `apartmentId` căn `050` | Hiển thị đủ cả giao dịch phí bắt buộc và ủng hộ tự nguyện | Planned |
| `FTC-S2-15` | `US-014` | Xuất file Excel tổng hợp thu theo loại phí & theo quỹ | Kỳ `2026-11` | File `.xlsx` tải về đúng tổng theo từng loại phí và quỹ | Planned |
| `FTC-S2-16` | `US-018` | ADMIN gán vai trò `ACCOUNTANT` / `TREASURER` cho tài khoản | `role = ACCOUNTANT` | Cập nhật quyền thành công, API kiểm tra đúng vai trò | Planned |
| `FTC-S2-17` | `US-018` | Chặn tài khoản không phải `ADMIN` tự nâng quyền | User `BQT` gọi `PATCH /api/accounts/:id/role` | HTTP 403 Forbidden | Planned |
| `FTC-S2-18` | `US-019` | Tự động ghi Audit Log khi thêm cư dân / ghi nhận thu tiền | Thực hiện `US-002` và `US-010` | `AuditLogObserver` ghi đủ 2 bản ghi vào `audit_logs` | Planned |
| `FTC-S2-19` | `US-019` | ADMIN tra cứu & lọc Nhật ký hệ thống theo loại đối tượng | `GET /api/audit-logs?entity=FEE_PAYMENT` | Chỉ trả về các thao tác giao dịch thu phí kèm tên người thu | Planned |
