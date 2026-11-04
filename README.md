# BlueMoon SE09 — lát US-015 / US-016 (4/11/2026)

Phần mềm quản lý thu phí chung cư BlueMoon, nhóm SE09. **Hôm nay chỉ tài khoản và đăng nhập.** Không phải bản v1.0 đầy đủ.

 React (Vite :5174) + Express (:3001) + MySQL `bluemoon_se09`.

## Chạy local

Tài khoản quản trị seed: `admin` / `admin123`

## AC lát này

- US-015: Admin cấp tên đăng nhập chưa trùng, họ tên, mật khẩu khởi tạo → người đó đăng nhập được. Tên chưa cấp không vào màn hình nghiệp vụ.
- US-016: Đúng TK/MK → màn hình chính. Sai → ở login + lỗi. Chưa đăng nhập thì `/apartments`, `/residents`, `/fees`, `/reports` đẩy về login.

Cư dân không có tài khoản. Không có form đăng ký công khai.
