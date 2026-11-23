# Regression Checklist Sprint 1 (BlueMoon SE09)

Bảng kiểm thử hồi quy (Regression Checklist — Mục 9.4) đối chiếu toàn bộ 8 Must User Stories của Sprint 1 với Tiêu chí chấp nhận (AC), mã Test Case, tệp kiểm thử tự động và trạng thái thực thi.

| STT | US ID | WBS | Tên User Story | Tiêu chí chấp nhận (Acceptance Criteria) | Mã Test Case đối chiếu | File Test tự động | Kết quả |
|---|---|---|---|---|---|---|---|
| 1 | **US-015** | 3.1.1 | Cấp tài khoản cho thành viên BQT | *Given* đăng nhập ADMIN, *When* nhập username chưa trùng, họ tên và mật khẩu khởi tạo $\ge 6$ ký tự rồi bấm Cấp, *Then* tài khoản BQT mới đăng nhập được; không cho xóa tài khoản đang đăng nhập hoặc ADMIN cuối cùng. | `FTC-30`, `FTC-31`, `UTC-04`, `UTC-05` | `backend/tests/authAndAccount.test.js` | **PASS** |
| 2 | **US-016** | 3.1.2 | Đăng nhập bằng tài khoản được cấp | *Given* ở màn hình đăng nhập, *When* nhập đúng tài khoản và mật khẩu, *Then* nhận JWT và vào màn hình chính; nhập sai báo lỗi `401`; chưa đăng nhập không gọi được API nghiệp vụ (`401`). | `FTC-32`, `ITC-01`, `ITC-04`, `ITC-06`, `UTC-01`..`03` | `backend/tests/authAndAccount.test.js`, `backend/tests/apartmentApi.integration.js` | **PASS** |
| 3 | **US-017** | 3.1.3 | Sửa hồ sơ cá nhân và đổi mật khẩu | *Given* đã đăng nhập, *When* sửa họ tên hoặc số điện thoại hợp lệ và bấm Lưu, *Then* hồ sơ của chính tài khoản trong JWT đổi; *When* nhập đúng mật khẩu hiện tại và mật khẩu mới $\ge 6$ ký tự, *Then* mật khẩu đổi thành công. | `FTC-33`, `FTC-34`, `ITC-04`, `UTC-06`..`08` | `backend/tests/authAndAccount.test.js`, `backend/tests/residentApi.integration.js` | **PASS** |
| 4 | **US-001** | 3.1.4 | Lưu căn hộ và diện tích | *Given* ở màn hình chính, *When* nhập số phòng chưa trùng và diện tích $> 0\text{ m}^2$ rồi bấm Lưu, *Then* căn hộ xuất hiện trong danh mục; chặn `400` nếu diện tích $\le 0$ và `409` nếu trùng số phòng. | `FTC-01`..`13`, `ITC-01`..`03`, `UTC-09`, `UTC-10` | `backend/tests/apartmentValidation.test.js`, `apartmentService.test.js`, `apartmentHandlers.test.js`, `apartmentApi.integration.js` | **PASS** |
| 5 | **US-002** | 3.1.5 | Lưu chủ hộ và nhân khẩu | *Given* đã chọn một căn hộ, *When* nhập họ tên, ngày sinh không ở tương lai, quan hệ với chủ hộ rồi bấm Thêm, *Then* nhân khẩu gắn với hộ của căn; bắt buộc tạo `Chủ hộ` đầu tiên (`400`) và mỗi căn chỉ có 1 `Chủ hộ` (`409`). | `FTC-14`..`22`, `ITC-05`, `UTC-11`, `UTC-12` | `backend/tests/residentValidation.test.js`, `residentService.test.js`, `residentApi.integration.js` | **PASS** |
| 6 | **US-003** | 3.1.6 | Tìm hộ hoặc nhân khẩu theo số phòng hoặc họ tên | *Given* ở màn hình nhân khẩu, *When* nhập số phòng hoặc họ tên và bấm Tìm, *Then* danh sách chỉ còn hồ sơ khớp kèm lịch sử cư trú, giữ nguyên bộ lọc `activeSearch` khi thao tác. | `FTC-23`, `ITC-05`, `UTC-13` | `backend/tests/residentService.test.js`, `residentApi.integration.js` | **PASS** |
| 7 | **US-004** | 3.1.7 | Ghi tạm trú, tạm vắng, chuyển đi và chuyển đến | *Given* nhân khẩu đã có trong hệ thống, *When* chọn 1 trong 5 trạng thái cư trú, nhập `startDate <= endDate` và xác nhận, *Then* `current_status` của nhân khẩu đổi và bản ghi mới được lưu vào `residency_events` kèm `recorded_by`. | `FTC-24`..`26`, `ITC-05`, `UTC-14` | `backend/tests/residentValidation.test.js`, `residentService.test.js`, `residentApi.integration.js` | **PASS** |
| 8 | **US-005** | 3.1.8 | Xuất danh sách nhân khẩu theo trạng thái cư trú | *Given* đã có nhân khẩu và biến động cư trú, *When* chọn trạng thái và bấm Xuất Excel, *Then* tải về file `.xlsx` chỉ gồm những người có `current_status` khớp, giữ số `0` đầu của phòng `050`; trả `404` nếu không có người khớp. | `FTC-27`..`29`, `ITC-06`, `ITC-07`, `UTC-15`..`17` | `backend/tests/residentExport.test.js`, `residentExportApi.integration.js`, `frontend/tests/api.test.mjs` | **PASS** |

---

## Quy trình chạy kiểm thử hồi quy nhanh

```powershell
# 1. Chạy toàn bộ Functional / Unit Tests ở Backend
cd backend
npm test

# 2. Chạy toàn bộ HTTP API Integration Tests ở Backend
npm run test:e2e

# 3. Chạy kiểm thử lớp gọi API ở Frontend & kiểm tra đóng gói build
cd ../frontend
node --test tests/api.test.mjs
npm run build
```
