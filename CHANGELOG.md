# Tổng hợp Thay đổi (Changelog) — BlueMoon SE09

> **Lần dọn Drive tiếp theo ngày 28/11/2026:** Theo yêu cầu lưu hiện vật ngoài GitHub, đã đưa 43 SVG trùng ở folder `figma-import` rời và 14 bản tài liệu repo cũ trong `01_Tai_lieu` của gói Drive vào thùng rác (57 file, không xóa vĩnh viễn). Hai folder chứa chúng còn rỗng do công cụ Trash chỉ hỗ trợ từng file. Đã sửa README native và index.html trên Drive, thêm `HUONG_DAN_THU_MUC_DRIVE.txt`. Bộ chuẩn 43 SVG và 18 Excel được đọc lại xác nhận còn đủ; nguồn sơ đồ/ảnh xuất không thiếu file theo đối chiếu danh sách local. Không tải thêm 9 tài liệu Markdown thuộc repo, không push GitHub, không sửa nội dung Excel. Bộ local đầy đủ vẫn giữ nguyên tài liệu; các ghi chú “chưa upload” bên dưới là trạng thái của lần đóng gói trước.

> **Trạng thái cập nhật 28/11/2026:** Bản tổng hợp thay đổi local phục vụ rà soát. Chưa push GitHub hay đồng bộ Drive trong lần cập nhật này; các cột đóng gói ở Phần II chỉ là đề xuất. Sprint 2 vẫn là thiết kế/kế hoạch, chưa triển khai chức năng tài chính.
>
> **Mốc đối chiếu:** Nhánh `main` gốc tại commit `66dd8fc` (`ci: enable auto-deploy to bluemoon-pied.vercel.app`) và bộ tài liệu khởi tạo ban đầu trong thư mục gốc dự án.

---

## Phần I. Các thay đổi trong Repository `IT3180_2026.1_Nhom9` (Dự kiến đẩy lên nhánh GitHub mới)

**Bổ sung tài liệu phối hợp 28/11/2026:** [Mục lục nhóm](docs/README.md), [quy trình đóng góp](CONTRIBUTING.md), [API draft](docs/api-contract-s2.md), [sổ quyết định](docs/sprint2-decisions.md), [dữ liệu thử](docs/sprint2-test-data.md) và [báo cáo S2](docs/test-report-s2.md). API mới còn cần chốt; các quyết định đều ghi Đề xuất, báo cáo 45 ca chức năng và 4 ca tích hợp/vận hành/hiệu năng/UX đều Chưa thực thi. Không tạo seed S2 hoặc chạy test ứng dụng trong lần bổ sung tài liệu này.

### 1. Hạ tầng ngày nghiệp vụ dùng chung (`shared/`) & Cấu hình

| File | Thay đổi gì | Thay đổi đó làm gì |
|---|---|---|
| `shared/businessDate.mjs` *(Mới)* | Tạo hàm `getBusinessDate(now = new Date())` định dạng ngày `YYYY-MM-DD` theo múi giờ `Asia/Ho_Chi_Minh`. | Khắc phục lỗi lệch ngày khi server/trình duyệt dùng ngày UTC (00:00 giờ Việt Nam là 17:00 UTC hôm trước), dùng thống nhất giữa validation ngày sinh, kiểm tra hiệu lực sự kiện cư trú và ngày mặc định trên form UI. |
| `frontend/vite.config.js` | Thêm `cacheDir: ".vite-cache"` và `server.fs.allow: [".."]`. | Tránh lỗi `EPERM` trên Windows khi xóa cache trong `node_modules/.vite` và cho phép frontend import trực tiếp `shared/businessDate.mjs` nằm ngoài thư mục `frontend/`. |
| `frontend/.gitignore` | Thêm `.vite-cache`. | Không đẩy thư mục cache build cục bộ lên Git. |

---

### 2. Backend — Database, Xác thực & Bảo mật (`backend/`)

