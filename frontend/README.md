# BlueMoon frontend

Frontend JavaScript dùng React, React Router và Vite. Cấu trúc màn hình nằm trong `src/pages`, layout sau đăng nhập trong `src/layouts`, trạng thái đăng nhập trong `src/contexts`, và HTTP client trong `src/services`.

## Chạy local

```powershell
npm ci
npm run dev
```

Vite chạy tại `http://localhost:5174`. Cấu hình dev server chuyển tiếp các request `/api` đến `http://127.0.0.1:3001`; cần khởi động backend trước để dùng chức năng đăng nhập và hồ sơ.

## Lệnh hữu ích

- `npm run build` tạo bản build production trong `dist/`.
- `npm run lint` chạy Oxlint.
