# Kế hoạch triển khai Sprint 2 — BlueMoon SE09

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking. Chỉ bắt đầu code khi được giao triển khai; tài liệu này không tự cho phép migration database dùng chung, deploy hay gửi thông báo cho thành viên.

**Goal:** Hoàn thiện luồng quản lý căn/hộ → bảng thu → thanh toán → biên lai → công nợ → báo cáo và quyền tra cứu cư dân, đồng thời áp dụng giao diện mới mà giữ nghiệp vụ Sprint 1.

**Architecture:** Giữ React/Vite → Express routes/handlers → services/validators → repositories → MySQL. Dùng chung resolver cư trú, ngày Việt Nam và logic bộ lọc; mọi ghi tài chính có quyền, transaction, khóa dòng và audit. Lịch sử hộ/diện tích và snapshot chứng từ là nền cho thu phí.

**Tech Stack:** JavaScript ESM, React, React Router, Vite, Express, mysql2, JWT/bcrypt, ExcelJS, node:test; giữ phiên bản trong manifest/lockfile. Không mặc định thêm thư viện hoặc nâng cấp môi trường.

**Spec:** [Thiết kế kỹ thuật S2](./sprint2-technical-base.md), [backlog và tiêu chí bổ sung](./product-vision-and-backlog.md), [test plan S2](./test-plan-and-cases-s2.md), [UI S2](./wireframes-sprint2-uiux.md), [bộ thiết kế mới](../design/bluemoon-ui-redesign/README.md).

Ngày lập: **28/11/2026**. Trạng thái: **Planned — chưa triển khai các task bên dưới**. Người phụ trách và lịch là đề xuất dựa trên phân công backlog, chưa phải xác nhận của từng thành viên.

## Global Constraints

- Giữ 11 US S2 (`US-006`–`US-014`, `US-018`, `US-019`), nối với 8 US S1. Không thêm xe, điện nước, cổng thanh toán hay ứng dụng native vào v1.0.
- Bảo toàn hành vi S1 đã sửa: kiểm tra chủ hộ độc lập với bảng đang lọc để chọn quan hệ khi đổi căn; khóa input khi POST đang lưu nhưng vẫn cho đổi căn khi kiểm tra chủ hộ lỗi. Backend tiếp tục chặn chủ hộ trùng; không khôi phục giới hạn cũ khi áp giao diện S2.
- Ngày nghiệp vụ `Asia/Ho_Chi_Minh`, dùng `shared/businessDate.mjs`; thời điểm lưu UTC. Tiền VND làm tròn từng khoản tới đồng, tính bằng số nguyên/decimal chính xác.
- Phạm vi đã chốt ngày 28/11/2026 (`DEC-01/02/03/05`): chỉ phát hành hóa đơn cho **kỳ hiện tại hoặc tương lai** (**bỏ sinh bù kỳ cũ** và bảng `apartment_area_versions`), không chia phí theo ngày, căn trống bỏ qua; **bỏ chuyển giao hộ A → B** tách lịch sử & nợ trong v1.0 (giữ mô hình 1 hộ/căn của S1); **giữ hủy & phát hành thay thế hóa đơn sai** (`cancel/replace` + `revision`, chặn khi còn khoản thu `VALID`).
- Hủy khoản ghi nhận không đồng nghĩa hoàn tiền thực tế; v1.0 không hoàn tiền tự động/khóa sổ kế toán. Thu nhiều kỳ theo lần lượt từng hóa đơn trong một panel, không tạo giao dịch gộp nhiều hóa đơn.
- Không xóa chứng từ; hóa đơn hủy và giao dịch hủy có nhãn riêng. Không cho sửa snapshot trực tiếp. Mọi endpoint kiểm tra quyền ở backend, không chỉ ẩn menu.
- Code S1 và thay đổi chưa commit phải được bảo toàn. Không seed, restore hoặc chạy migration thử vào database Cloud đang dùng demo.
- 9 SVG là hướng thiết kế, chưa phải Figma native hay frontend đã áp dụng. Chỉ dùng giao diện phù hợp chức năng đã có; mẫu S2 không được xuất hiện như tính năng hoạt động trước khi API tương ứng hoàn thành.

## Review Focus

1. Chuyển hộ hoặc nhân khẩu gia nhập sau: hộ mới không nhận nợ/xem chứng từ hộ cũ; kiểm ở T01/T09.
2. Mạng mất sau commit, gửi trùng hoặc hai người thu đồng thời: chỉ đúng một giao dịch, không thu vượt nợ; kiểm ở T05/T11.
3. Dữ liệu đổi sau preview, sinh bù thiếu lịch sử hoặc sửa hóa đơn đã thu: không dùng dữ liệu âm thầm khác bản xác nhận; kiểm ở T03/T04.
4. Đầu tháng Việt Nam, khoản thu cuối tháng, float và số dư sau hủy: ngày/kỳ và tổng tiền luôn nhất quán; kiểm ở T03/T05/T07.
5. Tài khoản bị hạ quyền, link chứng từ đoán được, xóa căn có tài chính: thu hồi quyền và giữ dữ liệu; kiểm ở T01/T02/T09.

