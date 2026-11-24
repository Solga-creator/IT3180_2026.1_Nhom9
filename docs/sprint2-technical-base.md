# Thiết kế Base Kỹ thuật cho Sprint 2 (Database Schema, Design Patterns, API Contract & UI Base)

> **Trạng thái:** Tài liệu Base kiến trúc phục vụ chuẩn bị triển khai Sprint 2. Nhóm SE09 hiện đã hoàn thành **100% Sprint 1 (8/8 US)** và **chưa bắt đầu code chức năng Sprint 2 (0/11 US)**.

---

## 1. Liên kết giữa Nền tảng Sprint 1 (Đã hoàn thành) và Sprint 2 (Chưa bắt đầu)

Toàn bộ 11 User Stories của Sprint 2 (`US-006`..`014`, `US-018`..`019`) kế thừa trực tiếp từ 5 bảng dữ liệu và khung kiến trúc Client–Server của Sprint 1:

| Thành phần Base từ Sprint 1 | File nguồn Sprint 1 | Vai trò làm Base trong Sprint 2 |
|---|---|---|
| **Bảng `apartments`** | `backend/config/database.js` | Cung cấp `apartments.id`, `room_number` và đặc biệt là `area` ($\text{m}^2$) để tự động tính bảng thu đầu tháng ($\text{Phí} = \text{area} \times \text{unit\_price}$) ở `US-008`. |
| **Bảng `households` & `residents`** | `backend/config/database.js` | Xác định chủ hộ (`head_resident_id`) và hồ sơ cư dân gắn với từng căn hộ để in Giấy báo phí (`US-009`), Biên lai thu tiền (`US-010`) và ghi nhận ủng hộ quỹ (`US-011`). |
| **Bảng `users` & JWT Middleware** | `backend/middlewares/auth.js` | Xác thực người thực hiện giao dịch thu phí (`recorded_by -> users.id`), phân quyền vai trò chi tiết (`US-018`) và ghi vết người thao tác trong Nhật ký kiểm toán (`US-019`). |
| **Singleton MySQL Pool** | `backend/config/database.js` | Dùng chung connection pool và cơ chế Transaction ACID (`SELECT ... FOR UPDATE`) khi sinh bảng thu hàng loạt (`US-008`) và ghi nhận thanh toán (`US-010`). |
| **Dịch vụ xuất Excel (`exceljs`)** | `backend/services/residentService.js` | Là mẫu chuẩn để xây dựng chức năng xuất báo cáo tổng thu theo loại phí và theo quỹ ra file `.xlsx` (`US-014`). |
| **Khung Giao diện & HTTP Client** | `frontend/src/components/AppLayout.jsx`, `frontend/src/services/api.js` | Cung cấp Master Layout (Sidebar + Topbar + Main Content) và hàm gọi REST API / tải file Blob cho toàn bộ 18 màn hình/khung giao diện của Sprint 2. |

---

## 2. Thiết kế Base CSDL cho Sprint 2 (10 bảng mới $\to$ Tổng 15/15 bảng toàn dự án)

Để đảm bảo không xung đột khi 4 thành viên cùng code Sprint 2, schema CSDL mở rộng thêm **10 bảng** nối khóa ngoại vào 5 bảng của Sprint 1:

1. **`fee_types` (`US-006`)**: Danh mục loại phí bắt buộc (`code`: `SERVICE_FEE`, `MANAGEMENT_FEE`; `name`, `calculation_unit`: `PER_SQM`, `min_price`, `max_price`).
2. **`fee_rate_configs` (`US-006`)**: Lịch sử chốt đơn giá áp dụng (`fee_type_id`, `unit_price`, `effective_from`, `updated_by -> users.id`).
   - Ràng buộc nghiệp vụ: Phí dịch vụ $2.500 \le \text{unit\_price} \le 16.500\text{ đ/m}^2$; Phí quản lý $\text{unit\_price} \ge 7.000\text{ đ/m}^2$.
