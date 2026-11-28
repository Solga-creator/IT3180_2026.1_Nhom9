# Hướng dẫn Triển khai Sprint 2 theo Đúng Thiết kế (BlueMoon SE09)

Tài liệu này gom gọn cách triển khai **11 User Stories Sprint 2 (`US-006`–`014`, `US-018`–`019`)** và cập nhật giao diện từ bộ SVG đề xuất thành từng bước thực hành theo từng phần hệ thống — **không phân chia theo cá nhân**, bất kỳ thành viên nào nhận phần nào đều làm theo đúng chuẩn chung.

> **Tài liệu gốc đối chiếu khi code:**
> - Mục lục theo vai trò: [README tài liệu](README.md); quy trình nhóm: [CONTRIBUTING](../CONTRIBUTING.md).
> - JSON/query/mã lỗi đã chốt: [api-contract-s2.md](api-contract-s2.md); sổ quyết định đã chốt: [sprint2-decisions.md](sprint2-decisions.md).
> - Dữ liệu thử dùng chung: [sprint2-test-data.md](sprint2-test-data.md); kết quả thực thi: [test-report-s2.md](test-report-s2.md) (hiện chưa chạy).
> - Quy tắc tài chính, schema DB, ma trận quyền & API: [sprint2-technical-base.md](./sprint2-technical-base.md)
> - Backlog, tiêu chí chấp nhận & giới hạn v1.0: [product-vision-and-backlog.md](./product-vision-and-backlog.md)
> - Kế hoạch task `T00`–`T11` & chữ ký hàm đề xuất: [sprint2-implementation-plan.md](./sprint2-implementation-plan.md)
> - Bộ 43 ca chức năng trong phạm vi + 2 ca ngoài phạm vi + E2E/OPS/PERF/UX: [test-plan-and-cases-s2.md](./test-plan-and-cases-s2.md)
> - Giao diện mẫu (8 board S1 + 34 board S2): Mở [design/bluemoon-ui-redesign/index.html](../design/bluemoon-ui-redesign/index.html) bằng trình duyệt.

---

## 1. Chuẩn bị Môi trường & Nguyên tắc Code Chung

Quy ước đã chốt: phân bổ DV trước QL, không thu vượt nợ; giữ 5 vai trò và audit atomic; quỹ chỉ nhận mới khi OPEN trong khoảng ngày VN gồm hai đầu, đóng sớm được nhưng không mở lại, vẫn cho VOID có lý do sau đóng; API theo DEC-09; demo dùng bộ A và kiểm phân bổ dùng bộ B. Nghiệm thu DEC-10: 100 căn/400 nhân khẩu/6 kỳ/1.000 khoản thu/3 phiên, >=100 request sau warm-up; p95 API <2s, sinh kỳ/Excel <10s, kiểm hai người cùng thu. Backup trước migration/nghiệm thu và restore một lần vào DB riêng; chưa làm backup tự động/RPO/RTO.

### 1.0. Điều kiện trước khi bắt đầu
- Sprint 2 hiện là thiết kế/kế hoạch, chưa phải chức năng đã triển khai. DEC-01–DEC-11 đã được chốt trong sổ quyết định: tính trọn tháng theo hộ hiện hữu/diện tích hiện tại lúc phát hành và giá hiệu lực đầu kỳ, bỏ qua căn trống, không chia phí theo ngày; không sinh bù quá khứ/chuyển giao hộ. Xác nhận này là phạm vi đồ án, không phải bằng chứng đã triển khai.
- Thực hiện T00 trong kế hoạch: smoke test Sprint 1 trên trình duyệt và DB thử riêng, lưu phiên bản code và kết quả chạy hồi quy làm baseline; đối chiếu [báo cáo S1](test-report-s1.md), phân biệt kết quả cũ với lần chạy mới, không tự đổi tổng số test thành kết quả PASS. Khi chốt baseline commit, đưa cả `frontend/tests/residentsRefresh.test.mjs` (hiện chưa được Git theo dõi) vào repo; chạy `node --test tests/*.test.mjs` từ frontend để các thành viên dùng cùng bộ test. Không đánh dấu T00 Done khi chưa có bằng chứng hoặc quyết định nghiệp vụ chưa được xác nhận.
- Không backfill lịch sử hộ/diện tích trong v1.0. Chặn phát hành kỳ quá khứ bằng 422; thiếu đơn giá hiệu lực đầu kỳ cũng trả 422. Dựng nhiều kỳ trong test bằng clock thử tiến lần lượt, không mở lại API sinh bù.

