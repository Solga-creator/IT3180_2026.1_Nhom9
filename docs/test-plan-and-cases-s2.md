# Kế hoạch Kiểm thử & Bộ Test Cases Chuẩn bị cho Sprint 2 (Test Plan & Cases S2 — Planned)

> **Trạng thái:** Tài liệu chuẩn bị trước khi triển khai code Sprint 2 (TDD/BDD). Nhóm SE09 hiện đã hoàn thành **100% kiểm thử Sprint 1** và **chưa bắt đầu thực thi code Sprint 2 (`0/11 US`)**.

---

## 1. Phạm vi & Mục tiêu Kiểm thử Sprint 2 (11 User Stories)
- **Phạm vi chức năng:** Kiểm thử toàn bộ phân hệ thu phí bắt buộc (`US-006`, `US-008`, `US-009`, `US-010`, `US-012`), quỹ đóng góp tự nguyện (`US-007`, `US-011`), lịch sử & báo cáo Excel (`US-013`, `US-014`), phân quyền 5 vai trò & nhật ký kiểm toán (`US-018`, `US-019`), và cổng tra cứu hóa đơn/biên lai của Cư dân (`/api/me/bills`).
- **Kiểm thử độ chặt chẽ nghiệp vụ tiền & phân quyền:** Kiểm thử phân bổ thanh toán một phần theo từng loại phí, chống thu trùng khi bấm đúp (`idempotency_key`), chống xung đột khi 2 người thu cùng lúc (`SELECT ... FOR UPDATE`), hủy giao dịch thu nhầm kèm lý do (`VOIDED`), tách biệt in lại biên lai với thu mới, bất biến snapshot chứng từ cũ, ghi `audit_logs` nguyên tử trong cùng transaction và chống IDOR giữa các căn hộ.
- **Hồi quy (Regression):** Kiểm tra toàn bộ test Sprint 1 sau khi thêm 7 bảng và mở rộng vòng đời hộ; bổ sung test cho xóa dữ liệu có chứng từ, chuyển giao hộ và phân quyền mới. Danh mục API tại `sprint2-technical-base.md` là hợp đồng dự kiến, chưa phải API đã triển khai.

---

## 2. Bộ Functional & Edge-Case Test Cases Trọng tâm (26 FTC nền cho 11 US Sprint 2)

