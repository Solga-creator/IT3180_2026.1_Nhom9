# Báo cáo Kiểm thử, Sổ theo dõi Lỗi & Minh chứng Thực thi Sprint 1 (BlueMoon SE09)

Tài liệu này tổng hợp **Báo cáo kiểm thử (Mục 9)**: **Test Execution Report (9.1)**, **Bug Report (9.2)** và **Evidence (9.3)** cho 8 Must User Stories thuộc Sprint 1.

---

## 1. Báo cáo thực thi kiểm thử (Test Execution Report — Mục 9.1)

### 1.1. Tổng hợp kết quả chạy Test tự động

| Nhóm kiểm thử | Lệnh thực thi | Số lượng Test | Pass | Fail | Tỷ lệ Pass |
|---|---|---:|---:|---:|---:|
| **Backend Unit & Functional Tests** (`tests/*.test.js`) | `npm test` | 40 | 40 | 0 | **100%** |
| **Backend HTTP API Integration Tests** (`tests/*.integration.js`) | `npm run test:e2e` | 7 | 7 | 0 | **100%** |
| **Frontend API Client Test** (`frontend/tests/api.test.mjs`) | `node --test tests/api.test.mjs` | 1 | 1 | 0 | **100%** |
| **Tổng cộng Automated Tests** | | **48** | **48** | **0** | **100%** |

### 1.2. Chi tiết theo từng tệp kiểm thử

| Tệp kiểm thử | Phạm vi User Story | Người phụ trách | Số test | Trạng thái |
|---|---|---|---:|---|
| `backend/tests/apartmentValidation.test.js` | `US-001` (Validation căn hộ & diện tích) | Nguyễn Quang Nhật | 7 | PASS (7/7) |
| `backend/tests/apartmentService.test.js` | `US-001` (Service lưu & lấy danh mục căn hộ) | Nguyễn Quang Nhật | 4 | PASS (4/4) |
| `backend/tests/apartmentHandlers.test.js` | `US-001` (Handlers HTTP 200/201) | Nguyễn Quang Nhật | 2 | PASS (2/2) |
| `backend/tests/apartmentApi.integration.js` | `US-001` (Integration API `/api/apartments`) | Nguyễn Quang Nhật | 3 | PASS (3/3) |
| `backend/tests/residentValidation.test.js` | `US-002`, `US-004` (Validation nhân khẩu & cư trú) | Lê Tuấn Vĩ | 8 | PASS (8/8) |
| `backend/tests/residentService.test.js` | `US-002`, `US-003`, `US-004` (Transaction hộ/nhân khẩu/tìm kiếm/lịch sử) | Lê Tuấn Vĩ | 5 | PASS (5/5) |
| `backend/tests/residentApi.integration.js` | `US-002`–`004`, `US-017` (Integration API `/api/residents`, `/api/auth/profile`) | Lê Tuấn Vĩ | 2 | PASS (2/2) |
| `backend/tests/authAndAccount.test.js` | `US-015`, `US-016`, `US-017` (Cấp tài khoản, đăng nhập, phân quyền, sửa hồ sơ, đổi mật khẩu) | Phạm Minh Hiếu & Lê Tuấn Vĩ | 11 | PASS (11/11) |
| `backend/tests/residentExport.test.js` | `US-005` (Service xuất Excel nhân khẩu theo trạng thái) | Đặng Gia Bảo | 3 | PASS (3/3) |
| `backend/tests/residentExportApi.integration.js` | `US-005` (Integration API `/api/residents/export`) | Đặng Gia Bảo | 2 | PASS (2/2) |
| `frontend/tests/api.test.mjs` | `US-005` & `US-016` (Tải blob `.xlsx` kèm JWT và xử lý lỗi JSON) | Đặng Gia Bảo | 1 | PASS (1/1) |

---

## 2. Sổ theo dõi lỗi Sprint 1 (Bug Report / Defect Log — Mục 9.2)

