# Tầm nhìn Sản phẩm, Product Backlog, Sprint Backlog & Kiến trúc (BlueMoon SE09)

Tài liệu này chính thức hóa trên GitHub các đầu mục: **Product Vision (Mục 1)**, **Product Backlog (Mục 2)**, **Sprint Backlogs (Mục 3)**, **User Stories (Mục 4)** và **Kiến trúc & Design Patterns (Mục 10)**.

---

## 1. Tầm nhìn sản phẩm (Product Vision — Mục 1)

### 1.1. Vấn đề hiện tại (As-Is Problem)
Ban quản trị (BQT) chung cư BlueMoon đang quản lý căn hộ, nhân khẩu, biến động cư trú và thu phí hoàn toàn thủ công trên sổ giấy và các file Excel rời rạc (`ASIS-01` đến `ASIS-12`). Cách làm này dẫn đến:
- Nhầm lẫn giữa diện tích khu đất ($450\text{ m}^2$) với diện tích từng căn hộ khi tính phí.
- Hồ sơ chủ hộ, nhân khẩu và lịch sử tạm trú/tạm vắng/chuyển đi nằm phân tán, mất 1–2 ngày lọc thủ công mỗi khi cơ quan chức năng yêu cầu danh sách cư trú.
- Không có cơ chế phân quyền tài khoản riêng cho từng thành viên BQT.

### 1.2. Mục tiêu & Tầm nhìn v1.0
Xây dựng hệ thống phần mềm quản lý chung cư **BlueMoon SE09** sử dụng cơ sở dữ liệu **MySQL tập trung**, giúp BQT quản lý xuyên suốt từ tài khoản nội bộ, danh mục căn hộ, hồ sơ hộ/nhân khẩu, lịch sử cư trú đến đơn giá, bảng thu định kỳ, quỹ đóng góp tự nguyện và báo cáo công nợ.

### 1.3. Quyết định kiến trúc công nghệ (Architecture Decision Record — ADR-001)
- **Bối cảnh:** Bản Project Charter ban đầu ghi định hướng `Java desktop + MySQL`. Tuy nhiên, để đảm bảo khả năng truy cập đồng thời cho nhiều thành viên BQT (Quản trị viên, Kế toán, Thủ quỹ), tách biệt rõ tầng giao diện và tầng nghiệp vụ REST API, nhóm SE09 thống nhất triển khai trên nền tảng **Web Client–Server**:
  - **Frontend (Client):** React 19, React Router 7, Vite 8 (chạy tại cổng `5174`, đóng gói tĩnh ra `frontend/dist`).
  - **Backend (Server):** Node.js, Express 5 REST API (chạy tại cổng `3001`), xác thực JWT và băm mật khẩu `bcrypt`.
  - **Cơ sở dữ liệu:** MySQL 8 tập trung (`bluemoon_se09`), kết nối qua Connection Pool `mysql2/promise` với Transaction ACID và khóa dòng `SELECT ... FOR UPDATE`.

---

## 2. Product Backlog toàn dự án (Mục 2 — 21 User Stories)

Tổng cộng **21 User Stories**: **19 US thuộc phạm vi v1.0** (16 Must + 3 Should) và **2 US ngoài phạm vi v1.0** (dành cho v2.0).

