# Kế hoạch Kiểm thử & Bộ Test Case Sprint 1 (BlueMoon SE09)

- **Dự án:** Phần mềm quản lý thu phí chung cư BlueMoon — Nhóm SE09
- **Phạm vi Sprint 1 (04/11 – 08/11/2026):** 8 Must User Stories (`US-015`, `US-016`, `US-017`, `US-001`, `US-002`, `US-003`, `US-004`, `US-005`)
- **Phụ trách QA:** Đặng Gia Bảo (WBS 4.3) | **Phụ trách Dev:** Phạm Minh Hiếu, Lê Tuấn Vĩ, Nguyễn Quang Nhật, Đặng Gia Bảo

---

## 1. Kế hoạch kiểm thử (Test Plan — Mục 8.1)

### 1.1. Mục tiêu & Phạm vi
Xác minh toàn bộ 8 Must User Stories của Sprint 1 thỏa mãn Tiêu chí chấp nhận (Acceptance Criteria — AC) và Definition of Done (DoD):
1. **Luồng tài khoản & xác thực (`EP-05`):**
   - `US-015` (WBS 3.1.1 — Phạm Minh Hiếu): Quản trị viên cấp và xóa tài khoản thành viên BQT.
   - `US-016` (WBS 3.1.2 — Phạm Minh Hiếu): Đăng nhập nhận JWT, chặn truy cập trái phép (`401`/`403`).
   - `US-017` (WBS 3.1.3 — Lê Tuấn Vĩ): Thành viên BQT tự sửa hồ sơ cá nhân (`fullName`, `phone`) và đổi mật khẩu.
2. **Luồng căn hộ & cư dân (`EP-01`):**
   - `US-001` (WBS 3.1.4 — Nguyễn Quang Nhật): Lưu căn hộ và diện tích ($> 0\text{ m}^2$, không suy từ $450\text{ m}^2$ khu đất).
   - `US-002` (WBS 3.1.5 — Lê Tuấn Vĩ): Lưu chủ hộ và nhân khẩu gắn với căn hộ (ràng buộc 1 căn 1 hộ 1 chủ hộ).
   - `US-003` (WBS 3.1.6 — Lê Tuấn Vĩ): Tìm kiếm hộ/nhân khẩu theo số phòng hoặc họ tên.
   - `US-004` (WBS 3.1.7 — Lê Tuấn Vĩ): Ghi nhận biến động cư trú (`Thường trú`, `Tạm trú`, `Tạm vắng`, `Chuyển đến`, `Chuyển đi`) và lưu lịch sử.
   - `US-005` (WBS 3.1.8 — Đặng Gia Bảo): Xuất danh sách nhân khẩu ra file `.xlsx` theo trạng thái cư trú hiện tại.

### 1.2. Môi trường kiểm thử
- **Runtime & Framework:** Node.js (`node:test`, `node:assert/strict`), Express 5, React 19 + Vite 8.
- **Cơ sở dữ liệu:** MySQL 8 (`bluemoon_se09`), thư viện `mysql2/promise`.
- **Lệnh thực thi tự động:**
  - Unit & Functional Test Backend: `cd backend && npm test`
  - HTTP API Integration Test Backend: `cd backend && npm run test:e2e`
  - Frontend API Client Test: `cd frontend && node --test tests/api.test.mjs`

### 1.3. Tiêu chí nghiệm thu (Entry / Exit Criteria)
- **Entry Criteria:** Code đã merge, migration chạy sạch 5 bảng (`users`, `apartments`, `households`, `residents`, `residency_events`), seed được tài khoản `ADMIN`.
- **Exit Criteria (DoD):** 100% test tự động Pass, kịch bản demo liên thông 8 US chạy thông suốt không có lỗi nghiêm trọng (Blocker/Critical).

---

## 2. Bộ Functional Test Cases Backend (Mục 8.2 — 40 Test Cases)

