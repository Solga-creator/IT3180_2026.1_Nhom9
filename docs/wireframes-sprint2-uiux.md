# Thiết kế UI/UX & Prototype / Wireframe Sprint 2 (32 Khung — `WF-13` đến `WF-44`)

Tài liệu này mô tả chi tiết **32 khung thiết kế UI/UX (Prototype / Wireframe)** cho toàn bộ **11 User Stories của Sprint 2** (`US-006`..`014`, `US-018`..`019`), kế thừa trực tiếp khung **Master Layout Base (`WF-BASE`)** của Sprint 1. Kết hợp với **12 khung Sprint 1 (`WF-01`..`WF-12`)**, dự án hoàn thiện trọn bộ **`44 / 44` khung Prototype / Wireframe (100% Mục 5 Checklist)**.

- **File nguồn Draw.io & 14 ảnh `.png` trên Google Drive:** [Prototype - Wireframe (Google Drive)](https://drive.google.com/drive/folders/1UPjX_bRgkSOnabKz-OSyh_xRvgoKEf30) (kèm file nguồn `.drawio` trong thư mục `File draw.io` để chỉnh sửa trực tiếp trên `app.diagrams.net`)
- **Trạng thái code Sprint 2:** Chưa bắt đầu code (`0/11 US`); đây là tài liệu thiết kế UI/UX chuẩn bị trước để cả 4 thành viên thống nhất giao diện và hợp đồng dữ liệu.

---

## Danh mục 32 Khung UI/UX Sprint 2 (`WF-13` đến `WF-44`)

| Tab Draw.io & Ảnh PNG | Các khung Wireframe | US ID | Phụ trách | Nội dung giao diện & Trạng thái chính |
|---|---|---|---|---|
| `WF-13_16_FeeRates` | `WF-13`..`WF-16` (4 khung) | `US-006` | Nguyễn Quang Nhật | (13) Bảng đơn giá hiện hành; (14) Form chốt đơn giá phí dịch vụ ($2.500\text{–}16.500\text{ đ/m}^2$) & quản lý ($\ge 7.000\text{ đ/m}^2$); (15) Banner lỗi nhập ngoài khung quy định; (16) Bảng lịch sử thay đổi đơn giá. |
| `WF-17_20_VoluntaryCampaigns` | `WF-17`..`WF-20` (4 khung) | `US-007` | Lê Tuấn Vĩ | (17) Danh sách đợt đóng góp tự nguyện tách riêng phí bắt buộc; (18) Form tạo đợt vận động/quỹ mới; (19) Trạng thái lỗi ngày kết thúc < ngày bắt đầu; (20) Chi tiết đợt đang mở / đã đóng. |
| `WF-21_24_MonthlyBilling` | `WF-21`..`WF-24` (4 khung) | `US-008` | Nguyễn Quang Nhật | (21) Thanh chọn kỳ `YYYY-MM` & nút Sinh bảng thu đầu tháng; (22) Modal xác nhận tính phí $= \text{diện tích} \times \text{đơn giá}$; (23) Bảng thu chi tiết từng căn hộ; (24) Cảnh báo chặn sinh trùng kỳ thu. |
| `WF-25_27_FeeNotice` | `WF-25`..`WF-27` (3 khung) | `US-009` | Đặng Gia Bảo | (25) Thanh chọn căn hộ cần xem giấy báo; (26) Mẫu Giấy báo phí chi tiết (Số phòng, Chủ hộ, Diện tích $\text{m}^2$, từng dòng phí, Tổng cộng); (27) Chế độ Print Preview khổ A5/A4. |
| `WF-28_32_FeePaymentReceipt` | `WF-28`..`WF-32` (5 khung) | `US-010` | Lê Tuấn Vĩ | (28) Chọn hóa đơn căn hộ cần thu; (29) Form nhập số tiền nộp & hình thức (`Tiền mặt`/`Chuyển khoản`); (30) Badge trạng thái Nộp một phần (`PARTIAL`) / Nộp đủ (`PAID`); (31) Mẫu Biên lai thu tiền có mã chứng từ; (32) Thông báo cập nhật công nợ thành công. |
| `WF-33_35_Contributions` | `WF-33`..`WF-35` (3 khung) | `US-011` | Lê Tuấn Vĩ | (33) Bộ chọn Đợt vận động & Quỹ tự nguyện; (34) Form ghi nhận số tiền hộ ủng hộ; (35) Bảng danh sách hộ ủng hộ tách riêng hoàn toàn khỏi công nợ phí bắt buộc. |
| `WF-36_38_UnpaidDebt` | `WF-36`..`WF-38` (3 khung) | `US-012` | Nguyễn Quang Nhật | (36) Bộ lọc Kỳ thu & Trạng thái chưa nộp đủ; (37) 3 thẻ KPI tổng quan (*Tổng phải thu*, *Tổng đã thu*, *Còn nợ*); (38) Bảng danh sách các căn hộ còn nợ kèm số tiền còn thiếu. |
| `WF-39_44_HistoryExportRoleAudit` | `WF-39`..`WF-44` (6 khung) | `US-013`, `014`, `018`, `019` | Bảo & Hiếu | (39) Lịch sử đóng tiền của một căn hộ (`US-013`); (40) Bảng tổng hợp đã thu theo loại phí & theo quỹ (`US-014`); (41) Thanh xuất báo cáo Excel `.xlsx` (`US-014`); (42) Form gán vai trò chi tiết `ADMIN/ACCOUNTANT/TREASURER/BQT` (`US-018`); (43) Bảng Nhật ký kiểm toán Audit Log (`US-019`); (44) Bộ lọc Audit Log theo loại thao tác cư dân / giao dịch thu (`US-019`). |
