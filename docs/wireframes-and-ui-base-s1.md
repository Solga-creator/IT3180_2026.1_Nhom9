# Thiết kế Prototype / Wireframe Sprint 1 (12 Khung) & Master Layout Base cho Sprint 2

Tài liệu này cung cấp đặc tả chi tiết **12 khung Prototype / Wireframe của Sprint 1** (đối chiếu 1-1 với 5 trang React đã hoàn thiện ở Sprint 1) và **1 khung Master Layout Base** dùng làm mẫu giao diện chuẩn để phát triển 32 khung màn hình thu phí ở Sprint 2 (tổng 44 khung toàn dự án thuộc **Mục 5 Checklist**).

- **Thư mục bản vẽ `.drawio` & `.png` trên Google Drive:** `Diagram Sprint 1 / Prototype - Wireframe`

---

## 1. Danh mục 12 Khung Wireframe của Sprint 1 (`WF-01` đến `WF-12`)

| Mã WF | Tên khung màn hình / Trạng thái | User Story | Component thực thi | Thành viên phụ trách |
|---|---|---|---|---|
| **WF-01** | Màn hình Đăng nhập (Trạng thái nhập liệu mặc định) | `US-016` | `LoginPage.jsx` | Phạm Minh Hiếu |
| **WF-02** | Màn hình Đăng nhập (Trạng thái cảnh báo lỗi xác thực / thiếu thông tin) | `US-016` | `LoginPage.jsx` | Phạm Minh Hiếu |
| **WF-03** | Trang chủ BQT & Quản lý danh mục Căn hộ (Thẻ tổng quan + Form + Bảng) | `US-001` | `HomePage.jsx` | Nguyễn Quang Nhật |
| **WF-04** | Quản lý Căn hộ (Trạng thái báo lỗi trùng số phòng / diện tích $\le 0$) | `US-001` | `HomePage.jsx` | Nguyễn Quang Nhật |
| **WF-05** | Quản lý Hộ & Nhân khẩu — Form thêm Chủ hộ và Nhân khẩu theo căn hộ | `US-002` | `ResidentsPage.jsx` | Lê Tuấn Vĩ |
| **WF-06** | Quản lý Hộ & Nhân khẩu — Thanh tìm kiếm theo số phòng/họ tên & Bảng kết quả | `US-003` | `ResidentsPage.jsx` | Lê Tuấn Vĩ |
| **WF-07** | Quản lý Hộ & Nhân khẩu — Khung ghi nhận biến động cư trú & Lịch sử cư trú | `US-004` | `ResidentsPage.jsx` | Lê Tuấn Vĩ |
| **WF-08** | Quản lý Hộ & Nhân khẩu — Bộ lọc trạng thái cư trú & Xuất file Excel `.xlsx` | `US-005` | `ResidentsPage.jsx` | Đặng Gia Bảo |
| **WF-09** | Cấp tài khoản BQT — Form tạo tài khoản & Bảng danh sách tài khoản (`ADMIN`) | `US-015` | `IssueAccountPage.jsx` | Phạm Minh Hiếu |
| **WF-10** | Cấp tài khoản BQT — Hộp thoại xác nhận xóa tài khoản (`Confirm Dialog`) | `US-015` | `IssueAccountPage.jsx` | Phạm Minh Hiếu |
| **WF-11** | Hồ sơ cá nhân — Form cập nhật Họ tên & Số điện thoại cá nhân | `US-017` | `ProfilePage.jsx` | Lê Tuấn Vĩ |
| **WF-12** | Hồ sơ cá nhân — Form đổi mật khẩu & Thông báo cập nhật thành công | `US-017` | `ProfilePage.jsx` | Lê Tuấn Vĩ |

---

## 2. Bản vẽ khung giao diện chi tiết (Wireframe Specification)