### 1.1. Tách Database thử nghiệm — Không chạm DB Cloud đang demo
- Tạo database riêng trên MySQL local (hoặc schema thử riêng có hậu tố `_s2_test`, ví dụ `bluemoon_se09_s2_test`) để chạy migration và test DB thật (`TEST_DB_*`).
- Tuyệt đối không chạy lệnh `DROP`, reset hay thử nghiệm migration Sprint 2 vào database đang dùng demo Sprint 1.
- Trước khi chạy migration lên môi trường mới hoặc nghiệm thu, luôn backup database trước theo mục 3.10 của [sprint2-technical-base.md](./sprint2-technical-base.md).

### 1.2. Các module Sprint 1 có sẵn cần tái sử dụng (Không viết lại)
| Module có sẵn | Dùng vào việc gì ở Sprint 2 |
|---|---|
| `shared/businessDate.mjs` (`getBusinessDate`) | Lấy ngày hiện tại chuẩn `YYYY-MM-DD` theo giờ `Asia/Ho_Chi_Minh`. Cấm dùng `new Date().toISOString().slice(0, 10)` cho ngày nghiệp vụ/kỳ thu. |
| `backend/config/database.js` (`pool`) | Lấy connection chạy Transaction ACID (`const conn = await pool.getConnection(); await conn.beginTransaction(); ...`). |
| `backend/helpers/AppError.js` (`AppError`) | Ném lỗi HTTP chuẩn từ Service (`throw new AppError(400/403/404/409/422, "...")`); Express handler không tự `res.status(...).json(...)` rải rác cho lỗi nghiệp vụ. |
| `backend/middlewares/auth.js` | Giữ `requireAuth`, kiểm tra `tokenVersion`; mở rộng thêm `requireRoles(...roles)` (không tin `role` hoặc `apartmentId`/`householdId` gửi từ body client). |
| `backend/strategies/feeCalculationStrategy.js` | Tái sử dụng & mở rộng cho validate đơn giá (`ServiceFeePerSqmStrategy`, `ManagementFeePerSqmStrategy`), phép tính làm tròn tới đồng và phân bổ tiền nộp một phần. |
| `backend/repositories/residentRepository.js` | Dùng `resolveEffectiveResidencyStatus(...)` với ngày VN khi đã có lịch sử; tái sử dụng `getEffectiveResidencyStatuses(residentIds, referenceDate)` để lấy trạng thái theo lô khi cần kiểm tra tài khoản `RESIDENT`. Helper batch dùng pool; nghiệp vụ trong transaction phải đọc/giải trạng thái bằng cùng connection của transaction. Không suy quyền chỉ từ cột `current_status`. |
| `frontend/src/services/api.js` (`api`) | Dùng sẵn cho mọi API JSON và tải file `.xlsx` dạng `"blob"`; nhớ giữ nguyên `idempotencyKey` khi user thử lại sau lỗi mất kết nối (`err.status === 0`). |

### 1.3. Luồng kiến trúc chuẩn cho mỗi tính năng Backend
```text
api/routes/*.js (requireAuth + requireRoles)
  → api/handlers/*.js (lấy params/query/body + req.user làm actor)
    → services/*.js (gọi validators/, kiểm tra nghiệp vụ, điều phối Transaction)
      → repositories/*.js (SQL tham số hóa `?`, khóa dòng FOR UPDATE, auditLogRepository)
```

