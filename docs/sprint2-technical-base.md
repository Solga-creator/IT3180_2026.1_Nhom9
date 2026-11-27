# Thiết kế Base Kỹ thuật cho Sprint 2 (Database Schema, Quy tắc Nghiệp vụ Tài chính, Phân quyền, API Contract & UI Base)

> **Trạng thái:** Tài liệu thiết kế kỹ thuật chuẩn bị triển khai Sprint 2 theo tiêu chí **"Ít bước, rõ kết quả, khó thao tác nhầm — Chặt chẽ nghiệp vụ tiền & phân quyền"**. Nhóm SE09 đã hoàn thành **100% Sprint 1 (8/8 US)** và **chưa bắt đầu code chức năng Sprint 2 (0/11 US)**.
>
> **Thứ tự ưu tiên triển khai trong Sprint 2:** Chuẩn bị migration lịch sử hộ/diện tích và middleware phân quyền (`US-018`), hàm audit trong transaction (`US-019`) trước; sau đó **Chốt giá (`US-006`) → Xem trước & Sinh hóa đơn (`US-008`) → Giấy báo (`US-009`) → Thu một phần/đủ & Biên lai (`US-010`) → Công nợ lũy kế (`US-012`) → Cư dân tra cứu**; cuối cùng hoàn thiện Quỹ tự nguyện, Lịch sử & Báo cáo. Mỗi API ghi dữ liệu phải tích hợp quyền và audit ngay khi triển khai.
>
> **Bổ sung rà soát ngày 28/11/2026:** Các mục 3.5–3.11 là đề xuất quy ước v1.0 để nhóm thống nhất trước khi code; không phải xác nhận nghiệp vụ của khách hàng hay chức năng đã triển khai. Khi nội dung cũ chưa chi tiết, áp dụng các quy tắc bổ sung này.

Tài liệu phối hợp: [mục lục nhóm](README.md), [API HTTP draft](api-contract-s2.md), [sổ quyết định](sprint2-decisions.md), [fixture dùng chung](sprint2-test-data.md), [báo cáo thực thi S2](test-report-s2.md). Các chi tiết API mới là đề xuất cần chốt; không tự thay đổi trạng thái quyết định khi thêm tài liệu.

**Lưu ý ví dụ cũ:** Cặp 90 m²/QL 5.000 đ/m² tại ví dụ phân bổ không đáp ứng mức QL tối thiểu 7.000 của thiết kế. Không dùng cặp đó làm cấu hình giá hợp lệ. Xem hai bộ số hợp lệ ở [fixture](sprint2-test-data.md) và DEC-11 trước khi viết test; việc sửa ví dụ không phải thay đổi khung giá nghiệp vụ.

---

## 1. Liên kết giữa Nền tảng Sprint 1 (Đã hoàn thành) và Sprint 2 (Chưa bắt đầu)

Toàn bộ 11 User Stories của Sprint 2 (`US-006`..`014`, `US-018`..`019`) kế thừa trực tiếp từ 5 bảng dữ liệu và khung kiến trúc Client–Server của Sprint 1:

| Thành phần Base từ Sprint 1 | File nguồn Sprint 1 | Vai trò làm Base trong Sprint 2 |
|---|---|---|
| **Bảng `apartments`** | `backend/config/database.js` | Cung cấp `apartments.id`, `room_number` và `area` ($\text{m}^2$) để chụp snapshot diện tích và tính bảng thu đầu tháng ($\text{Phí} = \text{area} \times \text{unit\_price}$) ở `US-008`. |
| **Bảng `households` & `residents`** | `backend/config/database.js` | Mở rộng lịch sử hộ theo mục 3.5; xác định hộ chịu phí tại ngày đầu kỳ, snapshot người chịu phí và kiểm soát quyền cư dân theo hộ, ngày gia nhập và trạng thái cư trú có hiệu lực. |
| **Bảng `users`, `token_version` & JWT Middleware** | `backend/middlewares/auth.js` | Xác thực người thực hiện giao dịch (`recorded_by -> users.id`), thu hồi phiên cũ khi đổi quyền/mật khẩu, mở rộng middleware `requireRoles(...)` cho 5 vai trò (`US-018`) và ghi vết trong Nhật ký kiểm toán (`US-019`). |
| **Singleton MySQL Pool & Transaction ACID** | `backend/config/database.js` | Dùng chung connection pool và cơ chế khóa dòng `SELECT ... FOR UPDATE` trong Transaction khi sinh bảng thu (`US-008`), ghi nhận/hủy thanh toán (`US-010`) và ghi `audit_logs` (`US-019`) nguyên tử. |
| **Dịch vụ xuất Excel (`exceljs`)** | `backend/services/residentService.js` | Mẫu chuẩn để xây dựng chức năng xuất báo cáo tổng thu theo từng loại phí bắt buộc và theo từng quỹ tự nguyện ra file `.xlsx` (`US-014`). |
| **Khung Giao diện & HTTP Client** | `frontend/src/layouts/AppLayout.jsx`, `frontend/src/services/api.js` | Cung cấp Master Layout và hàm gọi REST API / tải file Blob cho 2 trang nghiệp vụ thu phí của Sprint 2 (`/billing`, `/campaigns`). |

---

## 2. Thiết kế CSDL Sprint 2 (7 Bảng Mới → Tổng 12 Bảng Toàn Dự Án)

Thiết kế gồm **6 bảng tài chính/kiểm toán và 1 bảng lịch sử diện tích**, nối vào 5 bảng Sprint 1. Đồng thời mở rộng vòng đời hộ trên bảng hiện có, không tạo thêm bảng hộ trùng chức năng. Mục tiêu là toàn vẹn tài chính, bất biến chứng từ và phản hồi dưới 2 giây trong điều kiện nghiệm thu tại mục 3.11.

1. **`fee_rate_configs` (`US-006`)**: Lưu cấu hình đơn giá và lịch sử thay đổi đơn giá của 2 loại phí bắt buộc:
   - `id INT AUTO_INCREMENT PRIMARY KEY`
   - `service_unit_price DECIMAL(12, 2) NOT NULL` (ràng buộc trong khung $2.500\text{–}16.500\text{ đ/m}^2/tháng$)
   - `management_unit_price DECIMAL(12, 2) NOT NULL` (ràng buộc $\ge 7.000\text{ đ/m}^2/tháng$)
   - `effective_from DATE NOT NULL` (ngày bắt đầu có hiệu lực)
   - `note VARCHAR(255) NULL`, `updated_by INT NULL REFERENCES users(id)`, `created_at TIMESTAMP`
   - *Quy tắc chọn giá cho kỳ thu:* Khi sinh bảng thu kỳ `YYYY-MM`, hệ thống lấy bản ghi `fee_rate_configs` mới nhất có `effective_from <= ngày đầu kỳ (YYYY-MM-01)`. Thay đổi đơn giá mới chỉ áp dụng cho các kỳ sinh sau đó, tuyệt đối không sửa lại hóa đơn đã phát hành.