| File | Thay đổi gì | Thay đổi đó làm gì |
|---|---|---|
| `backend/config/database.js` | Bổ sung tự động migrate thêm cột `account_status`, `failed_login_attempts`, `locked_until`, `token_version`, `must_change_password` cho `users`; khóa ngoại `fk_users_resident` + `uq_users_resident`; cột `cccd` cho `residents`; đổi `residency_events.end_date` thành `DATE NULL`. | Nâng cấp schema an toàn cho luồng cư dân tự đăng ký chờ duyệt (`PENDING`), chống brute-force, thu hồi token cũ, lưu CCCD và cho phép ghi sự kiện cư trú chưa biết ngày kết thúc. |
| `backend/index.js` | Gọi `assertJwtConfigured()` trước khi khởi động HTTP server. | Buộc server phải dừng ngay khi thiếu biến môi trường `JWT_SECRET` thay vì chạy với khóa mặc định công khai. |
| `backend/middlewares/auth.js` | Xóa khóa `JWT_SECRET` mặc định hardcode; thêm `assertJwtConfigured()`; gắn `tokenVersion` vào payload JWT và đối chiếu `user.token_version` trong `requireAuth`. | Chặn sử dụng token cũ sau khi đổi mật khẩu, đặt lại mật khẩu hoặc khi cư dân đã chuyển đi; vẫn tạo khóa ngẫu nhiên tạm thời khi chạy test tự động `node --test`. |
| `backend/repositories/userRepository.js` | Cập nhật `toPublicUser` (thêm `mustChangePassword`), `updatePassword` (tăng `token_version` và cập nhật `must_change_password`), thêm hàm `updateAccountStatus`, `recordFailedLogin`, `clearFailedLogin`, `listResidentsWithoutAccount`, `listResidentAccounts`, `findResidentByRoomAndName`, `findResidenceForUser`, `listHouseholdMembersByHouseholdId`, `listHouseholdEventsByHouseholdId`. | Hỗ trợ truy vấn đăng nhập, khóa tạm, duyệt tài khoản cư dân, lọc bỏ người đã `"Chuyển đi"` khỏi danh sách ứng viên chưa có tài khoản và phục vụ cổng thông tin hộ gia đình của cư dân. |
| `backend/services/authService.js` | Kiểm tra `locked_until` (`HTTP 423`), tăng `failed_login_attempts` (khóa 5 phút sau 5 lần sai liên tiếp), chặn tài khoản `PENDING` (`HTTP 403`), tự reset bộ đếm khi đăng nhập đúng; khi `changePassword` trả kèm token mới và `mustChangePassword: false`. | Chống dò mật khẩu brute-force, chặn tài khoản chưa duyệt và cấp lại phiên mới hợp lệ ngay cho người vừa tự đổi mật khẩu (trong khi thu hồi các phiên ở thiết bị cũ). |
| `backend/services/accountService.js` | Thêm `generateTemporaryPassword(8)` bằng `crypto.randomBytes` và `resetStaffPassword(idInput, newPasswordInput)`. | Cho phép `ADMIN` đặt lại mật khẩu thành viên BQT bằng mật khẩu tạm ngẫu nhiên (8 ký tự), mở khóa đăng nhập tạm thời, thu hồi phiên cũ và bật cờ bắt buộc đổi mật khẩu ở lần đăng nhập kế tiếp. |
| `backend/services/residentAccountService.js` | Thêm `maskCccd`, `registerResidentAccount`, `approveResidentAccount`, `resetResidentPassword`, cập nhật `issueResidentAccount`, mở rộng `getMyResidence`. | Cho phép cư dân tự đăng ký theo `roomNumber` + `fullName` (trạng thái `PENDING`), BQT duyệt/từ chối/đặt lại mật khẩu tạm; chặn đăng ký hoặc cấp tài khoản cho người đã `"Chuyển đi"`; trong `getMyResidence` tự tính trạng thái hiệu lực theo ngày VN, chặn `403` khi cư dân đã `"Chuyển đi"`, lọc thành viên đang ở và che CCCD của các thành viên khác (`********XXXX`). |
| `backend/api/handlers/authHandlers.js`, `accountHandlers.js`, `residentAccountHandlers.js` & các `routes/` tương ứng | Mở thêm các route `POST /api/auth/register-resident`, `POST /api/accounts/:id/reset-password`, `PATCH /api/resident-accounts/:id/approve`, `POST /api/resident-accounts/:id/reset-password`. | Nối đầy đủ các API xác thực, duyệt tài khoản và khôi phục mật khẩu ra REST router có bảo vệ phân quyền đúng tầng. |

---

### 3. Backend — Quản lý Căn hộ, Nhân khẩu, Cư trú & Xuất Excel (`backend/`)

