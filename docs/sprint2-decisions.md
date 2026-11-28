# Sổ quyết định Sprint 2

Cập nhật 28/11/2026. Sổ này quản lý trạng thái quyết định; nội dung chi tiết ở [thiết kế kỹ thuật](sprint2-technical-base.md). Việc tạo file không có nghĩa nhóm/khách hàng đã duyệt nghiệp vụ.

## Cách dùng

Trạng thái: **Đề xuất → Đã chốt → Được thay thế**, hoặc **Không chọn**. Chỉ chuyển sang Đã chốt khi có người xác nhận và bằng chứng (biên bản, issue, PR hoặc xác nhận được ghi nhận). Người viết tài liệu không tự điền thay người duyệt.

| Mã | Nội dung / phạm vi đã quyết định | Nguồn / ảnh hưởng | Trạng thái | Người xác nhận / ngày / bằng chứng |
|---|---|---|---|---|
| DEC-01 | Tính trọn tháng theo hộ đang ở/diện tích hiện tại lúc phát hành kỳ hiện tại hoặc tương lai và đơn giá hiệu lực tại đầu kỳ; không prorata; căn trống lúc phát hành bỏ qua; **bỏ sinh bù kỳ quá khứ** | Kỹ thuật 3.5; T01/T03/T04 | **Đã chốt (Điều chỉnh)** | Đại diện nhóm SE09 — 28/11/2026 (xác nhận chốt phạm vi v1.0) |
| DEC-02 | **Không chọn sinh bù kỳ quá khứ / bảng `apartment_area_versions` trong v1.0:** chỉ phát hành kỳ hiện tại/tương lai, lấy `apartments.area` hiện tại và chốt `area_snapshot` bất biến trên hóa đơn; chặn phát hành kỳ quá khứ hoặc thiếu đơn giá hiệu lực | Kỹ thuật 2 và 3.5; T00/T01/T04 | **Đã chốt (Thay thế)** | Đại diện nhóm SE09 — 28/11/2026 (bỏ sinh bù kỳ cũ & lịch sử diện tích quá khứ) |
| DEC-03 | **Không chọn chuyển giao hộ A → B tách lịch sử & nợ trong v1.0:** giữ mô hình 1 hộ đang hoạt động / căn (`UNIQUE(apartment_id)` của S1); chỉ hỗ trợ đổi người đại diện trong cùng hộ; không triển khai `POST /api/apartments/:id/household-transfers` hay tách nợ hộ cũ/hộ mới trong v1.0 | Kỹ thuật 2 và 3.5; T01/T06/T09 | **Đã chốt (Không chọn cho v1.0)** | Đại diện nhóm SE09 — 28/11/2026 (bỏ chuyển giao hộ A → B trong v1.0) |
| DEC-04 | Tiền VND nguyên; làm tròn từng khoản rồi cộng; tự phân bổ dịch vụ trước → quản lý sau, lưu phân bổ từng giao dịch; thu một phần/đủ cho một hóa đơn; không nhận vượt nợ, không tiền thừa/trả trước | Kỹ thuật 3.1/3.7/3.8; T03/T05 | **Đã chốt** | Người dùng — 28/11/2026; xác nhận trong chat: «các đề xuất của mày được đấy chốt đi» |
| DEC-05 | **Giữ** xử lý sai sót: sai thu thì `VOID` có lý do; sai hóa đơn thì `cancel/replace` với `revision` và `replaces_bill_id` (chặn khi còn khoản thu `VALID`); không xóa chứng từ hoặc tự hoàn tiền; chưa khóa sổ | Kỹ thuật 3.2/3.6/3.8; T04/T05 | **Đã chốt** | Đại diện nhóm SE09 — 28/11/2026 (xác nhận giữ hủy & phát hành thay thế hóa đơn sai) |
| DEC-06 | Giữ 5 vai trò và ma trận quyền tại kỹ thuật mục 5; audit cùng transaction; đổi quyền thu hồi phiên; không hạ ADMIN cuối; không làm màn hình tự cấu hình quyền | Kỹ thuật 5; T02 | **Đã chốt** | Người dùng — 28/11/2026; xác nhận trong chat: «các đề xuất của mày được đấy chốt đi» |
| DEC-07 | Cư dân xem hóa đơn/biên lai của chính hộ mình (suy từ JWT → DB, chống IDOR); mất hiệu lực cư trú (`Chuyển đi`) thì chặn `403`, kể cả đọc biên lai *(không cần tách lịch sử hộ cũ/mới do DEC-03)* | Kỹ thuật 3.5; T09 | **Đã chốt (Điều chỉnh theo DEC-03)** | Đại diện nhóm SE09 — 28/11/2026 (đồng bộ theo quyết định bỏ chuyển giao hộ A → B) |
| DEC-08 | Quỹ tách công nợ; chỉ thu mới khi OPEN và trong khoảng ngày VN gồm cả hai đầu; cho đóng sớm, không mở lại; vẫn xem/in và VOID có lý do sau đóng; cư dân chỉ thấy đóng góp hộ mình | Kỹ thuật 3.9; T08 | **Đã chốt** | Người dùng — 28/11/2026; xác nhận trong chat: «các đề xuất của mày được đấy chốt đi» |
| DEC-09 | Dùng api-contract-s2.md làm hợp đồng: camelCase, tiền số đồng nguyên, ngày/kỳ chuẩn, response phù hợp S1; page/pageSize và totals toàn tập lọc; mã lỗi thống nhất; không thêm framework/mock/client generator | API contract; T02–T09 | **Đã chốt** | Người dùng — 28/11/2026; xác nhận trong chat: «các đề xuất của mày được đấy chốt đi» |
| DEC-10 | Nghiệm thu gọn: 100 căn, 400 nhân khẩu, 6 kỳ, 1.000 khoản thu, 3 phiên, >=100 request sau warm-up; mục tiêu p95 API <2s, sinh kỳ/Excel <10s; bắt buộc kiểm 2 người cùng thu; backup trước migration/nghiệm thu và restore một lần DB riêng; chưa làm backup tự động/RPO 24h/RTO 2h | T00/T11 | **Đã chốt** | Người dùng — 28/11/2026; xác nhận trong chat: «các đề xuất của mày được đấy chốt đi» |
| DEC-11 | Chốt bộ A demo chính: 90 m² × (DV 4.000 + QL 7.000) = 990.000; bộ B test phân bổ: 60 m² × (6.000 + 7.500) = 810.000, thu 500.000 phân bổ 360.000/140.000 và còn nợ 310.000; loại ví dụ QL 5.000 khỏi cấu hình hợp lệ | Kỹ thuật 3.1; fixture; T03/T05 | **Đã chốt** | Người dùng — 28/11/2026; xác nhận trong chat: «các đề xuất của mày được đấy chốt đi» |