2. **`apartment_bills` (`US-008`, `US-009`, `US-012`)**: Hóa đơn đầu tháng của từng căn hộ theo kỳ:
   - `id INT AUTO_INCREMENT PRIMARY KEY`
   - `period_code CHAR(7) NOT NULL` (dạng `YYYY-MM`)
   - `apartment_id INT NOT NULL REFERENCES apartments(id)`
   - `household_id INT NULL REFERENCES households(id)` (lưu hộ gia đình chịu phí tại thời điểm phát hành)
   - **Các trường Snapshot lịch sử bất biến:**
     - `room_number_snapshot VARCHAR(50) NOT NULL`
     - `payer_name_snapshot VARCHAR(120) NOT NULL` (tên chủ hộ tại thời điểm phát hành hóa đơn)
     - `area_snapshot DECIMAL(10, 2) NOT NULL`
     - `service_unit_price DECIMAL(12, 2) NOT NULL`
     - `management_unit_price DECIMAL(12, 2) NOT NULL`
   - **Các trường số tiền theo từng loại phí:**
     - `service_fee DECIMAL(14, 2) NOT NULL` ($= \text{ROUND}(\text{area\_snapshot} \times \text{service\_unit\_price})$)
     - `management_fee DECIMAL(14, 2) NOT NULL` ($= \text{ROUND}(\text{area\_snapshot} \times \text{management\_unit\_price})$)
     - `total_due DECIMAL(14, 2) NOT NULL` ($= \text{service\_fee} + \text{management\_fee}$)
     - `service_paid DECIMAL(14, 2) NOT NULL DEFAULT 0` (tổng phí dịch vụ đã thu từ các giao dịch `VALID`)
     - `management_paid DECIMAL(14, 2) NOT NULL DEFAULT 0` (tổng phí quản lý đã thu từ các giao dịch `VALID`)
     - `total_paid DECIMAL(14, 2) NOT NULL DEFAULT 0` ($= \text{service\_paid} + \text{management\_paid}$)
   - **Dẫn xuất trạng thái & số còn nợ nhất quán:**
     - `debt_amount` luôn bằng `total_due - total_paid` (tính trực tiếp hoặc cập nhật nguyên tử trong cùng transaction từ tổng giao dịch `VALID`, loại bỏ nguy cơ lệch số liệu).
     - `status ENUM('UNPAID', 'PARTIAL', 'PAID')`: `UNPAID` khi `total_paid = 0`; `PARTIAL` khi `0 < total_paid < total_due`; `PAID` khi `total_paid = total_due`.
   - Bổ sung `lifecycle_status ENUM('ISSUED', 'CANCELLED')`, `revision INT DEFAULT 1`, `cancel_reason`, `cancelled_by`, `cancelled_at`, `replaces_bill_id` để giữ hóa đơn bị hủy và bản phát hành thay thế.
   - Ràng buộc lịch sử: `UNIQUE(period_code, apartment_id, revision)`; thêm cột generated `active_apartment_id = CASE WHEN lifecycle_status = 'ISSUED' THEN apartment_id ELSE NULL END` và `UNIQUE(period_code, active_apartment_id)` để tối đa một hóa đơn còn hiệu lực cho mỗi căn/kỳ. Hóa đơn hủy không được tính vào công nợ hay tổng phải thu.

3. **`fee_payments` (`US-010`, `US-013`, `US-014`)**: Giao dịch thu phí bắt buộc có phân bổ từng loại phí, chống ghi trùng và hỗ trợ hủy giao dịch thu nhầm:
   - `id INT AUTO_INCREMENT PRIMARY KEY`
   - `apartment_bill_id INT NOT NULL REFERENCES apartment_bills(id)`
   - `apartment_id INT NOT NULL REFERENCES apartments(id)`
   - `idempotency_key VARCHAR(64) NOT NULL UNIQUE` (mã yêu cầu duy nhất chống ghi nhận 2 lần khi bấm đúp/mạng chậm)
   - `request_fingerprint CHAR(64) NOT NULL` (hash payload nghiệp vụ chuẩn hóa để phát hiện cùng mã nhưng khác nội dung)
   - `receipt_number VARCHAR(40) NOT NULL UNIQUE` (mã biên lai tự sinh `BL-YYYYMM-XXXX`)
   - `amount DECIMAL(14, 2) NOT NULL` (tổng tiền nộp trong giao dịch, `> 0` và `<= debt_amount`)
   - `service_paid_amount DECIMAL(14, 2) NOT NULL` (số tiền phân bổ vào phí dịch vụ)
   - `management_paid_amount DECIMAL(14, 2) NOT NULL` (số tiền phân bổ vào phí quản lý; đảm bảo `service_paid_amount + management_paid_amount = amount`)
   - `payment_method ENUM('CASH', 'BANK_TRANSFER') NOT NULL` (*"Chuyển khoản" là hình thức thủ quỹ ghi nhận sau khi đối chiếu tiền vào tài khoản BQT, không tích hợp cổng thanh toán trực tuyến trong Sprint 2*)
   - `payer_name VARCHAR(120) NOT NULL`, `note VARCHAR(255) NULL`
   - `recorded_by INT NOT NULL REFERENCES users(id)`, `paid_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP`
   - **Trạng thái xử lý thu nhầm (Void):**
     - `status ENUM('VALID', 'VOIDED') NOT NULL DEFAULT 'VALID'`
     - `void_reason VARCHAR(255) NULL`, `voided_by INT NULL REFERENCES users(id)`, `voided_at TIMESTAMP NULL`

4. **`voluntary_campaigns` (`US-007`)**: Đợt vận động & quỹ đóng góp tự nguyện (tách biệt hoàn toàn khỏi công nợ phí bắt buộc):
   - `id`, `name`, `fund_code` (5 quỹ mẫu: *Vì người nghèo, Biển đảo, Từ thiện, Khuyến học, Người cao tuổi*), `start_date`, `end_date`, `status` (`OPEN`/`CLOSED`), `created_by`, `created_at`.