| Mã TC | US ID | Tình huống kiểm thử | Dữ liệu đầu vào | Kết quả mong đợi | Trạng thái |
|---|---|---|---|---|---|
| `FTC-S2-01` | `US-006` | Chốt đơn giá phí dịch vụ & phí quản lý hợp lệ kèm ngày hiệu lực | Dịch vụ `6.000 đ/m²`, Quản lý `7.500 đ/m²`, `effectiveFrom = 2026-11-01` | HTTP 200, lưu vào `fee_rate_configs` và ghi `audit_logs` cùng transaction | Planned |
| `FTC-S2-02` | `US-006` | Từ chối phí dịch vụ ngoài khung $2.500\text{–}16.500\text{ đ/m}^2$ | Dịch vụ `2.000` hoặc `18.000` | HTTP 400, báo lỗi đúng khung giá quy định | Planned |
| `FTC-S2-03` | `US-006` | Từ chối phí quản lý dưới $7.000\text{ đ/m}^2$ | Quản lý `6.500` | HTTP 400, yêu cầu $\ge 7.000\text{ đ/m}^2$ | Planned |
| `FTC-S2-04` | `US-007` | Tạo đợt đóng góp tự nguyện hợp lệ | Tên *"Quỹ khuyến học 2026"*, `01/11`–`30/11` | HTTP 201, tách biệt hoàn toàn khỏi công nợ phí bắt buộc | Planned |
| `FTC-S2-05` | `US-007` | Từ chối đợt đóng góp có ngày kết thúc trước ngày bắt đầu | `start_date > end_date` | HTTP 400, báo lỗi khoảng ngày | Planned |
| `FTC-S2-06` | `US-008` | Preview và sinh bảng thu theo tình trạng đầu kỳ | Fixture riêng: kỳ `2026-11`, căn `050` 60 m² có hộ ở đầu kỳ; căn `301` không có hộ đầu kỳ (không giả định seed Sprint 1 là căn trống) | Preview bỏ qua `301`, phát hành `050`: DV 360.000, QL 450.000, tổng 810.000; dùng lịch sử đầu kỳ | Planned |
| `FTC-S2-07` | `US-008` | Chặn sinh trùng bảng thu cho kỳ đã tạo | Gọi sinh kỳ `2026-11` lần 2 | HTTP 409, không tạo hóa đơn trùng lặp (`UNIQUE(period_code, apartment_id)`) | Planned |
| `FTC-S2-08` | `US-009` | Lấy dữ liệu & xem bản in Giấy báo phí theo căn | `billId` của căn `050` | Hiển thị đúng snapshot số phòng `050`, chủ hộ, diện tích, chi tiết phí và nợ kỳ trước | Planned |
| `FTC-S2-09` | `US-010` | Ghi nhận nộp đủ phí bắt buộc bằng Tiền mặt | `amount = 810.000`, `method = CASH`, `idempotencyKey = uuid-1` | Lưu giao dịch (`service_paid_amount = 360.000`, `management_paid_amount = 450.000`), `status = PAID`, trả mã biên lai | Planned |
| `FTC-S2-10` | `US-010` | Ghi nhận nộp một phần bằng Chuyển khoản & kiểm tra phân bổ tự động (Dịch vụ trước, Quản lý sau) | Hóa đơn DV `360.000`, QL `450.000`; nộp `amount = 500.000`, `method = BANK_TRANSFER` | Phân bổ `service_paid_amount = 360.000`, `management_paid_amount = 140.000`; hóa đơn còn nợ `310.000` (thuộc phí QL), `status = PARTIAL` | Planned |
| `FTC-S2-11` | `US-010` | Chặn ghi nhận số tiền âm, bằng 0 hoặc vượt quá số còn nợ | `amount <= 0` hoặc `amount > debt_amount` | HTTP 400, không thay đổi công nợ | Planned |
| `FTC-S2-12` | `US-011` | Ghi nhận hộ gia đình ủng hộ quỹ tự nguyện | Căn `050`, Quỹ khuyến học, `200.000 đ` | Lưu vào `voluntary_contributions`, không trừ vào nợ phí bắt buộc | Planned |
| `FTC-S2-13` | `US-012` | Lọc danh sách căn hộ chưa nộp đủ kèm nợ lũy kế các kỳ trước | Kỳ `2026-11`, `?unpaidOnly=true` | Trả về các căn `UNPAID` & `PARTIAL` kèm số nợ kỳ đang chọn và nợ các kỳ trước (`prior_periods_debt`) | Planned |
| `FTC-S2-14` | `US-013` | Xem lịch sử đóng tiền của một căn hộ | `apartmentId` căn `050` | Hiển thị đủ giao dịch phí bắt buộc (`VALID`/`VOIDED`) và ủng hộ tự nguyện | Planned |
| `FTC-S2-15` | `US-014` | Xuất file Excel tổng hợp thu theo từng loại phí và từng quỹ | Kỳ `2026-11` | File `.xlsx` tổng hợp chính xác tổng thu Phí dịch vụ, Phí quản lý (từ các trường phân bổ) và từng quỹ tự nguyện | Planned |
| `FTC-S2-16` | `US-018` | ADMIN đổi vai trò tài khoản sang `ACCOUNTANT` / `TREASURER` và chặn hạ quyền ADMIN cuối cùng | `role = ACCOUNTANT` | Cập nhật quyền thành công, tăng `token_version`; nếu hạ quyền ADMIN cuối cùng thì chặn HTTP 400 | Planned |
| `FTC-S2-17` | `US-018` | Kiểm tra ma trận phân quyền giữa `ACCOUNTANT`, `TREASURER` và `BQT` | `ACCOUNTANT` gọi `POST /api/payments`; `TREASURER` gọi `PUT /api/fees/rates` | Cả 2 trường hợp trái thẩm quyền đều bị chặn HTTP 403 Forbidden | Planned |
| `FTC-S2-18` | `US-019` | Ghi Audit Log nguyên tử (có `before_data`, `after_data`, `reason`) khi thu tiền và hủy giao dịch | Thực hiện `POST /api/payments` và `POST /api/payments/:id/void` | Bảng `audit_logs` lưu đủ dữ liệu trước/sau và lý do hủy của cả 2 thao tác | Planned |
| `FTC-S2-19` | `US-019` | ADMIN tra cứu & lọc Nhật ký hệ thống theo loại đối tượng | `GET /api/audit-logs?entity=FEE_PAYMENT` | Chỉ trả về các thao tác giao dịch thu phí/hủy thu kèm tên người thực hiện | Planned |
| `FTC-S2-20` | `US-010` | **Thu đồng thời (Concurrency):** Hai thủ quỹ cùng bấm thu tiền cho một hóa đơn cùng lúc | Hóa đơn còn nợ `310.000`; 2 request đồng thời cùng nộp `310.000` với 2 `idempotencyKey` khác nhau | Nhờ khóa `SELECT ... FOR UPDATE`, chỉ 1 request thành công (`201`), request thứ 2 nhận HTTP `409` (không bị thu vượt số nợ) | Planned |
| `FTC-S2-21` | `US-010` | **Chống gửi trùng (Idempotency):** Gửi lại cùng yêu cầu thanh toán do bấm đúp hoặc mạng chậm | Gửi 2 lần `POST /api/payments` với cùng `idempotencyKey = "req-050-01"` | Lần 2 trả về đúng biên lai của lần 1, không tạo giao dịch thứ 2 và không cộng tiền 2 lần | Planned |
| `FTC-S2-22` | `US-010` | **Xử lý thu nhầm & In lại biên lai:** Hủy giao dịch thu nhầm kèm lý do và kiểm tra In lại biên lai | Gọi `POST /api/payments/:id/void` với `voidReason`; gọi `GET /api/payments/:id/receipt` nhiều lần | Khi hủy: giao dịch chuyển `VOIDED`, công nợ khôi phục đúng số tiền trước khi thu nhầm. Khi bấm In lại biên lai: chỉ trả dữ liệu chứng từ, `total_paid` không tăng | Planned |
| `FTC-S2-23` | `US-006`, `008`, `009` | **Bất biến chứng từ lịch sử:** Đổi đơn giá, diện tích hoặc chủ hộ ở kỳ sau nhưng chứng từ kỳ cũ giữ nguyên | Kỳ `2026-11` đã phát hành cho chủ hộ `Nguyễn Văn An` ($60\text{ m}^2$); sang tháng 12 đổi chủ hộ sang `Trần Thị Bình`, sửa diện tích $65\text{ m}^2$ và tăng đơn giá | Giấy báo phí và Biên lai kỳ `2026-11` vẫn hiển thị nguyên tên `Nguyễn Văn An`, diện tích $60\text{ m}^2$ và đơn giá cũ từ snapshot | Planned |
| `FTC-S2-24` | `US-010`, `014` | **Thu nợ kỳ trước ở tháng sau:** Báo cáo phân loại đúng theo kỳ hóa đơn vs tháng thực thu | Hóa đơn kỳ `2026-10` được cư dân nộp tiền vào ngày `05/11/2026` | Báo cáo theo kỳ hóa đơn `2026-10` ghi nhận đã thu; Báo cáo dòng tiền thực thu tháng `2026-11` ghi nhận khoản tiền thực thu ngày `05/11/2026` | Planned |
| `FTC-S2-25` | `US-009`, `010`, `012` | **Bảo mật cổng Cư dân (Chống IDOR & Thu hồi quyền khi chuyển đi):** Cư dân thử đọc hóa đơn căn khác hoặc đã chuyển đi | Cư dân căn `050` gọi `/api/me/bills/:billIdOfRoom101`; cư dân đã `"Chuyển đi"` gọi `/api/me/bills` | Cả 2 trường hợp đều bị chặn HTTP `403`/`404`, không lộ thông tin hóa đơn hay biên lai | Planned |
| `FTC-S2-26` | `US-010`, `019` | **Tính nguyên tử của Audit Log:** Ghi nhật ký `audit_logs` thất bại trong lúc thu tiền | Giả lập lỗi khi `INSERT INTO audit_logs` trong transaction thu tiền | Toàn bộ transaction thu tiền được `ROLLBACK`, giao dịch thanh toán và công nợ không bị lưu dang dở | Planned |