| File | Thay đổi gì | Thay đổi đó làm gì |
|---|---|---|
| `backend/repositories/apartmentRepository.js`, `apartmentService.js`, `apartmentHandlers.js`, `apartmentRoutes.js` | Thêm `editApartment` (`PUT /api/apartments/:id`), `countResidentsByApartmentId`, `removeApartment` (`DELETE /api/apartments/:id`). | Hoàn thiện đầy đủ Thêm – Xem – Sửa – Xóa căn hộ (`US-001`); kiểm tra trùng số phòng (`409`) và chặn xóa căn hộ đang có nhân khẩu (`400`) để bảo toàn dữ liệu hộ gia đình. |
| `backend/validators/residentValidation.js` | Dùng `getBusinessDate()` kiểm tra ngày sinh không ở tương lai; thêm validate `cccd` (rỗng hoặc 9/12 chữ số); hỗ trợ `{ requireApartment = true }`; cho phép `endDate` rỗng trong `validateResidencyEvent`. | Cho phép sửa nhân khẩu không cần gửi lại `apartmentId`, kiểm soát định dạng CCCD/CMND và hỗ trợ sự kiện cư trú không xác định ngày kết thúc. |
| `backend/repositories/residentRepository.js` | Bổ sung `resolveEffectiveResidencyStatus`, `isResidencyEventEffective`, `getResidentHistoryById`, `updateResidentById`, `deleteResidentById`; mở rộng `listResidents` (lọc `search`, `status`, `apartmentId`, `includeHistory`, join lấy `householdHeadId` & `householdHeadName`); sửa `listResidentsByStatus` chạy qua cùng luồng giải trạng thái hiệu lực; trong `createResidencyEvent` kiểm tra hiệu lực theo ngày VN trước khi ghi đè `current_status` và tự tăng `users.token_version` nếu sự kiện `"Chuyển đi"` có hiệu lực. | Đảm bảo trạng thái cư trú tự kích hoạt khi đến ngày, tự khôi phục khi tạm trú/tạm vắng hết hạn; màn hình tra cứu và xuất Excel luôn khớp tuyệt đối về trạng thái và lọc `apartmentId`; chuyển quyền Chủ hộ trong transaction an toàn; xóa nhân khẩu thừa an toàn (chặn xóa Chủ hộ khi còn thành viên khác, dọn hộ 1 người khi xóa). |
| `backend/services/residentService.js`, `residentHandlers.js`, `residentRoutes.js` | Thêm `getResidentHistory` (`GET /api/residents/:id/history`), `editResident` (`PUT /api/residents/:id`), `removeResident` (`DELETE /api/residents/:id`); cập nhật `exportResidents(status, search, { apartmentId })` validate `apartmentId`; phát sự kiện `RESIDENT_CREATED`, `RESIDENCY_STATUS_CHANGED` lên `domainEventBus`. | Cung cấp API sửa/xóa/chuyển chủ hộ, xuất Excel đồng bộ bộ lọc đang xem và kết nối nền `Observer` ở Sprint 1. |
| `backend/strategies/feeCalculationStrategy.js` | Sửa đường dẫn import `../utils/errors.js` thành `../helpers/AppError.js`. | Khắc phục lỗi module path không tồn tại ở base Strategy chuẩn bị cho Sprint 2. |
| `backend/seed.js` | Mở rộng seed mẫu: ngoài `admin`, tạo thêm `bqt01`, `bqt02`, `cudan050` (`ACTIVE`), `cudan102` (`PENDING`), 6 căn hộ (`050`, `101`, `102`, `201`, `202`, `301`) và 10 nhân khẩu kèm CCCD + sự kiện cư trú. | Giúp giảng viên/nhóm có sẵn dữ liệu thực tế đa trạng thái để kiểm thử ngay sau `npm run seed`. |

---

### 4. Frontend — Giao diện & Trải nghiệm người dùng (`frontend/`)