5. **`voluntary_contributions` (`US-011`, `US-013`, `US-014`)**: Giao dịch hộ gia đình ủng hộ quỹ tự nguyện:
   - `id`, `campaign_id`, `apartment_id`, `household_id`, `room_number_snapshot`, `payer_name_snapshot`, `amount`, `payment_method` (`CASH`/`BANK_TRANSFER`), `idempotency_key VARCHAR(64) NOT NULL UNIQUE`, `request_fingerprint`, `receipt_number UNIQUE`, `status ENUM('VALID', 'VOIDED') DEFAULT 'VALID'`, `void_reason`, `voided_by`, `voided_at`, `recorded_by`, `contributed_at`. Khóa ngoại chứng từ dùng `RESTRICT`, không xóa dây chuyền.

6. **`audit_logs` (`US-019`)** *(kèm mở rộng `users.role` cho `US-018`)*: Nhật ký kiểm toán hệ thống ghi trong cùng Transaction:
   - `id INT AUTO_INCREMENT PRIMARY KEY`
   - `actor_id INT NULL REFERENCES users(id)`
   - `action ENUM('CREATE', 'UPDATE', 'DELETE', 'PAYMENT', 'VOID_PAYMENT', 'ROLE_CHANGE', 'GENERATE_BILLS') NOT NULL`
   - `entity_type VARCHAR(50) NOT NULL` (`FEE_RATE`, `APARTMENT_BILL`, `FEE_PAYMENT`, `CONTRIBUTION`, `RESIDENT`, `USER_ROLE`)
   - `entity_id INT NULL`
   - `before_data JSON NULL`, `after_data JSON NULL` (lưu trạng thái dữ liệu trước và sau thao tác)
   - `reason VARCHAR(255) NULL`, `summary VARCHAR(255) NOT NULL`, `created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP`

7. **`apartment_area_versions` (`US-001`, `US-008`)**: `id`, `apartment_id`, `area DECIMAL(10,2)`, `effective_from DATE`, `recorded_by`, `reason`, `created_at`, `UNIQUE(apartment_id, effective_from)`. Lấy phiên bản mới nhất có hiệu lực không muộn hơn ngày đầu kỳ. `apartments.area` tiếp tục phục vụ hiển thị hiện tại; sửa diện tích từ Sprint 2 phải ghi lịch sử trong cùng transaction. Không tự suy diễn diện tích quá khứ từ giá trị hiện tại.

**Mở rộng bảng Sprint 1 để bảo toàn lịch sử:**
- `households`: thêm `starts_on DATE`, `ends_on DATE NULL`; khoảng cư trú là `[starts_on, ends_on)`. Bỏ `UNIQUE(apartment_id)` cũ, thay bằng cột generated `open_apartment_id = CASE WHEN ends_on IS NULL THEN apartment_id ELSE NULL END` và `UNIQUE(open_apartment_id)`. Trong transaction khóa dòng căn hộ, kiểm tra không chồng khoảng trước khi đóng hộ cũ/mở hộ mới; ràng buộc generated chỉ bảo vệ hộ chưa kết thúc, không thay thế kiểm tra khoảng thời gian.
- `residents`: thêm `joined_household_on DATE` để giới hạn kỳ hóa đơn một thành viên mới được xem. Khi kết thúc hộ, giữ nhân khẩu/lịch sử và thu hồi quyền cũ; nếu một người quay lại theo hộ mới thì tạo hồ sơ cư trú mới và liên kết lại tài khoản trong thao tác có audit.
- Migration không gán bừa ngày lịch sử: dùng mốc bắt đầu quản lý đã được nhóm xác nhận. Chặn sinh kỳ trước mốc có đủ dữ liệu hộ, diện tích và giá; không dùng ngày `created_at` như bằng chứng ngày chuyển đến.
- API thêm chủ hộ phải tạo hộ mới khi không có hộ đang mở; API danh sách căn hộ/nhân khẩu phải phân biệt hộ hiện tại với hộ lưu trữ. Luồng xóa Sprint 1 phải chặn xóa dữ liệu đã được hóa đơn/đóng góp tham chiếu; dùng kết thúc hộ/lưu trữ thay thế. Không áp dụng `ON DELETE CASCADE` lên chứng từ tài chính.

---

## 3. Các Quy tắc Nghiệp vụ Tài chính & Cư trú Cốt lõi (Chốt Trước Khi Code)

### 3.1. Quy tắc Phân bổ Thanh toán Một phần theo Từng Loại Phí (`US-010`, `US-014`)
Khi cư dân nộp số tiền `amount` nhỏ hơn tổng số còn nợ `debt_amount` của hóa đơn:
- Hệ thống áp dụng quy tắc phân bổ tự động theo thứ tự ưu tiên cố định: **Thu Phí dịch vụ trước, phần còn dư phân bổ vào Phí quản lý**:
  - $\text{service\_remaining} = \text{service\_fee} - \text{service\_paid}$
  - $\text{service\_paid\_amount} = \min(\text{amount}, \text{service\_remaining})$
  - $\text{management\_paid\_amount} = \text{amount} - \text{service\_paid\_amount}$
- *Ví dụ minh họa:* Hóa đơn có Phí dịch vụ `360.000 đ`, Phí quản lý `450.000 đ` (Tổng `810.000 đ`). Cư dân nộp lần 1 số tiền `500.000 đ`:
  - Giao dịch lưu ngay: `service_paid_amount = 360.000 đ`, `management_paid_amount = 140.000 đ`.
  - Hóa đơn cập nhật: `service_paid = 360.000 đ` (đã thu đủ DV), `management_paid = 140.000 đ` (còn thiếu `310.000 đ` QL), `total_paid = 500.000 đ`, `debt_amount = 310.000 đ`, `status = 'PARTIAL'`.
- Nhờ lưu rõ 2 trường phân bổ ngay khi thu, báo cáo `US-014` luôn tổng hợp chính xác tuyệt đối số tiền đã thu của từng loại phí dù hóa đơn mới nộp một phần.

### 3.2. Quy tắc Xử lý Thu nhầm (Hủy Giao dịch / Void) & In lại Biên lai (`US-010`)
- **Không sửa/xóa trực tiếp giao dịch đã xác nhận:** Mọi khoản thu đã lưu vào `fee_payments` không được phép `DELETE` hay sửa số tiền.
- **Hủy giao dịch thu nhầm (`POST /api/payments/:paymentId/void`):**
  - Thủ quỹ hoặc Admin chọn giao dịch bị nhập nhầm (nhầm căn hộ, nhầm số tiền, nhầm hình thức), nhập bắt buộc `voidReason` (ví dụ: *"Nhập nhầm số tiền phòng 101 sang phòng 102"*).
  - Trong cùng 1 MySQL Transaction (khóa dòng `apartment_bills FOR UPDATE`):
    1. Chuyển `fee_payments.status = 'VOIDED'`, ghi `void_reason`, `voided_by`, `voided_at`.
    2. Trừ lại `service_paid`, `management_paid`, `total_paid` trên `apartment_bills` và tính lại `debt_amount`, `status` (`UNPAID`/`PARTIAL`/`PAID`).
    3. Ghi bản ghi `VOID_PAYMENT` kèm `before_data`, `after_data` và `reason` vào `audit_logs`.
