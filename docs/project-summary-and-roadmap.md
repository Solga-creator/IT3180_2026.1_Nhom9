# BlueMoon SE09 — Tổng hợp dự án và lộ trình triển khai

Cập nhật: **28/11/2026**. Tài liệu tập hợp kết quả khảo sát code, dùng thử web, các sửa lỗi đã làm, phần thiết kế mới và kế hoạch tiếp theo. Đây là đầu mối đọc nhanh; bằng chứng chi tiết và quy tắc triển khai nằm trong các liên kết bên dưới.

## 1. Kết luận và trạng thái thực tế

BlueMoon có nền client–server và quản lý căn/hộ/nhân khẩu tương đối rõ cho đồ án Nhập môn CNPM. Định hướng v1.0 đủ tạo một sản phẩm quản lý cư dân và thu phí xuyên suốt nếu Sprint 2 được triển khai và nghiệm thu đúng. Chưa kết luận sản phẩm hoàn chỉnh hay đã sẵn sàng vận hành thực tế chỉ từ số lượng chức năng/tài liệu.

| Phần | Trạng thái đã xác minh | Việc còn lại |
|---|---|---|
| Sprint 1 — 8 US | Đã có chức năng; đã khảo sát code, dùng thử BQT/cư dân và sửa các lỗi ưu tiên | Chạy lại toàn bộ kiểm thử sau các sửa gần nhất; demo từng AC, cập nhật minh chứng rồi chốt Done chính thức |
| Sửa lỗi xuất Excel/ngày/lọc căn | Đã sửa trong code và thêm test; đã dùng thử lại ngày và xuất theo trạng thái | Theo dõi trong hồi quy S1 khi tích hợp S2 |
| Sprint 2 — 11 US | Có backlog, thiết kế kỹ thuật, hợp đồng API, UI và test plan; routes hiện chưa có phân hệ tài chính | Triển khai theo kế hoạch, kiểm chứng DB thật và tiêu chí Done |
| Giao diện mới | Có 9 board ban đầu + 34 board Sprint 2 = 43 board SVG, gallery có luồng bấm mẫu, gói nhập Figma | Chưa áp dụng vào frontend; Figma hết quota MCP nên chưa có bộ component/Auto Layout/prototype native |
| Kiểm thử S2 | Có 43 ca chức năng trong phạm vi, 2 ca ngoài phạm vi + E2E/OPS/PERF/UX | Chưa phải số test tự động hay kết quả Pass; cần triển khai và thực thi |

Điểm tham khảo từng nhận xét cho S1 là **7–8/10**, không phải điểm chính thức hay kết quả chấm của HUST. Những lời khen/nhận xét dựa trên phạm vi đã đọc và dùng thử, không đại diện một cuộc kiểm toán toàn bộ hệ thống.

## 2. Phạm vi sản phẩm khi ghép hai sprint

**Luồng v1.0:** Căn hộ/diện tích → hộ và nhân khẩu → đơn giá theo ngày → preview/phát hành hóa đơn → giấy báo → thu tiền/biên lai → công nợ/lịch sử → báo cáo; cư dân xem đúng dữ liệu của hộ mình.

| Sprint | User Story | Giá trị chính |
|---|---|---|
| S1 | `US-001`–`US-005` | Căn hộ, hộ/nhân khẩu, tra cứu, cư trú theo ngày, Excel nhân khẩu |
| S1 | `US-015`–`US-017` | Tài khoản, đăng nhập, hồ sơ/mật khẩu; luồng cư dân đăng ký/BQT duyệt |
| S2 | `US-006`, `US-008`, `US-009` | Đơn giá, bảng thu có snapshot, giấy báo |
| S2 | `US-010`, `US-012` | Thu một phần/đủ, hủy thu nhầm, công nợ theo hộ/kỳ |
| S2 | `US-007`, `US-011` | Quỹ tự nguyện, đóng góp/biên nhận và xử lý sai sót |
| S2 | `US-013`, `US-014` | Lịch sử và Excel theo kỳ/tháng thực thu |
| S2 | `US-018`, `US-019` | Quyền chi tiết và nhật ký; các kiểm soát tiền được tích hợp từ đầu |

Ngoài v1.0: xe/điện nước/Internet (`US-020`, `US-021`), cổng thanh toán, ứng dụng native, hoàn tiền tự động và khóa sổ kế toán. Không cần thêm các phần này để nghiệm thu đúng phạm vi đồ án đã chọn.