### 2.1. Cụm Xác thực (`WF-01` & `WF-02` — `US-016`)
```text
+-----------------------------------------------------------------------+
|                       BLUEMOON APARTMENT SYSTEM                       |
|                  Hệ thống Quản lý Chung cư BlueMoon                   |
|                                                                       |
|   +---------------------------------------------------------------+   |
|   |  ĐĂNG NHẬP HỆ THỐNG BQT                                       |   |
|   |  [!] (WF-02) Banner lỗi: Sai tên đăng nhập hoặc mật khẩu      |   |
|   |                                                               |   |
|   |  Tên đăng nhập (*)                                            |   |
|   |  [ Nhập tên đăng nhập (vd: admin / bqt01)...               ]  |   |
|   |                                                               |   |
|   |  Mật khẩu (*)                                                 |   |
|   |  [ ••••••••••••••••••••                                    ]  |   |
|   |                                                               |   |
|   |  [               ĐĂNG NHẬP HỆ THỐNG (Primary)              ]  |   |
|   +---------------------------------------------------------------+   |
+-----------------------------------------------------------------------+
```

### 2.2. Cụm Trang chủ & Quản lý Căn hộ (`WF-03` & `WF-04` — `US-001`)
```text
+----------------------+------------------------------------------------+
| BLUEMOON SE09        | Xin chào, Nguyễn Văn Quản Trị [Role: ADMIN]    |
|----------------------|------------------------------------------------|
| > Trang chủ & Căn hộ | [Thẻ 1: Tổng số căn hộ] [Thẻ 2: Căn hộ làm gốc |
|   Hộ & Nhân khẩu     |  đã lưu]                 tính phí m² (US-001)] |
|   Cấp tài khoản BQT  |------------------------------------------------|
|   Hồ sơ cá nhân      | +--- FORM LƯU CĂN HỘ & DIỆN TÍCH (US-001) ---+ |
|                      | | [!] (WF-04) Lỗi: Số phòng đã tồn tại / <=0 | |
|                      | | Số phòng (*): [ 050      ]                 | |
|                      | | Diện tích m² (*): [ 60.5 ]  [ Lưu căn hộ ] | |
|                      | +--------------------------------------------+ |
|                      | +--- DANH MỤC CĂN HỘ HIỆN CÓ ----------------+ |
| [ Đăng xuất ]        | | Mã căn | Số phòng | Diện tích (m²) | Chủ hộ| |
|                      | | #1     | 050      | 60.00 m²       | Đã có | |
|                      | | #2     | 101      | 75.50 m²       | Chưa  | |
|                      | +--------------------------------------------+ |
+----------------------+------------------------------------------------+
```

### 2.3. Cụm Quản lý Hộ, Nhân khẩu, Biến động cư trú & Xuất Excel (`WF-05` đến `WF-08` — `US-002..005`)
```text
+----------------------+------------------------------------------------+
| BLUEMOON SE09        | QUẢN LÝ HỘ GIA ĐÌNH & NHÂN KHẨU                |
|----------------------|------------------------------------------------|
|   Trang chủ & Căn hộ | +--- (WF-05) THÊM CHỦ HỘ & NHÂN KHẨU --------+ |
| > Hộ & Nhân khẩu     | | Căn hộ (*): [ Chọn căn hộ (050 - 60m²) v ] | |
|   Cấp tài khoản BQT  | | Họ tên (*): [ Trần Văn An                ] | |
|   Hồ sơ cá nhân      | | Ngày sinh (*): [ 1985-05-12 ]              | |
|                      | | Quan hệ (*): [ Chủ hộ / Vợ / Con       v ] | |
|                      | |                         [ Thêm nhân khẩu ] | |
|                      | +--------------------------------------------+ |
|                      | +--- (WF-06 & WF-08) TÌM KIẾM & XUẤT EXCEL --+ |
|                      | | Từ khóa: [ Tìm theo số phòng / họ tên... ] | |
|                      | | Lọc TT:  [ Tất cả / Thường trú / Tạm trú v]| |
|                      | | [ Tìm kiếm (US-003) ]  [ Xuất Excel .xlsx ]| |
|                      | +--------------------------------------------+ |
|                      | +--- DANH SÁCH NHÂN KHẨU --------------------+ |
|                      | | Phòng | Họ tên      | Quan hệ | Trạng thái | |
|                      | | 050   | Trần Văn An | Chủ hộ  | Thường trú | |
|                      | +--------------------------------------------+ |
|                      | +--- (WF-07) GHI NHẬN BIẾN ĐỘNG CƯ TRÚ ------+ |
|                      | | Nhân khẩu: [ Trần Văn An - Phòng 050   v ] | |
|                      | | Trạng thái mới: [ Tạm trú / Tạm vắng   v ] | |
|                      | | Từ ngày: [2026-11-01] Đến ngày: [2026-12-01]| |
|                      | |                  [ Xác nhận đổi cư trú ]   | |
|                      | +--------------------------------------------+ |
+----------------------+------------------------------------------------+
```