---

## 2. Thứ tự Triển khai theo Từng Phần (Làm đúng thứ tự để không bị lệch hợp đồng)

```text
[1] Migration & Lịch sử Hộ/Diện tích + Quyền & Audit
        ↓
[2] Đơn giá Phí & Công thức tính (US-006)
        ↓
[3] Xem trước, Phát hành & Hủy/Thay Hóa đơn (US-008)
        ↓
[4] Thu tiền, Phân bổ phí, Idempotency & Hủy giao dịch (US-010)
        ↓
[5] Công nợ, Giấy báo in hàng loạt & Báo cáo Excel (US-009, 012, 013, 014)
        ↓
[6] Quỹ tự nguyện (US-007, 011) & Cổng tra cứu Cư dân (/api/me/*)
        ↓
[7] Cập nhật Frontend theo bộ SVG thiết kế & Nghiệm thu DB thật
```

---

### Phần 1 — Nền tảng Dữ liệu (6 bảng mới), Bảo toàn S1, Phân quyền & Audit (`US-001/002/004`, `US-018`, `US-019`)

**1. Viết `backend/config/sprint2Migration.js` (gọi từ `migrate()` trong `database.js`):**
- Tạo **6 bảng mới**: `fee_rate_configs`, `apartment_bills`, `fee_payments`, `voluntary_campaigns`, `voluntary_contributions`, `audit_logs` *(đã chốt 28/11 theo DEC-02/03: không tạo `apartment_area_versions`, không thêm `starts_on`/`ends_on`/`open_apartment_id` hay luồng chuyển giao hộ A → B trong v1.0)*.
- Mở rộng tối thiểu theo mục 2 của [sprint2-technical-base.md](./sprint2-technical-base.md):
  - `users`: Mở rộng `role ENUM('ADMIN', 'BQT', 'ACCOUNTANT', 'TREASURER', 'RESIDENT')`.
  - `apartment_bills`: Thêm cột generated `active_apartment_id` + `UNIQUE(period_code, active_apartment_id)` để mỗi căn/kỳ chỉ có tối đa 1 bản `ISSUED` *(phục vụ hủy/thay thế hóa đơn giữ theo DEC-05)*.
- **Ràng buộc khóa ngoại & tính lũy đẳng:** Kiểm tra tồn tại bảng/cột/index qua `information_schema` trước khi `ALTER TABLE` để script chạy lại nhiều lần không lỗi; các FK từ hóa đơn/thanh toán/đóng góp trỏ sang `apartments`, `households`, `users` phải dùng `ON DELETE RESTRICT` (không xóa mất dấu chứng từ tài chính).
- MySQL DDL có implicit commit: không giả định rollback được toàn bộ migration. Kiểm tra trước/sau từng bước, backup trước khi chạy trên môi trường mới và kiểm thử chạy lại sau lỗi giữa chừng trên DB thử.
- Cập nhật luồng **Xóa ở Sprint 1** (`removeApartment`, `removeResident`, `removeAccount`): chặn xóa bằng `AppError(409/400)` nếu đối tượng đã có hóa đơn, giao dịch hoặc đóng góp tham chiếu (khi đã có chứng từ tài chính thì chỉ lưu trữ hoặc vô hiệu hóa tài khoản). Với căn hộ, mở rộng kiểm tra chứng từ ngay trong `deleteEmptyApartmentById(...)` ở `apartmentRepository.js`, sau `SELECT ... FOR UPDATE` và trước DELETE, dùng cùng connection/transaction hiện có.