| Mã TC | US | Mô tả trường hợp kiểm thử | File kiểm thử | Kỳ vọng |
|---|---|---|---|---|
| `FTC-01` | US-001 | Hợp lệ với căn hộ mẫu số phòng `'050'` và diện tích `60 m²` | `backend/tests/apartmentValidation.test.js` | Trả về `null` (không lỗi) |
| `FTC-02` | US-001 | Hợp lệ với số phòng có khoảng trắng hai đầu và diện tích số thực (`72.5`) | `backend/tests/apartmentValidation.test.js` | Trả về `null` |
| `FTC-03` | US-001 | Từ chối số phòng rỗng, `null` hoặc `undefined` | `backend/tests/apartmentValidation.test.js` | Báo lỗi `"Số phòng là bắt buộc."` |
| `FTC-04` | US-001 | Từ chối số phòng vượt quá 50 ký tự | `backend/tests/apartmentValidation.test.js` | Báo lỗi giới hạn 50 ký tự |
| `FTC-05` | US-001 | Từ chối diện tích trống | `backend/tests/apartmentValidation.test.js` | Báo lỗi `"Diện tích căn hộ là bắt buộc."` |
| `FTC-06` | US-001 | Từ chối diện tích không phải là số | `backend/tests/apartmentValidation.test.js` | Báo lỗi `"Diện tích căn hộ phải là một số hợp lệ."` |
| `FTC-07` | US-001 | Từ chối diện tích $\le 0\text{ m}^2$ (`0`, `-10`) | `backend/tests/apartmentValidation.test.js` | Báo lỗi `"Diện tích căn hộ phải lớn hơn 0 m²."` |
| `FTC-08` | US-001 | Service ném `AppError 400` khi dữ liệu căn hộ sai | `backend/tests/apartmentService.test.js` | `statusCode = 400` |
| `FTC-09` | US-001 | Service ném `AppError 409` khi trùng số phòng `'050'` | `backend/tests/apartmentService.test.js` | `statusCode = 409` |
| `FTC-10` | US-001 | Service lưu căn hộ `'050'` (`60 m²`) thành công | `backend/tests/apartmentService.test.js` | Trả về `{ id, roomNumber: '050', area: 60 }` |
| `FTC-11` | US-001 | Service `getApartments` trả danh mục đã parse diện tích số | `backend/tests/apartmentService.test.js` | Mảng căn hộ sắp xếp chuẩn |
| `FTC-12` | US-001 | Handler `createApartment` trả HTTP `201` kèm JSON căn hộ | `backend/tests/apartmentHandlers.test.js` | `res.status = 201` |
| `FTC-13` | US-001 | Handler `getApartments` trả HTTP `200` kèm danh sách | `backend/tests/apartmentHandlers.test.js` | `res.status = 200` |
| `FTC-14` | US-002 | Hợp lệ với dữ liệu chuẩn Chủ hộ `Nguyễn Văn A` căn `050` | `backend/tests/residentValidation.test.js` | Trả về `null` |
| `FTC-15` | US-002 | Hợp lệ với nhân khẩu quan hệ `Con` và chuỗi tên có khoảng trắng | `backend/tests/residentValidation.test.js` | Trả về `null` |
| `FTC-16` | US-002 | Từ chối `apartmentId` không nguyên dương (`0`, `-2`, `'abc'`) | `backend/tests/residentValidation.test.js` | Báo lỗi `"Chọn căn hộ hợp lệ."` |
| `FTC-17` | US-002 | Từ chối họ tên ngắn hơn 2 hoặc dài hơn 120 ký tự | `backend/tests/residentValidation.test.js` | Báo lỗi `"Họ tên phải từ 2 đến 120 ký tự."` |
| `FTC-18` | US-002 | Từ chối ngày sinh không có thật (`2026-02-31`) hoặc ở tương lai | `backend/tests/residentValidation.test.js` | Báo lỗi ngày sinh không hợp lệ / ở tương lai |
| `FTC-19` | US-002 | Chỉ chấp nhận 6 loại quan hệ với chủ hộ trong danh mục chuẩn | `backend/tests/residentValidation.test.js` | Từ chối `"Khách"`, chấp nhận 6 loại chuẩn |
| `FTC-20` | US-002 | Service chặn `400` khi căn hộ chưa có hộ mà thêm quan hệ `'Con'` | `backend/tests/residentService.test.js` | Rollback transaction, `statusCode = 400` |
| `FTC-21` | US-002 | Service chặn `409` khi căn hộ đã có chủ hộ mà thêm chủ hộ thứ 2 | `backend/tests/residentService.test.js` | Rollback transaction, `statusCode = 409` |
| `FTC-22` | US-002 | Service tạo hộ mới, lưu chủ hộ `Nguyễn Văn A` và gán `head_resident_id` | `backend/tests/residentService.test.js` | Commit transaction, trả về hồ sơ chủ hộ |
| `FTC-23` | US-003 | Service tìm nhân khẩu theo từ khóa `'050'` nối bảng căn hộ và gom lịch sử | `backend/tests/residentService.test.js` | Trả danh sách khớp kèm `residencyHistory` |
| `FTC-24` | US-004 | Hợp lệ với 5 trạng thái cư trú và `startDate <= endDate` | `backend/tests/residentValidation.test.js` | Trả về `null` |
| `FTC-25` | US-004 | Từ chối trạng thái ngoài danh mục, ngày sai (`2026-02-30`) hoặc `startDate > endDate` | `backend/tests/residentValidation.test.js` | Báo lỗi tương ứng |
| `FTC-26` | US-004 | Service ghi sự kiện `'Tạm vắng'` vào `residency_events` và đồng bộ `residents` | `backend/tests/residentService.test.js` | Cập nhật `currentStatus = 'Tạm vắng'`, lưu lịch sử |
| `FTC-27` | US-005 | Từ chối trạng thái xuất Excel không hợp lệ hoặc SQL injection | `backend/tests/residentExport.test.js` | `statusCode = 400`, không chạm DB |
| `FTC-28` | US-005 | Trả `404` khi không có nhân khẩu nào thuộc trạng thái cần xuất | `backend/tests/residentExport.test.js` | `statusCode = 404` |
| `FTC-29` | US-005 | Xuất buffer `.xlsx` giữ số `0` đầu phòng `'050'`, định dạng `dd/mm/yyyy` và chống formula injection | `backend/tests/residentExport.test.js` | File `.xlsx` đúng 6 cột và dữ liệu chuẩn |
| `FTC-30` | US-015 | Kiểm tra dữ liệu cấp tài khoản BQT hợp lệ | `backend/tests/authAndAccount.test.js` | Trả về `null` |
| `FTC-31` | US-015 | Từ chối username quá ngắn, chứa khoảng trắng hoặc ký tự đặc biệt | `backend/tests/authAndAccount.test.js` | Báo lỗi `"Tên đăng nhập từ 3 ký tự, không dấu cách."` |
| `FTC-32` | US-015 | Từ chối họ tên quá ngắn hoặc mật khẩu khởi tạo dưới 6 ký tự | `backend/tests/authAndAccount.test.js` | Báo lỗi họ tên / mật khẩu khởi tạo |
| `FTC-33` | US-015 | Service cấp tài khoản BQT mới, lấy danh sách tài khoản và chặn `409` khi trùng username | `backend/tests/authAndAccount.test.js` | Trả tài khoản `role: 'BQT'` và danh sách |
| `FTC-34` | US-015 | Service chặn xóa tài khoản không tồn tại (`404`), đang đăng nhập (`400`) hoặc ADMIN cuối cùng (`400`) | `backend/tests/authAndAccount.test.js` | Ném `AppError` đúng mã lỗi |
| `FTC-35` | US-016 | Đăng nhập đúng mật khẩu trả JWT token, thiếu thông tin trả `400`, sai mật khẩu trả `401` | `backend/tests/authAndAccount.test.js` | Trả `{ token, user }` hoặc ném `400`/`401` |
| `FTC-36` | US-016 | Middleware `requireAuth` và `requireAdmin` xác thực JWT và chặn `403` với tài khoản BQT thường | `backend/tests/authAndAccount.test.js` | Gán `req.user` và chặn `403` chuẩn xác |
| `FTC-37` | US-017 | Kiểm tra hợp lệ họ tên (2–120 ký tự) và định dạng số điện thoại hồ sơ cá nhân | `backend/tests/authAndAccount.test.js` | Chặn số điện thoại chứa chữ hoặc $> 30$ ký tự |
| `FTC-38` | US-017 | Kiểm tra điều kiện đổi mật khẩu (bắt buộc mật khẩu cũ/mới, mật khẩu mới $\ge 6$ ký tự) | `backend/tests/authAndAccount.test.js` | Chặn mật khẩu rỗng hoặc $< 6$ ký tự |
| `FTC-39` | US-017 | Cập nhật hồ sơ theo `userId` từ JWT và bỏ qua mọi trường lạ (`id`, `role`) gửi kèm trong body | `backend/tests/authAndAccount.test.js` | Chống IDOR / Mass Assignment |
| `FTC-40` | US-017 | Đổi mật khẩu thành công sau khi `bcrypt.compare` mật khẩu hiện tại, chặn `400` nếu sai mật khẩu cũ | `backend/tests/authAndAccount.test.js` | Cập nhật `password_hash` mới |

