# Bắt đầu từ đây — Tài liệu nhóm BlueMoon SE09

Cập nhật 28/11/2026. Dành cho thành viên nhận việc, người review và người kiểm thử.

## Đọc trong lần đầu

1. [Tổng quan repo](../README.md): phạm vi S1, kiến trúc, cấu trúc code và cách chạy.
2. [Cài đặt](huong-dan-cai-dat.md): cấu hình DB local, dependency và chạy frontend/backend. Vite hiện ở cổng 5174, proxy API sang 3001; không dùng DB demo cho thử migration.
3. [Tổng hợp hiện trạng](project-summary-and-roadmap.md): phần đã sửa, hạn chế và lộ trình.
4. [Hướng dẫn làm Sprint 2](huong-dan-lam-sprint2.md): thứ tự triển khai và các nguyên tắc dùng chung.
5. [Quyết định cần chốt](sprint2-decisions.md) và [quy trình đóng góp](../CONTRIBUTING.md): xác định điều kiện trước khi nhận task.

S1 có chức năng đang chạy nhưng vẫn cần chạy lại toàn bộ hồi quy để chốt baseline mới. S2 là thiết kế/kế hoạch; có sơ đồ, API đề xuất hoặc màn hình mẫu không có nghĩa tính năng đã triển khai. Kết quả kiểm thử được ghi nhận gần nhất là 26 test liên quan, không phải toàn bộ suite.

## Đọc theo công việc

| Công việc | Tài liệu cần đọc | Sản phẩm bàn giao |
|---|---|---|
| Mọi thành viên | Hướng dẫn S2, decisions, CONTRIBUTING, task được giao trong kế hoạch | Phạm vi task, phụ thuộc, người review và điều kiện Done |
| Backend/DB | [Thiết kế kỹ thuật](sprint2-technical-base.md), [API contract](api-contract-s2.md), [fixture](sprint2-test-data.md) | Migration/service/API, kiểm quyền/audit, test liên quan và hợp đồng đã cập nhật |
| Frontend | API contract, [wireframe S2](wireframes-sprint2-uiux.md), [gallery](../design/bluemoon-ui-redesign/index.html), fixture | UI theo quyền, xử lý lỗi/retry, giữ ngữ cảnh và kiểm responsive |
| Kiểm thử/review | [Test plan S2](test-plan-and-cases-s2.md), fixture, [báo cáo S2](test-report-s2.md) | Kết quả thực thi, log/bằng chứng và lỗi có thể tái hiện |
| Điều phối/đóng sprint | [Backlog](product-vision-and-backlog.md), [kế hoạch T00–T11](sprint2-implementation-plan.md), decisions, báo cáo S2 | Tiến độ có bằng chứng, quyết định còn mở và phạm vi nghiệm thu |

## Nguồn chuẩn và cách xử lý khi lệch

| Thông tin | Nguồn quản lý |
|---|---|
| Phạm vi US và tiêu chí chấp nhận | `product-vision-and-backlog.md` |
| Quy tắc nghiệp vụ đang đề xuất/đã chốt | `sprint2-decisions.md` ghi trạng thái; nội dung chi tiết ở thiết kế kỹ thuật |
| Schema, transaction, ma trận quyền | `sprint2-technical-base.md` |
| HTTP JSON, query và mã lỗi S2 | `api-contract-s2.md` — hiện là draft, cần chốt ở task liên quan |
| Task, phụ thuộc và Definition of Done | `sprint2-implementation-plan.md` |
| Dữ liệu thử/kết quả mong đợi | `sprint2-test-data.md` |
| Kết quả thực tế | `test-report-s1.md`, `test-report-s2.md`; không lấy số ca kế hoạch làm số PASS |
| Lịch sử thay đổi | [CHANGELOG](../CHANGELOG.md) |

Code là bằng chứng hành vi hiện tại; thiết kế S2 mô tả hành vi mục tiêu. Khi code và mục tiêu khác nhau, tạo lỗi hoặc ghi quyết định điều chỉnh, không tự coi bên nào đúng. Khi hai tài liệu mâu thuẫn, ghi điểm lệch, thống nhất với người phụ trách/review rồi sửa cùng lần thay đổi; không âm thầm chọn một bản.

## Thuật ngữ dễ nhầm

- **Căn hộ** là phòng; **hộ gia đình** là nhóm cư trú trong một khoảng thời gian. Một căn có thể có nhiều hộ qua lịch sử.
- **Kỳ hóa đơn** là tháng phát sinh nghĩa vụ; **tháng thực thu** là tháng nhận tiền. Hai tháng có thể khác nhau.
- **Trạng thái thanh toán**: `UNPAID/PARTIAL/PAID`; **vòng đời hóa đơn**: `ISSUED/CANCELLED`; **giao dịch**: `VALID/VOIDED`.
- **Snapshot** là dữ liệu chứng từ đã chốt; sửa tên/giá hiện tại không làm đổi chứng từ cũ.
- **Replay** là trả lại giao dịch của cùng yêu cầu, không tạo lần thu mới. **Mock** kiểm logic độc lập; **DB thật** kiểm khóa, unique, transaction và migration.

## Tài liệu lịch sử và bản local

Bộ SVG là đề xuất, chưa áp vào frontend và chưa có màn hình Figma native hoàn chỉnh. Các tab Draw.io tiền tố `ARCHIVE_` là lịch sử. Bản repo là nơi cập nhật tài liệu làm việc; bộ `BlueMoon_Documents_v2_2026-11-28` là bản local đóng gói, cần đồng bộ khi phát hành lại. Không đưa secret hoặc dữ liệu cư dân thật vào tài liệu/bằng chứng.