**2. Triển khai `requireRoles(...roles)` (`US-018`) & `auditLogRepository.js` (`US-019`):**
- Trên trang `/accounts` (chỉ `ADMIN`): chọn vai trò mới rồi bấm **Lưu** + xác nhận ngắn (`PATCH /api/accounts/:id/role`). Chặn tự hạ quyền `ADMIN` cuối cùng và tăng `token_version = token_version + 1` ngay trong transaction đổi quyền.
- Tạo `recordAuditInTransaction(connection, { actorId, action, entityType, entityId, beforeData, afterData, reason, summary })`: **bắt buộc dùng chung `connection` của transaction nghiệp vụ** (không mở connection riêng, không `commit` bên trong) để nếu ghi audit lỗi thì toàn bộ giao dịch thu/phát hành tự `rollback`.
- Tạo `GET /api/audit-logs` (chỉ `ADMIN`), hỗ trợ lọc theo `entity_type` / `action` / thời gian, trả đủ `before_data`, `after_data`, `reason`, tên người thao tác.

---

### Phần 2 — Đơn giá Phí & Phép tính Chính xác (`US-006`)

- **Bảng `fee_rate_configs` + `PUT /api/fees/rates` (chỉ `ADMIN`, `ACCOUNTANT`) & `GET /api/fees/rates`:**
  - Validate khung giá bằng `feeCalculationStrategy.js`: Phí dịch vụ $2.500\text{–}16.500\text{ đ/m}^2$, Phí quản lý $\ge 7.000\text{ đ/m}^2$, bắt buộc có `effectiveFrom` (`YYYY-MM-DD`).
  - Ghi bảng `fee_rate_configs` kèm `audit_logs` trong cùng transaction. Không sửa hóa đơn đã phát hành trước đó.
- **Query chọn giá cho kỳ `YYYY-MM`:**
  - Lấy bản ghi mới nhất có `effective_from <= YYYY-MM-01` (sắp xếp theo `effective_from DESC, id DESC LIMIT 1`). Nếu chưa có cấu hình hợp lệ tại ngày đầu kỳ thì trả lỗi `422` nêu rõ thiếu đơn giá.
- **Số học tiền VND:** Làm tròn từng khoản phí tới đồng nguyên bằng số nguyên/decimal chính xác (ví dụ nhân bằng số nguyên hoặc `DECIMAL`, làm tròn `Math.round`), không so sánh `float` trực tiếp để quyết định đủ/thiếu nợ.

---

### Phần 3 — Xem trước, Phát hành & Hủy/Thay Hóa đơn Đầu kỳ (`US-008`)

**1. Quy ước chọn hộ/diện tích hiện tại và giá hiệu lực đầu kỳ:**
- Hộ chịu phí là hộ hiện hữu của căn tại thời điểm phát hành kỳ hiện tại/tương lai; căn không có hộ/nhân khẩu đang cư trú thì bỏ qua. Tạm trú/tạm vắng không tự miễn phí. Giữ mô hình 1 hộ/căn, không thêm starts_on/ends_on hay chuyển giao hộ.
- Diện tích lấy apartments.area hiện tại rồi ghi area_snapshot bất biến; giá lấy cấu hình hiệu lực tại đầu kỳ. Không tạo apartment_area_versions, không phát hành mới kỳ quá khứ (422).

