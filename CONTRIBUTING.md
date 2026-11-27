# Quy trình làm việc nhóm BlueMoon SE09

Quy ước đề xuất cập nhật 28/11/2026 để nhóm áp dụng khi nhận việc Sprint 2. Chưa khẳng định repo đã cấu hình branch protection hay CI bắt buộc.

## Trước khi nhận task

- Đọc [mục lục nhóm](docs/README.md), xác định task T00–T11, US, đầu vào/đầu ra và phụ thuộc trong [kế hoạch](docs/sprint2-implementation-plan.md).
- Ghi người làm/người review vào bảng task nhóm đang sử dụng; tên trong kế hoạch hiện là đề xuất. Không tự coi task phụ thuộc đã Done vì có mock.
- Kiểm tra `git status` trước khi sửa. Giữ thay đổi chưa commit của người khác; không reset/clean, force push hoặc gom toàn bộ file bằng `git add .` khi chưa kiểm tra.
- Chốt các trường API và quy tắc còn mở ảnh hưởng task trong [decisions](docs/sprint2-decisions.md).

## Nhánh, commit và PR

1. Tạo nhánh từ nhánh tích hợp nhóm thống nhất; nếu đang dùng `main`, kiểm tra và cập nhật khi working tree an toàn. Không đổi nhánh hoặc pull khi có thay đổi chưa xử lý.
2. Tên nhánh gợi ý: `feature/s2-t05-payment`, `fix/s2-t05-replay`, `docs/s2-api-contract`.
3. Mỗi commit có một mục đích; thông điệp gợi ý `feat(s2): record partial payment`, `fix(s2): recompute status after void`, `docs(s2): clarify response fields`.
4. Trước commit, xem diff và stage đúng file. Không commit `.env`, token, mật khẩu, dữ liệu thật, cache hoặc log chứa thông tin nhạy cảm.
5. PR ghi: vấn đề/US/task; hành vi sau thay đổi; thay đổi API/schema; cách kiểm tra và kết quả thực tế; phần chưa kiểm chứng; ảnh UI nếu có thay đổi giao diện.
6. Người review kiểm nghiệp vụ, quyền, tiền, transaction, lỗi biên và tài liệu. Chỉ merge sau khi phản hồi quan trọng được xử lý và kiểm tra liên quan đạt. Người merge do nhóm thống nhất; không tự đưa production/deploy vào phạm vi PR.

Khi conflict, đọc cả hai thay đổi và giải quyết theo hợp đồng đã chốt. Không chọn toàn bộ “ours/theirs” để bỏ qua conflict. Nếu đụng file người khác đang làm, trao đổi phạm vi trước khi sửa chồng.

## Quy ước code và hợp đồng

- Giữ React/Vite và Express/ES modules hiện có; không tự nâng dependency hoặc thêm framework chỉ để đồng nhất phong cách.
- Backend theo `routes → handlers → services → repositories`; SQL tham số hóa. Actor lấy từ middleware, không lấy từ body.
- Dùng `getBusinessDate()` cho ngày nghiệp vụ VN; tiền theo số nguyên đồng/decimal chính xác. Chi tiết tại [hướng dẫn S2](docs/huong-dan-lam-sprint2.md).
- Frontend dùng API helper hiện có, phân quyền cả UI lẫn server. Không đổi tên trường JSON mà chỉ sửa một phía; đổi hợp đồng phải cập nhật API doc, fixture và bên gọi.
- Khóa theo thứ tự thống nhất; thu/hủy/audit dùng cùng transaction. Không bỏ unique, audit hay kiểm quyền để xử lý test thất bại.

## Migration và dữ liệu thử

- Chỉ thử trên DB riêng; `DB_*` là cấu hình runtime hiện tại. `TEST_DB_*` và script `test:db` là đề xuất cho test S2, chưa được code hiện tại tự hỗ trợ.
- Migration cần kiểm tra dữ liệu cũ, chạy lại được, có đường tiếp tục khi DDL lỗi giữa chừng; MySQL DDL không rollback toàn bộ như DML.
- Bàn giao schema trước khi các task phụ thuộc tích hợp. Không tự sửa lịch sử đã áp dụng trên DB chung; ghi migration bổ sung và kế hoạch chuyển dữ liệu để nhóm review.
- Backup trước thao tác thật; restore chỉ trên DB thử. Không seed/reset DB demo, không đổi secret hay deploy khi chỉ được giao code task.

## Kiểm tra và bàn giao

Chạy test liên quan nhỏ nhất có ý nghĩa trong lúc làm. Các script hiện có:

| Thư mục chạy | Lệnh | Phạm vi |
|---|---|---|
| `backend` | `npm test` | Bộ `tests/*.test.js`, hiện dùng mock |
| `backend` | `npm run test:e2e` | Bộ `tests/*.integration.js`, hiện dùng mock; tên e2e chưa chứng minh DB thật |
| `frontend` | `node --test tests/api.test.mjs` | API helper |
| `frontend` | `npm run lint` | Lint frontend |
| `frontend` | `npm run build` | Build frontend |

Các lệnh trên là lệnh hiện có, không phải yêu cầu chạy toàn bộ sau mọi sửa nhỏ. Khi tích hợp/đóng sprint, chạy bộ hồi quy và nghiệm thu DB thật theo kế hoạch. Nếu lỗi quyền khi build, ghi rõ đường dẫn và cách xác minh thay thế; không báo build mặc định đạt khi chỉ build thư mục tạm.

Checklist bàn giao:

- [ ] Đủ tiêu chí task, trường hợp lỗi và kiểm quyền liên quan.
- [ ] Có kết quả kiểm tra ghi lệnh, ngày, code/diff, pass/fail/skip và giới hạn.
- [ ] Có migration/fixture nếu cần, không chứa dữ liệu thật.
- [ ] API, decisions, test plan và changelog được cập nhật khi có thay đổi tương ứng.
- [ ] Người review biết phần chưa xong; không ghi Done dựa trên ảnh hoặc HTTP 200 riêng lẻ.
- [ ] Nếu phát hành bộ tài liệu local, đồng bộ bản sao và kiểm lại liên kết; không upload Drive hoặc push chỉ vì đã hoàn thành tài liệu.