---

## 3. Bộ UI Test Cases Giao diện (Mục 8.3 — 17 Test Cases)

| Mã TC | US | Màn hình / File UI | Bước thực hiện trên giao diện | Kết quả mong đợi |
|---|---|---|---|---|
| `UTC-01` | US-016 | `LoginPage.jsx` | Mở `/residents` khi chưa đăng nhập | `RequireAuth` trong `App.jsx` tự chuyển hướng về `/login` |
| `UTC-02` | US-016 | `LoginPage.jsx` | Nhập sai mật khẩu và bấm **Đăng nhập** | Hiển thị thông báo lỗi đỏ `"Tên đăng nhập hoặc mật khẩu không đúng."`, ở lại `/login` |
| `UTC-03` | US-016 | `LoginPage.jsx` | Nhập đúng tài khoản `admin` / `admin123` và bấm **Đăng nhập** | Lưu JWT vào `sessionStorage`, chuyển vào trang chính `/`, thanh đầu trang hiện tên & vai trò |
| `UTC-04` | US-015 | `AppLayout.jsx` & `IssueAccountPage.jsx` | Đăng nhập bằng tài khoản `BQT` (không phải `ADMIN`), truy cập `/accounts` | Link **Cấp tài khoản** ẩn trên thanh điều hướng; gõ thẳng `/accounts` bị `RequireAdmin` đẩy về `/` |
| `UTC-05` | US-015 | `IssueAccountPage.jsx` | Đăng nhập `ADMIN`, nhập `ketoan01`, họ tên, mật khẩu $\ge 6$ ký tự $\to$ bấm **Cấp tài khoản** | Hiện thông báo thành công, tài khoản mới xuất hiện ngay trong bảng danh sách tài khoản |
| `UTC-06` | US-017 | `ProfilePage.jsx` | Mở `/profile`, sửa Họ và tên + Số điện thoại $\to$ bấm **Lưu hồ sơ** | Nút chuyển sang `"Đang lưu…"`, lưu xong hiện `"Đã cập nhật hồ sơ."`, tên trên `AppLayout` đổi ngay không cần F5 |
| `UTC-07` | US-017 | `ProfilePage.jsx` | Nhập `Mật khẩu mới` khác `Nhập lại mật khẩu mới` $\to$ bấm **Đổi mật khẩu** | Chặn ngay tại client với lỗi `"Mật khẩu xác nhận không khớp."`, không gửi request thừa |
| `UTC-08` | US-017 | `ProfilePage.jsx` | Nhập đúng mật khẩu hiện tại và mật khẩu mới hợp lệ $\to$ bấm **Đổi mật khẩu** | Hiện `"Đổi mật khẩu thành công."`, tự động xóa trắng 3 ô mật khẩu |
| `UTC-09` | US-001 | `HomePage.jsx` | Ở trang chính `/`, nhập Số phòng `050`, Diện tích `60` $\to$ bấm **Lưu căn hộ** | Hiện thông báo thành công, căn `050 (60 m²)` xuất hiện trong bảng danh mục căn hộ |
| `UTC-10` | US-001 | `HomePage.jsx` | Nhập diện tích `0` hoặc `-10` $\to$ bấm **Lưu căn hộ** | Hiển thị lỗi diện tích phải lớn hơn $0\text{ m}^2$ |
| `UTC-11` | US-002 | `ResidentsPage.jsx` | Mở `/residents`, chọn căn `050`, nhập `Nguyễn Văn A`, ngày sinh, quan hệ **Chủ hộ** $\to$ bấm **Thêm nhân khẩu** | Hiện thông báo `"Đã thêm Nguyễn Văn A vào căn 050."`, xóa trắng ô tên/ngày sinh, dropdown quan hệ tự chuyển sang **Con** |
| `UTC-12` | US-002 | `ResidentsPage.jsx` | Chọn lại căn `050` đã có chủ hộ, chọn quan hệ **Chủ hộ** $\to$ bấm **Thêm nhân khẩu** | Hiển thị hộp cảnh báo lỗi đỏ `"Căn hộ này đã có chủ hộ."` |
| `UTC-13` | US-003 | `ResidentsPage.jsx` | Nhập `050` vào ô tìm kiếm $\to$ bấm **Tìm kiếm** | Bảng danh sách chỉ hiển thị các nhân khẩu thuộc căn `050`; lưu `activeSearch = "050"` |
| `UTC-14` | US-004 | `ResidentsPage.jsx` | Bấm **Cập nhật trạng thái** tại dòng `Nguyễn Văn A`, chọn **Tạm vắng**, nhập từ ngày – đến ngày $\to$ bấm **Xác nhận** | Form cập nhật đóng lại, cột Trạng thái đổi thành `Tạm vắng`, cột Lịch sử hiển thị thêm dòng mốc ngày vừa nhập |
| `UTC-15` | US-005 | `ResidentsPage.jsx` | Chọn trạng thái **Tạm vắng** ở khung Xuất danh sách $\to$ bấm **Xuất Excel** | Trình duyệt tự tải xuống file `nhan-khau-Tạm vắng.xlsx`, hiện thông báo xanh |
| `UTC-16` | US-005 | `ResidentsPage.jsx` | Chọn trạng thái không có nhân khẩu nào $\to$ bấm **Xuất Excel** | Hiện thông báo lỗi `"Không có nhân khẩu thuộc trạng thái đã chọn."`, không tải file rỗng |
| `UTC-17` | US-005 | `frontend/tests/api.test.mjs` | Kiểm thử tự động hàm `api()` tải dữ liệu `blob` kèm header `Authorization: Bearer <token>` và bắt lỗi JSON | Test tự động `api.test.mjs` chạy PASS |