**2. Quy trình 2 bước Preview → Generate (`POST /api/billing-periods/preview` & `/generate` — chỉ `ADMIN`, `ACCOUNTANT`):**
- **Bước Preview:** Tính danh sách căn đủ điều kiện, căn trống bỏ qua, đơn giá áp dụng, tổng phải thu; server ký `previewToken` (chứa `actorId`, `period`, `fingerprint` của dữ liệu nguồn và hạn 10 phút).
- **Bước Generate:** Nhận `period` và `previewToken`. Trong 1 MySQL Transaction (khóa căn/hộ liên quan):
  - Kiểm tra kỳ `YYYY-MM` đã có bản `ISSUED` chưa (nếu có $\to$ trả `409`).
  - Xác minh chữ ký `previewToken`, đúng `actorId` đang đăng nhập, đúng `period` và đúng mục đích phát hành toàn kỳ; không chấp nhận token thay thế hóa đơn ở endpoint `/generate`. Không tin các claim khi chưa xác minh chữ ký. Token sai người/quyền trả `403`; token không hợp lệ, hết hạn hoặc sai kỳ/mục đích trả `409`, yêu cầu xem trước lại.
  - Tính lại `fingerprint` từ dữ liệu lịch sử trong transaction; nếu khác fingerprint đã ký thì trả `409` (*"Dữ liệu đã thay đổi, vui lòng Xem trước lại"*).
  - Insert toàn bộ `apartment_bills` với đầy đủ snapshot (`room_number_snapshot`, `payer_name_snapshot`, `area_snapshot`, `service_unit_price`, `management_unit_price`, `service_fee`, `management_fee`, `total_due`, `lifecycle_status = 'ISSUED'`, `revision = 1`) + ghi `audit_logs`. Lỗi 1 căn thì rollback cả kỳ.

**3. Hủy & Phát hành thay thế hóa đơn sai (`POST /api/bills/:billId/cancel` & `/replace`):**
- Chỉ `ADMIN` / `ACCOUNTANT`; bắt buộc có `reason`. Khóa hóa đơn (`FOR UPDATE`): nếu còn giao dịch `fee_payments` trạng thái `VALID` thì chặn `409` (buộc hủy thu nhầm trước).
- Đánh dấu bản cũ `CANCELLED` (giữ nguyên snapshot), phát hành bản mới `revision + 1`, `replaces_bill_id = oldId` từ preview thay thế (`replacesBillId`) + ghi `audit_logs` trong cùng transaction.
- `/replace` nhận `{ reason, previewToken }`; token tạo từ preview có `replacesBillId`, được ký và ràng buộc đúng người, kỳ, mục đích thay thế và chính `billId` trên URL. Kiểm tra hạn dùng và fingerprint trong transaction như phát hành thường; không dùng token thay toàn kỳ hay thay một hóa đơn khác.

---

### Phần 4 — Thu tiền, Phân bổ Phí, Idempotency & Hủy Giao dịch (`US-010`)

**1. Ghi nhận thu tiền (`POST /api/payments` — chỉ `ADMIN`, `TREASURER`):**
- Input gồm `billId`, `amount` (`> 0`), `paymentMethod` (`CASH` | `BANK_TRANSFER`), `payerName`, `note`, `idempotencyKey`.
- Bên trong 1 MySQL Transaction:
  1. Kiểm tra `idempotencyKey` trong `fee_payments`: tính `request_fingerprint` từ payload chuẩn hóa (`billId`, `amount`, `paymentMethod`, `payerName`). Nếu `idempotencyKey` đã tồn tại: trùng fingerprint $\to$ trả về `200 { payment, bill, replayed: true }`; khác fingerprint $\to$ trả `409`.
  2. Khóa hóa đơn (`SELECT ... FROM apartment_bills WHERE id = ? FOR UPDATE`). Sau khi lấy được khóa, đọc lại key bằng current read (`SELECT ... FOR UPDATE`) và xử lý replay trước khi kiểm tra số dư, vì request khác có thể vừa commit trong lúc chờ khóa. Chỉ thu mới nếu `lifecycle_status = 'ISSUED'`. Kiểm tra `debt_amount = total_due - total_paid`: nếu `debt_amount <= 0` hoặc `amount > debt_amount` $\to$ trả `409` / `400`.
  3. **Phân bổ tiền nộp vào 2 loại phí (Dịch vụ trước $\to$ Quản lý sau):**
     - `serviceRemaining = service_fee - service_paid`
     - `servicePaidAmount = Math.min(amount, serviceRemaining)`
     - `managementPaidAmount = amount - servicePaidAmount`
  4. Sinh mã biên lai duy nhất `receipt_number` (`BL-YYYYMM-...`, đảm bảo không trùng khi chạy đồng thời, không dùng `COUNT(*)` không khóa).
  5. Insert `fee_payments` (`status = 'VALID'`), cập nhật `service_paid`, `management_paid`, `total_paid`, `status` (`PARTIAL`/`PAID`) trên `apartment_bills`, ghi `audit_logs` trong cùng transaction rồi `commit`. Trả cả `payment` và `bill` mới nhất để UI cập nhật dòng tại chỗ.