## 3. Tổng hợp review Sprint 1 và xử lý

| Nhận xét trước đây | Kết quả sau kiểm tra/sửa |
|---|---|
| Chữ nút chìm vào nền | Đã chỉnh màu; dùng thử thấy đọc được |
| Form thêm chiếm màn hình đầu, mở nhân khẩu tự bung form | Danh sách/tìm kiếm đã được ưu tiên; form mở khi cần |
| Cập nhật cư trú giữ trạng thái người trước | Đã khởi tạo lại khi đổi người/hủy; dùng thử xác nhận |
| Đổi chủ hộ qua Sửa bỏ qua xác nhận | Đã có hộp thoại; dùng thử xác nhận tên cũ → mới |
| Tìm riêng thành viên không xác định được chủ hộ hiện tại | Đã trả thông tin chủ hộ độc lập kết quả lọc; dùng thử thấy đúng |
| Tải lại mất bộ lọc | Bộ lọc được lưu URL; dùng thử tìm “Bình” rồi reload vẫn giữ |
| Lọc căn hộ bằng chuỗi số phòng | Danh sách và xuất Excel đã truyền ID căn hộ; test có mã `101`/`1101` |
| Sự kiện cư trú tương lai/hết hạn và Excel lệch trạng thái | Danh sách và xuất dùng cùng resolver theo ngày hiệu lực; test thời điểm và dùng thử căn 101 |
| Ngày mặc định lấy UTC, lệch ngày Việt Nam | Thêm helper dùng chung `shared/businessDate.mjs`; form và backend theo Việt Nam; dùng thử hiện 28/11 |
| Quan hệ mặc định khi đổi căn và form thêm nhân khẩu | Đã tách kiểm tra chủ hộ khỏi bảng đang lọc, khóa input khi đang lưu và bảo vệ draft; giữ hành vi này khi áp giao diện S2. Backend vẫn chặn chủ hộ trùng; chưa xác minh thao tác trên trình duyệt thật. |
| Bảng chật, ngày khó đọc, phải mở menu cho thao tác thường dùng | Đã cải thiện trong UI hiện tại; bản thiết kế mới tiếp tục tối ưu. Không đồng nghĩa toàn bộ 9 SVG đã được triển khai |
| Tải lịch sử cùng danh sách, cần phân trang khi lớn | Cần đánh giá khi triển khai S2; không khẳng định đã có tải lười chỉ vì UI đã thu gọn |

**Bằng chứng kiểm thử gần nhất (28/11/2026, nền commit `b065008` + working tree local sau đợt sửa rà soát cuối Sprint 1):**
- Đã sửa lọc `GET /api/residents?status=...` theo trạng thái hiệu lực ngày VN (`BUG-S1-06`), đồng nhất điều kiện ứng viên/đăng ký/cấp/duyệt/đăng nhập/xem hộ & thu hồi `token_version` khi ghi bù `"Chuyển đi"` (`BUG-S1-07`), khóa dòng `FOR UPDATE` trong transaction khi xóa căn hộ trống (`BUG-S1-08`), và đồng bộ vòng đời bộ lọc/reload/modal/khóa form thêm cư dân trên `ResidentsPage.jsx` + `ResidentForms.jsx` (`BUG-S1-09`).
- Toàn bộ suite tự động: **70/70 PASS** (`0 fail`, `0 skip`: `56` backend `npm test` + `8` backend `npm run test:e2e` + `6` frontend `node --test tests/*.test.mjs` gồm file untracked `residentsRefresh.test.mjs`). `npm run lint` (`oxlint`): **0 warnings, 0 errors**.
- `npm run build` mặc định vẫn gặp lỗi quyền `EPERM` tại `frontend/dist/assets`; `npm run build -- --outDir node_modules/.cache/s1-final-review-verify` **PASS** (37 modules, 118ms).
- **Chưa xác minh trong lần chạy này:** kiểm thử trực tiếp trên MySQL thật (bao gồm lịch khóa 2 connection thật) và kiểm tra thủ công giao diện trên trình duyệt (desktop / `390px`). Toàn bộ điều kiện còn lại của T00 (DB thử riêng, chốt baseline commit và ước lượng lại Sprint 2) vẫn đang mở.

## 4. Những quyết định đã bổ sung cho Sprint 2

Các quy tắc sau là **đề xuất v1.0 để nhóm xác nhận với bài toán trước khi code**, không phải xác nhận từ khách hàng hay kết luận nghĩa vụ tài chính thực tế:

