# BlueMoon SE09

Ứng dụng web quản lý cư trú, tài khoản và thu phí chung cư BlueMoon, xây dựng bằng JavaScript với React/Vite, Express và MySQL.

## Tổng hợp và kế hoạch tiếp theo

- [Bắt đầu từ đây — thứ tự đọc và tài liệu theo vai trò](docs/README.md).
- [Quy trình nhận task, review và bàn giao](CONTRIBUTING.md).
- [Tổng hợp trạng thái dự án, review, sửa lỗi và lộ trình](docs/project-summary-and-roadmap.md).
- [Kế hoạch triển khai Sprint 2 — 12 task, phân công và tiêu chí Done](docs/sprint2-implementation-plan.md).
- [Bộ thiết kế giao diện mới và hướng dẫn nhập Figma](design/bluemoon-ui-redesign/README.md) — bản đề xuất, chưa áp vào frontend.

Lưu ý: số test S1 trong báo cáo nền cần được chạy lại và cập nhật sau các sửa gần nhất. Lần xác minh hồi quy gần nhất chỉ chạy 26 test liên quan, không phải toàn bộ bộ kiểm thử. Sprint 2 hiện ở trạng thái kế hoạch.

> **Phạm vi nghiệm thu hiện tại (Sprint 1):** Hoàn thiện nền tảng **quản lý danh mục căn hộ, hộ gia đình & biến động nhân khẩu, xuất báo cáo Excel nhân khẩu và quản lý tài khoản/xác thực phân quyền** (`8/8 Must User Stories`: `US-001`..`005`, `US-015`..`017`). Phân hệ trung tâm về **bảng thu phí định kỳ, ghi nhận thanh toán, công nợ, quỹ tự nguyện và báo cáo thu** (`11 User Stories`: `US-006`..`014`, `US-018`..`019`) thuộc phạm vi **Sprint 2** và đã được thiết kế chi tiết tại [`docs/sprint2-technical-base.md`](docs/sprint2-technical-base.md) (hai module `backend/strategies/feeCalculationStrategy.js` và `backend/observers/domainEventBus.js` là khung nền tảng chuẩn bị cho Sprint 2).

## Phạm vi hiện tại

- **US-001:** Lưu, sửa nhanh tại chỗ (inline), xóa căn hộ trống và mở xem nhân khẩu trực tiếp theo từng căn hộ và diện tích (m²) tại màn hình Căn hộ, làm cơ sở lưu nhân khẩu (US-002) và tính phí dịch vụ/quản lý (US-008).
- **US-002:** Lưu, sửa nhanh tại chỗ, xóa nhân khẩu nhập nhầm (kèm CCCD/CMND) và đổi chủ hộ có bước xác nhận rõ người cũ → người mới theo từng căn hộ.
- **US-003:** Tìm hồ sơ hộ/nhân khẩu theo số phòng hoặc họ tên (hỗ trợ lọc theo căn hộ, trạng thái và tùy chọn tải lịch sử).
- **US-004:** Ghi tình trạng tạm trú, tạm vắng, chuyển đi, chuyển đến theo ngày hiệu lực (cho phép để trống ngày kết thúc với trạng thái chưa biết thời điểm kết thúc; sự kiện tương lai hoặc quá khứ không ghi đè sai trạng thái hiện tại; tự động thu hồi quyền truy cập hộ cũ khi cư dân `"Chuyển đi"`).
- **US-005:** Xuất file Excel danh sách nhân khẩu theo trạng thái cư trú hiện tại, đồng bộ với từ khóa tìm kiếm đang lọc.
- **US-015:** Quản trị viên cấp, đặt lại mật khẩu tạm ngẫu nhiên (kèm thu hồi phiên cũ `token_version` và yêu cầu đổi mật khẩu lần đăng nhập kế tiếp) cho tài khoản thành viên BQT; hỗ trợ Cư dân tự đăng ký tài khoản chờ BQT phê duyệt và xem thông tin hộ gia đình của mình (che bảo mật CCCD của các thành viên khác từ API).
- **US-016:** Đăng nhập bằng tài khoản được cấp (bắt buộc cấu hình `JWT_SECRET` khi khởi động server, khóa tạm 5 phút khi đăng nhập sai 5 lần liên tiếp chống brute-force); API và trang nghiệp vụ yêu cầu xác thực.
- **US-017:** Thành viên cập nhật hồ sơ của mình và đổi mật khẩu sau khi xác minh mật khẩu hiện tại (tự động tăng `token_version` để thu hồi mọi token phiên cũ).