- **Bảo vệ khi chạy đồng thời:** `idempotency_key` bắt buộc có `UNIQUE` ở DB; bước đọc trước không thay thế ràng buộc này. Nếu insert bị duplicate đúng index key, rollback transaction đang thử, đọc bản đã commit trong transaction mới rồi đối chiếu fingerprint và quyền để trả replay hoặc `409`. Không trả lỗi SQL và không nhầm duplicate mã biên lai với duplicate key. Deadlock/lock timeout phải rollback; nếu retry thì giới hạn số lần và giữ nguyên key/payload. Xác thực/phân quyền trước mọi nhánh trả replay; replay giao dịch đã hủy trả bản cũ với trạng thái `VOIDED`, không tạo khoản thu mới.

**2. Hủy giao dịch thu nhầm (`POST /api/payments/:paymentId/void` — chỉ `ADMIN`, `TREASURER`):**
- Body HTTP thống nhất `{ reason }` (lý do không rỗng), truyền vào `voidPayment(paymentId, { reason }, actor)`; ánh xạ sang cột `void_reason`. Đọc ID hóa đơn của giao dịch, khóa `apartment_bills` trước rồi khóa `fee_payments FOR UPDATE`, kiểm tra lại liên kết và trạng thái dưới khóa để giữ cùng thứ tự khóa với luồng thu.
- Nếu giao dịch đã `VOIDED` thì chặn `409` (không trừ nợ 2 lần).
- Chuyển giao dịch sang `status = 'VOIDED'`, tính lại `service_paid`, `management_paid`, `total_paid` trên `apartment_bills` bằng tổng các trường phân bổ đã lưu của giao dịch `VALID`; không phân bổ lại hay sửa chứng từ lịch sử còn hợp lệ.
- Trong cùng transaction, tính lại `debt_amount = total_due - total_paid` và trạng thái thanh toán hóa đơn: `UNPAID` khi `total_paid = 0`, `PARTIAL` khi `0 < total_paid < total_due`, `PAID` khi đã đủ; không đổi `lifecycle_status`. Ghi `audit_logs` (`before_data`, `after_data`, `reason`), commit và trả `{ payment, bill }` mới nhất cho UI. Ví dụ hóa đơn 810.000 đ đã thu đủ, hủy 310.000 đ thì phải còn nợ 310.000 đ và chuyển về `PARTIAL`.

---

### Phần 5 — Công nợ, Giấy báo in, Lịch sử & Báo cáo Excel (`US-009`, `012`, `013`, `014`)

- **Bảng thu & Công nợ (`GET /api/billing-periods/:period/bills`, `GET /api/apartments/:id/payments`):**
  - Chuẩn hóa bộ lọc dùng chung (`period`, `apartmentId`, `householdId`, `search`, `status`). Thẻ KPI (*Tổng phải thu*, *Tổng đã thu*, *Còn nợ*) tính bằng query tổng chạy trên **cùng bộ lọc** với bảng danh sách (không phụ thuộc phân trang).
  - Luôn loại hóa đơn `CANCELLED` và giao dịch `VOIDED` khỏi số tổng hợp, nhưng vẫn hiển thị trong bảng lịch sử kèm nhãn rõ ràng.
  - Công nợ tách rõ: **nợ kỳ này**, **nợ các kỳ trước** và **tổng nợ lũy kế** của hộ gắn với căn; không tách nợ hộ cũ/mới trong v1.0.