## 3. Ca bổ sung nối Sprint 1–2 (28/11/2026 — chưa thực thi)

Các quy ước v1.0 dùng cho dữ liệu mong đợi nằm tại mục 3.5–3.11 của thiết kế kỹ thuật; nhóm xác nhận trước khi code.

| Mã TC | US / loại | Tình huống và dữ liệu | Kết quả mong đợi | Trạng thái |
|---|---|---|---|---|
| `FTC-S2-27` | `US-002`, `004`, `012` | Chuyển giao hộ A → B tách lịch sử & nợ | *Ngoài phạm vi v1.0 theo DEC-03 (28/11/2026)* | Out of Scope (v1.0) |
| `FTC-S2-28` | `US-008` | Chặn phát hành mới cho kỳ quá khứ theo giờ VN (`period < tháng hiện tại`) | Trả `400`/`422`, không tạo hóa đơn bù kỳ cũ *(theo DEC-02)* | Planned |
| `FTC-S2-29` | `US-004`, `008` | Hộ có thành viên tạm vắng; căn khác trống (không có hộ) | Không miễn phí chỉ vì tạm vắng; căn trống được bỏ qua | Planned |
| `FTC-S2-30` | `US-001`, `006`, `008` | Sinh bù kỳ cũ bằng bảng lịch sử diện tích quá khứ | *Ngoài phạm vi v1.0 theo DEC-02 (28/11/2026); tính bất biến kỳ đã phát hành kiểm ở `FTC-S2-23`* | Out of Scope (v1.0) |
| `FTC-S2-31` | `US-008` | Hủy/thay hóa đơn sai chưa thu | Giữ bản CANCELLED, tạo revision mới liên kết bản cũ; chỉ một bản ISSUED; tổng nợ không cộng đôi | Planned |
| `FTC-S2-32` | `US-008`, `010` | Thay hóa đơn đang còn khoản thu VALID | 409, không hủy ngầm khoản thu; xử lý thu nhầm có lý do trước | Planned |
| `FTC-S2-33` | `US-001`, `002` | Xóa căn/hộ/tài khoản đã có chứng từ | Chặn xóa hoặc vô hiệu hóa/lưu trữ theo loại dữ liệu; chứng từ và người thu không mất | Planned |
| `FTC-S2-34` | `US-010`, `012` | Thu hai kỳ liên tiếp trong panel; chọn hộ cũ có nợ | Giữ căn/hộ/hình thức, hiển thị rõ kỳ và số tiền; không tự trả nợ hộ cũ; mỗi xác nhận có biên lai riêng | Planned |
| `FTC-S2-35` | `US-010` | Lưu tiền thành công rồi hủy/lỗi in; bấm in lại | Giao dịch không mất, không phát sinh khoản thu mới | Planned |
| `FTC-S2-36` | `US-010`, `011` | Cùng key nhưng khác amount/bill/method; hai request cùng key đồng thời | Khác payload trả 409; cùng payload tạo đúng một giao dịch và trả cùng biên lai | Planned |
| `FTC-S2-37` | `US-010` | Server commit rồi rớt phản hồi, tải lại và gửi lại | Giữ key, nhận giao dịch cũ dù hóa đơn đã đủ; không báo nhầm là khoản thu mới | Planned |
| `FTC-S2-38` | `US-008` | Preview rồi đổi giá/diện tích/hộ; token hết hạn | Generate trả 409, buộc preview lại; không dùng số tiền client sửa | Planned |
| `FTC-S2-39` | `US-008`, `019` | Phát hành nhiều căn, lỗi giữa batch; sau đó hai request phát hành đồng thời | Rollback cả batch khi lỗi; chỉ một lần phát hành thành công, không kỳ nửa vời/trùng | Planned |
| `FTC-S2-40` | `US-007`, `011` | Đóng đợt rồi thu thêm; hủy đóng góp cũ hai lần | Chặn thu mới; hủy đúng một lần, tổng quỹ đúng, biên nhận ĐÃ HỦY; không ảnh hưởng nợ bắt buộc | Planned |
| `FTC-S2-41` | `US-018` | Kế toán tạo/đóng đợt nhưng thử ghi đóng góp; thủ quỹ làm ngược lại; BQT thao tác theo bảng quyền | API/menu khớp ma trận: kế toán không ghi tiền, thủ quỹ không quản lý đợt, BQT được cả hai trong phạm vi quỹ | Planned |
| `FTC-S2-42` | `US-009`, `013` | Cư dân hộ mới/nhân khẩu mới xem hóa đơn trước ngày gia nhập hoặc biên nhận hộ khác | 403/404, không lộ dữ liệu; BQT vẫn xem được lịch sử hộ cũ | Planned |
| `FTC-S2-43` | `US-008`, `014` | Mốc 00:00 Việt Nam, cuối tháng/năm; số tiền có phần lẻ sau nhân diện tích | Ngày/kỳ và tháng thực thu đúng; làm tròn từng khoản tới đồng, tổng không lệch | Planned |
| `FTC-S2-44` | `US-012`, `014` | Áp dụng cùng bộ lọc ở bảng/thẻ/Excel; có hóa đơn và giao dịch hủy | Số liệu khớp; loại bản hủy khỏi tổng hợp, giữ trong lịch sử | Planned |
| `FTC-S2-45` | `US-009` | In 10 giấy báo; chèn ID sai kỳ; xem biên lai VOIDED | Đúng snapshot và phân trang A4/A5; chặn ID sai; chứng từ hủy có dấu rõ | Planned |

