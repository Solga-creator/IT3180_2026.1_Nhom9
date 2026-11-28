# Báo cáo Kiểm thử, Sổ theo dõi Lỗi & Minh chứng Thực thi Sprint 1 (BlueMoon SE09)

Tài liệu này tổng hợp **Báo cáo kiểm thử (Mục 9)**: **Test Execution Report (9.1)**, **Bug Report (9.2)** và **Evidence (9.3)** cho 8 Must User Stories thuộc Sprint 1.

---

## 1. Báo cáo thực thi kiểm thử (Test Execution Report — Mục 9.1)

> **Cập nhật thực thi ngày 28/11/2026** *(Commit `HEAD` `b065008` + working tree local sau đợt rà soát cuối Sprint 1)*:
> - **Đã chạy toàn bộ suite tự động:** **70/70 PASS** (`0 fail`, `0 skip`), gồm `56` test backend (`npm test`), `8` test HTTP integration (`npm run test:e2e`) và `6` test frontend (`node --test tests/*.test.mjs`, gồm `1` test `api.test.mjs` và `5` test hook/effect harness trong file untracked `frontend/tests/residentsRefresh.test.mjs`).
> - **Lint frontend (`npm run lint` — `oxlint`):** **PASS** (`0 warnings`, `0 errors` trên 18 file).
> - **Build frontend:**
>   - Lệnh mặc định `npm run build` vẫn gặp lỗi quyền môi trường `EPERM, Permission denied` tại `frontend/dist/assets` (giữ nguyên, không xóa hoặc can thiệp quyền thư mục `dist/` cũ).
>   - Lệnh kiểm chứng `npm run build -- --outDir node_modules/.cache/s1-final-review-verify` **PASS** (37 modules, built in 118ms).
> - **Giới hạn xác minh của lần chạy này:** Các test validation không truy cập DB; các test service/repository/API ở `backend/tests/` dùng **mock DB** (chưa chứng minh lịch khóa/transaction/SQL trên MySQL thật); `residentsRefresh.test.mjs` kiểm tra trực tiếp handler/effect/props (không phải kiểm thử DOM/StrictMode trên trình duyệt thật). Lần chạy này **chưa chạy kiểm thử trên MySQL thật** và **chưa kiểm tra giao diện thủ công trên trình duyệt** (desktop / `390px`). Các hạng mục còn lại của T00 (tạo DB thử riêng, chốt baseline commit, chốt quy ước nghiệp vụ & ước lượng lại Sprint 2) chưa hoàn tất.

### 1.1. Tổng hợp kết quả chạy Test tự động

| Nhóm kiểm thử | Lệnh thực thi | Số lượng Test | Pass | Fail | Skip | Tỷ lệ Pass |
|---|---|---:|---:|---:|---:|---:|
| **Backend Unit & Functional Tests** (`tests/*.test.js`) | `npm test` | 56 | 56 | 0 | 0 | **100%** |
| **Backend HTTP API Integration Tests** (`tests/*.integration.js`) | `npm run test:e2e` | 8 | 8 | 0 | 0 | **100%** |
| **Frontend API & Hook/Effect Harness Tests** (`frontend/tests/*.test.mjs`) | `node --test tests/*.test.mjs` | 6 | 6 | 0 | 0 | **100%** |
| **Tổng cộng Automated Tests** | | **70** | **70** | **0** | **0** | **100%** |

### 1.2. Chi tiết theo từng tệp kiểm thử