- **Giấy báo & Biên lai (`GET /api/bills/:billId/notice`, `GET /api/billing-periods/:period/notices?billIds=...`, `GET /api/payments/:paymentId/receipt`):**
  - Mọi chứng từ đọc 100% từ snapshot của `apartment_bills` / `fee_payments` (đổi giá hay đổi chủ hộ ở hiện tại không làm đổi chứng từ kỳ cũ).
  - Chứng từ của giao dịch `VOIDED` / hóa đơn `CANCELLED` bắt buộc hiển thị dấu **ĐÃ HỦY**; **In lại tuyệt đối không tạo giao dịch hay cộng tiền**.
  - In lô nhiều giấy báo kiểm tra đủ từng `billId` thuộc đúng kỳ và giới hạn tối đa 100 bản/lượt.
- **Xuất Excel (`GET /api/reports/collections/export`):**
  - Hỗ trợ 2 chế độ: `mode=period&period=YYYY-MM` (theo kỳ hóa đơn) và `mode=collection_month&month=YYYY-MM` (theo tháng thực thu `Asia/Ho_Chi_Minh`, quy đổi ra khoảng UTC tương ứng `[đầu tháng VN, đầu tháng sau VN)`).
  - Tổng hợp tiền dịch vụ và tiền quản lý từ `service_paid_amount`, `management_paid_amount` của các khoản thu `VALID`; giữ số phòng dạng chuỗi (`'050'`), tiếng Việt có dấu, ngày `dd/mm/yyyy` và ghi thời điểm xuất báo cáo.

---

### Phần 6 — Quỹ Đóng góp Tự nguyện (`US-007`, `US-011`) & Cổng Cư dân (`/api/me/*`)

- **Quỹ tự nguyện (`voluntary_campaigns`, `voluntary_contributions`):**
  - Tạo đợt (`POST /api/campaigns`) và đóng đợt (`PATCH /api/campaigns/:id/status`) dành cho `ADMIN`, `BQT`, `ACCOUNTANT`. Ghi nhận đóng góp (`POST /api/contributions`) và hủy ghi nhầm (`POST /api/contributions/:id/void`) dành cho `ADMIN`, `BQT`, `TREASURER`.
  - Chỉ nhận đóng góp khi đợt ở trạng thái `OPEN` và ngày nghiệp vụ hợp lệ (`start_date <= today <= end_date`); dùng `idempotencyKey` + `request_fingerprint`, sinh biên nhận có snapshot phòng/người nộp, tách rời hoàn toàn khỏi công nợ phí bắt buộc.
  - Chống trùng khi chạy đồng thời theo cùng nguyên tắc ở Phần 4: key `UNIQUE`, khóa đợt trước khi kiểm tra nhận khoản mới, đọc lại key sau khi lấy khóa, xử lý duplicate bằng rollback/đọc bản đã commit và kiểm quyền trước replay. Replay khoản đã ghi nhận được xử lý trước điều kiện nhận khoản mới, kể cả đợt đã đóng. Endpoint hủy nhận `{ reason }`, ánh xạ sang `void_reason`, không trừ tổng hai lần.
- **Cổng Cư dân (`GET /api/me/bills`, `GET /api/me/bills/:billId/receipts`, `GET /api/me/contributions`, `GET /api/me/contributions/:id/receipt`):**
  - JWT hiện chứa `sub`, role, username và tokenVersion, không chứa `resident_id`/`household_id`. Sau `requireAuth`, dùng `req.user.id` truy vấn DB theo `users.resident_id -> residents.household_id -> households`; kiểm tra lại liên kết và hiệu lực hiện tại trên mỗi request. Không lấy căn/hộ làm căn cứ cấp quyền từ body, query hay claim do client tự gửi; mọi ID chứng từ trên URL phải được đối chiếu với hộ được phép truy cập.
  - Dùng `resolveEffectiveResidencyStatus(...)` với ngày VN: nếu cư dân đã `"Chuyển đi"` hoặc hộ đã kết thúc $\to$ `403`.
  - Chỉ trả về hóa đơn, biên lai và đóng góp của hộ gắn với cư dân đang hợp lệ; kiểm quyền từng chứng từ. Không thêm joined_household_on hoặc giới hạn lịch sử theo tháng gia nhập trong v1.0 (DEC-03/07).

