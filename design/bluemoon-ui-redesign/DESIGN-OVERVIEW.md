# BlueMoon — Tổng hợp thiết kế Sprint 1 và Sprint 2

## Bộ bàn giao chung

Toàn bộ thiết kế dùng cùng phong cách teal/navy, chữ Segoe UI, nền sáng, tìm kiếm/danh sách làm trung tâm và thao tác chính tại dòng. Có **43 board**, được phân nhóm để tránh nhầm mẫu ban đầu với màn hình hiện hành:

| Nhóm | Số board | Phạm vi |
|---|---:|---|
| Sprint 1 | 8 | Căn hộ, nhân khẩu, hộp thoại cư trú, tài khoản cư dân, hồ sơ, trang cư dân, đăng nhập và cư dân trên điện thoại |
| Sprint 2 | 34 | Đơn giá, preview/bảng thu, thu/xác nhận/biên lai/hủy, công nợ, lịch sử, quỹ, báo cáo, quyền/audit và cư dân xem phí |
| Phác thảo cũ | 1 | `08-thu-phi-sprint-2.svg` được giữ để đối chiếu; dùng board 12 làm bảng thu hiện hành |

Sprint 1 mới có thiết kế cho các màn hình chính, chưa phải từng trạng thái của mọi US; tài khoản BQT/form đăng ký đầy đủ chưa có board S1 riêng. Sprint 2 phủ 11 US ở mức các màn hình và trạng thái chính, không có nghĩa mọi tổ hợp lỗi/breakpoint đã được vẽ.

## Xem chung và nhập Figma

- Mở `index.html`, hoặc `http://localhost:5175/#01-can-ho` khi server còn chạy. Thanh trái chia rõ Sprint 1, Sprint 2 và phác thảo cũ.
- Gói chung: `bluemoon-sprint1-sprint2-design.zip`. Giải nén để xem offline bằng `index.html`; các file SVG nằm trong `figma-import`.
- Trong Figma, tạo các trang `01 — Sprint 1`, `02 — Sprint 2`, `99 — Phác thảo cũ`; kéo các SVG vào trang tương ứng. S1 dùng file 01–07 và 09; S2 dùng 10–43; file 08 thuộc lưu trữ.
- SVG chứa vector và chữ; kiểm tra font/tiếng Việt sau nhập. Bộ này chưa có component, Auto Layout hay liên kết prototype native trong Figma do quota MCP vẫn chặn.

## Các luồng tổng hợp

1. **Quản lý cư dân:** Căn hộ → nhân khẩu → xem/sửa hồ sơ hoặc hộp thoại đổi cư trú.
2. **Chuẩn bị kỳ thu:** Đơn giá → preview → phát hành → bảng thu.
3. **Thu phí:** Bảng thu → chọn phòng/kỳ → nhập tiền → xác nhận → biên lai → lịch sử; thu nhầm có bước hủy và chứng từ ĐÃ HỦY.
4. **Quỹ:** Danh sách đợt → tạo/xem đợt → ghi ủng hộ → biên nhận; có xác nhận đóng đợt và hủy ghi nhầm.
5. **Theo dõi:** Công nợ theo căn/hộ, lịch sử, báo cáo kỳ hóa đơn/tháng thực thu.
6. **Quản trị:** Chọn vai trò → xác nhận; audit có dữ liệu trước/sau/lý do.
7. **Cư dân:** Xem căn hộ/thành viên và phí/giấy báo/biên lai của hộ; có mẫu điện thoại cho S1 và S2.

Các luồng trên mô tả kết nối nghiệp vụ khi triển khai. Gallery cho chọn mọi board, một số nút S2 bấm chuyển bước được; không phải tất cả nút S1 đã được nối. Scene độc lập, không có form nhập thật, tính số dư, gọi API, thu tiền, in hoặc xuất Excel nghiệp vụ. Không dùng bản mẫu để xác minh logic hay quyền truy cập.

## Đọc tiếp

- [Hướng dẫn và quy tắc giao diện chung](README.md).
- [Danh mục 34 board và ánh xạ User Story S2](SPRINT2-DESIGN.md).
- [Tổng hợp dự án và lộ trình](../../docs/project-summary-and-roadmap.md).

Đây là bản thiết kế đề xuất; chưa áp dụng vào frontend đang chạy và chưa được ghi thành file Figma native.
