# Hợp đồng HTTP Sprint 2 — Draft v0.1

Cập nhật 28/11/2026. **Thiết kế đề xuất, chưa phải API đang chạy.** Nhóm cần chốt tên trường, query và giới hạn ở task liên quan trước khi frontend/backend tích hợp (DEC-09). Không coi ví dụ JSON là dữ liệu đã trả từ server.

Nguồn nghiệp vụ/schema/quyền: [thiết kế kỹ thuật](sprint2-technical-base.md). Luồng xử lý transaction, replay, token: [hướng dẫn S2](huong-dan-lam-sprint2.md). HTTP dùng camelCase, DB dùng snake_case và ánh xạ ở repository; không yêu cầu đổi response S1 trong đợt này.

## 1. Quy ước chung

- Base path `/api`; `Authorization: Bearer <token>` ở mọi endpoint bên dưới. JSON request dùng `Content-Type: application/json`.
- ID là số nguyên dương; không coi ID mẫu là ID seed thật. `roomNumber` luôn là chuỗi, ví dụ `"050"`.
- Ngày nghiệp vụ `YYYY-MM-DD` theo VN; kỳ `YYYY-MM`; timestamp là ISO 8601 có múi giờ, ví dụ `2026-11-28T03:00:00.000Z`. Ngày phải tồn tại, không chỉ đúng regex.
- Tiền JSON là số nguyên đồng không âm, khoản thu phải dương; trong giới hạn safe integer và schema DB. Diện tích là số m² dương tối đa 2 chữ số thập phân; phép tính dùng decimal/số nguyên chính xác và làm tròn từng khoản.
- Thành công theo kiểu hiện có: `{ "success": true, ...trườngNghiệpVụ }`; không thêm tầng `data` chỉ ở một phía. Lỗi tối thiểu `{ "success": false, "message": "..." }`, tương thích helper hiện tại. UI xử lý theo HTTP status, không parse câu lỗi.
- `201` khi tạo chứng từ mới; `200` cho đọc/cập nhật/replay. PUT đơn giá tạo phiên bản mới và trả `200 { success, rateConfig }` theo quy ước endpoint này.
- `400` input sai; `401` thiếu/hết phiên; `403` không đủ quyền; `404` không tìm thấy hoặc chứng từ ngoài phạm vi cư dân; `409` xung đột/key khác payload/preview không hợp lệ; `422` thiếu lịch sử; `500` lỗi nội bộ được che chi tiết.
- Không nhận `actorId`, `recordedBy` hoặc vai trò trong body làm căn cứ quyền. Nội bộ = ADMIN/BQT/ACCOUNTANT/TREASURER, theo ma trận kỹ thuật; cư dân chỉ qua các API cho phép.
- Giới hạn chuỗi draft: tên người nộp 2–120 ký tự, note/reason tối đa 255 ký tự, reason bắt buộc có nội dung sau trim; key UUID v4 tối đa 64 ký tự. Bộ mã `fundCode` cần chốt ở T08, không tự suy ra từ nhãn tiếng Việt.

## 2. Kiểu dữ liệu dùng chung

**Bill** (các trường tối thiểu):

```json
{
  "id": 101,
  "period": "2026-11",
  "apartmentId": 50,
  "householdId": 501,
  "roomNumberSnapshot": "050",
  "payerNameSnapshot": "Người thử A",
  "areaSnapshot": 90,
  "serviceUnitPrice": 4000,
  "managementUnitPrice": 7000,
  "serviceFee": 360000,
  "managementFee": 630000,
  "totalDue": 990000,
  "servicePaid": 360000,
  "managementPaid": 140000,
  "totalPaid": 500000,
  "debtAmount": 490000,
  "status": "PARTIAL",
  "lifecycleStatus": "ISSUED",
  "revision": 1,
  "replacesBillId": null
}
```

Ví dụ này dùng đơn giá quản lý hợp lệ 7.000 đ/m²; ví dụ 810.000 đ trong tài liệu cũ được xử lý riêng trong [dữ liệu thử](sprint2-test-data.md), không dùng làm mẫu cấu hình giá hợp lệ.

