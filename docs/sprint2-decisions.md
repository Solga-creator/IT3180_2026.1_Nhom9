# Sổ quyết định Sprint 2

Cập nhật 28/11/2026. Sổ này quản lý trạng thái quyết định; nội dung chi tiết ở [thiết kế kỹ thuật](sprint2-technical-base.md). Việc tạo file không có nghĩa nhóm/khách hàng đã duyệt nghiệp vụ.

## Cách dùng

Trạng thái: **Đề xuất → Đã chốt → Được thay thế**, hoặc **Không chọn**. Chỉ chuyển sang Đã chốt khi có người xác nhận và bằng chứng (biên bản, issue, PR hoặc xác nhận được ghi nhận). Người viết tài liệu không tự điền thay người duyệt.

| Mã | Nội dung đang đề xuất | Nguồn / ảnh hưởng | Trạng thái | Người xác nhận / ngày / bằng chứng |
|---|---|---|---|---|
| DEC-01 | Tính trọn tháng theo hộ đang ở và diện tích/đơn giá tại thời điểm phát hành kỳ hiện tại hoặc tương lai; không prorata; căn trống đầu kỳ bỏ qua; **bỏ sinh bù kỳ quá khứ** | Kỹ thuật 3.5; T01/T03/T04 | **Đã chốt (Điều chỉnh)** | Đại diện nhóm SE09 — 28/11/2026 (xác nhận chốt phạm vi v1.0) |
| DEC-02 | **Không chọn sinh bù kỳ quá khứ / bảng `apartment_area_versions` trong v1.0:** chỉ phát hành kỳ hiện tại/tương lai, lấy `apartments.area` hiện tại và chốt `area_snapshot` bất biến trên hóa đơn; chặn phát hành kỳ quá khứ hoặc thiếu đơn giá hiệu lực | Kỹ thuật 2 và 3.5; T00/T01/T04 | **Đã chốt (Thay thế)** | Đại diện nhóm SE09 — 28/11/2026 (bỏ sinh bù kỳ cũ & lịch sử diện tích quá khứ) |
| DEC-03 | **Không chọn chuyển giao hộ A → B tách lịch sử & nợ trong v1.0:** giữ mô hình 1 hộ đang hoạt động / căn (`UNIQUE(apartment_id)` của S1); chỉ hỗ trợ đổi người đại diện trong cùng hộ; không triển khai `POST /api/apartments/:id/household-transfers` hay tách nợ hộ cũ/hộ mới trong v1.0 | Kỹ thuật 2 và 3.5; T01/T06/T09 | **Đã chốt (Không chọn cho v1.0)** | Đại diện nhóm SE09 — 28/11/2026 (bỏ chuyển giao hộ A → B trong v1.0) |
| DEC-04 | Tiền đồng nguyên, làm tròn từng khoản; thu dịch vụ trước rồi quản lý; thu từng hóa đơn | Kỹ thuật 3.1/3.7/3.8; T03/T05 | Đề xuất | Chưa có |
| DEC-05 | **Giữ** xử lý sai sót: sai thu thì `VOID` có lý do; sai hóa đơn thì `cancel/replace` với `revision` và `replaces_bill_id` (chặn khi còn khoản thu `VALID`); không xóa chứng từ hoặc tự hoàn tiền; chưa khóa sổ | Kỹ thuật 3.2/3.6/3.8; T04/T05 | **Đã chốt** | Đại diện nhóm SE09 — 28/11/2026 (xác nhận giữ hủy & phát hành thay thế hóa đơn sai) |
| DEC-06 | Ma trận ADMIN/BQT/ACCOUNTANT/TREASURER/RESIDENT; audit atomic, không hạ ADMIN cuối | Kỹ thuật 5; T02 | Đề xuất | Chưa có |
| DEC-07 | Cư dân xem hóa đơn/biên lai của chính hộ mình (suy từ JWT → DB, chống IDOR); mất hiệu lực cư trú (`Chuyển đi`) thì chặn `403`, kể cả đọc biên lai *(không cần tách lịch sử hộ cũ/mới do DEC-03)* | Kỹ thuật 3.5; T09 | **Đã chốt (Điều chỉnh theo DEC-03)** | Đại diện nhóm SE09 — 28/11/2026 (đồng bộ theo quyết định bỏ chuyển giao hộ A → B) |
| DEC-08 | Quỹ tự nguyện độc lập công nợ; chỉ nhận mới khi OPEN và trong ngày hiệu lực; không mở lại trong v1 | Kỹ thuật 3.9; T08 | Đề xuất | Chưa có |
| DEC-09 | Chốt JSON/query/pagination và mã lỗi theo API draft trước khi frontend/backend tích hợp | API contract; T02–T09 | Đề xuất | Chưa có |
| DEC-10 | Mục tiêu backup, restore và hiệu năng theo kỹ thuật 3.10–3.11; ước lượng lại mở rộng trước cam kết | T00/T11 | Đề xuất | Chưa có |
| DEC-11 | Sửa ví dụ số học cũ: 90 m² với QL 5.000 không hợp khung giá. Đề xuất bộ A 90 m² × (4.000 + 7.000) = 990.000; bộ B 60 m² × (6.000 + 7.500) = 810.000 để giữ ví dụ phân bổ 360.000/140.000 khi thu 500.000 | Kỹ thuật 3.1; fixture; T03/T05 | Đề xuất | Chưa có |

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