1. Tính trọn tháng theo hộ, diện tích và đơn giá tại đầu kỳ; hộ vào giữa tháng bắt đầu kỳ sau; căn trống đầu kỳ bỏ qua. Thiếu dữ liệu lịch sử thì báo rõ, không suy diễn từ hiện tại.
2. Tách hộ mới với hộ cũ theo thời gian; nợ/chứng từ giữ đúng hộ chịu phí. Hộ mới không tự gánh nợ hoặc đọc dữ liệu hộ cũ.
3. Hóa đơn sai có quy trình hủy/thay bằng revision; không sửa snapshot trực tiếp, không thay khi vẫn còn khoản thu hợp lệ.
4. Thu tiền có idempotency và fingerprint, khóa dòng, audit cùng transaction; gửi lại sau mất phản hồi không tạo khoản thu mới.
5. Thu nhiều kỳ theo từng hóa đơn trong cùng panel, giữ căn/hộ/phương thức; chưa làm một khoản thu gộp nhiều hóa đơn trong v1.0.
6. Preview có token/phiên bản và hết hạn; dữ liệu đổi thì xem lại, phát hành toàn kỳ atomic.
7. Quyền tạo/đóng đợt quỹ tách khỏi ghi/hủy tiền; đóng đợt, hủy đóng góp và biên nhận có hợp đồng API rõ.
8. Bảng, số tổng, giấy báo và Excel dùng cùng filter, snapshot và quy tắc số tiền/ngày Việt Nam.
9. Xóa dữ liệu S1 không được làm mất lịch sử tài chính; ưu tiên lưu trữ/kết thúc/vô hiệu hóa khi đã có chứng từ.
10. Done có DB thật, concurrency, in, backup/restore, hiệu năng và UX làm bằng chứng.

Thiết kế dự kiến gồm **7 bảng mới + 5 bảng S1 = 12 bảng nghiệp vụ**, mở rộng thêm trường lịch sử trên các bảng cũ. Bảng metadata migration kỹ thuật nếu cần không được tính lẫn vào số bảng nghiệp vụ. Đây mới là thiết kế, chưa có migration S2 được thực thi.

## 5. Tổng hợp thiết kế giao diện

- Định hướng: sidebar gọn, tìm kiếm/danh sách làm trung tâm, thao tác thường dùng tại dòng, biểu mẫu chỉ mở khi cần; modal giữ ngữ cảnh người/phòng.
- Màu teal/navy, nền sáng, chữ tương phản; Segoe UI và tiếng Việt; trường/nút chính cao 42–50 px. Phân biệt trạng thái bằng cả chữ lẫn màu.
- 9 board ban đầu và 34 board bổ sung phủ 11 US Sprint 2: đơn giá, preview, bảng thu, thu/xác nhận/biên lai/hủy, quỹ, công nợ, báo cáo, quyền/audit và cư dân. Xem [bản đồ thiết kế S2](../design/bluemoon-ui-redesign/SPRINT2-DESIGN.md).
- Bản tĩnh chứa dữ liệu minh họa. Tài khoản BQT và form đăng ký đầy đủ chưa có board riêng; cần dùng cùng thành phần khi triển khai. Vai trò hiển thị trong mẫu phải khớp quyền thật.
- Một số nút bên trong SVG cho chuyển bước trong gallery; các scene là độc lập, không chạy nghiệp vụ hay lưu dữ liệu. Không gắn nhãn “prototype Figma hoàn chỉnh” hoặc “frontend mới đã xong”.

Tài nguyên: [gallery HTML](../design/bluemoon-ui-redesign/index.html), [ZIP nhập Figma](../design/bluemoon-ui-redesign/bluemoon-figma-import.zip), [hướng dẫn và nguyên tắc](../design/bluemoon-ui-redesign/README.md), [đặc tả UI S2](./wireframes-sprint2-uiux.md). Địa chỉ `http://localhost:5175` chỉ dùng khi server xem trước còn chạy.

## 6. Lộ trình và phân công ngắn

Kế hoạch chi tiết: [Sprint 2 Implementation Plan](./sprint2-implementation-plan.md). **12 task T00–T11, khung đề xuất 10 ngày làm việc**, bắt đầu sau khi nhóm chốt D1; không hứa hoàn thành trong các ngày còn lại của lịch cũ 13–30/11. Ước lượng 38 SP cũ cần đánh giá lại.