## 1. Phạm vi, nguồn quyết định và điều kiện bắt đầu

Luồng ưu tiên: **Lịch sử hộ/diện tích + quyền/audit → đơn giá → preview/phát hành → thu tiền → công nợ/biên lai → cư dân → quỹ/báo cáo → nghiệm thu**.

Điều kiện vào sprint: xác nhận quy ước v1.0 ở trên; tạo database thử riêng; lưu baseline S1; phân công người duyệt từng phần. Ước lượng **38 SP** trong backlog cũ là baseline lịch sử, phải ước lượng lại phần mở rộng; không coi 38 SP là cam kết mới.

## 2. Phân công và mốc dự kiến

`D1` là ngày làm việc đầu tiên sau khi nhóm chốt phạm vi, không tự gán ngày bắt đầu. Khung dưới là **10 ngày làm việc dự kiến cho nhóm 4 người**, không phải bảo đảm tiến độ hoặc lịch thay thế đã được giảng viên duyệt. Lịch gốc 13–30/11/2026 được giữ để đối chiếu; không ghi các ngày đã qua như công việc đã hoàn thành.

| Task | Sản phẩm bàn giao | Chính / người rà soát đề xuất | Phụ thuộc | Mốc dự kiến |
|---|---|---|---|---|
| T00 | Baseline S1, dữ liệu thử, quy ước được ghi nhận | Hiếu / cả nhóm | — | D1 |
| T01 | Migration lịch sử hộ/diện tích và API chuyển hộ | Vĩ / Nhật | T00 | D1–D3 |
| T02 | Role middleware và audit trong transaction | Hiếu / Vĩ | T00; schema T01 để tích hợp | D1–D3 |
| T03 | Đơn giá có ngày hiệu lực, phép tính tiền | Nhật / Bảo | T02; schema T01 | D2–D3 |
| T04 | Preview, phát hành, hủy/thay hóa đơn | Nhật / Vĩ | T01–T03 | D3–D5 |
| T05 | Thu tiền, idempotency, hủy thu | Vĩ / Hiếu | T02, T04 | D5–D7 |
| T06 | Bảng thu, công nợ, lịch sử đọc | Bảo / Nhật | T01, T04; đối chiếu lại sau T05 | D4–D6 |
| T07 | Giấy báo, biên lai, Excel | Bảo / Hiếu | T05, T06; phần quỹ cần T08 | D6–D8 |
| T08 | Quỹ, đóng góp, hủy và biên nhận | Vĩ; Nhật hỗ trợ sau T04 / Bảo | T01, T02 | D7–D8 |
| T09 | Cư dân xem hóa đơn/biên nhận đúng quyền | Hiếu / Vĩ | T05–T08 | D7–D9 |
| T10 | Áp dụng giao diện và các trạng thái UX | Hiếu; mỗi người nối UI phần mình / Bảo | Khung sau T00; nghiệm thu sau T04–T09 | D2–D9 |
| T11 | E2E thật, đối soát, restore, hiệu năng, báo cáo | Hiếu điều phối / cả nhóm | T01–T10 | D9–D10 |

**Điểm nghẽn:** Vĩ phụ trách nhiều nghiệp vụ nặng; Nhật tiếp nhận phần quỹ sau T04 nếu T05 kéo dài. Các endpoint/dạng response phải chốt khi bắt đầu task để Bảo/Hiếu làm UI với fixture rõ ràng. Fixture không thay bằng chứng DB thật. Chỉ dùng tên thành viên để đề xuất phân công, không tự tạo/gửi giao việc ra dịch vụ bên ngoài.

T01 cần bàn giao hợp đồng schema và phần migration chạy được trước, mục tiêu cuối D1, rồi tiếp tục logic chuyển hộ tới D3. T02/T03 có thể viết test độc lập theo hợp đồng đó nhưng chỉ đóng task sau khi tích hợp schema thật; nếu phần schema chậm thì dịch mốc phụ thuộc, không đánh dấu hoàn thành bằng mock.

**Gate D3:** có DB thử + lịch sử hộ/diện tích + quyền/audit + đơn giá. **Gate D7:** thu một phần/đủ, hủy và công nợ đối chiếu được. **Gate D10:** đủ luồng, bằng chứng và không còn lỗi nghiêm trọng. Nếu trượt gate, cập nhật lịch/phạm vi công khai; không bỏ transaction, quyền, audit hay chống thu trùng để kịp lịch.