- **Phân biệt In lại biên lai và Ghi nhận khoản thu mới:**
  - **In lại biên lai (`GET /api/payments/:paymentId/receipt`)**: Truy vấn đọc đúng giao dịch đã tồn tại. Giao dịch `VOIDED` chỉ có bản xem/in đóng dấu **ĐÃ HỦY**, không được hiển thị như biên lai hợp lệ. In lại không tạo giao dịch mới hay đổi số dư.
  - **Ghi nhận khoản thu mới (`POST /api/payments`)**: Chỉ thực hiện khi bấm nút xác nhận thu tiền trên form thu phí kèm `idempotency_key` mới.

### 3.3. Quy tắc Chống Ghi nhận Hai lần (Idempotency & Concurrency Lock)
- **Khóa dòng trong Transaction (`SELECT ... FOR UPDATE`):** Khi xử lý `POST /api/payments`, server mở transaction và thực hiện `SELECT * FROM apartment_bills WHERE id = ? FOR UPDATE`. Nếu 2 thủ quỹ bấm thu cùng lúc cho 1 hóa đơn còn nợ `310.000 đ`, giao dịch thứ 2 phải chờ giao dịch thứ 1 commit rồi mới đọc lại số dư nợ mới (`0 đ`) và trả lỗi `409 Conflict` (*"Hóa đơn này vừa được thu đủ bởi giao dịch khác"*).
- **Chống gửi trùng (`idempotency_key`):** Mỗi lần mở form thu tiền, frontend sinh một mã `idempotencyKey` (UUID v4). Nếu người dùng bấm đúp hoặc mạng chậm khiến trình duyệt gửi lại request mang cùng `idempotencyKey`, server phát hiện mã đã tồn tại trong `fee_payments` và trả lại biên lai của giao dịch vừa tạo (HTTP `200`) thay vì cộng tiền lần thứ hai.

### 3.4. Quy tắc Bất biến Chứng từ Lịch sử, Căn hộ Trống, Đổi Chủ hộ & Quyền Xem của Cư dân
1. **Căn hộ trống khi sinh bảng thu (`US-008`):**
   - Preview hiển thị đơn giá, diện tích theo lịch sử, hộ chịu phí tại ngày đầu kỳ, các căn trống bị bỏ qua và tổng phải thu. Không suy ra căn trống từ riêng cột `current_status` hiện tại. Chính sách cụ thể tại mục 3.5; phát hành phải kiểm tra lại phiên bản preview theo mục 3.8.
2. **Đổi chủ hộ / diện tích / đơn giá và quản lý nợ cũ:**
   - Mọi hóa đơn đã phát hành giữ nguyên `room_number_snapshot`, `payer_name_snapshot`, `area_snapshot`, `service_unit_price`, `management_unit_price`. Khi in lại Giấy báo phí (`US-009`) hoặc Biên lai (`US-010`) của kỳ cũ, hệ thống hiển thị từ các cột snapshot này nên đổi chủ hộ hoặc đổi diện tích ở hiện tại không làm biến dạng chứng từ kỳ cũ.
   - Công nợ gắn theo căn hộ và hộ gia đình (`household_id`). Trên màn hình công nợ (`US-012`), ngoài số nợ của kỳ đang chọn (`current_period_debt`), hệ thống hiển thị thêm cột **Nợ các kỳ trước (`prior_periods_debt`)** và **Tổng nợ lũy kế (`total_accumulated_debt`)**.
3. **Phạm vi dữ liệu Cư dân được phép xem (`/api/me/bills`):**
   - Server xác định căn hộ và `household_id` trực tiếp từ JWT (`req.user.id -> users.resident_id`).
   - Nếu trạng thái cư trú có hiệu lực tại ngày Việt Nam hiện tại là `Chuyển đi` hoặc hộ đã kết thúc, từ chối truy cập (`403 Forbidden`); không chỉ đọc cột trạng thái lưu cũ.
   - Cư dân mới chuyển đến chỉ nhìn thấy các hóa đơn thuộc `household_id` hiện tại của mình từ kỳ bắt đầu cư trú trở đi; không xem được hóa đơn hay biên lai của hộ cũ hoặc của căn hộ khác (chống IDOR).
4. **Định nghĩa rõ 2 chế độ Báo cáo Excel (`US-014`):**
   - **Báo cáo theo Kỳ hóa đơn (`mode=period&period=YYYY-MM`)**: Tổng hợp phải thu, đã thu (Phí dịch vụ, Phí quản lý) và còn nợ của các hóa đơn thuộc kỳ `YYYY-MM`.
   - **Báo cáo Thực thu trong tháng (`mode=collection_month&month=YYYY-MM`)**: Tổng hợp mọi giao dịch `fee_payments` (`VALID`) và `voluntary_contributions` (`VALID`) có ngày thực thu (`paid_at` / `contributed_at`) nằm trong tháng `YYYY-MM` (bao gồm cả khoản thu trong tháng này để trả nợ cho hóa đơn tháng trước, ghi rõ cột `Kỳ hóa đơn` và `Ngày thực thu`).

---

### 3.5. Hộ chịu phí, thời điểm tính phí và quyền xem lịch sử

**Đề xuất phạm vi v1.0:** tính trọn tháng theo hộ đang cư trú tại `YYYY-MM-01`, không chia theo số ngày. Hộ vào giữa tháng bắt đầu đóng từ đầu tháng kế tiếp; hộ ở đầu tháng rồi rời giữa tháng vẫn chịu kỳ đó. Tạm trú/tạm vắng không tự miễn phí khi hộ vẫn còn hiệu lực. Căn không có hộ tại đầu kỳ được bỏ qua cả hai khoản phí theo giả định đồ án; đây là quy ước cần khách hàng/nhóm xác nhận, không phải kết luận về nghĩa vụ thực tế.