| TT | US ID | Epic | Feature | Nội dung User Story | Ưu tiên | Phiên bản | Sprint | SP | Phụ trách | Trạng thái |
|---:|---|---|---|---|---|---|---|---:|---|---|
| 1 | **US-015** | EP-05 | FE-051 | Là quản trị viên, tôi muốn cấp tài khoản cho thành viên BQT để mỗi người có tài khoản riêng | Must | v1.0 | Sprint 1 | 3 | Phạm Minh Hiếu | **Done (S1)** |
| 2 | **US-016** | EP-05 | FE-051 | Là thành viên BQT, tôi muốn đăng nhập bằng tài khoản được cấp để chỉ người trong ban mới vào phần mềm | Must | v1.0 | Sprint 1 | 2 | Phạm Minh Hiếu | **Done (S1)** |
| 3 | **US-017** | EP-05 | FE-052 | Là thành viên BQT, tôi muốn sửa thông tin của mình và đổi mật khẩu để tự quản lý tài khoản đang dùng | Must | v1.0 | Sprint 1 | 2 | Lê Tuấn Vĩ | **Done (S1)** |
| 4 | **US-001** | EP-01 | FE-011 | Là thành viên BQT, tôi muốn lưu căn hộ và diện tích để lấy đó làm căn cứ tính phí | Must | v1.0 | Sprint 1 | 3 | Nguyễn Quang Nhật | **Done (S1)** |
| 5 | **US-002** | EP-01 | FE-012 | Là thành viên BQT, tôi muốn lưu chủ hộ và nhân khẩu của từng căn để hồ sơ cư dân nằm ở một chỗ | Must | v1.0 | Sprint 1 | 5 | Lê Tuấn Vĩ | **Done (S1)** |
| 6 | **US-003** | EP-01 | FE-012 | Là thành viên BQT, tôi muốn tìm hộ hoặc nhân khẩu theo số phòng hoặc họ tên để không cần lọc trên Excel | Must | v1.0 | Sprint 1 | 2 | Lê Tuấn Vĩ | **Done (S1)** |
| 7 | **US-004** | EP-01 | FE-013 | Là thành viên BQT, tôi muốn ghi tạm trú, tạm vắng, chuyển đi và chuyển đến để hồ sơ cư trú đúng với giấy tờ vừa nộp | Must | v1.0 | Sprint 1 | 3 | Lê Tuấn Vĩ | **Done (S1)** |
| 8 | **US-005** | EP-01 | FE-014 | Là thành viên BQT, tôi muốn xuất danh sách nhân khẩu theo trạng thái cư trú để nộp cho cơ quan khi được yêu cầu | Must | v1.0 | Sprint 1 | 3 | Đặng Gia Bảo | **Done (S1)** |
| 9 | **US-006** | EP-02 | FE-021 | Là kế toán BQT, tôi muốn chốt giá phí dịch vụ (2.500–16.500 đ/m²) và phí quản lý ($\ge 7.000$ đ/m²) | Must | v1.0 | Sprint 2 | 3 | Nguyễn Quang Nhật | Planned (S2) |
| 10 | **US-007** | EP-02 | FE-022 | Là thành viên BQT, tôi muốn tạo đợt đóng góp tự nguyện tách khỏi phí bắt buộc | Must | v1.0 | Sprint 2 | 2 | Lê Tuấn Vĩ | Planned (S2) |
| 11 | **US-008** | EP-03 | FE-031 | Là kế toán BQT, tôi muốn hệ thống sinh bảng thu đầu tháng cho mọi căn (Phí = diện tích × đơn giá) | Must | v1.0 | Sprint 2 | 5 | Nguyễn Quang Nhật | Planned (S2) |
| 12 | **US-009** | EP-03 | FE-032 | Là kế toán BQT, tôi muốn in giấy báo theo từng căn | Should | v1.0 | Sprint 2 | 3 | Đặng Gia Bảo | Planned (S2) |
| 13 | **US-010** | EP-03 | FE-033 | Là thủ quỹ BQT, tôi muốn ghi tiền cư dân nộp (Tiền mặt / Chuyển khoản) và in biên lai | Must | v1.0 | Sprint 2 | 5 | Lê Tuấn Vĩ | Planned (S2) |
| 14 | **US-011** | EP-03 | FE-034 | Là thủ quỹ BQT, tôi muốn ghi số tiền một hộ ủng hộ theo đợt và theo quỹ | Must | v1.0 | Sprint 2 | 3 | Lê Tuấn Vĩ | Planned (S2) |
| 15 | **US-012** | EP-03 | FE-035 | Là kế toán BQT, tôi muốn xem các căn chưa nộp đủ trong kỳ | Must | v1.0 | Sprint 2 | 3 | Nguyễn Quang Nhật | Planned (S2) |
| 16 | **US-013** | EP-04 | FE-041 | Là thành viên BQT, tôi muốn xem lịch sử đóng tiền của một căn | Must | v1.0 | Sprint 2 | 3 | Đặng Gia Bảo | Planned (S2) |
| 17 | **US-014** | EP-04 | FE-042 | Là kế toán BQT, tôi muốn xuất tổng số đã thu theo loại phí và theo quỹ | Must | v1.0 | Sprint 2 | 5 | Đặng Gia Bảo | Planned (S2) |
| 18 | **US-018** | EP-05 | FE-051 | Là quản trị viên, tôi muốn gán vai trò chi tiết cho từng tài khoản | Should | v1.0 | Sprint 2 | 3 | Phạm Minh Hiếu | Planned (S2) |
| 19 | **US-019** | EP-05 | FE-053 | Là quản trị viên, tôi muốn xem nhật ký thêm, sửa, xóa hồ sơ cư dân và giao dịch thu | Should | v1.0 | Sprint 2 | 3 | Phạm Minh Hiếu | Planned (S2) |
| 20 | **US-020** | EP-06 | FE-061 | Khai báo xe và tính phí gửi xe tháng theo loại xe (xe máy 70.000 đ, ô tô 1.200.000 đ) | Could | v2.0 | Ngoài v1.0 | 5 | Nhóm v2.0 | Won't Have v1.0 |
| 21 | **US-021** | EP-06 | FE-062 | Nhập tiền điện, nước, Internet theo thông báo của nhà cung cấp | Could | v2.0 | Ngoài v1.0 | 3 | Nhóm v2.0 | Won't Have v1.0 |