---

### Phần 7 — Cập nhật Frontend theo Bộ Thiết kế SVG & Kiểm chứng

1. **Bám sát quy chuẩn ở [design/bluemoon-ui-redesign/README.md](../design/bluemoon-ui-redesign/README.md) & [SPRINT2-DESIGN.md](../design/bluemoon-ui-redesign/SPRINT2-DESIGN.md):**
   - Dùng bộ màu teal/navy (`#116A73`, nền `#F5F7FA`, chữ `#172B3A`), sidebar 224 px trên desktop, chuyển thẻ gọn ở viewport `390px` (mobile).
   - **Trang `/billing` (`BillingPage.jsx`):**
     - Khu mặc định: chọn kỳ, tìm phòng, lọc trạng thái, 3 thẻ tổng hợp, nút Xuất Excel theo bộ lọc, bảng hóa đơn.
     - Panel chi tiết khi chọn 1 căn: danh sách kỳ còn nợ theo thứ tự cũ $\to$ mới, form thu tiền tự điền số còn nợ + hiển thị trước phần phân bổ Dịch vụ/Quản lý + modal xác nhận ngắn + giữ nguyên `idempotencyKey` nếu mất mạng cần thử lại + thu xong chuyển nhanh sang kỳ tiếp theo của hộ đang mở; bảng lịch sử kèm nút *In lại biên lai* và *Hủy giao dịch*.
     - Khu `<details>` thu gọn cho chuẩn bị kỳ mới: cấu hình đơn giá + 2 bước *Xem trước bảng thu* $\to$ *Xác nhận phát hành*.
   - **Trang `/campaigns` (`CampaignsPage.jsx`), `/accounts` (`IssueAccountPage.jsx` — đổi vai trò + Audit Log) và trang Cư dân `/` (`ResidentHomePage.jsx`):**
     - Trang Cư dân đưa khối **Còn phải đóng $\to$ Chi tiết khoản phí $\to$ Lịch sử & Biên lai** lên trên, phần nhân khẩu đặt gọn bên dưới.
   - Không mở nút hành động cho chức năng khi API và middleware phân quyền tương ứng chưa hoàn tất.

2. **Kiểm thử & Nghiệm thu bắt buộc trước khi đóng Sprint 2:**
   - Viết unit test mock theo TDD cho từng service + viết bộ test tích hợp DB thật (`backend/tests/db/` chạy với `TEST_DB_*` trỏ vào database `_s2_test`).
   - Kiểm tra đồng thời thật (2 request cùng lúc thu 1 hóa đơn, 2 request cùng `idempotencyKey`), rollback khi audit lỗi, xem trước hết hạn (`409`), đổi đại diện cùng hộ giữ snapshot, print preview A4/A5, responsive `390px`, backup & restore trên DB thử và đo hiệu năng mẫu theo mục 3.11 của [sprint2-technical-base.md](./sprint2-technical-base.md).
   - Bổ sung các ca biên theo hướng dẫn này: cùng key/cùng payload trả cùng giao dịch, cùng key/khác payload trả `409` kể cả gửi đồng thời; replay sau hủy không thu lại; hủy từ `PAID` về `PARTIAL`/`UNPAID`; token sai người/sai kỳ/sai hóa đơn/sai mục đích không phát hành; cư dân không lấy được chứng từ hộ khác. Áp dụng kiểm thử replay/concurrency tương tự cho quỹ tự nguyện.