3. **`billing_periods` (`US-008`)**: Kỳ thu phí theo tháng (`period_code` dạng `YYYY-MM`, `month`, `year`, `status`: `OPEN`/`CLOSED`, `generated_by -> users.id`).
4. **`apartment_bills` (`US-008`, `US-012`)**: Hóa đơn tổng hợp đầu tháng của từng căn hộ (`billing_period_id`, `apartment_id`, `household_id`, `area_snapshot`, `total_due`, `total_paid`, `debt_amount`, `status`: `UNPAID`/`PARTIAL`/`PAID`).
5. **`apartment_bill_items` (`US-008`, `US-009`)**: Chi tiết từng dòng phí bắt buộc trong hóa đơn căn hộ (`apartment_bill_id`, `fee_type_id`, `unit_price`, `area_snapshot`, `amount`).
6. **`fee_payments` (`US-010`, `US-013`)**: Giao dịch thu phí bắt buộc (`apartment_bill_id`, `apartment_id`, `amount`, `payment_method`: `CASH`/`BANK_TRANSFER`, `payer_name`, `recorded_by -> users.id`, `paid_at`, `note`).
7. **`payment_receipts` (`US-009`, `US-010`)**: Chứng từ giấy báo phí & biên lai thu tiền (`receipt_number`, `doc_type`: `NOTICE`/`RECEIPT`, `apartment_bill_id`, `fee_payment_id`, `issued_by -> users.id`, `issued_at`).
8. **`voluntary_campaigns` (`US-007`)**: Đợt vận động & quỹ đóng góp tự nguyện (`name`, `fund_code`, `description`, `start_date`, `end_date`, `status`: `OPEN`/`CLOSED`, `created_by -> users.id`).
9. **`voluntary_contributions` (`US-011`, `US-013`, `US-014`)**: Giao dịch hộ gia đình ủng hộ theo đợt và theo quỹ (`campaign_id`, `apartment_id`, `household_id`, `amount`, `payment_method`, `contributor_name`, `recorded_by -> users.id`, `contributed_at`).
10. **`audit_logs` (`US-019`)** *(kèm bảng/cột phân quyền vai trò chi tiết `US-018`)*: Nhật ký kiểm toán hệ thống (`actor_id -> users.id`, `action`: `CREATE`/`UPDATE`/`DELETE`/`PAYMENT`, `entity_type`: `RESIDENT`/`RESIDENCY_EVENT`/`FEE_PAYMENT`/`CONTRIBUTION`, `entity_id`, `old_values`, `new_values`, `created_at`).

---

## 3. Thiết kế Base Design Patterns cho Sprint 2 (Mục 10 Checklist)

### 3.1. Repository Pattern (+10 Repositories mới $\to$ 13/13 Repositories)
Mỗi bảng mới của Sprint 2 ánh xạ 1-1 với một Repository trong `backend/repositories/`:
- Đã có ở Sprint 1 (3): `userRepository.js`, `apartmentRepository.js`, `residentRepository.js`.
- Mở rộng ở Sprint 2 (10): `feeTypeRepository.js`, `feeRateRepository.js`, `billingPeriodRepository.js`, `apartmentBillRepository.js`, `billItemRepository.js`, `feePaymentRepository.js`, `receiptRepository.js`, `campaignRepository.js`, `contributionRepository.js`, `auditLogRepository.js`.

### 3.2. Strategy Pattern (Khung cơ sở trong [backend/strategies/feeCalculationStrategy.js](../backend/strategies/feeCalculationStrategy.js))
1. **`FeeCalculationStrategy` (`US-006`, `US-008`)**:
   - `ServiceFeePerSqmStrategy`: Kiểm tra đơn giá trong khoảng $[2500, 16500]$ và tính $\text{amount} = \text{area} \times \text{unitPrice}$.
   - `ManagementFeePerSqmStrategy`: Kiểm tra đơn giá $\ge 7000$ và tính $\text{amount} = \text{area} \times \text{unitPrice}$.