---

## 3. Sprint 1 Backlog & Chi tiết 8 User Stories (Mục 3 & Mục 4)

- **Mục tiêu Sprint 1 (04/11 – 08/11/2026):** Hoàn thành luồng quản trị tài khoản BQT và quản lý căn hộ, hộ gia đình, nhân khẩu, lịch sử cư trú, tìm kiếm và xuất danh sách Excel (8 Must US — 23 Story Points).

| WBS | US ID | Chủ sở hữu | Lịch thực hiện | SP | Phụ thuộc | Tiêu chí chấp nhận (Acceptance Criteria) |
|---|---|---|---|---:|---|---|
| `3.1.1` | **US-015** | Phạm Minh Hiếu | 04/11/2026 | 3 | — | *Given* đăng nhập bằng tài khoản ADMIN, *When* nhập tên đăng nhập chưa trùng, họ tên và mật khẩu khởi tạo rồi bấm Cấp, *Then* người đó đăng nhập được. Tài khoản chưa cấp không vào được màn hình nghiệp vụ. |
| `3.1.2` | **US-016** | Phạm Minh Hiếu | 04/11/2026 | 2 | 3.1.1 | *Given* ở màn hình đăng nhập, *When* nhập đúng tài khoản và mật khẩu, *Then* vào màn hình chính. *When* nhập sai, *Then* ở lại màn hình đăng nhập và thấy báo lỗi. *When* chưa đăng nhập, *Then* không mở được màn hình căn hộ/cư dân. |
| `3.1.3` | **US-017** | Lê Tuấn Vĩ | 05/11/2026 | 2 | 3.1.2 | *Given* đã đăng nhập, *When* sửa họ tên hoặc số điện thoại và bấm Lưu, *Then* hồ sơ của tôi đổi. *When* nhập đúng mật khẩu hiện tại và mật khẩu mới rồi bấm Đổi mật khẩu, *Then* lần đăng nhập sau dùng mật khẩu mới. Không sửa được hồ sơ người khác. |
| `3.1.4` | **US-001** | Nguyễn Quang Nhật | 26/10 – 03/11 | 3 | 2.2 | *Given* đang ở màn hình chính, *When* nhập số phòng và diện tích $> 0$ rồi bấm Lưu, *Then* căn đó xuất hiện trong danh mục và dùng cho các kỳ thu sau (không dùng diện tích $450\text{ m}^2$ khu đất). |
| `3.1.5` | **US-002** | Lê Tuấn Vĩ | 05/11 – 06/11 | 5 | 3.1.4 | *Given* đã chọn một căn, *When* nhập họ tên, ngày sinh, quan hệ với chủ hộ và bấm Thêm nhân khẩu, *Then* người đó gắn với căn hộ và hiện trong danh sách nhân khẩu của căn (bắt buộc tạo Chủ hộ trước, mỗi căn 1 Chủ hộ). |
| `3.1.6` | **US-003** | Lê Tuấn Vĩ | 06/11/2026 | 2 | 3.1.5 | *Given* đang ở màn hình nhân khẩu, *When* nhập số phòng hoặc họ tên và bấm Tìm, *Then* danh sách chỉ còn hồ sơ khớp, phản hồi $< 2$ giây theo NFR-01. |
| `3.1.7` | **US-004** | Lê Tuấn Vĩ | 06/11 – 07/11 | 3 | 3.1.5 | *Given* nhân khẩu đã có trong hệ thống, *When* chọn trạng thái, nhập ngày bắt đầu và ngày kết thúc rồi bấm Xác nhận, *Then* trạng thái hiện tại đổi và lần đổi này còn lưu trong lịch sử. |
| `3.1.8` | **US-005** | Đặng Gia Bảo | 07/11 – 08/11 | 3 | 3.1.7 | *Given* đã có nhân khẩu và biến động, *When* chọn trạng thái và bấm Xuất, *Then* nhận được file Excel `.xlsx` gồm những người đang ở trạng thái đó kèm số phòng giữ nguyên số `0` đầu. |

