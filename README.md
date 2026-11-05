# BlueMoon SE09

Ứng dụng web quản lý thu phí chung cư, xây dựng bằng JavaScript với React/Vite, Express và MySQL.

## Phạm vi hiện tại

- **US-001:** Lưu căn hộ và diện tích (m²) tại màn hình chính, làm cơ sở lưu nhân khẩu (US-002) và tính phí dịch vụ/quản lý (US-008).
- **US-015:** Quản trị viên cấp và quản lý tài khoản thành viên BQT.
- **US-016:** Đăng nhập bằng tài khoản được cấp; API và trang nghiệp vụ yêu cầu xác thực.
- **US-017:** Thành viên cập nhật hồ sơ của mình và đổi mật khẩu sau khi xác minh mật khẩu hiện tại.

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
  services/     Nghiệp vụ US-015–US-017
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

Tất cả request/response dùng JSON, ngoại trừ endpoint health check. Các endpoint được proxy qua Vite trong môi trường phát triển.

| Method | Endpoint | Quyền | Dữ liệu gửi lên |
|---|---|---|---|
| `GET` | `/api/health` | Công khai | Không có; kiểm tra backend còn hoạt động |
| `POST` | `/api/auth/login` | Công khai | `username`, `password`; trả token và thông tin user |
| `GET` | `/api/auth/me` | Đã đăng nhập | Không có; trả user của token hiện tại |
| `PATCH` | `/api/auth/profile` | Đã đăng nhập | `fullName`, `phone` |
| `POST` | `/api/auth/password` | Đã đăng nhập | `currentPassword`, `newPassword` |
| `POST` | `/api/accounts` | ADMIN | `username`, `fullName`, `password` |
| `GET` | `/api/accounts` | ADMIN | Không có; trả danh sách tài khoản |
| `DELETE` | `/api/accounts/:id` | ADMIN | ID tài khoản nằm trên URL |
| `GET` | `/api/apartments` | Đã đăng nhập | Không có; trả danh mục căn hộ (US-001) |
| `POST` | `/api/apartments` | Đã đăng nhập | `roomNumber`, `area`; lưu căn hộ mới (US-001) |

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

   Mỗi thành viên dùng file `.env` riêng vì thông tin MySQL có thể khác nhau. Không commit hoặc gửi mật khẩu lên Git. Khi backend khởi động, migration tự tạo/cập nhật bảng `users`; không cần tự tạo bảng bằng tay.

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

Tài khoản ADMIN mẫu là `admin` / `admin123` nếu dùng giá trị mặc định trong `.env.example`. Đổi mật khẩu mẫu trước khi seed nếu cần. Seed chỉ tạo tài khoản nếu username chưa tồn tại; thay `ADMIN_PASSWORD` rồi chạy seed lại sẽ **không** đổi mật khẩu tài khoản đã có.

## Một số lỗi thường gặp

- **`Cannot find path ...\backend\backend`**: terminal đang ở trong `backend` rồi. Chạy `npm run seed` hoặc `npm run dev` ngay tại đó; nếu muốn về project root thì chạy `cd ..`.
- **`Cannot find path ...\backend\frontend`**: tương tự, terminal còn đứng trong `backend`; để sang frontend chạy `cd ..\frontend`, hoặc mở terminal mới tại project root rồi chạy `cd frontend`.
- **`ECONNREFUSED 127.0.0.1:3306`**: MySQL Server chưa chạy, sai `DB_PORT`, hoặc `DB_HOST` không trỏ tới máy MySQL.
- **Lỗi xác thực MySQL (`Access denied`)**: kiểm tra `DB_USER` và `DB_PASSWORD` trong `backend/.env`.
- **Frontend mở được nhưng API lỗi**: kiểm tra backend vẫn đang chạy, `/api/health` trả `{"ok":true}`, và MySQL kết nối được.
- **Port 5174 đang được dùng**: đóng Vite cũ trước khi chạy `npm run dev` lần nữa. Chỉ chạy một frontend dev server trên port này.

## Lệnh kiểm tra code

Kiểm tra backend (validation, service, handler, API unit tests):

```powershell
cd backend
npm test
```

Kiểm tra frontend:

```powershell
cd frontend
npm run lint
npm run build
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