- Sinh bù kỳ cũ dùng khoảng cư trú, phiên bản diện tích và đơn giá tại đầu kỳ, không dùng dữ liệu hiện tại. Thiếu lịch sử thì trả `422` và liệt kê dữ liệu thiếu; không âm thầm dùng giá/diện tích mới.
- Mốc đầu kỳ quyết định hộ chịu phí, diện tích và đơn giá. Tên đại diện và mã phòng được snapshot tại lần phát hành từ đúng hộ đã chọn, không tự nhận là lịch sử tên đại diện tại đầu kỳ nếu chưa lưu lịch sử đó. Chứng từ đã phát hành vẫn giữ nguyên snapshot khi thông tin hiện tại đổi.
- Đổi người đại diện trong cùng gia đình giữ `household_id`; thay toàn bộ hộ thì đóng hộ A và tạo hộ B có ID mới. Kỳ cũ/nợ cũ giữ ở A, không tự chuyển nghĩa vụ sang B. BQT được xem cả lịch sử căn, cư dân B chỉ xem dữ liệu của B.
- Công nợ nội bộ chia thành **nợ hộ hiện tại**, **nợ hộ cũ** và tổng của căn; không đưa nợ hộ cũ vào số phải đóng của cư dân mới. BQT có thể ghi nhận người đại diện hộ cũ thanh toán bằng cách chọn rõ hộ cũ trong panel.
- Quyền cư dân: suy ra nhân khẩu/hộ từ tài khoản; chỉ trả hóa đơn cùng hộ và kỳ không sớm hơn tháng `joined_household_on`. Kiểm tra lại quyền cho mọi API biên lai/đóng góp, không tin `apartmentId` phía client. Ví dụ gia nhập 15/12 thì không xem chứng từ tháng 11 của cùng hộ.
- Chuyển giao hộ trong v1.0 thực hiện có hiệu lực hôm nay, có xác nhận và audit; không tự động chuyển giao từ thao tác sửa quan hệ. Cấm đổi lùi ngày ảnh hưởng hóa đơn đã phát hành; xử lý sai sót theo mục 3.6.

### 3.6. Hóa đơn phát hành sai và bảo toàn dữ liệu Sprint 1

- Chỉ `ADMIN`/`ACCOUNTANT` được hủy hóa đơn có lý do, với điều kiện không còn giao dịch `VALID`. Khóa hóa đơn, đánh dấu `CANCELLED`, giữ nguyên snapshot và ghi audit cùng transaction. Nếu vẫn có khoản thu hợp lệ, trả `409`, hướng dẫn xử lý khoản thu nhầm trước; không tự hủy tiền hay coi việc hủy sổ là đã hoàn tiền thực tế.
- Phát hành thay thế tạo ID mới, `revision + 1`, `replaces_bill_id`; bản hủy vẫn xem được với nhãn **ĐÃ HỦY**. Đây là thao tác sửa sai riêng, không mở lại API sinh toàn kỳ để lách chặn trùng. Tối đa một bản `ISSUED` cho mỗi căn/kỳ.
- Nguồn dữ liệu sửa sai (hộ, diện tích, đơn giá) phải có ngày hiệu lực đúng kỳ và lý do điều chỉnh được audit; không sửa trực tiếp snapshot cũ. Hủy rồi phát hành lại phải atomic nếu chọn thao tác thay thế một bước.
- Các FK từ hóa đơn/giao dịch sang căn/hộ dùng `RESTRICT`; tài khoản có chứng từ được vô hiệu hóa thay vì xóa mất dấu người thu. Bổ sung hồi quy cho nút xóa Sprint 1 sau khi có tài chính.

### 3.7. Thu nhiều kỳ và thao tác hàng ngày

- Phạm vi bắt buộc v1.0: trong một panel căn hộ/hộ, liệt kê các kỳ còn nợ theo thứ tự cũ đến mới, điền sẵn số còn nợ, thu một kỳ rồi chuyển nhanh sang kỳ tiếp theo; giữ căn hộ, hộ chịu phí, hình thức thu và bộ lọc. Mỗi lần xác nhận vẫn tạo một khoản thu cho một hóa đơn.
- Màn hình ghi rõ **Đang thu kỳ nào / hộ nào / số tiền nào**; không âm thầm trả nợ hộ cũ. Thu tổng một lần tự phân bổ qua nhiều hóa đơn và biên lai gộp nằm ngoài v1.0, tránh hứa UI mà chưa có mô hình giao dịch tương ứng.
- Lưu thành công mới hiện nút in; in bị hủy/lỗi không hoàn tác khoản thu. Nút in lại chỉ đọc. In nhiều giấy báo được chọn trong một lượt qua `GET /api/billing-periods/:period/notices?billIds=...`, chỉ dùng ID thuộc kỳ và quyền được phép, tối đa 100 bản/lượt.

### 3.8. Gửi lại yêu cầu, xem trước và tính nhất quán

- Cùng `idempotencyKey` và cùng payload chuẩn hóa (hóa đơn, số tiền, phương thức, người nộp) trả lại cùng giao dịch/biên lai; cùng mã nhưng khác payload trả `409`. Phải xác thực/phân quyền trước khi trả giao dịch cũ.
- Frontend giữ key khi timeout/mất phản hồi, kể cả khi tải lại để phục hồi thao tác chưa rõ kết quả; chỉ tạo key mới khi bắt đầu khoản thu khác. Backend kiểm tra giao dịch đã có trước khi kết luận hóa đơn vừa hết nợ. Hai request cùng key đồng thời chỉ được ghi một lần.
- Preview trả `previewToken` do server ký, gắn người thực hiện, kỳ, fingerprint đầu vào và hạn 10 phút. Generate nhận token, đọc lại dữ liệu trong transaction nhất quán, so fingerprint; dữ liệu đổi hoặc token hết hạn trả `409`, yêu cầu xem trước lại. Không tin số tiền/tổng căn gửi từ client.
- Phát hành toàn kỳ atomic; lỗi một căn thì rollback toàn bộ, không để kỳ nửa vời. Có bất kỳ hóa đơn đã phát hành của kỳ thì generate trả `409`; dùng quy trình thay thế riêng khi sửa sai. Preview không có căn đủ điều kiện thì không phát hành.
- Toàn bộ ngày nghiệp vụ dùng `Asia/Ho_Chi_Minh`; thời điểm lưu UTC, lọc tháng thực thu bằng khoảng UTC tương ứng đầu tháng Việt Nam đến đầu tháng sau (cận trên không bao gồm). Tiền VND làm tròn từng khoản tới đồng, dùng số nguyên hoặc phép tính decimal chính xác; cấm dựa vào float để quyết định đủ/thiếu.
- Thẻ tổng hợp, bảng, in và Excel dùng cùng bộ lọc chuẩn hóa (`period`, `apartmentId`, `householdId`, `search`, trạng thái, chế độ báo cáo). Biên lai hủy/hóa đơn hủy không cộng vào số liệu hợp lệ; lịch sử vẫn hiển thị. Báo cáo phải ghi thời điểm xuất; bản xuất lại sau hủy có thể khác bản cũ, không giả định đã có khóa sổ kế toán.