---

## 3.2. Sprint 2 Backlog — Kế hoạch chuẩn bị (Mục 3 & Mục 4 — 11 US, 38 SP, Trạng thái: Chưa bắt đầu)

- **Mục tiêu Sprint 2 (13/11 – 30/11/2026 — Planned / Not Started):** Xây dựng phân hệ quản lý đơn giá phí bắt buộc, quỹ đóng góp tự nguyện, sinh bảng thu đầu tháng theo diện tích căn hộ, thu tiền & in biên lai/giấy báo, theo dõi công nợ, xuất báo cáo thu phí Excel, phân quyền chi tiết và nhật ký kiểm toán (8 Must US + 3 Should US — 38 Story Points).
- **Trạng thái thực thi hiện tại:** Đã hoàn tất lập kế hoạch Sprint 2 Backlog và tài liệu Base kỹ thuật ([sprint2-technical-base.md](./sprint2-technical-base.md)); **chưa bắt đầu triển khai code chức năng Sprint 2 (`0/11 US`)**.

| WBS | US ID | Chủ sở hữu | Lịch dự kiến | SP | Phụ thuộc | Tiêu chí chấp nhận (Acceptance Criteria) | Trạng thái |
|---|---|---|---|---:|---|---|---|
| `3.3.1` | **US-006** | Nguyễn Quang Nhật | 13/11 – 15/11 | 3 | 3.1.4 (`US-001`) | *Given* đăng nhập vai trò Kế toán/BQT, *When* nhập đơn giá phí dịch vụ trong khung $2.500\text{–}16.500\text{ đ/m}^2$ và phí quản lý $\ge 7.000\text{ đ/m}^2$ rồi bấm Lưu, *Then* hệ thống lưu cấu hình đơn giá áp dụng cho kỳ thu. *When* nhập ngoài khung quy định, *Then* từ chối lưu và báo lỗi. | Planned (0%) |
| `3.3.2` | **US-007** | Lê Tuấn Vĩ | 15/11 – 16/11 | 2 | 3.1.2 (`US-016`) | *Given* thành viên BQT đăng nhập, *When* tạo đợt đóng góp tự nguyện (tên quỹ, đợt vận động, ngày bắt đầu/kết thúc), *Then* đợt đóng góp được lưu tách biệt hoàn toàn với các khoản phí bắt buộc. | Planned (0%) |
| `3.3.3` | **US-008** | Nguyễn Quang Nhật | 16/11 – 19/11 | 5 | 3.3.1 (`US-006`) | *Given* đã có danh mục căn hộ kèm diện tích (`apartments.area`) và đơn giá phí, *When* kế toán chọn tháng/năm và bấm Sinh bảng thu đầu tháng, *Then* hệ thống tự động tạo hóa đơn cho mọi căn hộ theo công thức $\text{Phí} = \text{Diện tích} \times \text{Đơn giá}$. Không cho phép sinh trùng kỳ thu. | Planned (0%) |
| `3.3.4` | **US-009** | Đặng Gia Bảo | 19/11 – 20/11 | 3 | 3.3.3 (`US-008`) | *Given* bảng thu kỳ hiện tại đã được sinh, *When* chọn một căn hộ và bấm Xem/In giấy báo phí, *Then* hiển thị đúng số phòng, chủ hộ, diện tích, chi tiết từng khoản phí và tổng số tiền phải nộp. | Planned (0%) |
| `3.3.5` | **US-010** | Lê Tuấn Vĩ | 20/11 – 23/11 | 5 | 3.3.3 (`US-008`) | *Given* căn hộ có khoản phải thu trong kỳ, *When* thủ quỹ nhập số tiền cư dân nộp, chọn hình thức (`Tiền mặt` / `Chuyển khoản`) và bấm Ghi nhận, *Then* giao dịch được lưu, cập nhật số đã nộp/còn nợ của căn hộ và xuất mẫu biên lai thu tiền. | Planned (0%) |
| `3.3.6` | **US-011** | Lê Tuấn Vĩ | 23/11 – 24/11 | 3 | 3.3.2 (`US-007`) | *Given* đợt đóng góp tự nguyện đang mở, *When* thủ quỹ chọn căn hộ/hộ gia đình, chọn quỹ và nhập số tiền ủng hộ, *Then* hệ thống lưu khoản ủng hộ theo đúng đợt và quỹ mà không cộng lẫn vào công nợ phí bắt buộc. | Planned (0%) |
| `3.3.7` | **US-012** | Nguyễn Quang Nhật | 24/11 – 25/11 | 3 | 3.3.5 (`US-010`) | *Given* đang trong hoặc sau kỳ thu, *When* kế toán mở danh sách công nợ theo kỳ, *Then* hệ thống lọc chính xác các căn hộ chưa nộp hoặc nộp chưa đủ (`total_paid < total_due`) kèm số tiền còn thiếu. | Planned (0%) |
| `3.3.8` | **US-013** | Đặng Gia Bảo | 25/11 – 26/11 | 3 | 3.3.5, 3.3.6 | *Given* chọn một căn hộ bất kỳ, *When* mở tab Lịch sử đóng tiền, *Then* hiển thị đầy đủ các lần nộp phí bắt buộc và ủng hộ tự nguyện theo thứ tự thời gian kèm người thu và phương thức thanh toán. | Planned (0%) |
| `3.3.9` | **US-014** | Đặng Gia Bảo | 26/11 – 28/11 | 5 | 3.3.5, 3.3.6 | *Given* đã có dữ liệu thu phí và ủng hộ, *When* kế toán chọn kỳ thu và bấm Xuất báo cáo Excel, *Then* tải về file `.xlsx` tổng hợp chính xác tổng số tiền đã thu theo từng loại phí bắt buộc và theo từng quỹ tự nguyện. | Planned (0%) |
| `3.3.10` | **US-018** | Phạm Minh Hiếu | 28/11 – 29/11 | 3 | 3.1.1 (`US-015`) | *Given* đăng nhập bằng `ADMIN`, *When* gán vai trò chi tiết cho tài khoản BQT (`ADMIN`, `ACCOUNTANT`, `TREASURER`, `BQT`), *Then* hệ thống phân quyền truy cập API và menu tương ứng với vai trò được gán. | Planned (0%) |
| `3.3.11` | **US-019** | Phạm Minh Hiếu | 29/11 – 30/11 | 3 | 3.1.5, 3.3.5 | *Given* có thao tác thêm/sửa/xóa hồ sơ cư dân hoặc ghi nhận giao dịch thu phí, *When* `ADMIN` mở màn hình Nhật ký hệ thống, *Then* hiển thị lịch sử thao tác (người thực hiện, hành động, đối tượng, thời gian). | Planned (0%) |