## Kiến trúc và công nghệ

Dự án dùng kiến trúc **client–server**. Frontend React là client; backend Express là server cung cấp REST API và trao đổi dữ liệu JSON. Frontend không render từ template của Express.

```text
Trình duyệt (React/Vite)
        │ HTTP + JSON (/api)
        ▼
Server (Express)
  API routes → middlewares → handlers → services → repositories
                                      │
                                      ▼
                                 MySQL database
```

- **Client:** hiển thị trang, điều hướng và gửi request qua `frontend/src/services/api.js`.
- **Server:** nhận request tại API routes, xác thực/phân quyền bằng middleware, xử lý HTTP ở handlers, nghiệp vụ ở services và truy vấn dữ liệu qua repositories.
- **Database:** MySQL được truy cập từ backend; frontend không kết nối trực tiếp tới database.
- Khi chạy phát triển, Vite proxy `/api` sang Express. Khi triển khai, trình duyệt vẫn gọi API của server; hai phần có thể được host riêng.

Backend được chia theo luồng API và nghiệp vụ, không tổ chức theo MVC.

| Phần | Công nghệ | Vai trò |
|---|---|---|
| Frontend | JavaScript, React, React Router, Vite | Giao diện, điều hướng và gọi API |
| Backend | JavaScript, Node.js, Express | REST API, xác thực, nghiệp vụ |
| Database | MySQL, `mysql2` | Lưu tài khoản, hồ sơ người dùng và danh mục căn hộ |
| Bảo mật đăng nhập | JWT, `bcrypt` | Token phiên đăng nhập và băm mật khẩu |

## Cấu trúc

```text
backend/
  api/
    routes/     Khai báo REST API endpoints
    handlers/   Nhận request và trả response JSON
  config/       Cấu hình database và migration
  helpers/      Hàm dùng chung
  middlewares/  Xác thực và phân quyền
  repositories/ Truy vấn và ánh xạ dữ liệu MySQL
  services/     Nghiệp vụ US-001–US-004 và US-015–US-017
  validators/   Kiểm tra dữ liệu đầu vào
  app.js        Khởi tạo Express và gắn routes
  index.js      Migration và khởi động HTTP server
  seed.js       Tạo tài khoản quản trị ban đầu
frontend/
  public/       Tài nguyên tĩnh, hiện có favicon.svg
  src/
    contexts/   Trạng thái và hàm xác thực dùng chung
    layouts/    Khung ứng dụng sau đăng nhập
    pages/      Các màn hình
    services/   Gọi API
    styles/     CSS toàn cục
    App.jsx     Khai báo route và quyền truy cập
    main.jsx    Điểm khởi chạy React
```

## API hiện tại

Các API dùng JSON, ngoại trừ phản hồi xuất Excel là dữ liệu nhị phân `.xlsx`. Các endpoint được proxy qua Vite trong môi trường phát triển.