---

## 4. Bộ Integration Test Cases HTTP API (Mục 8.4 — 7 Test Cases)

| Mã TC | US |File kiểm thử | Mô tả kiểm thử tích hợp HTTP → Router → Middleware → Handler → Service → Repository | Kết quả |
|---|---|---|---|---|
| `ITC-01` | US-001 | `backend/tests/apartmentApi.integration.js` | `GET /api/apartments` khi không có JWT token bị `requireAuth` chặn `401` | HTTP `401` |
| `ITC-02` | US-001 | `backend/tests/apartmentApi.integration.js` | `POST /api/apartments` tạo căn `'050'` (`60 m²`) trả `201` và `GET /api/apartments` trả danh sách gồm căn `'050'` | HTTP `201` & `200` |
| `ITC-03` | US-001 | `backend/tests/apartmentApi.integration.js` | `POST /api/apartments` với số phòng trùng `'050'` trả `409 Conflict` | HTTP `409` |
| `ITC-04` | US-002..004, US-017 | `backend/tests/residentApi.integration.js` | `GET /api/residents` và `PATCH /api/auth/profile` không có token bị chặn `401` | HTTP `401` |
| `ITC-05` | US-002..004 | `backend/tests/residentApi.integration.js` | Chuỗi liên hoàn: `POST /api/residents` (tạo chủ hộ Nguyễn Văn A căn 050) $\to$ `POST /api/residents/100/residency-events` (ghi Tạm vắng) $\to$ `GET /api/residents?search=050` | HTTP `201` $\to$ `201` $\to$ `200` |
| `ITC-06` | US-005 | `backend/tests/residentExportApi.integration.js` | `GET /api/residents/export` không có token hoặc token sai bị chặn `401` | HTTP `401` |
| `ITC-07` | US-005 | `backend/tests/residentExportApi.integration.js` | `GET /api/residents/export?status=...` tải file `.xlsx` hợp lệ cho cả 5 trạng thái, trả `400` khi sai tham số và `404` khi danh sách rỗng | HTTP `200`, `400`, `404` |