---

## 4. Kiến trúc Phân tầng Client–Server & Design Patterns (Mục 10)

### 4.1. Kiến trúc Client–Server + Layered REST API (Khác biệt với Monolithic MVC)
Dự án **không sử dụng Monolithic MVC truyền thống** mà tách hẳn thành 2 ứng dụng độc lập giao tiếp qua giao thức HTTP REST API + JSON:
- **Client (`frontend/`):** Ứng dụng Single Page Application (React 19 + Vite 8), quản lý giao diện, trạng thái (`useState`, `AuthContext`) và gọi REST API qua `frontend/src/services/api.js`. Frontend không render từ view template của Express.
- **Server (`backend/`):** Ứng dụng Express 5 cung cấp REST API, tổ chức theo **Kiến trúc phân tầng (Layered Architecture)** gồm 5 tầng tách biệt:
  1. **Routing Layer (`backend/api/routes/`):** Định nghĩa các REST endpoints (`/api/auth`, `/api/accounts`, `/api/apartments`, `/api/residents`).
  2. **Middleware Layer (`backend/middlewares/auth.js`):** Xác thực JWT token (`requireAuth`) và kiểm tra quyền quản trị (`requireAdmin`).
  3. **Handler Layer (`backend/api/handlers/`):** Nhận HTTP request (`req.params`, `req.query`, `req.body`, `req.user`), gọi tầng Service và trả HTTP response (`JSON` hoặc `.xlsx` buffer).
  4. **Service & Validator Layer (`backend/services/`, `backend/validators/`):** Thực thi quy tắc nghiệp vụ, kiểm tra dữ liệu đầu vào và ném lỗi chuẩn `AppError(statusCode, message)`.
  5. **Repository Layer (`backend/repositories/`):** Chứa toàn bộ truy vấn SQL tham số hóa (`?`) và quản lý Transaction ACID (`beginTransaction`, `SELECT ... FOR UPDATE`, `commit`, `rollback`).

### 4.2. Các Design Patterns áp dụng trong mã nguồn
- **Singleton Pattern (Module-level Shared Instance — `backend/config/database.js`):** Khởi tạo duy nhất một đối tượng MySQL Connection Pool (`export const pool = mysql.createPool(...)`) ở cấp ES Module và tái sử dụng xuyên suốt toàn bộ ứng dụng, tránh tạo kết nối tràn lan.
- **Repository Pattern (`backend/repositories/`):** Gồm 3 module chuyên biệt trong Sprint 1 (`userRepository.js`, `apartmentRepository.js`, `residentRepository.js`), che giấu chi tiết câu lệnh SQL và ánh xạ dòng dữ liệu snake_case của MySQL sang object camelCase cho tầng Service.
- **Strategy / Observer (Định hướng Sprint 2):** Pattern Strategy phục vụ đa phương thức thu phí / tính biểu phí (`US-006`, `US-008`, `US-010`, `US-011`) thuộc phạm vi Sprint 2 (13/11 – 30/11).