## 3. Cấu trúc file và giao kèo dùng chung

Tên file/hàm dưới đây là **đề xuất sẽ tạo khi triển khai**; không khẳng định đã tồn tại. Giữ cấu trúc repo hiện có, không tái cấu trúc toàn bộ S1.

| Trách nhiệm | File dự kiến |
|---|---|
| Migration có thể tiếp tục sau lỗi, kiểm tra schema | `backend/config/sprint2Migration.js`; gọi từ `backend/config/database.js` |
| Query/khóa dữ liệu tài chính | `backend/repositories/billingRepository.js` |
| Ghi audit bằng connection được truyền vào | `backend/repositories/auditLogRepository.js` |
| Lịch sử hộ, chuyển giao, lịch sử diện tích | Mở rộng `residentRepository.js`, `apartmentRepository.js`; thêm `backend/services/householdService.js` |
| Giá/phát hành/thu/quỹ/truy vấn/báo cáo/cư dân | `backend/services/feeRateService.js`, `billingService.js`, `paymentService.js`, `campaignService.js`, `billingQueryService.js`, `billingReportService.js`, `residentBillingService.js` |
| API theo nhóm | Tạo cặp `backend/api/routes/{billing,payment,campaign,report,household}Routes.js` và `backend/api/handlers/{billing,payment,campaign,report,household}Handlers.js`; mở rộng auth/account routes cho `/api/me/*`, role/audit |
| Validation | `backend/validators/billingValidation.js`, `paymentValidation.js`, `campaignValidation.js` |
| Giao diện S2 | `frontend/src/pages/BillingPage.jsx`, `CampaignsPage.jsx`, `AuditLogsPage.jsx`; `frontend/src/components/billing/{BillDetailsPanel,PaymentForm,BillPreview,ReceiptView}.jsx` |
| UI chung và bộ lọc | `frontend/src/components/{AppSidebar,Modal,StatusBadge}.jsx`, `frontend/src/styles/tokens.css`, `frontend/src/services/billingApi.js` |
| Test fixture | `backend/tests/fixtures/billingFixtures.js`; test DB thật nằm riêng `backend/tests/db/`, không trộn với test mock |

**Hợp đồng service nội bộ:** ID là số nguyên dương; ngày là `YYYY-MM-DD`; kỳ `YYYY-MM`; tiền trong request/response là số nguyên đồng; số decimal từ mysql2 được chuẩn hóa ở repository. `actor` là `{ id, role }` lấy từ middleware, không lấy từ body.

- `recordAuditInTransaction(connection, { actorId, action, entityType, entityId, beforeData, afterData, reason, summary }) -> Promise<void>`; không tự mở/commit transaction.
- `transferHousehold(apartmentId, { headResident, reason }, actor) -> { previousHouseholdId, householdId, effectiveDate }`.
- `saveFeeRates({ serviceUnitPrice, managementUnitPrice, effectiveFrom, note }, actor) -> rateConfig`.
- `previewBills({ period }, actor) -> { period, previewToken, eligible, skipped, totals }`.
- `generateBills({ period, previewToken }, actor) -> { period, bills, totals }`.
- `cancelBill(billId, { reason }, actor) -> bill`; `replaceBill(billId, { reason, previewToken }, actor) -> { cancelledBillId, bill }`. Preview thay thế được tạo bằng `previewBills({ period, replacesBillId }, actor)`; cùng kiểm tra dữ liệu/phiên bản như preview thường, token chỉ cho phép thay đúng hóa đơn.
- `recordPayment({ billId, amount, paymentMethod, payerName, note, idempotencyKey }, actor) -> { payment, bill, replayed }`; `voidPayment(paymentId, { reason }, actor) -> { payment, bill }`.
- `getBillingSummary({ period, apartmentId, householdId, search, status }, actor) -> { items, totals }`; `getApartmentPaymentHistory(apartmentId, actor) -> { payments, contributions }`.
- `createCampaign(input, actor) -> campaign`; `closeCampaign(campaignId, actor) -> campaign`; `recordContribution({ campaignId, apartmentId, householdId, amount, paymentMethod, payerName, idempotencyKey }, actor) -> { contribution, replayed }`; `voidContribution(id, { reason }, actor) -> contribution`.
- `getNotice(billId, actor) -> notice`; `getReceipt(paymentId, actor) -> receipt`; `getContributionReceipt(contributionId, actor) -> receipt`; `exportCollections(filters, actor) -> Buffer`.
- `getResidentBills(actor) -> { bills, totals }`; `getResidentBillReceipts(billId, actor) -> { receipts }`; `getResidentContributions(actor) -> { contributions }`; `getResidentContributionReceipt(contributionId, actor) -> receipt`. Các hàm dành cho cư dân luôn kiểm quyền theo T09 trước khi lấy dữ liệu chứng từ.