## Xác nhận bổ sung 28/11/2026

DEC-04/06/08/09/10/11 đã được người dùng chốt trong chat theo phương án đề xuất. DEC-10 thay mục tiêu vận hành/hiệu năng cũ bằng quy mô đồ án; nếu yêu cầu môn học có ngưỡng bắt buộc khác, phải ghi quyết định thay thế trước nghiệm thu. Việc chốt phạm vi không phải bằng chứng code/test đã hoàn tất; lịch, phân công và ước lượng vẫn cần nhóm xác nhận tại T00.

## Ghi một quyết định mới hoặc thay đổi

```text
Mã: DEC-xx
Vấn đề cần chốt:
Phương án và lý do chọn:
Quy tắc cụ thể + ví dụ đầu vào/kết quả:
Phần ngoài phạm vi:
US/task/API/schema/test bị ảnh hưởng:
Trạng thái:
Người xác nhận:
Ngày xác nhận:
Bằng chứng:
Thay thế quyết định nào (nếu có):
```

Nếu chưa chốt phần ảnh hưởng tiền/quyền/schema, thành viên có thể khảo sát hoặc làm phần độc lập nhưng không tự coi giả định là hợp đồng nghiệm thu. Khi chốt, cập nhật cùng lúc thiết kế kỹ thuật, API, fixture/kết quả mong đợi và kế hoạch bị ảnh hưởng. Giữ lại lịch sử quyết định đã thay thế.