| File | Thay đổi gì | Thay đổi đó làm gì |
|---|---|---|
| `frontend/src/styles/global.css` | Sửa màu chữ `button.link` thành `#14344a` trên nền `#fff` (giữ chữ trắng ở `.top button.link`); thêm `.modal-backdrop`, `.modal-card` và `flex-wrap: wrap` cho `.row-actions`. | Khắc phục lỗi nút phụ bị chìm chữ trắng trên nền sáng và hỗ trợ hộp thoại nổi không làm nhảy bố cục bảng. |
| `frontend/src/services/api.js` | Dùng `import.meta.env?.VITE_API_URL`; tách riêng lỗi mất kết nối (`status: 0`) và lỗi `5xx` với thông báo hướng dẫn cụ thể. | Chạy được test Client trực tiếp trên Node và tránh hiển thị lỗi *"Yêu cầu thất bại."* chung chung khi mất mạng/server lỗi. |
| `frontend/src/layouts/AppLayout.jsx` | Đổi nhãn menu thành `Căn hộ` / `Căn hộ của tôi`, `Hộ và nhân khẩu`, `Tài khoản cư dân`, `Hồ sơ cá nhân`, `Tài khoản BQT`; thêm banner nhắc đổi mật khẩu khi `user.mustChangePassword === true`. | Tên mục phản ánh đúng chức năng và nhắc người dùng đổi mật khẩu sau khi được reset mật khẩu tạm. |
| `frontend/src/pages/LoginPage.jsx` | Thêm chế độ `Cư dân tự đăng ký tài khoản` gửi `POST /api/auth/register-resident`. | Cư dân tự gửi yêu cầu đăng ký, giảm thao tác nhập liệu thủ công cho BQT. |
| `frontend/src/pages/HomePage.jsx` | Đưa thanh tìm số phòng, nút `+ Thêm căn hộ` (ẩn/hiện form) và bảng căn hộ lên đầu trang; thêm nút `Nhân khẩu` (điều hướng kèm `apartmentId` & `room`), `Sửa` (inline), `Xóa` (xác nhận inline) và cập nhật state tại chỗ. | Không phải cuộn qua form nhập khi mở trang; truy cập thẳng đúng nhân khẩu của từng phòng (không khớp nhầm chuỗi con). |
| `frontend/src/pages/ResidentForms.jsx` *(Mới)* & `ResidentsPage.jsx` | Tách `AddResidentForm` và modal `ResidencyStatusForm` khỏi `ResidentsPage.jsx`; đặt thanh tìm kiếm + xuất Excel đồng bộ bộ lọc + bảng 5 cột lên đầu trang; lưu bộ lọc trên URL query (`useSearchParams`); hiển thị ngày `dd/mm/yyyy` theo VN (`getBusinessDate()`); giữ phòng & auto-focus ô Họ tên khi thêm liên tiếp; tự chọn quan hệ `Con`/`Chủ hộ`; bắt buộc hộp thoại xác nhận `Chủ hộ cũ → Chủ hộ mới` ở mọi luồng (`Đặt chủ hộ` lẫn `Sửa`); reset form đổi cư trú mỗi lần mở người mới; thêm lối tắt `Cấp TK`. | Giảm mạnh thao tác thừa, chống mất bộ lọc khi tải lại trang và ngăn cập nhật nhầm trạng thái/chủ hộ. |
| `frontend/src/pages/IssueResidentAccountPage.jsx` & `IssueAccountPage.jsx` | Thêm bảng yêu cầu chờ duyệt 1-click (`Duyệt`/`Từ chối`), nút `Đặt lại MK` (hiển thị mật khẩu tạm ngẫu nhiên vừa sinh), ô tìm nhanh nhân khẩu theo tên/phòng và nhận sẵn `?residentId=` từ trang Nhân khẩu. | Rút gọn quy trình duyệt, cấp tài khoản và khôi phục mật khẩu cho BQT/Admin. |
| `frontend/src/pages/ResidentHomePage.jsx` & `ProfilePage.jsx` | Giao diện Cư dân ưu tiên hiển thị thông tin hộ + danh sách thành viên đang cư trú, gom ngày sinh, CCCD đã che và lịch sử cư trú vào phần chi tiết (`<details>`) dùng định dạng `dd/mm/yyyy`; `ProfilePage.jsx` cập nhật lại JWT token & user context sau khi đổi mật khẩu. | Bảo vệ thông tin hành chính nhạy cảm trên màn hình chính cư dân và giữ phiên đăng nhập liên tục sau khi tự đổi mật khẩu. |

---

### 5. Kiểm thử tự động (`backend/tests/` & `frontend/tests/`)

