# Dữ liệu thử dùng chung Sprint 2

Cập nhật 28/11/2026. Đây là **đặc tả fixture đề xuất**, chưa có seed/script S2 được tạo hoặc chạy. Chỉ dùng tên giả và DB riêng có hậu tố `_s2_test`; không đưa dữ liệu cư dân thật vào log/ảnh.

Nguồn: [quy tắc kỹ thuật](sprint2-technical-base.md), [API draft](api-contract-s2.md), [test plan](test-plan-and-cases-s2.md). Các giả định nghiệp vụ vẫn chờ chốt trong [decisions](sprint2-decisions.md).

## 1. Cách dựng fixture

- Mỗi kịch bản bắt đầu từ trạng thái sạch của chính kịch bản hoặc snapshot được mô tả; không cộng nối kết quả của các hàng khác trừ khi ghi rõ.
- Mốc ngày thử cố định `2026-11-28` VN; thời gian phải được inject/mock trong test. Không đổi đồng hồ máy và không dùng ngày thật khiến test tự hết hạn.
- Dùng ký hiệu APT-A, HH-A, BILL-NOV thay ID cứng. Khi seed trả ID thật, lưu ánh xạ và dùng trong request tiếp theo.
- Ghi rõ trạng thái trước/sau, tổng tiền và số chứng từ. Reset chỉ fixture trong DB thử đã được xác nhận; không chạy seed/reset vào DB demo.
- Adapter `TEST_DB_*` và script `test:db` còn phải triển khai. Pool runtime hiện đọc `DB_*`; chỉ đặt TEST_DB_NAME chưa đảm bảo kết nối DB thử. Test runner phải kiểm DB đích và từ chối DB chung trước khi ghi.

## 2. Bộ dữ liệu nền A — 90 m²

| Đối tượng | Dữ liệu giả lập |
|---|---|
| Căn APT-A | Số phòng chuỗi `050`, diện tích 90 m² |
| Hộ HH-A | Hiệu lực từ 2026-10-01, chưa kết thúc; chủ hộ Người thử A |
| Thành viên R-A | Gia nhập 2026-10-01, Thường trú; tài khoản RESIDENT liên kết hồ sơ |
| Đơn giá | Hiệu lực 2026-10-01: DV 4.000 đ/m², QL 7.000 đ/m² |
| Lịch sử diện tích | 90 m² từ 2026-10-01 |
| Hai kỳ | 2026-10 và 2026-11; mỗi kỳ DV 360.000 + QL 630.000 = 990.000 đ |
| Tài khoản staff | ADMIN, BQT, ACCOUNTANT, TREASURER riêng biệt, mật khẩu test lấy từ cấu hình riêng |
| Căn APT-EMPTY | `101`, có lịch sử diện tích nhưng không có hộ tại đầu kỳ |
| Đợt quỹ CMP-A | OPEN, 2026-11-01 đến 2026-11-30; fundCode theo bộ mã T08 được chốt |

Đơn giá và dữ liệu trên dùng cho nhánh kiểm thử hợp lệ. Chặn seed nếu chưa có mã fundCode đã chốt, không tự invent enum trong DB.

## 3. Kịch bản đối chiếu tiền

| Mã fixture | Trạng thái đầu và thao tác | Kết quả mong đợi |
|---|---|---|
| FX-01 | BILL-NOV 990.000 chưa thu; nộp 500.000 | DV paid 360.000, QL paid 140.000; totalPaid 500.000; nợ 490.000; PARTIAL |
| FX-02 | Tiếp sau FX-01, nộp thêm 490.000 bằng key mới | Giao dịch hai DV 0, QL 490.000; bill PAID, nợ 0; 2 khoản VALID |
| FX-03 | Tiếp sau FX-02, hủy giao dịch 490.000 | Giao dịch hai VOIDED, giao dịch đầu giữ nguyên; bill PARTIAL, nợ 490.000 |
| FX-04 | Sau FX-01, hủy giao dịch duy nhất 500.000 | Bill UNPAID, paid 0, nợ 990.000; giao dịch cũ vẫn tồn tại VOIDED |
| FX-05 | BILL-NOV chưa thu, hai request cùng key và cùng nội dung 500.000 | Chỉ 1 payment, 1 lần cộng tiền, 1 audit tạo khoản thu; hai phản hồi quy về cùng payment.id; lần replay không thêm audit tạo thu |
| FX-06 | Cùng key, hai payload 500.000 và 400.000 gửi đồng thời | Chỉ một payload thắng và được ghi; payload khác trả 409; tổng đúng theo giao dịch thắng, không giả định thứ tự request |
| FX-07 | Bill chỉ còn 490.000, hai key khác nhau cùng thu 490.000 | Một thành công, một bị chặn 409; tổng thu không vượt totalDue |
| FX-08 | Sau FX-04 retry key/payload khoản 500.000 đã hủy | Cùng payment.id VOIDED; bill vẫn UNPAID, không thêm khoản thu |
| FX-09 | Cả hai kỳ chưa thu; trả 500.000 vào tháng 11 cho BILL-OCT | Nợ tháng 10 còn 490.000, tháng 11 còn 990.000; nợ hộ 1.480.000; báo cáo thực thu tháng 11 có 500.000, kỳ bill là tháng 10 |
| FX-10 | BILL-NOV chưa thu; mô phỏng audit insert lỗi sau ghi payment | Rollback: không có payment/biên lai mới, bill paid 0 và nợ 990.000; không để audit thành công giả |

