# Hướng dẫn cài đặt BlueMoon SE09

BlueMoon SE09 là ứng dụng web quản lý chung cư, dùng React/Vite ở frontend, Express ở backend và MySQL để lưu dữ liệu. Nếu bạn mới kéo mã nguồn về và muốn tự chạy trên máy cá nhân, làm lần lượt các bước dưới đây là được.

## Cần chuẩn bị trước

Trên máy cần có sẵn hai thứ:

- Node.js (nên dùng từ bản 20 trở lên; cài Node.js là có luôn `npm`).
- MySQL Server đang chạy ở local, có tài khoản đủ quyền tạo database mới.

## Bước 1: Tạo database rỗng

Mở MySQL (qua MySQL Workbench, terminal `mysql` hoặc công cụ bạn hay dùng) rồi chạy câu lệnh sau:

```sql
CREATE DATABASE IF NOT EXISTS bluemoon_se09 CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

Chỉ cần tạo database rỗng là đủ, không cần tạo bảng bằng tay. Lúc chạy seed hoặc khởi động backend, code sẽ tự tạo 5 bảng (`users`, `apartments`, `households`, `residents`, `residency_events`).

## Bước 2: Tạo file cấu hình cho backend

Mở terminal tại thư mục gốc của dự án (`IT3180_2026.1_Nhom9`) rồi copy file mẫu thành `backend/.env`:

Trên Windows (PowerShell):

```powershell
Copy-Item backend/.env.example backend/.env
```

Trên macOS / Linux (hoặc Git Bash):

```bash
cp backend/.env.example backend/.env
```

Mở `backend/.env` lên và chỉnh lại các biến cho khớp với máy của bạn:

| Biến | Ý nghĩa | Giá trị mẫu |
| --- | --- | --- |
| `PORT` | Cổng chạy backend | `3001` |
| `DB_HOST` | Địa chỉ máy chủ MySQL | `127.0.0.1` |
| `DB_PORT` | Cổng MySQL | `3306` |
| `DB_USER` | Tài khoản MySQL của bạn | `root` |
| `DB_PASSWORD` | Mật khẩu MySQL của bạn | Điền mật khẩu đã đặt lúc cài MySQL |
| `DB_NAME` | Tên database vừa tạo ở bước 1 | `bluemoon_se09` |
| `JWT_SECRET` | Chuỗi bí mật để ký token đăng nhập | Đổi thành một chuỗi ngẫu nhiên bất kỳ |
| `DEBUG` | In thêm log debug ra terminal hay không | `true` hoặc `false` |
| `ADMIN_USERNAME` | Tên đăng nhập tài khoản quản trị ban đầu | `admin` |
| `ADMIN_PASSWORD` | Mật khẩu tài khoản quản trị ban đầu | `admin123` |
| `ADMIN_FULL_NAME` | Tên hiển thị của quản trị viên | `Quản trị viên SE09` |

File `.env` là cấu hình riêng của từng máy (mỗi người đặt mật khẩu MySQL khác nhau), nên đừng commit file này lên Git.

## Bước 3: Cài thư viện, tạo tài khoản admin và chạy backend

Ở cửa sổ terminal thứ nhất (đang đứng tại `IT3180_2026.1_Nhom9`), chạy lần lượt:

```bash
cd backend
npm ci
npm run seed
npm run dev
```

Nếu mọi thứ ổn, terminal sẽ báo `BlueMoon SE09 API http://127.0.0.1:3001`. Bạn có thể mở trình duyệt vào `http://127.0.0.1:3001/api/health`, thấy trả về `{"ok":true}` là backend đã chạy bình thường.

Một điểm cần biết về `npm run seed`: ngoài tài khoản quản trị `admin` / `admin123`, script còn tự động khởi tạo bộ dữ liệu mẫu thực tế gồm tài khoản BQT (`bqt01` / `123456`), tài khoản cư dân đã duyệt (`cudan050` / `123456`), tài khoản cư dân chờ duyệt (`cudan102` / `123456`), 6 căn hộ mẫu và 10 nhân khẩu có đủ CCCD cùng lịch sử cư trú để bạn kiểm thử ngay. Script chạy an toàn nhiều lần (chỉ tạo mới nếu dữ liệu chưa tồn tại).

## Bước 4: Cài thư viện và chạy frontend

Giữ nguyên cửa sổ terminal backend đang chạy. Mở thêm một cửa sổ terminal thứ hai tại thư mục gốc `IT3180_2026.1_Nhom9` rồi chạy:

```bash
cd frontend
npm ci
npm run dev
```

Frontend sẽ chạy tại `http://localhost:5174` và tự chuyển tiếp các yêu cầu `/api` sang backend ở cổng `3001`. Nhớ giữ cả hai cửa sổ terminal mở trong lúc dùng web.

## Vài lỗi hay gặp lúc cài

- Gặp `ECONNREFUSED 127.0.0.1:3306` nghĩa là MySQL chưa bật, hoặc trên máy bạn MySQL đang chạy ở cổng khác `3306`. Kiểm tra lại service MySQL và biến `DB_PORT` trong `backend/.env`.
- Gặp `Access denied for user ...` thì xem lại `DB_USER` và `DB_PASSWORD` trong `backend/.env` đã gõ đúng chưa.
- Nếu terminal báo không tìm thấy đường dẫn `backend/backend` hoặc `backend/frontend`, khả năng cao bạn đang đứng sẵn trong thư mục `backend` rồi. Gõ `cd ..` để lùi về thư mục gốc trước, hoặc mở cửa sổ terminal mới.
- Nếu Vite báo cổng `5174` đang bị chiếm, đừng tìm cách đổi cổng vội vì cấu hình đang khóa cứng cổng này (`strictPort: true`). Tắt bản Vite cũ đang chạy ngầm đi rồi chạy lại `npm run dev`.
- Trường hợp mở được trang web nhưng bấm đăng nhập hay tải dữ liệu đều báo lỗi, quay lại kiểm tra terminal backend xem có bị tắt hoặc mất kết nối MySQL không, rồi thử mở `http://127.0.0.1:3001/api/health`.

## Kiểm tra nhanh sau khi cài (tùy chọn)

Nếu muốn chạy thử bộ test có sẵn để chắc chắn môi trường không có vấn đề gì:

Kiểm tra backend (đứng trong thư mục `backend`):

```bash
npm test
npm run test:e2e
```

Kiểm tra frontend (đứng trong thư mục `frontend`):

```bash
npm run lint
npm run build
node --test tests/*.test.mjs
```

Cài xong và chạy được web rồi thì bạn xem tiếp cách thao tác từng màn hình trong [huong-dan-su-dung.md](./huong-dan-su-dung.md).