**HTTP:** Hợp đồng tại thiết kế kỹ thuật mục 6.2. Lỗi `400` input, `401` chưa xác thực/phiên cũ, `403/404` ngoài quyền, `409` xung đột/trùng/preview cũ, `422` thiếu lịch sử; `201` tạo mới, `200` đọc/cập nhật/replay. Không đưa SQL/secret vào lỗi.

## 4. Các task triển khai

Các lệnh trong phần này là **lệnh sẽ chạy khi triển khai**, chưa phải kết quả thực thi. Chạy từ `backend` hoặc `frontend` theo ghi chú. Mỗi task được commit riêng sau kiểm tra khi nhóm đã cho phép commit; không gom hoặc ghi đè thay đổi của người khác.

### T00 — Chốt baseline và môi trường kiểm thử

**Files:** đọc README, manifest, `.env.example`, tài liệu S1/S2; cập nhật `docs/test-report-s1.md`, tạo `docs/test-report-s2.md` làm sổ kết quả thực thi.
**Interfaces:** đầu vào là trạng thái S1 hiện có; đầu ra là commit/baseline hoặc bản kê thay đổi, thông số DB thử và các quy ước đã xác nhận.

- [ ] Ghi xác nhận quy tắc tại Global Constraints; đánh giá lại 38 SP, năng lực từng người và mốc D1.
- [ ] Chạy `npm test` và `npm run test:e2e` ở backend; `npm run lint`, `npm run build`, `node --test tests/*.test.mjs` ở frontend; ghi kết quả thực tế vào [báo cáo S1](test-report-s1.md), không sao chép tổng test cũ. Nếu build vướng quyền `dist/assets`, ghi lỗi và dùng `npm run build -- --outDir <thư-mục-tạm>` để phân biệt lỗi code với môi trường.
- [ ] Chuẩn bị DB thử riêng, snapshot baseline và fixture; tuyệt đối không dùng quyền reset DB demo.
- [ ] Smoke test S1 trên trình duyệt và DB thử, lưu bằng chứng với phiên bản code tương ứng. Khi chốt baseline commit, đưa `frontend/tests/residentsRefresh.test.mjs` (hiện untracked) vào repo cùng các thay đổi S1 cần thiết; kiểm tra máy thành viên chạy được đầy đủ `tests/*.test.mjs`. Không tự coi test hook/effect là bằng chứng trình duyệt hoặc MySQL thật.
- [ ] Ghi lỗi còn mở/giới hạn đã chấp nhận và giao người xử lý; chỉ hoàn tất T00 khi baseline có bằng chứng.

### T01 — Migration 6 bảng tài chính/audit & bảo toàn dữ liệu S1

**Files:** `backend/config/sprint2Migration.js`, `database.js`, `apartmentRepository.js`, `residentRepository.js`, `accountService.js`; test `backend/tests/db/sprint2Migration.test.js`.
**Interfaces:** tạo nền **6 bảng mới** (`fee_rate_configs`, `apartment_bills`, `fee_payments`, `voluntary_campaigns`, `voluntary_contributions`, `audit_logs`, kèm `ON DELETE RESTRICT` và `active_apartment_id` cho cancel/replace); giữ nguyên bảng `households` (`UNIQUE(apartment_id)`) của S1 *(bỏ `apartment_area_versions` và `transferHousehold` theo DEC-02/03)*.

- [ ] Viết test chặn xóa căn/nhân khẩu/tài khoản đã có chứng từ tài chính và test migration chạy hai lần không mất dữ liệu, lỗi giữa chừng có thể tiếp tục an toàn.
- [ ] Viết migration 6 bảng mới + mở rộng `users.role` theo spec mục 2; MySQL DDL có implicit commit nên không giả định rollback toàn migration. Kiểm tra trước/sau từng bước qua `information_schema` và backup trước khi chạy trên môi trường mới.
- [ ] Bổ sung chặn xóa căn có chứng từ trong `deleteEmptyApartmentById(...)`: giữ khóa dòng căn (`FOR UPDATE`), kiểm tra nhân khẩu/chứng từ và DELETE trong cùng transaction. Không quay về đếm/kiểm tra rồi xóa ngoài transaction.
- [ ] Chạy lại test; kiểm tra migration trên DB thử riêng và ca `FTC-S2-33`. Không xóa hồ sơ/tài khoản được chứng từ tham chiếu.
- [ ] Rà soát thay đổi S1 với Nhật và ghi kết quả/commit chỉ các file của task.