| Mã lỗi | US liên quan | Mô tả lỗi phát hiện trong quá trình phát triển & kiểm thử | Mức độ | Nguyên nhân gốc & Cách khắc phục | Người sửa | Trạng thái |
|---|---|---|---|---|---|---|
| `BUG-S1-01` | `US-017` | Lỗi thiếu cột `phone` trên các máy đã tạo bảng `users` từ bản `US-015`/`016` đầu tiên | High | `CREATE TABLE IF NOT EXISTS users` không tự thêm cột mới vào bảng đã có. Đã bổ sung truy vấn kiểm tra `information_schema.columns` và chạy `ALTER TABLE users ADD COLUMN phone` trong `backend/config/database.js`. | Lê Tuấn Vĩ | **Closed (Fixed)** |
| `BUG-S1-02` | `US-002` | Nguy cơ tạo trùng 2 chủ hộ cho cùng một căn hộ khi gửi 2 request đồng thời (Race Condition) | High | Thiếu khóa dòng trong transaction. Đã bọc trong `connection.beginTransaction()`, dùng `SELECT ... FOR UPDATE` trên `apartments` và `households`, kết hợp ràng buộc `UNIQUE (apartment_id)` và bắt mã lỗi `ER_DUP_ENTRY` để trả `409 Conflict`. | Lê Tuấn Vĩ | **Closed (Fixed)** |
| `BUG-S1-03` | `US-003`, `US-004` | Sau khi thêm nhân khẩu hoặc cập nhật trạng thái cư trú, bảng danh sách tải lại bị mất bộ lọc tìm kiếm hoặc lọc nhầm theo chuỗi đang gõ dở | Medium | Dùng chung 1 state cho ô input và tham số tải bảng. Đã tách thành 2 state `searchInput` (đang gõ) và `activeSearch` (từ khóa đã bấm Tìm) trong `frontend/src/pages/ResidentsPage.jsx`. | Lê Tuấn Vĩ | **Closed (Fixed)** |
| `BUG-S1-04` | `US-005` | Số phòng bắt đầu bằng chữ số `0` (như `'050'`) bị mất số `0` đầu hoặc tên cư dân bắt đầu bằng dấu `=` bị hiểu thành công thức khi mở bằng Excel | Medium | Excel tự ép kiểu số/công thức. Đã ép kiểu chuỗi tường minh `String(...)` cho các ô dữ liệu và định dạng cột ngày sinh `dd/mm/yyyy` trong `backend/services/residentService.js`. | Đặng Gia Bảo | **Closed (Fixed)** |
| `BUG-S1-05` | `US-005` | Lỗi `ERR_MODULE_NOT_FOUND: Cannot find package 'exceljs'` khi chạy test trên máy chưa cài lại dependencies sau khi merge nhánh `US-005` | Low | Nhánh `US-005` thêm phụ thuộc `exceljs` vào `backend/package.json`. Đã bổ sung hướng dẫn chạy `npm ci` / `npm install` trong `README.md` và xác nhận cài đặt đầy đủ. | Đặng Gia Bảo | **Closed (Fixed)** |

---

## 3. Minh chứng thực thi (Test & Build Evidence — Mục 9.3)

### 3.1. Log thực thi Unit & Functional Tests (`cd backend && npm test`)
- Toàn bộ **34/34** unit & functional test cases trong `backend/tests/*.test.js` đạt `PASS` (`0 fail`).

### 3.2. Log thực thi HTTP API Integration Tests (`cd backend && npm run test:e2e`)
- Toàn bộ **7/7** integration test cases trong `backend/tests/*.integration.js` đạt `PASS` (`0 fail`).

### 3.3. Log thực thi Frontend Test & Build (`cd frontend && node --test tests/api.test.mjs && npm run build`)
- Test `frontend/tests/api.test.mjs` đạt `PASS` (`1/1`).
- Lệnh `vite build` biên dịch thành công gói giao diện sản phẩm vào `frontend/dist/` không có cảnh báo hay lỗi cú pháp.