**Payment**: `id`, `billId`, `amount`, `servicePaidAmount`, `managementPaidAmount`, `paymentMethod`, `payerNameSnapshot`, `receiptNumber`, `status`, `paidAt`, `voidReason` (null khi chưa hủy), `voidedAt` (null khi chưa hủy). `amount = servicePaidAmount + managementPaidAmount`; trạng thái VALID/VOIDED. Response không cần trả fingerprint hoặc token nội bộ.

**Contribution**: `id`, `campaignId`, `apartmentId`, `householdId`, `roomNumberSnapshot`, `payerNameSnapshot`, `amount`, `paymentMethod`, `receiptNumber`, `status`, `contributedAt`, `voidReason`, `voidedAt`.

**Campaign**: `id`, `name`, `fundCode`, `startDate`, `endDate`, `status`, `totalContributed` (chỉ tổng VALID).

**Notice**: `bill` chứa snapshot, `generatedAt`, `cancelled` lấy từ vòng đời bill. **Receipt**: payment/contribution, snapshot phòng/người nộp, snapshot bill hoặc campaign tương ứng, `generatedAt`, `voided`. Không tạo giao dịch khi đọc/in lại; chứng từ hủy có dấu ĐÃ HỦY.

## 3. Query và danh sách

Đề xuất `page=1`, `pageSize=20`, tối đa 100; số âm, không nguyên hoặc vượt giới hạn trả `400`. Sắp xếp ổn định do server quy định (bill theo phòng rồi ID; lịch sử theo thời điểm giảm dần rồi ID). Không nhận biểu thức SQL sort từ client.

Danh sách trả `{ success, items, pagination: { page, pageSize, totalItems, totalPages } }`; không có kết quả thì `items: []`, totalItems/totalPages bằng 0. Endpoint có tổng tiền thêm `totals`, tính trên toàn bộ tập lọc trước phân trang.

- Bảng thu: `apartmentId`, `householdId`, `search` (trim, tối đa 120), `status=UNPAID|PARTIAL|PAID`, `unpaidOnly=true|false`. Nếu kết hợp `unpaidOnly=true` và `status=PAID`, trả `400`.
- `period` trong path quyết định kỳ; không gửi thêm query kỳ khác. ID căn/hộ lọc chính xác; hộ phải thuộc căn nếu cùng gửi.
- Bảng thu mặc định chỉ ISSUED. Lịch sử vẫn trả bản hủy với trạng thái rõ ràng. API quản trị đọc bản hủy theo ID không bị mất chứng từ.
- `totals`: `totalDue`, `totalPaid`, `currentPeriodDebt`, `priorPeriodsDebt`, `totalAccumulatedDebt`. Ba trường đầu tính trên hóa đơn kỳ đang xem khớp filter. Prior là nợ trước kỳ của các hộ xuất hiện trong tập kết quả kỳ đó trước phân trang; không cộng lại ở mỗi dòng hay đưa vào totalDue kỳ này. Panel theo căn phải liệt kê cả hộ cũ không có bill kỳ hiện tại bằng truy vấn lịch sử riêng, không suy ra tổng toàn căn từ prior của bảng kỳ.
- Lịch sử căn nhận `householdId`, `period` (chỉ lọc phần hóa đơn), `status=VALID|VOIDED`, page/pageSize; phần đóng góp không bị gán một kỳ hóa đơn giả. UI ghi rõ hai nhóm kết quả.
- Audit giữ query `entity_type`, `action`, `from`, `to`, page/pageSize; `from/to` là timestamp ISO, khoảng `[from,to)`. Trả `400` nếu khoảng đảo ngược.

## 4. Endpoint và body/response tối thiểu

Trường body không có dấu `?` là bắt buộc. Tên object response dưới đây được đặt cùng cấp với `success`.