| Tệp kiểm thử | Phạm vi User Story | Người phụ trách | Số test | Trạng thái |
|---|---|---|---:|---|
| `backend/tests/apartmentValidation.test.js` | `US-001` (Validation căn hộ & diện tích) | Nguyễn Quang Nhật | 7 | PASS (7/7) |
| `backend/tests/apartmentService.test.js` | `US-001` (Service lưu, sửa nhanh, lấy danh mục & xóa căn hộ trống khóa `FOR UPDATE` trong transaction) | Nguyễn Quang Nhật | 6 | PASS (6/6) |
| `backend/tests/apartmentHandlers.test.js` | `US-001` (Handlers HTTP 200/201) | Nguyễn Quang Nhật | 2 | PASS (2/2) |
| `backend/tests/apartmentApi.integration.js` | `US-001` (Integration API `/api/apartments`) | Nguyễn Quang Nhật | 3 | PASS (3/3) |
| `backend/tests/residentValidation.test.js` | `US-002`, `US-004` (Validation nhân khẩu, CCCD & cư trú) | Lê Tuấn Vĩ | 9 | PASS (9/9) |
| `backend/tests/residentService.test.js` | `US-002`, `US-003`, `US-004` (Transaction hộ/nhân khẩu/sửa/xóa/đổi chủ hộ/tìm kiếm/ngày hiệu lực cư trú động, ghi bù `"Chuyển đi"` thu hồi `token_version` cùng transaction & lọc `apartmentId`) | Lê Tuấn Vĩ | 10 | PASS (10/10) |
| `backend/tests/residentApi.integration.js` | `US-002`–`004`, `US-017` (Integration API `/api/residents` kèm lọc trạng thái hiệu lực + `apartmentId`, `/api/auth/profile`) | Lê Tuấn Vĩ | 3 | PASS (3/3) |
| `backend/tests/authAndAccount.test.js` | `US-015`, `US-016`, `US-017` (Cấp/reset mật khẩu tạm ngẫu nhiên, thu hồi phiên cũ `token_version`, kiểm tra `JWT_SECRET`, che CCCD và điều kiện ứng viên/đăng ký/cấp TK/duyệt TK/đăng nhập/xem hộ theo trạng thái hiệu lực ngày VN) | Phạm Minh Hiếu & Lê Tuấn Vĩ | 16 | PASS (16/16) |
| `backend/tests/residentExport.test.js` | `US-005` (Service xuất Excel nhân khẩu theo trạng thái) | Đặng Gia Bảo | 3 | PASS (3/3) |
| `backend/tests/residentExportRegression.test.js` | `US-003`, `US-004`, `US-005` (Hồi quy lọc trạng thái hiệu lực ngày VN, lọc chính xác `apartmentId`, đối chiếu API list và Excel) | Đặng Gia Bảo & Lê Tuấn Vĩ | 3 | PASS (3/3) |
| `backend/tests/residentExportApi.integration.js` | `US-005` (Integration API `/api/residents/export`) | Đặng Gia Bảo | 2 | PASS (2/2) |
| `frontend/tests/api.test.mjs` | `US-005` & `US-016` (Tải blob `.xlsx` kèm JWT và xử lý lỗi JSON/mạng) | Đặng Gia Bảo | 1 | PASS (1/1) |
| `frontend/tests/residentsRefresh.test.mjs` *(untracked)* | `US-002`, `US-003`, `US-004` (Harness kiểm tra vòng đời tải danh sách, giữ bộ lọc URL, giữ modal khi reload, khóa form khi POST thêm cư dân và bỏ lọc riêng phòng) | Nhóm SE09 | 5 | PASS (5/5) |

---

## 2. Sổ theo dõi lỗi Sprint 1 (Bug Report / Defect Log — Mục 9.2)