### 3.9. Vòng đời quỹ và quyền thao tác

- Tạo/đóng đợt: `ADMIN`, `BQT`, `ACCOUNTANT`. Ghi nhận/hủy đóng góp: `ADMIN`, `BQT`, `TREASURER`. Xem tổng hợp: nhân sự nội bộ; cư dân chỉ thấy thông tin công khai của đợt và đóng góp của hộ mình, không thấy danh sách người nộp của hộ khác.
- Tạo đợt bằng POST; đóng đợt qua PATCH riêng. Chỉ nhận tiền khi đợt `OPEN` và ngày nghiệp vụ nằm trong khoảng cho phép. Đợt đã đóng vẫn đọc được, không mở lại trong v1.0; hủy sai sót vẫn được phép có lý do/audit.
- Đóng góp áp dụng fingerprint/idempotency như phí bắt buộc. Hủy cập nhật tổng quỹ trong cùng transaction, lưu người/thời điểm/lý do; hủy lại không trừ lần hai. Biên nhận có snapshot và mã riêng; không ghi vào nợ phí bắt buộc.

### 3.10. Bảo vệ và khôi phục dữ liệu

- Trước migration và trước nghiệm thu, sao lưu database bằng công cụ tương thích môi trường MySQL/TiDB đang dùng; không chạy thử restore vào database đang phục vụ demo.
- Phải phục hồi được một bản sao vào database kiểm thử riêng: đối chiếu số căn/hộ, hóa đơn, giao dịch hợp lệ/hủy, tổng thu và công nợ; kiểm tra đăng nhập/phân quyền sau phục hồi. Ghi người thực hiện, thời điểm, nguồn backup và kết quả; không đưa mật khẩu hoặc dữ liệu nhạy cảm vào log minh chứng.
- Đề xuất mục tiêu vận hành v1.0 để nhóm xác nhận: backup mỗi ngày và trước migration, mất tối đa 24 giờ dữ liệu, khôi phục trong 2 giờ. Tự động backup chỉ được đánh dấu Done khi có cấu hình và một lần phục hồi thật làm bằng chứng.

### 3.11. Điều kiện nghiệm thu kết hợp Sprint 1–2

- E2E với database thật, dữ liệu thử riêng: tạo căn/hộ → phát hành hai kỳ → thu một phần → trả nợ kỳ trước → hủy thu nhầm → thay hộ → đối chiếu chứng từ, quyền cư dân và Excel. Không dùng kết quả mock làm bằng chứng đã kiểm tra khóa dòng thực tế.
- Mục tiêu hiệu năng đề xuất: 500 căn, 2.000 nhân khẩu, 24 kỳ, 20.000 khoản thu, 5 phiên nội bộ đồng thời; sau warm-up, ít nhất 100 lượt tra cứu/thu mẫu, p95 phản hồi API dưới 2 giây. Ghi cấu hình máy, vị trí database và điều kiện mạng; không tính thời gian người dùng nhập hoặc máy in. Xuất Excel và sinh toàn kỳ đo riêng, mục tiêu 10 giây cho bộ dữ liệu này.
- Kiểm tra in A4/A5 bằng print preview/PDF, giữ số 0 đầu của phòng, dấu tiếng Việt, tổng tiền, phân trang và trạng thái hủy. Kiểm tra viewport 390px và desktop, thao tác bàn phím, nhãn input, focus hộp thoại, nút Hủy/Escape và không gửi hai lần.
- Definition of Done: tiêu chí US và ca kiểm thử bổ sung đạt, hồi quy Sprint 1 đạt, migration/backup/restore có bằng chứng, ma trận quyền khớp API/menu, không còn lỗi nghiêm trọng về tiền hoặc lộ dữ liệu, cập nhật báo cáo kết quả thực thi. Các số liệu/mốc trên là mục tiêu, chưa phải kết quả đo.

## 4. Thiết kế Design Patterns Gọn Nhẹ và Đúng Trách Nhiệm

1. **Repository Pattern (5 Repositories toàn dự án):**
   - Sprint 1 (3): `userRepository.js`, `apartmentRepository.js`, `residentRepository.js`.
   - Sprint 2 (2):
     - `billingRepository.js`: Quản lý truy vấn và Transaction cho `fee_rate_configs`, `apartment_bills`, `fee_payments`, `voluntary_campaigns`, `voluntary_contributions`.
     - `auditLogRepository.js`: Cung cấp hàm `recordAuditInTransaction(connection, { actorId, action, entityType, entityId, beforeData, afterData, reason, summary })` để **ghi nhật ký trực tiếp trong cùng MySQL Transaction** với thao tác thu tiền/hủy thu/đổi đơn giá/đổi quyền.
2. **Strategy Pattern (`backend/strategies/feeCalculationStrategy.js`):**
   - `ServiceFeePerSqmStrategy` (kiểm tra khung giá $[2.500, 16.500]$ và tính phí dịch vụ) và `ManagementFeePerSqmStrategy` (kiểm tra $\ge 7.000$ và tính phí quản lý), kèm hàm phân bổ thanh toán một phần `allocatePartialPayment(amount, bill)`.
3. **Observer Pattern (`backend/observers/domainEventBus.js`):**
   - **Đã tích hợp ở Sprint 1** trong `residentService.js` (`RESIDENT_CREATED`, `RESIDENCY_STATUS_CHANGED`).
   - **Ở Sprint 2:** Vì nhật ký kiểm toán tài chính (`audit_logs`) bắt buộc phải ghi **trong cùng Transaction** để không bao giờ bị mất khi tiến trình dừng giữa chừng, `domainEventBus` chỉ dùng cho các tác vụ phụ sau khi commit (như làm mới bộ đếm thông báo trên dashboard hoặc ghi log debug).

---

## 5. Ma trận Phân quyền Chi tiết (`US-018`)

Bảng `users.role` được mở rộng thành `ENUM('ADMIN', 'BQT', 'ACCOUNTANT', 'TREASURER', 'RESIDENT')`. Middleware `requireRoles(...allowedRoles)` kiểm tra chặt chẽ tại tầng API:

| Nhóm hành động / API Endpoint | `ADMIN` | `BQT` | `ACCOUNTANT` (Kế toán) | `TREASURER` (Thủ quỹ) | `RESIDENT` (Cư dân) |
|---|:---:|:---:|:---:|:---:|:---:|
| Quản lý tài khoản BQT, gán vai trò & bấm Lưu (`US-015`, `US-018`) | **Có** | Không | Không | Không | Không |
| Xem Nhật ký kiểm toán hệ thống (`US-019` — `GET /api/audit-logs`) | **Có** | Không | Không | Không | Không |
| Quản lý căn hộ, hộ gia đình, nhân khẩu, duyệt TK cư dân (`US-001`..`005`) | **Có** | **Có** | Chỉ xem | Chỉ xem | Không |
| Cấu hình đơn giá phí & Sinh bảng thu đầu tháng (`US-006`, `US-008`) | **Có** | Chỉ xem | **Có** | Chỉ xem | Không |
| Xem bảng thu, lọc công nợ, xem Giấy báo & Xuất Excel (`US-009`, `012`, `013`, `014`) | **Có** | **Có** | **Có** | **Có** | Không |
| Ghi nhận thu tiền, Hủy giao dịch thu nhầm (`US-010`) | **Có** | Không | Không | **Có** | Không |
| Xem/In lại biên lai và in giấy báo theo lô | **Có** | **Có** | **Có** | **Có** | Không |
| Tạo/đóng đợt vận động (`US-007`) | **Có** | **Có** | **Có** | Không | Không |
| Ghi nhận/hủy ủng hộ quỹ (`US-011`) | **Có** | **Có** | Không | **Có** | Không |
| Hủy/thay thế hóa đơn sai (`US-008`) | **Có** | Không | **Có** | Không | Không |
| Chuyển giao hộ gia đình (`US-002`, `US-004`) | **Có** | **Có** | Không | Không | Không |
| Xem thông tin hộ, hóa đơn & biên lai của chính căn hộ mình (`/api/me/*`) | Không | Không | Không | Không | **Có** *(khi chưa Chuyển đi)* |

- **Quy tắc đổi vai trò an toàn (`US-018`):** Trên trang `/accounts`, Admin chọn vai trò mới trong dropdown rồi bấm nút **`Lưu`** (kèm xác nhận ngắn: *"Đổi vai trò tài khoản ketoan01 từ BQT sang ACCOUNTANT?"*). Hệ thống chặn tự hạ quyền của `ADMIN` cuối cùng và tự động tăng `token_version = token_version + 1` của tài khoản được đổi quyền.

---

## 6. Tổ chức Giao diện & Hợp đồng REST API Sprint 2

### 6.1. Tổ chức Màn hình theo Tiêu chí "Ít bước, rõ kết quả, khó thao tác nhầm"

1. **Trang Thu phí & Công nợ (`/billing` — `BillingPage.jsx`):** Chia thành 3 khu vực hiển thị rõ ràng theo tần suất sử dụng (không đặt form đổi đơn giá thường trực cạnh nút thu tiền):
   - **Khu vực Mặc định (Tra cứu & Theo dõi công nợ hàng ngày):**
     - Thanh chọn Kỳ thu (`YYYY-MM`), ô tìm số phòng/chủ hộ, bộ lọc trạng thái (`Tất cả`, `Chưa nộp đủ`, `Đã nộp đủ`), nút **Xuất Excel theo bộ lọc hiện tại (`US-014`)**.
     - 3 thẻ chỉ số tổng hợp: **Tổng phải thu**, **Tổng đã thu**, **Còn nợ** (hiển thị rõ nợ kỳ này và nợ lũy kế kỳ trước).
     - Bảng danh sách hóa đơn căn hộ (`US-008`, `US-012`).
   - **Khu vực Chi tiết khi chọn 1 Căn hộ (Drawer / Panel chi tiết căn hộ):**
     - Hiển thị chi tiết hóa đơn của căn hộ đã chọn, nút **Xem & In Giấy báo phí (`US-009`)**.
     - Form **Ghi nhận thu tiền (`US-010`)** (chỉ hiển thị cho `TREASURER`/`ADMIN`): tự động tính trước số tiền phân bổ vào Phí dịch vụ và Phí quản lý, có bước **Xác nhận ngắn** (*"Xác nhận thu 500.000 đ (DV: 360.000 đ, QL: 140.000 đ) bằng Chuyển khoản cho căn 050 - Kỳ 2026-11?"*) trước khi lưu.
     - Bảng **Lịch sử giao dịch của căn hộ (`US-013`)**: mỗi giao dịch `VALID` có nút **In lại biên lai** (chỉ đọc chứng từ cũ) và nút **Hủy giao dịch** (bắt buộc nhập lý do hủy).
   - **Khu vực Chuẩn bị kỳ mới (Panel thu gọn `<details>` dành cho `ACCOUNTANT`/`ADMIN`):**
     - Form cập nhật đơn giá có ngày hiệu lực (`US-006`) và quy trình **2 bước Sinh bảng thu kỳ mới (`US-008`)**: bấm **Xem trước bảng thu** (kiểm tra số căn hộ có người ở, số căn trống bỏ qua, đơn giá áp dụng, tổng phải thu) $\to$ bấm **Xác nhận phát hành bảng thu**.
2. **Trang Quỹ đóng góp tự nguyện (`/campaigns` — `CampaignsPage.jsx`):**
   - Quản lý đợt vận động (`US-007`) và ghi nhận ủng hộ (`US-011`) tách riêng khỏi công nợ phí bắt buộc.
3. **Trang Chủ Cư dân (`/` — `ResidentHomePage.jsx` mở rộng ở Sprint 2):**
   - Đưa thông tin phí lên đầu trang để trả lời ngay 3 câu hỏi của cư dân:
     1. **Kỳ này cần đóng bao nhiêu & Còn nợ kỳ trước không?** (Thẻ tổng hợp trạng thái đóng phí của căn hộ).
     2. **Chi tiết từng khoản phí dịch vụ, phí quản lý tính thế nào?** (Bảng hóa đơn các kỳ của hộ).
     3. **Đã đóng chưa & Xem biên lai ở đâu?** (Danh sách biên lai đã nộp và lịch sử ủng hộ quỹ của hộ).
   - Phần thông tin nhân khẩu & lịch sử cư trú đặt gọn ở khung bên dưới.

### 6.2. Danh mục Hợp đồng REST API của Sprint 2