### T02 — Quyền và audit dùng ngay từ API đầu tiên

**Files:** `backend/middlewares/auth.js`, `backend/repositories/auditLogRepository.js`, `backend/services/accountService.js`, `backend/services/auditLogService.js`, account routes/handlers, `backend/api/routes/auditRoutes.js`, `backend/api/handlers/auditHandlers.js`; test `backend/tests/billingAuthorization.test.js`, `backend/tests/auditLog.test.js`.
**Interfaces:** tạo `requireRoles(...roles)` và `recordAuditInTransaction(...)`; T03–T09 dùng connection đang giao dịch và actor từ xác thực.

- [ ] Viết test kế toán không thu tiền, thủ quỹ không sửa giá, phân quyền quỹ đúng bảng; đổi quyền làm token cũ vô hiệu; không hạ ADMIN cuối cùng; audit lỗi làm thao tác ghi rollback.
- [ ] Chạy `node --test tests/billingAuthorization.test.js tests/auditLog.test.js`, xác nhận ca mới thất bại.
- [ ] Mở rộng role ENUM/mapping user bằng migration T01, middleware và API đổi quyền/audit. Không đổi nghĩa role RESIDENT hoặc bỏ kiểm tra quyền cũ của S1.
- [ ] Chạy lại test và kiểm tra trực tiếp gọi API trái quyền; đối chiếu `FTC-S2-16`–`19`, `26`, `41`.
- [ ] Review với Vĩ, ghi kết quả và commit phần riêng.

### T03 — Giá theo ngày hiệu lực và tính tiền chính xác

**Files:** `services/feeRateService.js`, `repositories/billingRepository.js`, `validators/billingValidation.js`, `strategies/feeCalculationStrategy.js`, billing routes/handlers; test `backend/tests/feeRateService.test.js`.
**Interfaces:** `saveFeeRates(...)`; hàm query `findRateForPeriod(period, connection) -> rateConfig | null`; xuất phép tính tổng từ diện tích/giá với quy tắc làm tròn của spec.

- [ ] Test DV 2.500 và 16.500 hợp lệ, 2.499/16.501 bị từ chối; QL 7.000 hợp lệ, 6.999 bị từ chối; đầu kỳ chọn đúng giá và không có giá thì báo thiếu; phép nhân/làm tròn không dùng sai float.
- [ ] Chạy `node --test tests/feeRateService.test.js`, xác nhận ca mới thất bại.
- [ ] Triển khai validate, lưu giá + audit cùng transaction, query giá theo ngày đầu kỳ Việt Nam. Không hardcode giá vào frontend.
- [ ] Chạy lại test, kiểm `FTC-S2-01`–`03`, `23`, `30`, `43` và bảng quyền.
- [ ] Review với Bảo, ghi bằng chứng/commit.

### T04 — Preview, phát hành và sửa sai hóa đơn

**Files:** `services/billingService.js`, `repositories/billingRepository.js`, billing routes/handlers/validation; test `backend/tests/billGeneration.test.js`.
**Interfaces:** dùng query hộ/diện tích T01, giá T03, audit T02; tạo `previewBills`, `generateBills`, `cancelBill`, `replaceBill` và snapshot cho T05–T07.

- [ ] Test hộ vào giữa tháng không bị tính kỳ đó; hộ ở đầu tháng ra giữa tháng vẫn chịu kỳ; thiếu lịch sử trả 422; preview đổi dữ liệu/hết 10 phút trả 409; sinh trùng/chạy đồng thời không có hai bản hiệu lực; lỗi giữa batch rollback; thay hóa đơn có VALID payment bị chặn; bản thay có revision mới.
- [ ] Chạy `node --test tests/billGeneration.test.js`, xác nhận ca mới thất bại.
- [ ] Triển khai previewToken ký gắn actor/period/fingerprint/expiry, query dữ liệu lịch sử và phát hành toàn kỳ atomic; thêm cancel/replace đúng unique hiệu lực và dấu vết lịch sử.
- [ ] Chạy lại test và `FTC-S2-06`, `07`, `28`–`32`, `38`, `39`; kiểm tra bản hủy không được thu hoặc cộng công nợ.
- [ ] Review với Vĩ, ghi kết quả/commit; không đưa nút phát hành lên UI trước khi bước xác nhận có dữ liệu thật.

### T05 — Khoản thu, hủy thu và khôi phục sau mất phản hồi

**Files:** `services/paymentService.js`, `repositories/billingRepository.js`, `validators/paymentValidation.js`, payment routes/handlers; test `backend/tests/paymentService.test.js`, `backend/tests/db/paymentConcurrency.test.js`.
**Interfaces:** `recordPayment`, `voidPayment`; khoản thu có receiptNumber, fingerprint và snapshot/ID hóa đơn; trả cả bill đã cập nhật để UI không tải lại toàn bảng.