| File | Thay đổi gì |
|---|---|
| `backend/tests/apartmentService.test.js` | Thêm test `editApartment` và `removeApartment` (xóa căn trống, chặn xóa căn đang có người). |
| `backend/tests/authAndAccount.test.js` | Mở rộng test brute-force (`423`), tài khoản `PENDING`, tự đăng ký + duyệt, che CCCD thành viên khác, chặn `403` khi `"Chuyển đi"`, bắt buộc `JWT_SECRET`, mật khẩu tạm ngẫu nhiên 8 ký tự và thu hồi JWT cũ via `token_version`. |
| `backend/tests/residentValidation.test.js` | Thêm test validate CCCD (9/12 số) và cho phép bỏ trống `endDate` khi đổi cư trú. |
| `backend/tests/residentService.test.js` & `residentApi.integration.js` | Thêm test `editResident`, `removeResident`, sự kiện tương lai không ghi đè sai `current_status`, sự kiện `"Chuyển đi"` thu hồi phiên, `resolveEffectiveResidencyStatus` theo thời điểm và lọc chính xác `apartmentId` kèm `householdHeadName`. |
| `backend/tests/residentExport.test.js`, `residentExportApi.integration.js` & `residentExportRegression.test.js` *(Mới)* | Thêm kiểm thử hồi quy xuất Excel dùng cùng trạng thái hiệu lực theo ngày giờ Việt Nam (`getBusinessDate`) và lọc chính xác `apartmentId` (`101` vs `1101`). |
| `frontend/tests/api.test.mjs` | Thêm test lỗi mạng (`status: 0`) và lỗi máy chủ (`502`). |

- **Bằng chứng kiểm thử hiện được ghi nhận** (đối chiếu [báo cáo S1](docs/test-report-s1.md) và [README](README.md)):
  - **Cập nhật chạy thực tế ngày 28/11/2026** *(nền commit `b065008` + working tree local sau khi thực hiện plan rà soát cuối Sprint 1)*:
    - Đã sửa `listResidents` / `listResidentsByStatus` lọc trạng thái hiệu lực ngày VN (`BUG-S1-06`); đồng nhất điều kiện ứng viên/đăng ký/cấp/duyệt/đăng nhập/xem hộ qua `getEffectiveResidencyStatuses` và thu hồi `token_version` trong transaction khi ghi bù `"Chuyển đi"` (`BUG-S1-07`); khóa `SELECT ... FOR UPDATE` trong transaction khi xóa căn hộ trống (`deleteEmptyApartmentById` — `BUG-S1-08`); đồng bộ vòng đời tải danh sách, giữ modal khi reload, tách tải `/api/apartments`, khóa form theo prop `submitting` khi POST thêm cư dân và giữ `search`/`status` khi bấm *"Xem tất cả các phòng"* trên `ResidentsPage.jsx` & `ResidentForms.jsx` (`BUG-S1-09`).
    - Chạy lại toàn bộ suite tự động: **70/70 PASS** (`0 fail`, `0 skip`: `56` backend `npm test` + `8` backend `npm run test:e2e` + `6` frontend `node --test tests/*.test.mjs` gồm file untracked `residentsRefresh.test.mjs`); `oxlint` **0 warnings, 0 errors**.
    - `npm run build` mặc định vẫn gặp lỗi quyền `EPERM` tại `frontend/dist/assets`; `npm run build -- --outDir node_modules/.cache/s1-final-review-verify` **PASS** (37 modules, 118ms).
    - **Phần chưa xác minh:** các test có tương tác dữ liệu ở backend dùng mock DB (chưa chạy MySQL thật), `residentsRefresh.test.mjs` là hook/effect harness (chưa kiểm tra thủ công DOM/StrictMode trên trình duyệt desktop / `390px`). Các điều kiện còn lại của T00 (tạo DB thử riêng, chốt baseline commit, chốt quyết định `DEC-01`..`DEC-11` và ước lượng lại Sprint 2) chưa đánh dấu Done.

---

### 6. Tài liệu Dự án (`README.md`, `docs/`) & Thiết kế giao diện đề xuất (`design/`)