---

## 5. Kịch bản kiểm thử xuyên suốt & Dữ liệu kiểm thử (Mục 8.5 & 8.6)

### 5.1. Kịch bản nghiệm thu Sprint 1 (End-to-End Demo Scenario)
1. **Bước 1 (`US-015`):** Đăng nhập tài khoản seed `admin` (`admin123`), mở **Cấp tài khoản**, tạo tài khoản kế toán `ketoan01` (`Trần Thị Kế Toán`).
2. **Bước 2 (`US-016` & `US-017`):** Đăng xuất `admin`, đăng nhập `ketoan01`, mở **Hồ sơ cá nhân**, cập nhật số điện thoại `0912345678` và đổi mật khẩu sang mật khẩu mới.
3. **Bước 3 (`US-001`):** Mở màn hình **Căn hộ**, nhập Số phòng `050`, Diện tích `60` ($60\text{ m}^2$) $\to$ bấm **Lưu căn hộ**.
4. **Bước 4 (`US-002`):** Mở **Hộ và nhân khẩu**, chọn căn `050`, nhập Họ tên `Nguyễn Văn A`, Ngày sinh `1985-05-15`, Quan hệ `Chủ hộ` $\to$ bấm **Thêm nhân khẩu**.
5. **Bước 5 (`US-004`):** Tại dòng `Nguyễn Văn A`, bấm **Cập nhật trạng thái**, chọn `Tạm vắng`, nhập từ ngày `2026-11-06` đến `2026-11-20` $\to$ bấm **Xác nhận**.
6. **Bước 6 (`US-003`):** Nhập `050` vào ô tìm kiếm $\to$ bấm **Tìm kiếm**, kiểm tra dòng `Nguyễn Văn A` hiển thị trạng thái hiện tại `Tạm vắng` cùng lịch sử cư trú.
7. **Bước 7 (`US-005`):** Tại mục **Xuất danh sách nhân khẩu**, chọn trạng thái `Tạm vắng` $\to$ bấm **Xuất Excel**, mở file `.xlsx` kiểm tra số phòng `050` giữ nguyên số `0` ở đầu và thông tin `Nguyễn Văn A` chính xác.

### 5.2. Dữ liệu kiểm thử (Test Data / Fixtures)
- **Tài khoản khởi tạo (`backend/seed.js`):** `username: "admin"`, `role: "ADMIN"`.
- **Dữ liệu căn hộ mẫu:** Số phòng `"050"`, diện tích `60.00` ($\text{m}^2$); Số phòng `"101"`, diện tích `75.50` ($\text{m}^2$).
- **Dữ liệu cư dân mẫu:** Chủ hộ `"Nguyễn Văn A"` (`1985-05-15`, căn `050`), thành viên `"Nguyễn Văn B"` (`2015-10-20`, quan hệ `"Con"`, căn `050`).
- **Dữ liệu biến động cư trú mẫu:** Trạng thái `"Tạm vắng"`, từ `"2026-11-06"` đến `"2026-11-20"`.