| Method | Endpoint | Quyền | Dữ liệu gửi lên |
|---|---|---|---|
| `GET` | `/api/health` | Công khai | Không có; kiểm tra backend còn hoạt động |
| `POST` | `/api/auth/login` | Công khai | `username`, `password`; trả token và thông tin user (khóa tạm 5 phút nếu sai 5 lần) |
| `POST` | `/api/auth/register-resident` | Công khai | `roomNumber`, `fullName`, `username`, `password`; cư dân tự gửi yêu cầu tạo tài khoản (`PENDING`) |
| `GET` | `/api/auth/me` | Đã đăng nhập | Không có; trả user của token hiện tại |
| `GET` | `/api/auth/residence` | RESIDENT | Không có; trả thông tin căn hộ, danh sách thành viên đang cư trú (che bảo mật CCCD thành viên khác) và lịch sử cư trú; chặn `403` nếu cư dân đã `"Chuyển đi"` |
| `PATCH` | `/api/auth/profile` | ADMIN / BQT | `fullName`, `phone` |
| `POST` | `/api/auth/password` | Đã đăng nhập | `currentPassword`, `newPassword`; đổi mật khẩu, thu hồi các token phiên cũ và cấp token mới |
| `POST` | `/api/accounts` | ADMIN | `username`, `fullName`, `password` |
| `GET` | `/api/accounts` | ADMIN | Không có; trả danh sách tài khoản BQT/ADMIN |
| `POST` | `/api/accounts/:id/reset-password` | ADMIN | Cấp mật khẩu tạm thời ngẫu nhiên, thu hồi phiên cũ, mở khóa tạm và bật cờ yêu cầu đổi mật khẩu |
| `DELETE` | `/api/accounts/:id` | ADMIN | ID tài khoản nằm trên URL |
| `GET` | `/api/resident-accounts/candidates` | ADMIN / BQT | Danh sách nhân khẩu đang cư trú chưa có tài khoản cư dân |
| `GET` | `/api/resident-accounts` | ADMIN / BQT | Danh sách tài khoản cư dân (`PENDING` chờ duyệt & `ACTIVE` đang hoạt động) |
| `POST` | `/api/resident-accounts` | ADMIN / BQT | `residentId`, `username`, `password`; BQT chủ động cấp ngay tài khoản cư dân (`ACTIVE`) |
| `PATCH` | `/api/resident-accounts/:id/approve` | ADMIN / BQT | Duyệt yêu cầu đăng ký tài khoản cư dân (`PENDING` -> `ACTIVE`) |
| `POST` | `/api/resident-accounts/:id/reset-password` | ADMIN / BQT | Cấp mật khẩu tạm thời ngẫu nhiên cho tài khoản cư dân, thu hồi phiên cũ và yêu cầu đổi mật khẩu |
| `DELETE` | `/api/resident-accounts/:id` | ADMIN / BQT | Xóa hoặc từ chối tài khoản cư dân |
| `GET` | `/api/apartments` | ADMIN / BQT | Không có; trả danh mục căn hộ (US-001) |
| `POST` | `/api/apartments` | ADMIN / BQT | `roomNumber`, `area`; lưu căn hộ mới (US-001) |
| `PUT` | `/api/apartments/:id` | ADMIN / BQT | `roomNumber`, `area`; sửa nhanh số phòng hoặc diện tích căn hộ (US-001) |
| `DELETE` | `/api/apartments/:id` | ADMIN / BQT | Xóa căn hộ tạo nhầm khi căn hộ chưa có nhân khẩu nào (US-001) |
| `GET` | `/api/residents?search=` | ADMIN / BQT | Tùy chọn `search`; tìm theo số phòng hoặc họ tên (US-003), kèm CCCD và lịch sử cư trú |
| `GET` | `/api/residents/export?status=` | ADMIN / BQT | Bắt buộc `status` thuộc một trong năm trạng thái cư trú; trả file `.xlsx` (US-005) |
| `POST` | `/api/residents` | ADMIN / BQT | `apartmentId`, `fullName`, `birthDate`, `cccd`, `relationship`; lưu chủ hộ/nhân khẩu (US-002) |
| `PUT` | `/api/residents/:id` | ADMIN / BQT | `fullName`, `birthDate`, `cccd`, `relationship`; sửa thông tin nhân khẩu hoặc chuyển quyền Chủ hộ (US-002) |
| `DELETE` | `/api/residents/:id` | ADMIN / BQT | Xóa nhân khẩu nhập thừa (chặn xóa Chủ hộ nếu trong hộ vẫn còn thành viên khác) (US-002) |
| `POST` | `/api/residents/:id/residency-events` | ADMIN / BQT | `status`, `startDate`, `endDate`; cập nhật trạng thái và lưu lịch sử (US-004) |