| Giai đoạn | Trọng tâm | Phụ trách đề xuất |
|---|---|---|
| D1–D3 | Baseline S1, DB thử, lịch sử hộ/diện tích, quyền/audit, đơn giá | Hiếu + Vĩ + Nhật |
| D3–D5 | Preview/phát hành/hủy-thay hóa đơn; bắt đầu query công nợ | Nhật + Bảo |
| D5–D7 | Thu/hủy thu, idempotency, biên lai và đối soát công nợ | Vĩ + Bảo, Hiếu review quyền |
| D7–D9 | Quỹ, cư dân, báo cáo; hoàn thiện UI đồng bộ | Cả nhóm; Nhật hỗ trợ quỹ |
| D9–D10 | E2E thật, concurrency, in/Excel, restore, hiệu năng, tài liệu | Hiếu điều phối + cả nhóm |

Giao diện chung có thể làm từ D2, nhưng tính năng chỉ bật khi API và quyền tương ứng đã có. Vĩ có nguy cơ quá tải; cần điều chuyển công việc hỗ trợ, không chờ cuối sprint mới tích hợp.

## 7. Điều kiện đóng dự án v1.0

- [ ] Chạy lại đầy đủ kiểm thử S1, nghiệm thu từng AC và cập nhật báo cáo thật.
- [ ] Hoàn thành 11 US S2 theo tiêu chí gốc và phần bổ sung, không còn lỗi nghiêm trọng về tiền/phân quyền.
- [ ] Đối chiếu kết quả 43 ca chức năng trong phạm vi và E2E/OPS/PERF/UX (FTC-S2-27/30 ngoài phạm vi); không chuyển Planned sang Pass chỉ vì đã viết tài liệu.
- [ ] DB thật chứng minh chống thu trùng, rollback và quyền qua các hộ; không chỉ mock.
- [ ] Bảng/totals/Excel khớp; chứng từ cũ bất biến, in lại không thu lại, hủy có dấu và audit.
- [ ] Restore vào DB thử thành công; có số đo hiệu năng đúng điều kiện spec và kiểm tra desktop/390px.
- [ ] UI được áp dụng, hướng dẫn cài/chạy/demo và traceability được đồng bộ; báo rõ giới hạn v1.0.

**Demo xuyên suốt:** tạo căn/hộ → hai kỳ hóa đơn → thu một phần → trả nợ kỳ trước → gửi lại/in lại → hủy thu nhầm → sửa sai hóa đơn → thay hộ → kiểm quyền cư dân → quỹ → báo cáo/audit → trình bày minh chứng kiểm thử và khôi phục.

## 8. Bản đồ tài liệu

| Nhu cầu | Nguồn chính |
|---|---|
| Cài/chạy và phạm vi hiện có | [README](../README.md) |
| Hiểu mục tiêu, US và AC | [Product vision & backlog](./product-vision-and-backlog.md) |
| Lập trình Sprint 2 theo task | [Kế hoạch triển khai](./sprint2-implementation-plan.md) |
| Schema, quyền, API, quy tắc nghiệp vụ | [Thiết kế kỹ thuật](./sprint2-technical-base.md) |
| Tình huống kiểm thử S2 | [Test plan S2](./test-plan-and-cases-s2.md) |
| Kết quả S1 và lưu ý baseline | [Test report S1](./test-report-s1.md) |
| Thiết kế UI S2 và trạng thái cần vẽ | [UI S2](./wireframes-sprint2-uiux.md) |
| Xem các board mới / nhập Figma | [Bộ giao diện mới](../design/bluemoon-ui-redesign/README.md) |

Khi có thay đổi phạm vi, sửa nguồn quy tắc trước, cập nhật kế hoạch/test/UI và trạng thái trong bản tổng hợp này. Không dùng bản tóm tắt để ghi đè hợp đồng API hoặc kết quả thực thi.


**Quyết định S2 ngày 28/11/2026:** DEC-01–DEC-11 đã chốt theo [sổ quyết định](sprint2-decisions.md), gồm xác nhận sáu đề xuất cuối trong chat. Mục tiêu nghiệm thu DEC-10 được giảm còn 100 căn/400 nhân khẩu/6 kỳ/1.000 khoản thu/3 phiên; không làm backup tự động hay cam kết RPO/RTO trong v1.0. Điều này không đồng nghĩa S2/T00 đã hoàn tất hoặc mục tiêu hiệu năng đã đạt.