| Mã lỗi | US liên quan | Mô tả lỗi phát hiện trong quá trình phát triển & kiểm thử | Mức độ | Nguyên nhân gốc & Cách khắc phục | Người sửa | Trạng thái |
|---|---|---|---|---|---|---|
| `BUG-S1-01` | `US-017` | Lỗi thiếu cột `phone` trên các máy đã tạo bảng `users` từ bản `US-015`/`016` đầu tiên | High | `CREATE TABLE IF NOT EXISTS users` không tự thêm cột mới vào bảng đã có. Đã bổ sung truy vấn kiểm tra `information_schema.columns` và chạy `ALTER TABLE users ADD COLUMN phone` trong `backend/config/database.js`. | Lê Tuấn Vĩ | **Closed (Fixed)** |
| `BUG-S1-02` | `US-002` | Nguy cơ tạo trùng 2 chủ hộ cho cùng một căn hộ khi gửi 2 request đồng thời (Race Condition) | High | Thiếu khóa dòng trong transaction. Đã bọc trong `connection.beginTransaction()`, dùng `SELECT ... FOR UPDATE` trên `apartments` và `households`, kết hợp ràng buộc `UNIQUE (apartment_id)` và bắt mã lỗi `ER_DUP_ENTRY` để trả `409 Conflict`. | Lê Tuấn Vĩ | **Closed (Fixed)** |
| `BUG-S1-03` | `US-003`, `US-004` | Sau khi thêm nhân khẩu hoặc cập nhật trạng thái cư trú, bảng danh sách tải lại bị mất bộ lọc tìm kiếm hoặc lọc nhầm theo chuỗi đang gõ dở | Medium | Dùng chung 1 state cho ô input và tham số tải bảng. Đã tách thành 2 state `searchInput` (đang gõ) và `activeSearch` (từ khóa đã bấm Tìm) trong `frontend/src/pages/ResidentsPage.jsx`. | Lê Tuấn Vĩ | **Closed (Fixed)** |
| `BUG-S1-04` | `US-005` | Số phòng bắt đầu bằng chữ số `0` (như `'050'`) bị mất số `0` đầu hoặc tên cư dân bắt đầu bằng dấu `=` bị hiểu thành công thức khi mở bằng Excel | Medium | Excel tự ép kiểu số/công thức. Đã ép kiểu chuỗi tường minh `String(...)` cho các ô dữ liệu và định dạng cột ngày sinh `dd/mm/yyyy` trong `backend/services/residentService.js`. | Đặng Gia Bảo | **Closed (Fixed)** |
| `BUG-S1-05` | `US-005` | Lỗi `ERR_MODULE_NOT_FOUND: Cannot find package 'exceljs'` khi chạy test trên máy chưa cài lại dependencies sau khi merge nhánh `US-005` | Low | Nhánh `US-005` thêm phụ thuộc `exceljs` vào `backend/package.json`. Đã bổ sung hướng dẫn chạy `npm ci` / `npm install` trong `README.md` và xác nhận cài đặt đầy đủ. | Đặng Gia Bảo | **Closed (Fixed)** |
| `BUG-S1-06` | `US-003`, `US-004`, `US-005` | API `GET /api/residents?status=...` lọc trực tiếp cột `r.current_status` trong SQL trước khi giải trạng thái hiệu lực theo ngày VN, dẫn đến trả thừa người hết hạn tạm vắng/tạm trú và bỏ sót người có sự kiện đến hạn, lệch với luồng xuất Excel | High | Bỏ điều kiện `WHERE r.current_status = ?` trong `listResidents()` ở `backend/repositories/residentRepository.js`, bọc ngoặc cố định biểu thức `OR` tìm kiếm, chốt một ngày tham chiếu VN cho toàn lượt tải, lọc trạng thái sau `resolveEffectiveResidencyStatus(...)` và cho `listResidentsByStatus()` tái sử dụng trực tiếp. Đã thêm test hồi quy (`residentExportRegression.test.js`, `residentApi.integration.js`). | Nhóm SE09 | **Closed (Verified on mock DB; pending real MySQL)** |
| `BUG-S1-07` | `US-015`, `US-016`, `US-004` | Danh sách ứng viên chưa có tài khoản (`listResidentsWithoutAccount`), đăng ký/cấp/duyệt tài khoản cư dân (`registerResidentAccount`, `issueResidentAccount`, `approveResidentAccount`), đăng nhập `RESIDENT` (`login`), kiểm tra sớm trong `getMyResidence` và thu hồi `token_version` trong `createResidencyEvent` dựa vào cột `r.current_status` / `status_start_date` chưa đồng bộ theo lịch sử hiệu lực ngày VN | High | Bổ sung helper tải theo lô `getEffectiveResidencyStatuses(residentIds, referenceDate)` trong `residentRepository.js`; bỏ lọc SQL cứng trong `userRepository.js`; kiểm tra trạng thái hiệu lực tại `getResidentAccountOptions`, `registerResidentAccount`, `issueResidentAccount`, `approveResidentAccount` và `login` (chỉ với `RESIDENT` sau khi xác thực mật khẩu); giải trạng thái hiệu lực trước/sau `INSERT` trên cùng transaction connection trong `createResidencyEvent` để thu hồi `token_version` cả khi ghi bù `"Chuyển đi"` đè sự kiện cũ đã hết hạn. | Nhóm SE09 | **Closed (Verified on mock DB; pending real MySQL)** |
| `BUG-S1-08` | `US-001`, `US-002` | `removeApartment` đếm nhân khẩu rồi `DELETE` qua `pool` ngoài transaction, trong khi FK `apartments -> households -> residents` dùng `ON DELETE CASCADE`, tạo khoảng hở xóa mất hộ mới vừa thêm đồng thời | Medium | Tạo `deleteEmptyApartmentById(id)` trong `backend/repositories/apartmentRepository.js` mở transaction, khóa dòng `SELECT ... FROM apartments WHERE id = ? FOR UPDATE` (cùng thứ tự khóa với `createResident`), đếm nhân khẩu và `DELETE` trên cùng `connection`. | Nhóm SE09 | **Closed (Verified on mock DB; pending real MySQL lock test)** |
| `BUG-S1-09` | `US-002`, `US-003`, `US-004` | Trên `ResidentsPage.jsx`: reload sau lưu đóng mất modal vừa mở và gọi thừa `/api/apartments`; Back/Forward không bật `loading` và giữ bảng cũ khi lỗi mạng; đổi căn khi POST thêm cư dân đang bay làm mất draft và lệch `headCheck` | Medium | Tách `/api/apartments` sang effect mount; dẫn xuất `loading` và khóa phạm vi modal/edit theo `filterKey` (không đóng thao tác mới khi reload cùng bộ lọc); thêm prop `submitting` cho `AddResidentForm` để khóa chọn căn/input chỉ khi POST đang chạy và bảo vệ reset bằng `addDraftSeqRef`; đưa `handleApartmentSelect` ra ngoài state updater và tách `clearApartmentFilter`. | Nhóm SE09 | **Closed (Verified via hook/effect harness; pending manual browser check)** |