Frontend gửi JWT trong header `Authorization: Bearer <token>` cho API cần đăng nhập. Backend luôn tự kiểm tra token và role; ẩn route ở frontend chỉ nhằm điều hướng giao diện, không thay thế kiểm tra quyền phía server.

## Cài đặt và chạy local

Yêu cầu Node.js/npm, MySQL Server và quyền tạo database. MySQL phải đang chạy trước khi khởi động backend.

Các lệnh dưới đây giả định terminal bắt đầu tại thư mục gốc `IT3180_2026.1_Nhom9`. Chạy backend và frontend trong **hai terminal riêng** để cả hai server cùng hoạt động.

1. Tạo database trong MySQL:

   ```sql
   CREATE DATABASE IF NOT EXISTS bluemoon_se09 CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
   ```

2. Nếu chưa có file `backend/.env`, tạo file cấu hình cá nhân từ mẫu:

   ```powershell
   Copy-Item backend/.env.example backend/.env
   ```

   Chỉnh các biến phù hợp trong `backend/.env`:

   | Biến | Ý nghĩa | Giá trị mẫu |
   |---|---|---|
   | `PORT` | Port backend | `3001` |
   | `DB_HOST` | Máy chạy MySQL | `127.0.0.1` |
   | `DB_PORT` | Port MySQL | `3306` |
   | `DB_USER` | User MySQL trên máy của thành viên | `root` |
   | `DB_PASSWORD` | Mật khẩu MySQL của thành viên | Điền mật khẩu đã đặt |
   | `DB_NAME` | Database project | `bluemoon_se09` |
   | `JWT_SECRET` | Khóa ký token local | Đổi thành chuỗi riêng, đủ khó đoán |
   | `DEBUG` | Bật/tắt log debug | `true` hoặc `false` |
   | `ADMIN_USERNAME`, `ADMIN_PASSWORD`, `ADMIN_FULL_NAME` | Thông tin ADMIN tạo bởi seed | `admin`, `admin123`, `Quản trị viên SE09` |

   Mỗi thành viên dùng file `.env` riêng vì thông tin MySQL có thể khác nhau. Không commit hoặc gửi mật khẩu lên Git. Khi backend khởi động, migration tự tạo/cập nhật các bảng `users`, `apartments`, `households`, `residents` và `residency_events`; không cần tự tạo bảng bằng tay.

3. Trong terminal thứ nhất, cài dependency, tạo tài khoản admin mẫu và chạy backend:

   ```powershell
   cd backend
   npm ci
   npm run seed
   npm run dev
   ```

   API chạy tại `http://127.0.0.1:3001`; endpoint kiểm tra là `http://127.0.0.1:3001/api/health`. Giữ terminal này mở trong lúc sử dụng web.

4. Trong terminal thứ hai, mở lại thư mục gốc project, cài dependency và chạy frontend:

   ```powershell
   cd frontend
   npm ci
   npm run dev
   ```

   Vite chạy tại `http://localhost:5174` và proxy `/api` sang backend. Giữ terminal này mở và truy cập địa chỉ đó để dùng web.

Tài khoản mẫu được tạo sẵn bởi `npm run seed`:
- **ADMIN:** `admin` / `admin123` (nếu dùng giá trị mặc định trong `.env.example`).
- **Thành viên BQT:** `bqt01` / `123456`, `bqt02` / `123456`.
- **Cư dân đã duyệt (`ACTIVE`):** `cudan050` / `123456` (Chủ hộ phòng `050`).
- **Cư dân chờ duyệt (`PENDING`):** `cudan102` / `123456` (Chủ hộ phòng `102` — dùng để demo BQT bấm duyệt 1-click).
- Kèm theo **6 căn hộ mẫu** (`050`, `101`, `102`, `201`, `202`, `301`) và **10 nhân khẩu mẫu** có sẵn số CCCD và lịch sử biến động cư trú (`Thường trú`, `Tạm trú`, `Tạm vắng`, `Chuyển đi`).