- [ ] Test 810.000 phải thu: nộp 500.000 phân bổ DV 360.000/QL 140.000, còn 310.000; cấm âm/0/vượt nợ; cùng key/payload trả cùng ID; khác payload trả 409; replay sau commit vẫn nhận giao dịch cũ; hủy lặp không trừ hai lần.
- [ ] Chạy `node --test tests/paymentService.test.js`, xác nhận ca mới thất bại.
- [ ] Triển khai khóa hóa đơn trước cập nhật số dư, cấp mã biên lai unique không dựa vào COUNT không khóa, idempotency + fingerprint, audit và cập nhật tổng trong cùng transaction. Giữ nguyên các khoản phân bổ của giao dịch lịch sử; tính tổng từ giao dịch VALID sau hủy.
- [ ] Chạy lại test; DB thật kiểm hai request khác key cùng trả hết nợ chỉ một thành công và hai request cùng key chỉ tạo một giao dịch. Đối chiếu `FTC-S2-09`–`11`, `20`–`22`, `26`, `34`–`37`, `43`.
- [ ] Review với Hiếu, lưu bằng chứng không có thu trùng và commit.

### T06 — Bảng thu, công nợ và lịch sử đọc

**Files:** `services/billingQueryService.js`, `repositories/billingRepository.js`, billing routes/handlers; test `backend/tests/billingQueries.test.js`.
**Interfaces:** `getBillingSummary`, `getApartmentPaymentHistory`; dữ liệu gồm nợ kỳ này, nợ kỳ trước, nợ hộ hiện tại/hộ cũ; chuẩn hóa filter một lần cho T07/UI.

- [ ] Test có hai hộ qua các thời kỳ: tổng căn bằng tổng từng hộ nhưng không gộp nợ vào nghĩa vụ hộ mới; bản CANCELLED/VOIDED không cộng số; bộ lọc trả bảng và totals khớp nhau, lịch sử vẫn giữ giao dịch hủy.
- [ ] Chạy `node --test tests/billingQueries.test.js`, xác nhận ca mới thất bại.
- [ ] Viết query có phân trang và giới hạn pageSize, query tổng riêng cùng filter không phụ thuộc trang đang xem; index theo căn/hộ/kỳ/ngày thực thu cần được giải thích bằng dữ liệu thử.
- [ ] Chạy lại test và `FTC-S2-13`, `14`, `27`, `44`; sau T05 đối soát số dư trực tiếp.
- [ ] Review với Nhật, ghi kết quả/commit.

### T07 — Chứng từ in và Excel theo cùng nguồn số liệu

**Files:** `services/billingReportService.js`, report/payment/billing handlers; `frontend/src/components/billing/ReceiptView.jsx`; test `backend/tests/billingDocuments.test.js`.
**Interfaces:** `getNotice`, `getReceipt`, `exportCollections`; mode `period`/`collection_month`, cùng filter T06; in lô tối đa 100 bản, không tạo khoản thu.

- [ ] Test số phòng 050, dấu tiếng Việt, snapshot cũ sau đổi giá/chủ hộ, bản hủy có nhãn, in lại không ghi tiền; Excel khớp totals và chỉ tổng khoản VALID; biên tháng Việt Nam không bị lệch UTC. Sau T08 bổ sung dữ liệu quỹ vào test này.
- [ ] Chạy `node --test tests/billingDocuments.test.js`, xác nhận ca mới thất bại.
- [ ] Dựng dữ liệu chứng từ từ snapshot; export bằng ExcelJS; tách trang in khỏi nút lưu tiền; kiểm từng billId của in lô và cùng kỳ, không nhận mảng ID vô hạn.
- [ ] Chạy lại test, kiểm A4/A5 qua print preview/PDF và `FTC-S2-08`, `15`, `23`, `24`, `35`, `43`–`45`.
- [ ] Review với Hiếu, ghi file minh chứng/commit.

### T08 — Đợt quỹ và đóng góp độc lập công nợ

**Files:** `services/campaignService.js`, `repositories/billingRepository.js`, `validators/campaignValidation.js`, campaign routes/handlers; `frontend/src/pages/CampaignsPage.jsx`; test `backend/tests/campaignService.test.js`.
**Interfaces:** `createCampaign`, `closeCampaign`, `recordContribution`, `voidContribution`; biên nhận quỹ và tổng hợp cho T07/T09.