| Nhóm file | Thay đổi gì | Thay đổi đó làm gì |
|---|---|---|
| `README.md`, `docs/huong-dan-su-dung.md`, `docs/huong-dan-cai-dat.md`, `docs/wireframes-and-ui-base-s1.md` | Cập nhật phạm vi Sprint 1 vs Sprint 2, danh sách REST API, hướng dẫn seed mẫu và luồng sử dụng thực tế mới. | Giúp thành viên và giảng viên cài đặt, demo và tra cứu đúng với code hiện tại. |
| `docs/test-plan-and-cases-s1.md`, `docs/test-report-s1.md`, `docs/traceability-matrix-s1.md`, `docs/regression-checklist-s1.md` | Bổ sung các test case mới, bảng truy vết endpoint/file nguồn/test cho toàn bộ tính năng Sprint 1 đã hoàn thiện. | Đồng bộ hồ sơ kiểm thử và ma trận truy vết Sprint 1. |
| `docs/sprint2-technical-base.md`, `docs/test-plan-and-cases-s2.md`, `docs/wireframes-sprint2-uiux.md`, `docs/product-vision-and-backlog.md` | Hoàn thiện thiết kế kỹ thuật Sprint 2 (đề xuất 7 bảng mới + mở rộng vòng đời hộ/diện tích lịch sử = 12 bảng nghiệp vụ, quy tắc phân bổ tiền, idempotency + fingerprint, hủy hóa đơn/giao dịch, audit cùng transaction, ma trận 5 vai trò, 45 ca `FTC-S2-01`..`45` + 4 ca tích hợp/vận hành/hiệu năng/UX). | Khóa chặt nghiệp vụ tiền & phân quyền làm chuẩn trước khi bắt đầu code Sprint 2 (`0/11 US`). |
| `docs/project-summary-and-roadmap.md`, `docs/sprint2-implementation-plan.md`, `docs/huong-dan-lam-sprint2.md` *(Mới)* | Tổng hợp thực trạng, kế hoạch 12 task (`T00`–`T11`) và hướng dẫn theo module. Rà soát 28/11 bổ sung điều kiện vào sprint, migration không suy diễn lịch sử, kiểm token preview theo người/kỳ/mục đích/hóa đơn, idempotency khi chạy đồng thời, tính lại trạng thái sau hủy, payload `{ reason }` và truy quyền cư dân từ DB. | Làm hướng dẫn triển khai; các quy tắc v1.0 còn cần nhóm/khách hàng xác nhận. Chưa phải bằng chứng Sprint 2 đã chạy. |
| `design/bluemoon-ui-redesign/` & `design/drive-update-20261128/` *(Mới)* | Bộ 43 SVG đề xuất giao diện (`01`–`43`), gallery prototype HTML tĩnh (`index.html`), script sinh SVG (`generate_design.py`, `sprint2_boards.py`), 3 file `.zip` nhập Figma và 8 file `.drawio` bản gốc (`originals/`). | Bản thiết kế giao diện đề xuất cho Sprint 1 & 2 (chưa áp vào code frontend đang chạy; dùng thay thế tạm thời do Figma Starter hết quota MCP). |

---

## Phần II. Các folder/file nằm NGOÀI `IT3180_2026.1_Nhom9` (Dự kiến tổng hợp lên Google Drive `figma - cnpm`)