## Một số lỗi thường gặp

- **`Cannot find path ...\backend\backend`**: terminal đang ở trong `backend` rồi. Chạy `npm run seed` hoặc `npm run dev` ngay tại đó; nếu muốn về project root thì chạy `cd ..`.
- **`Cannot find path ...\backend\frontend`**: tương tự, terminal còn đứng trong `backend`; để sang frontend chạy `cd ..\frontend`, hoặc mở terminal mới tại project root rồi chạy `cd frontend`.
- **`ECONNREFUSED 127.0.0.1:3306`**: MySQL Server chưa chạy, sai `DB_PORT`, hoặc `DB_HOST` không trỏ tới máy MySQL.
- **Lỗi xác thực MySQL (`Access denied`)**: kiểm tra `DB_USER` và `DB_PASSWORD` trong `backend/.env`.
- **Frontend mở được nhưng API lỗi**: kiểm tra backend vẫn đang chạy, `/api/health` trả `{"ok":true}`, và MySQL kết nối được.
- **Port 5174 đang được dùng**: đóng Vite cũ trước khi chạy `npm run dev` lần nữa. Chỉ chạy một frontend dev server trên port này.

## Lệnh kiểm tra code

Kiểm tra backend unit (validation, service và handler):

```powershell
cd backend
npm test
```

Chạy API integration tests:

```powershell
npm run test:e2e
```

Bộ kiểm thử tự động hiện có **58/58 test cases đạt 100% PASS** (50 backend unit/functional tests + 7 backend HTTP integration tests + 1 frontend API client test), bao phủ toàn bộ 8/8 User Stories của Sprint 1 (`US-001`..`005`, `US-015`..`017`) cùng các quy tắc bảo mật `JWT_SECRET`, thu hồi phiên cũ `token_version`, reset mật khẩu tạm ngẫu nhiên, thu hồi quyền xem hộ khi chuyển đi, tính trạng thái cư trú động theo ngày hiệu lực và lọc chính xác theo `apartmentId`. *(Lưu ý: các test tự động trong `backend/tests` sử dụng mock database để chạy độc lập; việc kiểm chứng kết nối MySQL thực tế và giao diện trình duyệt được thực hiện qua `npm run seed` và kịch bản demo dưới đây).*

Kiểm tra frontend:

```powershell
cd frontend
npm run lint
npm run build
node --test tests/api.test.mjs
```

`npm run build` tạo output production trong `frontend/dist/`; đây là file sinh tự động, không chỉnh sửa thủ công.

## Kịch bản kiểm thử Demo Sprint 1 (US-001: Lưu căn hộ và diện tích)

1. **Khởi động hệ thống:**
   - Đảm bảo MySQL đang chạy và database `bluemoon_se09` đã được tạo.
   - Chạy `npm run dev` ở backend (`http://127.0.0.1:3001`). Migration tự động tạo bảng `apartments` nếu chưa có.
   - Chạy `npm run dev` ở frontend (`http://localhost:5174`).
2. **Đăng nhập:**
   - Mở trình duyệt tại `http://localhost:5174/login`.
   - Đăng nhập bằng tài khoản `admin` / `admin123` (hoặc tài khoản BQT đã được cấp).
   - Hệ thống tự chuyển vào **Màn hình chính**.
3. **Thêm căn hộ mẫu Sprint 1:**
   - Tại form "Lưu căn hộ và diện tích":
     + Số phòng: nhập `050`
     + Diện tích (m²): nhập `60`
     + Bấm nút **Lưu**.
   - **Kết quả nghiệm thu:**
     + Xuất hiện thông báo: `Đã lưu căn hộ 050 (60 m²).`
     + Căn hộ `050` với diện tích `60 m²` xuất hiện ngay lập tức trong bảng "Danh mục căn hộ" phía dưới.
     + Form nhập được reset về trạng thái trống.
     + Dữ liệu được lưu bền vững vào bảng `apartments` trong MySQL.