- [ ] Test ngày sai, đợt CLOSED/hết hạn không nhận khoản mới, đóng đợt không xóa lịch sử; replay/fingerprint như khoản thu; hủy hai lần tổng chỉ giảm một lần; người trái quyền bị chặn; cư dân không xem danh sách tiền hộ khác.
- [ ] Chạy `node --test tests/campaignService.test.js`, xác nhận ca mới thất bại.
- [ ] Triển khai snapshot hộ/phòng/người nộp, mã biên nhận, audit/transaction và quyền riêng tạo đợt với ghi tiền. Không cộng khoản ủng hộ vào nợ bắt buộc.
- [ ] Chạy lại test và `FTC-S2-04`, `05`, `12`, `36`, `40`–`42`; nối Excel T07 và đối chiếu tổng quỹ.
- [ ] Review với Bảo, cập nhật phần hỗ trợ của Nhật nếu cần và commit.

### T09 — Cư dân tra cứu đúng phạm vi

**Files:** `services/residentBillingService.js`, auth routes/handlers hoặc route riêng cho `/api/me`; sửa `frontend/src/pages/ResidentHomePage.jsx`; test `backend/tests/residentBillingAccess.test.js`.
**Interfaces:** `getResidentBills(actor)` và các hàm đọc biên lai/đóng góp dành cho cư dân; không nhận householdId từ client làm nguồn quyền.

- [ ] Test IDOR bill/payment/contribution khác hộ, nhân khẩu gia nhập sau, hộ kết thúc, chuyển đi theo ngày hiệu lực dù cột lưu cũ chưa đổi, tài khoản vừa đổi quyền; tất cả không lộ dữ liệu.
- [ ] Chạy `node --test tests/residentBillingAccess.test.js`, xác nhận ca mới thất bại.
- [ ] Suy ra nhân khẩu/hộ từ user đã xác thực; tái sử dụng `resolveEffectiveResidencyStatus(...)` với ngày Việt Nam và helper batch `getEffectiveResidencyStatuses(...)` khi phù hợp, không chỉ đọc `current_status`. Helper batch dùng pool; nếu kiểm tra trong transaction phải dùng cùng connection cho dữ liệu/lịch sử. Giữ kiểm tra trạng thái hiệu lực khi duyệt/đăng nhập và thu hồi phiên của S1; bổ sung giới hạn hộ/ngày gia nhập, chỉ hiện nợ hộ hiện tại cho cư dân. Mọi link tải/in phải kiểm quyền riêng.
- [ ] Chạy lại test và `FTC-S2-25`, `27`, `42`; thử tài khoản cư dân và nhân sự thật trên DB thử.
- [ ] Review với Vĩ, ghi bằng chứng/commit.

### T10 — Áp dụng giao diện và tối ưu thao tác

**Files:** `frontend/src/styles/tokens.css`, `global.css`, `layouts/AppLayout.jsx`, `App.jsx`, các trang S1, các page/component S2 ở mục 3; `frontend/src/services/billingApi.js`; test `frontend/tests/billingFilters.test.mjs`.
**Interfaces:** dùng response T04–T09, cùng filter chuẩn hóa T06; chuẩn hóa URL/local state cho bộ lọc, form modal và key khoản thu đang chờ kết quả. Không lưu mật khẩu trong state bền vững.

- [ ] Viết test bộ tạo query giữ apartmentId/hộ/kỳ, tiền nhập chuyển sang số đồng đúng và idempotencyKey được giữ khi retry; chạy `node --test tests/billingFilters.test.mjs` để xác nhận ca mới thất bại.
- [ ] Áp dụng tokens và sidebar theo [SVG](../design/bluemoon-ui-redesign/README.md); làm danh sách/form/modal trước trang trí. Tk BQT chỉ ADMIN; các mẫu chưa có board riêng phải dùng cùng thành phần và kiểm quyền.
- [ ] Nối màn hình billing/campaign/audit/cư dân; giữ bộ lọc và vị trí sau lưu; điền sẵn nợ/ngày Việt Nam, chuyển kỳ tiếp theo trong cùng panel; không tự trộn hộ cũ/mới hoặc tạo lại key khi chỉ thử lại khoản thu.
- [ ] Khi sửa trang S1, giữ cơ chế bỏ response lỗi thời và tải lại bằng bộ lọc URL hiện tại, loading khi Back/Forward, không để reload đóng thao tác mới. Bảo toàn kiểm tra chủ hộ độc lập với bảng lọc, bảo vệ draft và phân biệt trạng thái POST đang lưu với kiểm tra chủ hộ đang tải/lỗi; chạy cả `frontend/tests/residentsRefresh.test.mjs`.
- [ ] Chạy test frontend + `npm run lint` + build; thao tác desktop/390px, bàn phím/modal Escape/focus; kiểm nhãn lỗi, loading/empty/success, mất mạng sau lưu và in lại. `UX-S2-01` phải có kết quả thật.
- [ ] Đối chiếu đủ các route S1 với checklist, review giao diện với Bảo và commit. Không để thay đổi thẩm mỹ vô tình thay quy tắc dữ liệu.

