# BlueMoon — Đề xuất thiết kế giao diện

## Trạng thái bàn giao

Ngày thiết kế: 28/11/2026. Đây là bản thiết kế đề xuất, chưa thay đổi frontend đang chạy.

**Bộ tổng hợp Sprint 1 + Sprint 2:** [Xem mục lục chung](DESIGN-OVERVIEW.md). Gói `bluemoon-sprint1-sprint2-design.zip` gồm gallery offline, toàn bộ 43 SVG, manifest và hướng dẫn. Gallery chia 8 board S1, 34 board S2 và 1 phác thảo cũ.

**Đã mở rộng đầy đủ phạm vi thiết kế Sprint 2:** 34 board mới (`10`–`43`) phủ cả 11 User Story S2, cộng 9 board ban đầu thành **43 board**. Xem [bản đồ màn hình Sprint 2](SPRINT2-DESIGN.md). Một số nút chính trong SVG có thể bấm chuyển bước ở gallery HTML; đây là prototype điều hướng bằng dữ liệu mẫu, không có giao dịch, dữ liệu lưu hay API thật.

Figma đã tạo file `BlueMoon · Quản lý chung cư — UI Redesign`, nhưng tài khoản Starter hết hạn mức MCP ngay sau đó nên không thể ghi các màn hình vào file. Bộ SVG trong thư mục `figma-import` là phương án bàn giao thay thế; không phải file Figma native có Auto Layout, component hay prototype đã được liên kết.

## Xem và nhập Figma

1. Mở `index.html` bằng trình duyệt hoặc vào `http://localhost:5175` khi server xem trước còn chạy.
2. Chọn từng màn hình ở thanh bên hoặc mở `http://localhost:5175/#12-bang-thu`. Bấm “Thu tiền” → “Kiểm tra & xác nhận” → “Xác nhận đã thu tiền” để xem luồng mẫu. Các nút in/tải báo cáo bên trong mẫu không thực hiện in/xuất thật; dùng liên kết tải SVG ở ngoài để lấy file thiết kế.
3. Giải nén `bluemoon-figma-import.zip`, kéo các file `.svg` vào trang Design trong Figma.
4. SVG chứa hình vector và chữ, không chứa ảnh chụp giao diện. Cách Figma xử lý chữ phụ thuộc khả năng nhập/font; kiểm tra Segoe UI và tiếng Việt sau khi nhập. Có thể chỉnh nội dung từ SVG nguồn hoặc script rồi tạo lại.
5. Khi công cụ Figma hoạt động trở lại, cần chuyển các mẫu này thành component, biến thiết kế, Auto Layout và prototype thật trước khi coi là bàn giao Figma native hoàn chỉnh.

Gói **`bluemoon-sprint2-figma-import.zip`** chứa riêng 34 board Sprint 2. Gói **`bluemoon-figma-import.zip`** chứa tất cả 43 board. Prototype HTML có các trạng thái độc lập để rà soát; số dư không tự cập nhật xuyên mọi màn hình sau một lần bấm và không cho nhập dữ liệu thật. Không dùng prototype này để kiểm chứng logic tài chính.

## Các màn hình

| File | Mục đích |
|---|---|
| `01-can-ho.svg` | Danh sách căn hộ, tìm nhanh, xem nhân khẩu và sửa tại dòng |
| `02-nhan-khau.svg` | Danh sách cư dân gọn, giữ ngữ cảnh phòng, thao tác cư trú dễ thấy |
| `03-doi-cu-tru.svg` | Hộp thoại đổi cư trú, hiện tên/phòng và trạng thái hiện tại |
| `04-tai-khoan-cu-dan.svg` | Yêu cầu chờ duyệt ưu tiên phía trên, tìm và quản lý tài khoản |
| `05-ho-so-ca-nhan.svg` | Thông tin cá nhân và bảo mật tách thành hai nhóm rõ ràng |
| `06-can-ho-cua-toi.svg` | Cư dân xem thông tin phòng và thành viên gia đình |
| `07-dang-nhap.svg` | Đăng nhập và đường đăng ký cư dân dễ nhận biết |
| `08-thu-phi-sprint-2.svg` | Đề xuất Sprint 2: tra cứu, số tổng hợp và thu tiền tại dòng |
| `09-mobile-cu-dan.svg` | Bản cư dân cho màn hình 390 px, thẻ dễ đọc và điều hướng dưới |

Dữ liệu, số lượng, trạng thái và số tiền là minh họa thiết kế, không phải báo cáo database. Mẫu thu phí không đại diện cho chức năng Sprint 2 đã triển khai. Các vai trò trong mẫu cần được ánh xạ về quyền thực tế khi triển khai, đặc biệt mục Tài khoản BQT chỉ dành cho ADMIN. Mẫu tài khoản BQT và form đăng ký đầy đủ có thể dùng lại khung bảng/form này nhưng chưa có board riêng.

## Nguyên tắc áp dụng vào frontend

- Ưu tiên tìm kiếm và danh sách; chỉ mở biểu mẫu khi cần thêm/sửa.
- Sửa, đổi cư trú, xem nhân khẩu là thao tác thường dùng; xóa/đặt lại mật khẩu nằm ở nhóm hành động phụ và có xác nhận phù hợp.
- Giữ căn hộ, bộ lọc và vị trí cuộn sau lưu. Không giữ dữ liệu cư trú của người trước.
- Ngày theo Việt Nam; lỗi có hướng xử lý; loading/empty/success/error cần được triển khai cùng giao diện.
- Desktop dùng sidebar 224 px, vùng nội dung rộng; mobile dùng thẻ và điều hướng gọn, không thu nhỏ nguyên bảng desktop.
- Màu chính teal `#116A73`, nền `#F5F7FA`, chữ `#172B3A`, chữ phụ `#607486`, đường viền `#E3EAF0`; đỏ dành cho thao tác nguy hiểm, trạng thái có nhãn chữ kèm màu.
- Chữ Segoe UI; nội dung 14–16 px, tiêu đề 24–28 px; trường/nút chính cao 42–50 px. Khi triển khai bổ sung focus rõ, nhãn input, điều hướng bàn phím và kiểm tra độ tương phản.

## Tạo lại các file

Từ project root, chạy `python design/bluemoon-ui-redesign/generate_design.py`. Script chỉ sinh các artifact trong thư mục thiết kế, không sửa frontend/backend.