4. **Kiểm tra chống trùng lặp (Validation Unique):**
   - Tiếp tục nhập lại Số phòng `050` với diện tích `60` và bấm **Lưu**.
   - **Kết quả nghiệm thu:** Hệ thống báo lỗi `Số phòng "050" đã tồn tại trong danh mục.` và không cho phép ghi đè.
5. **Kiểm tra ràng buộc diện tích:**
   - Nhập Số phòng `101` với diện tích `0` hoặc `-10` -> Báo lỗi `Diện tích căn hộ bắt buộc phải là số lớn hơn 0 m².` (không dùng diện tích 450 m² của toàn khu đất).

## Kịch bản demo hộ và nhân khẩu (US-002–US-004)

1. Đăng nhập bằng tài khoản BQT và mở mục **Hộ và nhân khẩu**.
2. Chọn căn hộ đã được lưu ở US-001, nhập họ tên/ngày sinh và chọn quan hệ **Chủ hộ** để tạo hồ sơ hộ.
3. Thêm một hoặc nhiều nhân khẩu vào cùng căn hộ bằng quan hệ với chủ hộ. Mỗi căn hộ chỉ có một chủ hộ; cần tạo chủ hộ trước nhân khẩu khác.
4. Tìm theo số phòng hoặc họ tên; danh sách chỉ hiện các nhân khẩu có thông tin khớp. Mỗi dòng hiển thị căn hộ, họ tên, ngày sinh, quan hệ và trạng thái hiện tại.
5. Chọn **Cập nhật trạng thái**, chọn một trong các trạng thái thường trú/tạm trú/tạm vắng/chuyển đến/chuyển đi, nhập ngày bắt đầu và ngày kết thúc rồi xác nhận.
6. Kiểm tra trạng thái hiện tại đã đổi và phần **Lịch sử** lưu lại trạng thái cùng khoảng ngày vừa nhập.

## Kịch bản xuất Excel nhân khẩu (US-005 / WBS 3.1.8)

1. Chạy `npm ci` trong `backend` sau khi lấy nhánh này để cài thêm ExcelJS, rồi khởi động lại backend.
2. Đăng nhập, mở **Hộ và nhân khẩu**. Chuẩn bị nhân khẩu thuộc ít nhất hai trạng thái khác nhau.
3. Trong **Xuất danh sách nhân khẩu**, chọn trạng thái rồi bấm **Xuất Excel**.
4. Mở file `.xlsx`: kiểm tra STT, căn hộ, họ tên, ngày sinh, quan hệ với chủ hộ và trạng thái. Chỉ những người có trạng thái hiện tại khớp lựa chọn được xuất, mỗi người một dòng; lịch sử không tạo thêm dòng.
5. Số phòng như `050` giữ nguyên số 0 đầu, ngày sinh hiển thị `dd/mm/yyyy`, tên tiếng Việt không lỗi dấu.
6. Đổi trạng thái của một nhân khẩu bằng US-004 rồi xuất lại: người đó chỉ xuất hiện trong danh sách trạng thái mới.
7. Chọn trạng thái không có người: giao diện báo không có nhân khẩu phù hợp, không tải file rỗng. Khi đang lọc theo số phòng hoặc từ khóa tìm kiếm trên bảng, file Excel xuất ra sẽ đồng bộ theo bộ lọc đang xem (hoặc xuất toàn bộ theo trạng thái nếu không nhập bộ lọc).

API yêu cầu đăng nhập, trả `400` nếu trạng thái thiếu/sai và `404` nếu không có kết quả. Căn hộ được lấy từ liên kết hồ sơ hiện có, kể cả người có trạng thái **Chuyển đi**; US-005 không thay đổi cách lưu căn hộ của US-004.