## 4. Nghiệm thu tích hợp và vận hành

| Mã TC | Phép kiểm tra | Bằng chứng yêu cầu | Trạng thái |
|---|---|---|---|
| `E2E-S2-01` | Database thật: tạo căn/hộ → hai kỳ thu → thu một phần → trả nợ cũ → hủy thu nhầm → chuyển hộ → cư dân/BQT tra cứu → Excel | Fixture riêng, tổng tiền đối chiếu trước/sau, request/response che dữ liệu nhạy cảm, ảnh UI và file Excel | Planned |
| `OPS-S2-01` | Backup và restore sang database kiểm thử riêng | Đối chiếu số bản ghi, tổng phải thu/thu/nợ, quyền đăng nhập; ghi thời gian khôi phục, không chạy restore vào DB demo | Planned |
| `PERF-S2-01` | 500 căn, 2.000 nhân khẩu, 24 kỳ, 20.000 khoản thu, 5 phiên; ít nhất 100 request sau warm-up | p95 tra cứu/thu dưới 2 giây; sinh kỳ/Excel dưới 10 giây; ghi máy, mạng, DB và dữ liệu đo | Planned |
| `UX-S2-01` | Desktop và 390px, bàn phím, focus modal/Escape, mất mạng khi thu, giữ bộ lọc/vị trí sau lưu | Kịch bản thao tác, số bước và lỗi quan sát; không gửi trùng; có cách khôi phục/in lại | Planned |

Không dùng số lượng ca trong tài liệu làm số test đã chạy. Chỉ chuyển trạng thái sang Pass khi có kết quả thực thi; nếu quy ước nghiệp vụ đổi thì cập nhật cả thiết kế, fixture và kết quả mong đợi.