### T11 — Nghiệm thu tích hợp và đóng sprint

**Files:** `backend/tests/db/{sprint2Migration,paymentConcurrency,billingJourney}.test.js`, `backend/package.json`, `docs/test-report-s2.md`, cập nhật test plan/traceability/backlog/checklist cài đặt và sử dụng.
**Interfaces:** bổ sung script đề xuất `test:db = node --test tests/db/*.test.js`; chỉ dùng DB riêng có hậu tố `_s2_test`, cấu hình qua biến `TEST_DB_*`; test phải từ chối trỏ nhầm DB dùng chung, không tự reset database khi không có cấu hình cho phép riêng.

- [ ] Viết hành trình DB thật `E2E-S2-01` và guard DB; chạy trước để xác nhận lỗi tích hợp còn thiếu được phát hiện, không chỉ mock query trả sẵn kết quả.
- [ ] Thực hiện migration/seed fixture trên DB thử, chạy hành trình, concurrency và rollback giữa batch; chạy hồi quy S1, test S2 và các test frontend đã thêm. Không tự chạy benchmark lặp lại ngoài phép đo nghiệm thu quy định.
- [ ] Thực hiện `OPS-S2-01`, `PERF-S2-01`, `UX-S2-01` đúng cấu hình spec; lưu kết quả đo/in/Excel, không gắn Pass nếu chưa chạy. Fixture 500 căn/2.000 nhân khẩu/24 kỳ/20.000 khoản thu là dữ liệu tổng hợp riêng.
- [ ] Cập nhật báo cáo với số test thực tế, môi trường, lỗi còn lại, minh chứng DB/backup/restore và kết quả từng gate; đối chiếu `FTC-S2-01`–`45` có kết quả hoặc lý do chưa nghiệm thu. Ca Planned chưa đồng nghĩa automated test tồn tại.
- [ ] Cả nhóm demo quy trình cuối, review diff và tài liệu; chỉ đánh dấu S2 Done khi không còn lỗi nghiêm trọng về tiền/phân quyền và toàn bộ yêu cầu bắt buộc có bằng chứng.

## 5. Theo dõi và xử lý rủi ro

| Rủi ro | Dấu hiệu / cách xử lý |
|---|---|
| Phạm vi lớn hơn 38 SP gốc | Ước lượng lại tại T00, cập nhật bảng mốc khi trượt; không cắt kiểm soát tiền để chạy theo số US |
| Migration làm hỏng S1 | Backup, schema check từng bước, DB thử, test chạy hai lần và hồi quy xóa/tạo hộ |
| Vĩ quá tải | Nhật hỗ trợ T08 sau T04; chốt interface trước để UI không phải chờ tất cả backend |
| Quota Figma | Dùng SVG và gallery làm tài liệu tham chiếu; không báo đã có component/prototype native |
| Cloud chậm hoặc không truy cập được | Ghi điều kiện mạng, tách lỗi môi trường khỏi lỗi code; giữ cấu hình cá nhân, không gửi secret |
| Kết quả mock tạo cảm giác hoàn thành | T11 bắt buộc DB thật, đo/restore/in và demo; báo rõ những gì chưa chạy |

## 6. Kịch bản demo cuối và Definition of Done

1. ADMIN cấp vai trò; BQT tạo căn/hộ, ghi diện tích có hiệu lực.
2. Kế toán chốt giá, preview và phát hành hai kỳ; thử trùng kỳ/preview cũ để chứng minh chặn đúng.
3. Thủ quỹ thu một phần, trả nợ kỳ trước, thử gửi lại cùng key và in lại.
4. Hủy khoản thu nhầm, kiểm số dư; hủy/thay hóa đơn sai đủ điều kiện, giữ bản cũ.
5. Chuyển hộ A → B; B không xem hay gánh nợ A; nhân sự xem được lịch sử.
6. Ghi đóng góp, đóng đợt, hủy sai sót; so sánh công nợ bắt buộc không bị ảnh hưởng.
7. Xuất Excel theo kỳ/tháng thực thu, đối chiếu bảng và totals; xem audit.
8. Trình bày hồi quy S1, kết quả DB/concurrency, giao diện 390px, in, backup/restore và hiệu năng.

**S2 Done** = đủ 11 US theo tiêu chí bổ sung + bằng chứng kiểm thử/phi chức năng + tài liệu đồng bộ + không còn lỗi nghiêm trọng. Việc có kế hoạch, ảnh giao diện hoặc API trả 200 riêng lẻ chưa đủ để đóng sprint.