### 2.4. Cụm Cấp tài khoản BQT (`WF-09` & `WF-10` — `US-015`) & Hồ sơ cá nhân (`WF-11` & `WF-12` — `US-017`)
```text
+--- (WF-09 & WF-10) CẤP TÀI KHOẢN BQT (ADMIN) ------------------------+
| Tên đăng nhập (*): [ bqt_ketoan ]  Họ tên (*): [ Lê Thị Kế Toán    ] |
| Mật khẩu khởi tạo (*): [ •••••••• ]              [ Cấp tài khoản ]   |
|----------------------------------------------------------------------|
| Danh sách tài khoản BQT:                                             |
| ID | Username   | Họ tên         | Vai trò | Thao tác                |
| 2  | bqt_ketoan | Lê Thị Kế Toán | BQT     | [ Xóa ] -> (WF-10 Modal)|
+----------------------------------------------------------------------+

+--- (WF-11) CẬP NHẬT HỒ SƠ CÁ NHÂN ---+--- (WF-12) ĐỔI MẬT KHẨU ------+
| Họ và tên (*): [ Lê Tuấn Vĩ        ] | Mật khẩu hiện tại: [ •••••• ] |
| Số điện thoại: [ 0912345678        ] | Mật khẩu mới (>=6):[ •••••• ] |
| [ Lưu thông tin hồ sơ ]              | [ Cập nhật mật khẩu ]         |
+--------------------------------------+-------------------------------+
```

---

## 3. Khung Master Layout Base (`WF-BASE`) cho 32 Khung Màn hình Sprint 2

Để chuẩn bị làm 11 User Stories của Sprint 2 (`US-006`..`014`, `US-018`..`019`), toàn bộ các màn hình mới kế thừa thống nhất khung **`WF-BASE` (`AppLayout.jsx`)**:

1. **Vùng Thanh điều hướng phân quyền theo `user.role` (`AppLayout.jsx`):**
   - Nhóm menu Sprint 1 (Đã hoàn thiện): *Màn hình chính (`/`, căn hộ & sửa nhanh; với `RESIDENT` là cổng xem hồ sơ hộ gia đình)*, *Hộ và nhân khẩu (`/residents`, thêm/sửa nhanh, CCCD, đổi chủ hộ 1-click, cư trú, xuất Excel)*, *Cấp tài khoản cư dân (`/resident-accounts`, duyệt 1-click yêu cầu cư dân tự đăng ký & đặt lại mật khẩu)*, *Hồ sơ cá nhân (`/profile`)*, *Cấp tài khoản (`/accounts`, dành cho `ADMIN`)*.
   - Nhóm menu chờ gắn ở Sprint 2 (Gom gọn tối đa chỉ thêm 2 mục): *Thu phí & Công nợ (`/billing` — tích hợp `US-006, 008, 009, 010, 012, 013, 014`)* và *Quỹ tự nguyện (`/campaigns` — tích hợp `US-007, 011`)*. Các chức năng *Phân quyền 1-click & Nhật ký Audit (`US-018, 019`)* tích hợp trực tiếp vào trang `/accounts` của `ADMIN`.
2. **Vùng Filter & Action Bar (Card phía trên):**
   - Chuẩn hóa bộ chọn Kỳ thu (`YYYY-MM`), chọn Căn hộ (`apartments.room_number`), nút hành động chính (`Primary Button`) và nút Xuất Excel / In chứng từ (`Secondary Action`).
3. **Vùng Data Table & Printable Modal (Giấy báo `US-009` / Biên lai `US-010`):**
   - Chuẩn hóa bảng dữ liệu có định dạng tiền tệ VNĐ (`Intl.NumberFormat('vi-VN')`), badge trạng thái (`PAID` xanh, `PARTIAL` vàng, `UNPAID` đỏ) và khung Modal bản in khổ A5/A4.