| STT | Method & Endpoint | US ID | Vai trò được phép | Mô tả & Quy tắc nghiệp vụ |
|---:|---|---|---|---|
| 1 | `GET /api/fees/rates` | `US-006` | Nhân sự nội bộ | Lấy đơn giá phí dịch vụ & quản lý hiện hành kèm lịch sử cấu hình. |
| 2 | `PUT /api/fees/rates` | `US-006` | `ADMIN`, `ACCOUNTANT` | Chốt đơn giá mới kèm `effectiveFrom` (DV $2.500\text{–}16.500$, QL $\ge 7.000$), ghi `audit_logs` trong cùng transaction. |
| 3 | `POST /api/billing-periods/preview` | `US-008` | `ADMIN`, `ACCOUNTANT` | Nhận `period`, tùy chọn `replacesBillId` cho sửa sai một hóa đơn; trả danh sách đủ điều kiện/bỏ qua, giá/tổng và `previewToken`. Token thay thế gắn đúng hóa đơn; không dùng để phát hành toàn kỳ. |
| 4 | `POST /api/billing-periods/generate` | `US-008` | `ADMIN`, `ACCOUNTANT` | Nhận `period`, `previewToken`; kiểm tra phiên bản/đủ dữ liệu lịch sử, phát hành atomic theo snapshot đầu kỳ; chặn trùng hoặc preview lỗi thời `409`. |
| 5 | `GET /api/billing-periods/:period/bills` | `US-008`, `US-012` | Nhân sự nội bộ | Xem danh sách hóa đơn trong kỳ kèm nợ kỳ trước (`?unpaidOnly=true&search=...`). |
| 6 | `GET /api/bills/:billId/notice` | `US-009` | Nhân sự nội bộ | Lấy dữ liệu Giấy báo phí từ snapshot lịch sử của hóa đơn để hiển thị/in. |
| 7 | `POST /api/payments` | `US-010` | `ADMIN`, `TREASURER` | Ghi nhận thu phí (khóa `FOR UPDATE`, kiểm tra `idempotencyKey`, phân bổ DV/QL, sinh mã biên lai, ghi `audit_logs` cùng transaction). |
| 8 | `GET /api/payments/:paymentId/receipt` | `US-010` | Nhân sự nội bộ | Xem và **In lại biên lai** từ giao dịch đã có (chỉ đọc, không tạo giao dịch mới). |
| 9 | `POST /api/payments/:paymentId/void` | `US-010`, `US-019` | `ADMIN`, `TREASURER` | Hủy giao dịch thu nhầm với body `{ reason }` bắt buộc, ánh xạ vào `void_reason`; tính lại nợ/trạng thái và ghi `audit_logs` trong cùng transaction. |
| 10 | `GET /api/campaigns` | `US-007` | Nhân sự nội bộ, `RESIDENT` | Lấy danh sách các đợt vận động quỹ tự nguyện kèm tổng tiền đã ủng hộ. |
| 11 | `POST /api/campaigns` | `US-007` | `ADMIN`, `BQT`, `ACCOUNTANT` | Tạo đợt mới; không dùng POST tạo mới để đóng đợt đã có. |
| 12 | `POST /api/contributions` | `US-011` | `ADMIN`, `TREASURER`, `BQT` | Ghi nhận hộ gia đình ủng hộ quỹ tự nguyện (có `idempotencyKey`, tách rời công nợ bắt buộc). |
| 13 | `GET /api/apartments/:id/payments` | `US-013` | Nhân sự nội bộ | Xem toàn bộ lịch sử đóng phí bắt buộc (kèm trạng thái `VALID`/`VOIDED`) và ủng hộ tự nguyện của 1 căn hộ. |
| 14 | `GET /api/reports/collections/export` | `US-014` | `ADMIN`, `BQT`, `ACCOUNTANT`, `TREASURER` | Xuất Excel `.xlsx` tổng thu theo từng loại phí (từ `service_paid_amount`, `management_paid_amount`) và từng quỹ, hỗ trợ lọc theo kỳ hóa đơn hoặc tháng thực thu. |
| 15 | `GET /api/me/bills` & `GET /api/me/bills/:billId/receipts` | `US-009`, `010`, `012`, `013` | `RESIDENT` | Cư dân đang cư trú xem chứng từ được phép của hộ mình; suy nhân khẩu/hộ từ DB theo user đã xác thực, kiểm hiệu lực/ngày gia nhập và từng ID chứng từ, chống IDOR. |
| 16 | `PATCH /api/accounts/:id/role` & `GET /api/audit-logs` | `US-018`, `US-019` | `ADMIN` | Đổi vai trò tài khoản (chặn hạ quyền `ADMIN` cuối cùng, tăng `token_version`) và tra cứu Nhật ký kiểm toán hệ thống. |
| 17 | `POST /api/apartments/:id/household-transfers` | `US-002`, `US-004`, `US-019` | `ADMIN`, `BQT` | Đóng hộ cũ/mở hộ mới có hiệu lực hôm nay, xác nhận chủ hộ mới, giữ nợ cũ và thu hồi quyền hộ cũ trong transaction. |
| 18 | `POST /api/bills/:billId/cancel` & `POST /api/bills/:billId/replace` | `US-008`, `US-019` | `ADMIN`, `ACCOUNTANT` | Bắt buộc lý do; chặn nếu còn khoản thu VALID; hủy lưu lịch sử hoặc thay thế bằng revision mới atomic. |
| 19 | `GET /api/billing-periods/:period/notices?billIds=...` | `US-009` | Nhân sự nội bộ | Dữ liệu in nhiều giấy báo cùng kỳ, tối đa 100 bản, kiểm tra từng ID và giữ snapshot. |
| 20 | `PATCH /api/campaigns/:id/status` | `US-007` | `ADMIN`, `BQT`, `ACCOUNTANT` | Chuyển OPEN → CLOSED có audit; đóng lại không tạo đợt mới, không mở lại trong v1.0. |
| 21 | `POST /api/contributions/:id/void` & `GET /api/contributions/:id/receipt` | `US-011`, `US-019` | Hủy: `ADMIN`, `BQT`, `TREASURER`; đọc: nhân sự nội bộ | Hủy có lý do, lưu vết và tính lại tổng quỹ; biên nhận hủy có nhãn ĐÃ HỦY. |
| 22 | `GET /api/me/contributions` & `GET /api/me/contributions/:id/receipt` | `US-011`, `US-013` | `RESIDENT` | Chỉ dữ liệu của hộ được phép xem theo mục 3.5; kiểm tra cả quyền với chứng từ cụ thể. |

Danh sách trên nhóm một số endpoint liên quan trong cùng dòng, không dùng số dòng làm số lượng endpoint thực tế. Các bổ sung vẫn thuộc các US hiện có; nhóm phải ước lượng lại công sức trước khi cam kết lịch.