**Bộ B để kiểm ví dụ 810.000 đ:** dùng căn riêng 60 m², DV 6.000 đ/m² và QL 7.500 đ/m². Tổng DV 360.000 + QL 450.000 = 810.000; nộp 500.000 phân bổ 360.000/140.000, nợ 310.000. Cả hai đơn giá đều trong khung thiết kế.

Ví dụ cũ tại kỹ thuật mục 3.1 dùng 90 m² × QL 5.000 đ/m² để ra 810.000 đ, mâu thuẫn mức QL tối thiểu 7.000. Không dùng cặp 90 m²/5.000 làm cấu hình hợp lệ. Nhóm cần chốt cách sửa ví dụ đó; các test đang dùng tổng 810.000 phải ghi rõ bộ B hoặc chỉ là unit fixture số dư, không giả là kết quả cấu hình giá hợp lệ của bộ A.

## 4. Hộ, quyền và dữ liệu lịch sử

| Mã fixture | Thiết lập/thao tác | Kết quả mong đợi |
|---|---|---|
| FX-11 | HH-A từ 01/10, chuyển sang HH-B ngày 20/11; clock thử 20/11 | Tháng 11 vẫn thuộc HH-A; tháng 12 thuộc HH-B nếu dữ liệu đầy đủ; nợ HH-A không chuyển sang HH-B |
| FX-12 | Token R-A cũ sau chuyển hộ; R-B xem bill HH-A | Phiên A bị thu hồi/không còn quyền; B không lấy được chứng từ A; staff hợp lệ vẫn xem lịch sử |
| FX-13 | Thành viên mới gia nhập HH-A ngày 15/11 | Không xem bill tháng 10; được xem kỳ tháng 11 theo quy ước tháng gia nhập nếu còn hiệu lực; kiểm cả endpoint receipt |
| FX-14 | APT-EMPTY trống ngày 01/11; hộ mới bắt đầu 15/11 | Không bill tháng 11; kỳ 12 đủ dữ liệu mới sinh bill |
| FX-15 | Thiếu diện tích trước kỳ hoặc thiếu mốc bắt đầu hộ đã xác nhận | Preview/generate 422, không dùng số hiện tại để lấp lịch sử |
| FX-16 | Preview rồi đổi đơn giá/hộ/diện tích; token hết hạn; dùng sai actor/kỳ/bill | Không phát hành theo preview cũ; lỗi theo API contract; không ghi nửa batch |
| FX-17 | Hủy bill còn VALID payment; sau đó VOID đủ rồi replace | Lần đầu 409; thay hợp lệ tạo revision mới, old CANCELLED giữ snapshot, unique chỉ cho một ISSUED/căn/kỳ |

## 5. Quỹ, thời gian và xuất báo cáo

| Mã fixture | Thao tác | Kết quả mong đợi |
|---|---|---|
| FX-18 | Đóng góp 100.000 cho CMP-A, retry cùng key rồi hủy | Tổng quỹ lần lượt 100.000 → 100.000 → 0; nợ bill không thay đổi; biên nhận hủy giữ dấu |
| FX-19 | Đợt CLOSED/hết hạn, thử khoản mới và replay khoản đã ghi | Chặn khoản mới; replay trả giao dịch cũ theo quyền, không thêm đóng góp |
| FX-20 | Clock 2026-11-30T16:59:59Z và 17:00:00Z | Tương ứng 23:59:59 ngày 30/11 VN và 00:00 ngày 01/12 VN; report tháng thực thu phân loại đúng biên |
| FX-21 | Bảng/thẻ/Excel cùng apartmentId, householdId, period, status; có bản hủy | Tổng theo cùng phạm vi lọc, không cộng bản hủy; chuỗi phòng 050 không mất số 0 |
| FX-22 | Kế toán thử thu; thủ quỹ thử sửa giá; BQT thử API quỹ | Quyền đúng ma trận, chặn server chứ không chỉ ẩn nút; kiểm cả replay trái quyền |

Khoảng UTC của tháng 11/2026 VN là `[2026-10-31T17:00:00Z, 2026-11-30T17:00:00Z)`. Timestamp cuối khoảng thuộc tháng 12 VN. Mọi số tiền/timestamp trên là đầu vào kỳ vọng, chưa phải kết quả chạy.

## 6. Bằng chứng khi chạy

Ghi FX-ID và FTC-ID liên quan, ID thật do fixture trả, snapshot trước/sau, HTTP response đã che token, số bản ghi và tổng tiền. Tách test mock với test DB thật. Dùng [báo cáo S2](test-report-s2.md) để lưu kết quả; không đổi Planned thành Pass chỉ vì fixture đã viết.