2. **`CollectionReportExportStrategy` (`US-014`)**:
   - `MandatoryFeeSummaryStrategy`: Tổng hợp và kết xuất sheet Excel số đã thu theo từng loại phí bắt buộc.
   - `VoluntaryFundSummaryStrategy`: Tổng hợp và kết xuất sheet Excel số đã thu theo từng đợt và từng quỹ tự nguyện.

### 3.3. Observer Pattern (Khung cơ sở trong [backend/observers/domainEventBus.js](../backend/observers/domainEventBus.js))
- **Subject (`domainEventBus.js`)**: Phát sự kiện sau khi các transaction nghiệp vụ commit thành công.
- **Observers**:
  1. `AuditLogObserver`: Lắng nghe sự kiện thêm/sửa/xóa cư dân (`US-002`, `US-004`) và sự kiện thu tiền (`US-010`, `US-011`) để ghi bản ghi vào bảng `audit_logs` (`US-019`).
  2. `BillDebtStatusObserver`: Lắng nghe sự kiện `FEE_PAYMENT_CREATED` (`US-010`) để tự động tính lại `total_paid`, `debt_amount` và cập nhật trạng thái `UNPAID`/`PARTIAL`/`PAID` cho `apartment_bills` (`US-012`).

---

## 4. Hợp đồng 12 REST API Endpoints của Sprint 2 (Mục 13.1: +12 API $\to$ 25/25 API)

| STT | Method & Endpoint | US ID | Phụ trách | Mô tả & Quy tắc dữ liệu |
|---:|---|---|---|---|
| 14 | `GET /api/fees/rates` | `US-006` | Nguyễn Quang Nhật | Lấy đơn giá phí dịch vụ và phí quản lý hiện hành kèm lịch sử cập nhật. |
| 15 | `PUT /api/fees/rates` | `US-006` | Nguyễn Quang Nhật | Chốt đơn giá mới (validate phí dịch vụ $2.500\text{–}16.500$, phí quản lý $\ge 7.000$). |
| 16 | `GET /api/campaigns` | `US-007` | Lê Tuấn Vĩ | Lấy danh sách các đợt vận động và quỹ đóng góp tự nguyện. |
| 17 | `POST /api/campaigns` | `US-007` | Lê Tuấn Vĩ | Tạo đợt đóng góp tự nguyện mới tách biệt với phí bắt buộc. |
| 18 | `POST /api/billing-periods/generate` | `US-008` | Nguyễn Quang Nhật | Sinh bảng thu đầu tháng cho toàn bộ căn hộ ($\text{diện tích} \times \text{đơn giá}$). |
| 19 | `GET /api/billing-periods/:period/bills` | `US-008` | Nguyễn Quang Nhật | Xem bảng thu tổng hợp của các căn hộ trong kỳ. |
| 20 | `GET /api/bills/:billId/notice` | `US-009` | Đặng Gia Bảo | Xuất dữ liệu Giấy báo phí chi tiết của một căn hộ để hiển thị/in. |
| 21 | `POST /api/payments` | `US-010` | Lê Tuấn Vĩ | Ghi nhận cư dân nộp phí bắt buộc (`CASH`/`BANK_TRANSFER`) và sinh biên lai. |
| 22 | `POST /api/contributions` | `US-011` | Lê Tuấn Vĩ | Ghi nhận số tiền một hộ ủng hộ theo đợt và theo quỹ tự nguyện. |
| 23 | `GET /api/bills/unpaid` | `US-012` | Nguyễn Quang Nhật | Lọc danh sách các căn hộ chưa nộp hoặc nộp chưa đủ trong kỳ. |
| 24 | `GET /api/apartments/:id/payments` | `US-013` | Đặng Gia Bảo | Xem toàn bộ lịch sử đóng phí bắt buộc và ủng hộ tự nguyện của một căn hộ. |
| 25 | `GET /api/reports/collections/export` | `US-014` | Đặng Gia Bảo | Xuất file Excel `.xlsx` tổng số đã thu theo loại phí và theo quỹ *(kèm API phân quyền & audit `US-018`, `US-019`)*. |
