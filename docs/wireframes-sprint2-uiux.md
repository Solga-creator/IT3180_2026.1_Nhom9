# Thiết kế UI/UX & Prototype / Wireframe Sprint 2 (32 Khung — `WF-13` đến `WF-44`)

Tài liệu mô tả danh mục gốc **32 khung Sprint 2** (`WF-13`..`WF-44`) kế thừa Master Layout Sprint 1. Phần bổ sung ngày 28/11/2026 bên dưới là đặc tả trạng thái cần cập nhật vào thiết kế; chưa xác minh/cập nhật file Draw.io hoặc ảnh PNG trên Drive, nên không dùng danh mục 44 khung cũ để khẳng định toàn bộ thiết kế bổ sung đã hoàn thành.

- **File nguồn Draw.io & 14 ảnh `.png` trên Google Drive:** [Prototype - Wireframe (Google Drive)](https://drive.google.com/drive/folders/1UPjX_bRgkSOnabKz-OSyh_xRvgoKEf30) (kèm file nguồn `.drawio` trong thư mục `File draw.io` để chỉnh sửa trực tiếp trên `app.diagrams.net`)
- **Nguyên tắc tổ chức màn hình Sprint 2 ("Ít bước, rõ kết quả, khó thao tác nhầm"):**
  - **Trên trang `/billing` (BQT / Kế toán / Thủ quỹ):**
    1. **Khu vực mặc định:** Chọn kỳ thu, tìm căn hộ, lọc trạng thái nợ, 3 chỉ số tổng hợp (*Phải thu*, *Đã thu*, *Còn nợ* kèm nợ kỳ trước), nút *Xuất Excel theo bộ lọc* và bảng danh sách hóa đơn.
    2. **Khi chọn một căn hộ:** Mở panel chi tiết hóa đơn, lịch sử giao dịch, nút *In Giấy báo phí*, form *Ghi nhận thu tiền* (hiển thị rõ số tiền phân bổ vào Phí dịch vụ / Phí quản lý và bước xác nhận ngắn trước khi lưu), nút *In lại biên lai* (chỉ đọc) và nút *Hủy giao dịch thu nhầm* (bắt buộc nhập lý do).
    3. **Khi chuẩn bị kỳ mới (thu gọn):** Khu vực *Cấu hình đơn giá* (`US-006`) và *Sinh bảng thu kỳ mới* (`US-008`) có bước **Xem trước bảng thu (Preview)** số căn có người ở, số căn trống bỏ qua, đơn giá áp dụng và tổng phải thu trước khi xác nhận phát hành.
  - **Trên trang chủ Cư dân `/` (`ResidentHomePage.jsx`):** Ưu tiên hiển thị theo thứ tự **Còn phải đóng (kỳ này & nợ cũ) → Chi tiết khoản phí → Lịch sử & Biên lai**, phần Hồ sơ nhân khẩu đặt ở mục riêng bên dưới.

---

## Danh mục 32 Khung UI/UX Sprint 2 (`WF-13` đến `WF-44`)

| Tab Draw.io & Ảnh PNG | Các khung Wireframe | US ID | Phụ trách | Nội dung giao diện & Trạng thái chính |
|---|---|---|---|---|
| `WF-13_16_FeeRates` | `WF-13`..`WF-16` (4 khung) | `US-006` | Nguyễn Quang Nhật | (13) Bảng đơn giá hiện hành & ngày hiệu lực; (14) Form chốt đơn giá phí dịch vụ ($2.500\text{–}16.500\text{ đ/m}^2$) & quản lý ($\ge 7.000\text{ đ/m}^2$) kèm bước xác nhận; (15) Banner lỗi nhập ngoài khung quy định; (16) Bảng lịch sử thay đổi đơn giá (không sửa hóa đơn cũ). |
| `WF-17_20_VoluntaryCampaigns` | `WF-17`..`WF-20` (4 khung) | `US-007` | Lê Tuấn Vĩ | (17) Danh sách đợt đóng góp tự nguyện tách riêng phí bắt buộc; (18) Form tạo đợt vận động/quỹ mới; (19) Trạng thái lỗi ngày kết thúc < ngày bắt đầu; (20) Chi tiết đợt đang mở / đã đóng. |
| `WF-21_24_MonthlyBilling` | `WF-21`..`WF-24` (4 khung) | `US-008` | Nguyễn Quang Nhật | (21) Thanh chọn kỳ `YYYY-MM` & nút Xem trước bảng thu; (22) Khung Xem trước (Preview) số căn hộ có người ở, số căn trống bỏ qua, đơn giá áp dụng & tổng phải thu trước khi xác nhận phát hành; (23) Bảng thu chi tiết từng căn hộ (lưu snapshot phòng, chủ hộ, diện tích, đơn giá); (24) Cảnh báo chặn sinh trùng kỳ thu. |
| `WF-25_27_FeeNotice` | `WF-25`..`WF-27` (3 khung) | `US-009` | Đặng Gia Bảo | (25) Chọn căn hộ xem chi tiết hóa đơn; (26) Mẫu Giấy báo phí lấy từ dữ liệu snapshot đã chốt (Số phòng, Chủ hộ tại kỳ phát hành, Diện tích $\text{m}^2$, từng dòng phí, Nợ kỳ trước, Tổng cộng); (27) Chế độ Print Preview khổ A5/A4. |
| `WF-28_32_FeePaymentReceipt` | `WF-28`..`WF-32` (5 khung) | `US-010` | Lê Tuấn Vĩ | (28) Mở panel thu tiền của căn hộ đã chọn; (29) Form nhập số tiền nộp, hình thức (`Tiền mặt`/`Chuyển khoản`), tự động hiển thị phân bổ *Phí dịch vụ trước → Phí quản lý sau* & bước xác nhận ngắn; (30) Badge trạng thái Nộp một phần (`PARTIAL`) / Nộp đủ (`PAID`); (31) Mẫu Biên lai thu tiền & nút *In lại biên lai* (chỉ đọc chứng từ cũ); (32) Form *Hủy giao dịch thu nhầm* bắt buộc nhập lý do (`VOIDED`). |
| `WF-33_35_Contributions` | `WF-33`..`WF-35` (3 khung) | `US-011` | Lê Tuấn Vĩ | (33) Bộ chọn Đợt vận động & Quỹ tự nguyện; (34) Form ghi nhận số tiền hộ ủng hộ kèm xác nhận; (35) Bảng danh sách hộ ủng hộ tách riêng hoàn toàn khỏi công nợ phí bắt buộc. |
| `WF-36_38_UnpaidDebt` | `WF-36`..`WF-38` (3 khung) | `US-012` | Nguyễn Quang Nhật | (36) Bộ lọc Kỳ thu & Trạng thái chưa nộp đủ; (37) 3 thẻ chỉ số tổng quan (*Tổng phải thu*, *Tổng đã thu*, *Còn nợ*); (38) Bảng danh sách các căn hộ còn nợ hiển thị rõ *Nợ kỳ đang chọn*, *Nợ các kỳ trước* và *Tổng nợ lũy kế*. |
| `WF-39_44_HistoryExportRoleAudit` | `WF-39`..`WF-44` (6 khung) | `US-013`, `014`, `018`, `019` | Bảo & Hiếu | (39) Lịch sử đóng tiền của căn hộ (`US-013`) và giao diện Cư dân tra cứu phí (`/api/me/bills`); (40) Bảng tổng hợp đã thu theo từng loại phí (đã phân bổ) & theo từng quỹ (`US-014`); (41) Thanh xuất báo cáo Excel `.xlsx` theo kỳ hóa đơn hoặc theo tháng thực thu (`US-014`); (42) Chọn vai trò `ADMIN/BQT/ACCOUNTANT/TREASURER` và bấm Lưu kèm xác nhận (`US-018`); (43) Bảng Nhật ký kiểm toán Audit Log có dữ liệu Trước/Sau & Lý do (`US-019`); (44) Bộ lọc Audit Log theo loại đối tượng (`US-019`). |

## Trạng thái giao diện cần bổ sung trước khi nghiệm thu

Các trạng thái sau bổ sung vào khung hiện có hoặc mở rộng sơ đồ khi nhóm vẽ; chưa phải màn hình đã code. Quy tắc nghiệp vụ và quyền lấy từ [thiết kế kỹ thuật, mục 3.5–3.11 và 5](./sprint2-technical-base.md).

| Vị trí | Trạng thái và thao tác cần thể hiện | Tiêu chí tiện dụng / tránh nhầm |
|---|---|---|
| Hồ sơ căn hộ/hộ (nối S1) | Nút Chuyển giao hộ; xác nhận hộ cũ → hộ mới, ngày hiệu lực hôm nay, nợ cũ giữ lại, cảnh báo thu hồi quyền | Không dùng sửa quan hệ chủ hộ để thay hộ; không nhập lại căn đã chọn; báo rõ hậu quả trước lưu |
| `WF-22` Preview | Ngày chốt đầu kỳ, hộ chịu phí, nguồn diện tích/giá; lỗi thiếu lịch sử; preview hết hạn hoặc dữ liệu vừa đổi | Buộc xem lại trước phát hành; không hiển thị thành công khi phát hành lỗi một phần |
| `WF-23` Hóa đơn | Nhãn ISSUED/CANCELLED tách khỏi UNPAID/PARTIAL/PAID; xem bản cũ, lý do hủy, revision thay thế | Hủy/thay chỉ đúng vai trò; chặn khi còn giao dịch VALID; không cho sửa snapshot trực tiếp |
| `WF-27` In | Chọn nhiều giấy báo theo kỳ/bộ lọc; preview A4/A5; trạng thái ĐÃ HỦY | In lại không ghi tiền; lỗi máy in có nút thử lại; không mất số 0 đầu và dấu tiếng Việt |
| `WF-28`–`WF-32` Thu | Chọn hộ hiện tại/hộ cũ, danh sách kỳ còn nợ cũ → mới; số tiền điền sẵn; xác nhận rõ hộ/kỳ; chuyển kỳ tiếp theo sau lưu | Giữ căn, phương thức, bộ lọc và vị trí cuộn; mỗi xác nhận một hóa đơn; không tự trả nợ hộ khác |
| `WF-31` Kết quả thu | Đang lưu / đã lưu / chưa rõ do mất mạng / in lỗi / in lại / giao dịch hủy | Giữ mã yêu cầu khi thử lại; không khuyến khích nhập khoản thu mới khi chưa rõ lần trước đã lưu chưa |
| `WF-20`, `WF-35` Quỹ | Nút đóng đợt, báo đợt đóng/hết hạn, hủy đóng góp có lý do, biên nhận hợp lệ/hủy | Quyền tạo/đóng khác quyền ghi tiền; không xóa giao dịch, không đổi số nợ bắt buộc |
| `WF-38` Công nợ | Ba phần: nợ hộ hiện tại, nợ hộ cũ, tổng nội bộ của căn | Cư dân mới chỉ thấy phần của hộ mình; số thẻ/tổng dòng/Excel cùng bộ lọc |
| `WF-39` Cư dân | Chỉ hóa đơn/biên nhận được phép theo hộ và tháng gia nhập; hộ kết thúc bị thu hồi quyền | Không chỉ ẩn menu, API phải chặn đọc chứng từ khác hộ |
| Toàn bộ | Desktop và 390px; nhãn form; focus vào modal và trả về nút mở khi đóng; Escape; loading/empty/error/success; nút thao tác không tràn | Kiểm tra bằng thao tác thật, ghi số bước; ngày Việt Nam; không giữ dữ liệu người trước |

**Luồng demo UX bắt buộc:** Tìm phòng một lần → xem nợ theo hộ/kỳ → thu một phần → in lại → chuyển kỳ tiếp → kiểm tra lịch sử và xuất Excel. Sau đó thử mất phản hồi khi thu, hủy khoản thu nhầm và chuyển giao hộ. Trạng thái các ảnh/source cần được đối chiếu lại sau khi nhóm cập nhật; không tự đánh dấu Done từ tài liệu mô tả này.