| Endpoint | Quyền | Body/query ngoài quy ước chung | Response thành công |
|---|---|---|---|
| GET `/fees/rates` | Nội bộ | page/pageSize | `items` RateConfig + pagination |
| PUT `/fees/rates` | ADMIN, ACCOUNTANT | `serviceUnitPrice, managementUnitPrice, effectiveFrom, note?` | `rateConfig` gồm id và các trường cấu hình |
| POST `/billing-periods/preview` | ADMIN, ACCOUNTANT | `period, replacesBillId?` | `period, previewToken, expiresAt, eligible, skipped, totals` |
| POST `/billing-periods/generate` | ADMIN, ACCOUNTANT | `period, previewToken` | 201: `period, bills, totals` |
| GET `/billing-periods/:period/bills` | Nội bộ | Bộ lọc bảng thu | `items` Bill, pagination, totals |
| POST `/bills/:billId/cancel` | ADMIN, ACCOUNTANT | `reason` | `bill` đã CANCELLED |
| POST `/bills/:billId/replace` | ADMIN, ACCOUNTANT | `reason, previewToken` | 201: `cancelledBillId, bill` revision mới |
| GET `/bills/:billId/notice` | Nội bộ | Không | `notice` |
| GET `/billing-periods/:period/notices` | Nội bộ | `billIds=101,102` — 1–100 ID duy nhất | `notices` — sai một ID/kỳ thì từ chối toàn lô |
| POST `/payments` | ADMIN, TREASURER | `billId, amount, paymentMethod, payerName, idempotencyKey, note?` | 201 mới / 200 replay: `payment, bill, replayed` |
| POST `/payments/:paymentId/void` | ADMIN, TREASURER | `reason` | `payment, bill` đã tính lại |
| GET `/payments/:paymentId/receipt` | Nội bộ | Không | `receipt` |
| GET `/apartments/:id/payments` | Nội bộ | Bộ lọc lịch sử căn | `payments, contributions` mỗi nhóm có items/pagination; `households` và `debtsByHousehold` để tách nợ hộ cũ/mới |
| GET `/campaigns` | Nội bộ, RESIDENT | page/pageSize, `status?=OPEN|CLOSED` | `items` Campaign, pagination; không lộ danh sách người đóng cho RESIDENT |
| POST `/campaigns` | ADMIN, BQT, ACCOUNTANT | `name, fundCode, startDate, endDate` | 201: `campaign` OPEN |
| PATCH `/campaigns/:id/status` | ADMIN, BQT, ACCOUNTANT | `status: "CLOSED"` | `campaign`; không hỗ trợ mở lại |
| POST `/contributions` | ADMIN, BQT, TREASURER | `campaignId, apartmentId, householdId, amount, paymentMethod, payerName, idempotencyKey` | 201 mới / 200 replay: `contribution, replayed` |
| POST `/contributions/:id/void` | ADMIN, BQT, TREASURER | `reason` | `contribution, campaign` với tổng mới |
| GET `/contributions/:id/receipt` | Nội bộ | Không | `receipt` |
| GET `/me/bills` | RESIDENT | page/pageSize, `period?, status?` | `items` Bill, pagination, totals của hộ được phép |
| GET `/me/bills/:billId/receipts` | RESIDENT | page/pageSize | `items` Receipt, pagination |
| GET `/me/contributions` | RESIDENT | page/pageSize, `campaignId?` | `items` Contribution, pagination |
| GET `/me/contributions/:id/receipt` | RESIDENT | Không | `receipt` |
| POST `/apartments/:id/household-transfers` | ADMIN, BQT | `headResident, reason` | 201: `previousHouseholdId, householdId, effectiveDate` |
| PATCH `/accounts/:id/role` | ADMIN | `role` trong 5 vai trò | `user` public, không trả secret; không biến staff thành resident nếu thiếu liên kết hồ sơ phù hợp |
| GET `/audit-logs` | ADMIN | Bộ lọc audit | `items` audit + pagination |
| GET `/reports/collections/export` | Nội bộ | Bộ lọc báo cáo mục 6 | Binary XLSX |

`RateConfig`: id, serviceUnitPrice, managementUnitPrice, effectiveFrom, note. `headResident` gồm `fullName, birthDate, cccd?`; dùng cùng validation S1, server đặt quan hệ Chủ hộ và tạo hồ sơ thuộc hộ mới. Không nhận householdId hoặc ngày chuyển lùi từ body.