Các tài liệu quản lý dự án, biểu mẫu Excel, sơ đồ nguồn và bộ đóng gói tài liệu hiện nằm tại `d:\HUST\CNPM\Bluemoon\`:

**Phạm vi xác minh 28/11/2026:** Bộ thiết kế rời ở root đã được so sánh byte với bản trong repo, gồm 43 SVG và các file liệt kê ở dòng 6. Với Draw.io, Class và Sequence khác bản gốc tải từ Drive; sáu file còn lại trùng byte. So sánh này không chứng minh mọi thay đổi nội dung sơ đồ đều đúng. Chưa có bản trước/sau hoặc lịch sử phiên bản để xác nhận các tuyên bố sửa/giữ nguyên Excel, DOCX và ảnh bên dưới; những thông tin đó được giữ làm danh mục cần đối chiếu, không phải kết luận đã kiểm chứng.

| STT | Tên folder / file | Tình trạng so với ban đầu | Ghi chú đóng gói lên Google Drive |
|---:|---|---|---|
| 1 | **10 file `.xlsx` được bản kê khai trước ghi là đã cập nhật (chưa xác minh lịch sử):** `SE09-Project Charter.xlsx`, `SE09 - Mẫu cấu trúc phân chia công việc.xlsx`, `SE09 - Mẫu Dashboard báo cáo dự án.xlsx`, `SE09 - Mẫu lập kế hoạch dự án theo nguyên tắc Agile.xlsx`, `SE_9-W02-Client wish list.xlsx`, `SE_9-W02-NFR.xlsx`, `SE_9-W02-Product backlog.xlsx`, `SE_9-W02-Raw log.xlsx`, `SE_9-W02-Traceability Matrix.xlsx`, `SE_9-W02-User story.xlsx` | **Cần đối chiếu bản trước/sau** cho các nội dung được kê khai: (sửa lệch mã `RAW-06`..`26`, sửa `Sprint 3` $\to$ `Sprint 2`, đồng bộ `NFR-01`/`NFR-10`, cập nhật tiến độ charter/WBS/dashboard). | Đưa toàn bộ vào thư mục con `01_Tai_lieu_Excel_W02_va_Quan_ly` (gồm cả 8 file `.xlsx` còn lại bên dưới). |
| 2 | **8 file `.xlsx` được kê khai giữ nguyên (chưa có baseline đối chiếu):** `SE09 - Mẫu Gantt Chart quản lý dự án.xlsx`, `SE09 - Mẫu ma trận quản lý rủi ro dự án.xlsx`, `SE09 - Mẫu theo dõi rủi ro dự án.xlsx`, `SE09 - Mẫu timeline dự án.xlsx`, `SE_9-W02-As is scenario.xlsx`, `SE_9-W02-Epics.xlsx`, `SE_9-W02-Features.xlsx`, `SE_9-W02-Visionary scenario.xlsx` | **Chưa xác minh trạng thái trước/sau**; danh mục biểu mẫu môn học. | Đưa cùng vào thư mục con `01_Tai_lieu_Excel_W02_va_Quan_ly`. |
| 3 | **Tài liệu & ảnh gốc:** `Huong_dan_kiem_tra_scenario_Agile_Scrum.docx`, `image.png`, `image (1).png` | **Chưa xác minh so với bản ban đầu**. | Đưa vào thư mục `02_Tai_lieu_Tham_khao_Goc`. |
| 4 | **`Diagrams_Source/`** (8 file `.drawio`) | **Khác bản gốc tải từ Drive:** `Class_Diagram.drawio` & `Sequence_Diagrams.drawio`; 6 file còn lại trùng byte. Chưa nghiệm thu nội dung phần khác biệt. | Đưa lên Drive (thư mục `03_So_do_Nguon_Diagrams_Source`). |
| 5 | **`BlueMoon_Documents_v2_2026-11-28/`** | **Bản local riêng** (chứa `01_Tai_lieu/`, `02_Giao_dien/`, `03_So_do/` gồm nguồn Draw.io mới + PNG + SVG, `99_Nguon_goc_Drawio/`, `index.html`, `catalog.json`, `README.md`). Ngày 28/11 bổ sung bản hướng dẫn Sprint 2 đã rà soát vào `01_Tai_lieu/`, bản changelog ở root gói và liên kết mục lục. | Chưa upload; giữ nguyên các bản gốc trên Drive. |
| 6 | **Bản thiết kế rời ở root Bluemoon — đã dọn ngày 28/11/2026:** 43 SVG trong `figma-import/` và 6 file `index.html`, `manifest.json`, `DESIGN-OVERVIEW.md`, `SPRINT2-DESIGN.md`, `README.md`, `bluemoon-sprint1-sprint2-design.zip` | **Đã xóa 49 file trùng SHA-256 và thư mục `figma-import/` rỗng**, tổng dung lượng logic 1.243.186 byte. Kiểm tra từng bản được giữ trước khi xóa. | Bản chuẩn còn ở `IT3180_2026.1_Nhom9/design/bluemoon-ui-redesign/`; bản đóng gói local vẫn giữ trong `BlueMoon_Documents_v2_2026-11-28/02_Giao_dien/`. Không upload Drive. |

### Phạm vi dọn bản sao

Quét 456 file làm việc (bỏ qua Git internals, dependency, cache và build output) tìm được 69 nhóm trùng nội dung. Chỉ xóa 49 bản thiết kế rời đã xác minh trùng và không có tham chiếu phụ thuộc được tìm thấy. Không suy ra file thừa chỉ vì tên giống nhau hoặc không thấy import.

Giữ nguyên code, test, tài liệu làm việc trong repo; các bảng Excel/DOCX/ảnh nguồn; `Diagrams_Source`; nguồn Draw.io tải từ Drive; bản sao lưu nguyên gốc; bộ tài liệu local được yêu cầu tạo riêng. Các bản trong gói local phục vụ đọc độc lập và các bản lưu trữ phục vụ đối chiếu, nên không xóa chỉ vì trùng hash. Các ZIP nhập Figma, SVG, PNG và nguồn Draw.io có mục đích xuất/nhập khác nhau, không tự coi là file thừa.