---

## 3. Minh chứng thực thi (Test & Build Evidence — Mục 9.3)

- **Ngày thực thi gần nhất:** `28/11/2026` — nền commit `b065008` kèm thay đổi local chưa commit (`git status` có chỉnh sửa ở `backend/`, `frontend/`, `docs/`, `README.md`, `CHANGELOG.md` và file test mới `frontend/tests/residentsRefresh.test.mjs`).

### 3.1. Log thực thi Unit & Functional Tests (`cd backend && npm test`)
- **56/56** test cases trong `backend/tests/*.test.js` đạt `PASS` (`0 fail`, `0 skip`). *(Các test validation không truy cập DB; các test service/repository dùng mock `pool`/`connection` nên chưa chứng minh SQL/migration/lịch khóa transaction trên MySQL thật).*

### 3.2. Log thực thi HTTP API Integration Tests (`cd backend && npm run test:e2e`)
- **8/8** integration test cases trong `backend/tests/*.integration.js` đạt `PASS` (`0 fail`, `0 skip`; chạy HTTP thật trên `127.0.0.1` với mock DB).

### 3.3. Log thực thi Frontend Test, Lint & Build
- `cd frontend && node --test tests/*.test.mjs`: **6/6 PASS** (`0 fail`, `0 skip`: `1` test `api.test.mjs` + `5` test hook/effect harness trong `residentsRefresh.test.mjs`).
- `cd frontend && npm run lint` (`oxlint`): **PASS** (`0 warnings`, `0 errors` trên 18 file).
- `cd frontend && npm run build`: **FAIL** do lỗi quyền hệ thống `EPERM, Permission denied` khi dọn `frontend/dist/assets` (giữ nguyên để phản ánh đúng lỗi môi trường).
- `cd frontend && npm run build -- --outDir node_modules/.cache/s1-final-review-verify`: **PASS** (`37 modules transformed`, built in `118ms`).
- **Chưa xác minh trong lần chạy này:** kiểm thử trực tiếp trên MySQL thật (bao gồm lịch khóa 2 connection thật) và thao tác trình duyệt thủ công (desktop / `390px`) trên DOM/StrictMode thật.