`eligible` preview chứa `apartmentId, householdId, roomNumber, payerName, area, serviceUnitPrice, managementUnitPrice, serviceFee, managementFee, totalDue`; `skipped` chứa căn và lý do bỏ qua. Tổng preview gồm `eligibleCount, skippedCount, totalDue`. Thiếu lịch sử trả 422 toàn preview, không đưa căn thiếu vào nhóm “trống”. Preview thay thế chỉ có một hóa đơn đích; token ràng buộc actor/kỳ/mục đích/ID như hướng dẫn S2.

## 5. Ví dụ thu tiền và lỗi

```json
{
  "billId": 101,
  "amount": 500000,
  "paymentMethod": "BANK_TRANSFER",
  "payerName": "Người thử A",
  "note": "Dữ liệu giả lập",
  "idempotencyKey": "3b114515-8528-4b1a-9000-000000000001"
}
```

Với bill 990.000 đ ở mục 2 và chưa thu trước đó: payment phân bổ DV 360.000, QL 140.000; bill totalPaid 500.000, debtAmount 490.000, PARTIAL. Tạo mới trả `201 { success, payment, bill, replayed: false }`; retry cùng key/payload trả 200 và cùng payment.id, `replayed: true`. Retry sau khi payment bị hủy trả payment cũ VOIDED và bill hiện tại, không phục hồi khoản thu.

```json
{ "success": false, "message": "Mã yêu cầu đã được dùng với nội dung khác." }
```

Lỗi trên trả 409. Không expose SQL, fingerprint, token hay dữ liệu hộ khác. Mất phản hồi không chứng minh thất bại: UI giữ key và payload cho retry; chỉ tạo key mới cho ý định thu mới. 5xx cũng có thể xảy ra sau commit, nên không tự đổi key khi chưa xác định kết quả.

## 6. Excel và quyền cư dân

- Report nhận `mode=period&period=YYYY-MM` hoặc `mode=collection_month&month=YYYY-MM`, không trộn hai chế độ. Các bộ lọc áp dụng được: apartmentId, householdId, search, trạng thái thanh toán hóa đơn. Khi lọc trạng thái bill, phần quỹ không có trạng thái này phải ở sheet riêng và ghi rõ phạm vi; không gán trạng thái bill cho đóng góp. Tổng quỹ không cộng vào nợ bắt buộc.
- Period mode báo cáo theo kỳ bill; phần quỹ theo ngày đóng góp trong tháng cùng tên, ghi tiêu đề rõ. Collection-month mode dùng thời điểm thực thu VN cho cả hai loại khoản thu. Chỉ cộng VALID; loại bill CANCELLED khỏi số liệu phí hợp lệ. Lịch sử hủy không bị xóa.
- Trả MIME `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`, Content-Disposition attachment, Cache-Control no-store. Lỗi trả JSON với HTTP lỗi; frontend gọi helper ở chế độ blob và xử lý lỗi như hiện có.
- API cư dân suy hộ từ user DB sau xác thực, kiểm trạng thái cư trú và ngày gia nhập; không tin ID căn/hộ client. Khoản đóng góp không có kỳ hóa đơn: giới hạn theo tháng contributedAt VN so với tháng gia nhập, cần nhóm chốt DEC-07 trước triển khai.
- Thiết kế hiện chưa có endpoint giấy báo riêng cho cư dân. `/me/bills` trả đủ snapshot tối thiểu của Bill để hiển thị/in giấy báo của hộ được phép; không gọi API notice nội bộ bằng token RESIDENT. Nếu cần endpoint riêng, bổ sung API/quyền/test cùng PR trước khi nối UI.

## 7. Chốt hợp đồng khi nhận task

Người backend và frontend/tester review body/response mẫu, đơn vị tiền, bộ lọc, lỗi và quyền; ghi quyết định DEC-09. T08 cần chốt bộ fundCode; T06/T07 cần xác nhận phạm vi totals và sheet báo cáo; T09 xác nhận giới hạn lịch sử đóng góp. Fixture trong tài liệu chỉ là đặc tả; chưa có server mock/Postman/OpenAPI được tạo bởi file này. Mọi thay đổi đã chốt cần sửa các ví dụ và test tương ứng, không đổi một phía.
