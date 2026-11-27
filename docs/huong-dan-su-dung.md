# Hướng dẫn sử dụng BlueMoon SE09

Tài liệu này hướng dẫn cách thao tác trên ứng dụng web quản lý chung cư BlueMoon SE09. Nếu bạn chưa cài chạy dự án trên máy, xem trước file [huong-dan-cai-dat.md](./huong-dan-cai-dat.md).

## Đăng nhập và phân quyền

Mở trình duyệt vào `http://localhost:5174`. Chưa đăng nhập thì web sẽ tự đẩy về trang đăng nhập. Nếu bạn giữ nguyên file cấu hình mẫu lúc cài đặt, đăng nhập quản trị bằng tài khoản `admin` / `admin123`.

Web có ba loại tài khoản, thanh menu phía trên sẽ tự ẩn/hiện tùy theo quyền của bạn:

- Tài khoản Quản trị (`ADMIN`) dùng được hết các chức năng quản lý chung cư, cộng thêm mục **Cấp tài khoản** để tạo, đặt lại mật khẩu 1-click hoặc xóa tài khoản cho thành viên BQT.
- Tài khoản Thành viên BQT (`BQT`) quản lý căn hộ, hộ và nhân khẩu, xuất Excel, duyệt/cấp tài khoản cho cư dân và tự sửa hồ sơ cá nhân.
- Tài khoản Cư dân (`RESIDENT`) xem được toàn bộ thông tin căn hộ (số phòng, diện tích, chủ hộ, tổng nhân khẩu), bảng thành viên cùng hộ gia đình, lịch sử biến động cư trú của hộ ở màn hình chính, kèm trang đổi mật khẩu.

> **Bảo mật đăng nhập:** Nếu nhập sai mật khẩu 5 lần liên tiếp, tài khoản sẽ tự động tạm khóa 5 phút để chống dò mật khẩu. Quản trị viên hoặc BQT có thể bấm **Đặt lại MK** để mở khóa và cấp lại mật khẩu mặc định (`123456`) ngay lập tức.

## 1. Lưu, xem và sửa nhanh danh mục căn hộ

Chức năng này nằm ngay tại **Màn hình chính** (dành cho Quản trị và BQT). Bạn nên nhập căn hộ trước, vì bước thêm chủ hộ và nhân khẩu sau đó sẽ lấy danh sách từ đây.

1. Nhập **Số phòng** (ví dụ `050`, `101`, `12A04`) và **Diện tích (m²)** (bắt buộc lớn hơn 0).
2. Bấm **Lưu**.

Căn hộ vừa tạo sẽ hiện ngay trong bảng **Danh mục căn hộ** bên dưới. Số phòng không được trùng nhau; nếu nhập lại số phòng đã có, web sẽ báo lỗi và không ghi đè. Khi cần chỉnh lại số phòng hoặc diện tích nhập nhầm, bấm nút **Sửa** ngay trên dòng căn hộ đó, chỉnh trực tiếp rồi bấm **Lưu**. Nếu tạo nhầm một căn hộ trống (chưa có nhân khẩu), bấm nút **Xóa** rồi bấm **Xác nhận** để xóa bỏ (hệ thống tự chặn xóa nếu căn hộ đang có nhân khẩu).

## 2. Quản lý hộ và nhân khẩu

Chọn mục **Hộ và nhân khẩu** trên thanh menu. Màn hình này gom gọn các thao tác: thêm nhân khẩu, sửa nhanh tại chỗ, đổi chủ hộ 1-click, xuất Excel, tra cứu và cập nhật tình trạng cư trú.

### Thêm chủ hộ và thành viên

1. Chọn căn hộ ở danh sách thả xuống.
2. Nhập **Họ và tên** (tối thiểu 2 ký tự), chọn **Ngày sinh** (không được chọn ngày trong tương lai), nhập **Số CCCD/CMND** (9 hoặc 12 chữ số, tùy chọn đối với trẻ em) và chọn **Quan hệ với chủ hộ** (`Chủ hộ`, `Vợ/chồng`, `Con`, `Cha/mẹ`, `Anh/chị/em`, `Khác`).
3. Bấm **Thêm nhân khẩu**.

Cần chú ý thứ tự nhập: mỗi căn hộ phải có **Chủ hộ** trước rồi mới thêm được các thành viên khác, và một căn hộ chỉ có duy nhất một chủ hộ. Sau khi bạn thêm xong chủ hộ, ô quan hệ sẽ tự chuyển sang `Con` để tiện nhập tiếp các thành viên còn lại.

### Sửa nhanh, Xóa nhân khẩu nhập nhầm và Đổi chủ hộ 1-click

- **Sửa nhanh tại chỗ:** Nếu nhập nhầm họ tên, ngày sinh, số CCCD hoặc quan hệ, bấm nút **Sửa** ngay trên dòng của nhân khẩu đó trong bảng, chỉnh trực tiếp trên dòng rồi bấm **Lưu**.
- **Đổi chủ hộ 1-click:** Khi chủ hộ cũ chuyển đi hoặc muốn chuyển quyền chủ hộ cho thành viên khác trong cùng căn hộ, chỉ cần bấm nút **Đặt chủ hộ** ngay trên dòng của thành viên mới. Hệ thống sẽ tự động chuyển người đó thành `Chủ hộ` và cập nhật chủ hộ cũ thành thành viên trong cùng một giao dịch.
- **Xóa nhân khẩu nhập thừa:** Bấm nút **Xóa** rồi bấm **Xác nhận** ngay trên dòng nhân khẩu. Nếu người đó là `Chủ hộ` và trong hộ vẫn còn các thành viên khác, hệ thống sẽ nhắc bạn bấm **Đặt chủ hộ** cho thành viên khác trước khi xóa chủ hộ cũ.

### Tra cứu theo số phòng hoặc họ tên

Ở phần **Tra cứu hộ và nhân khẩu**, gõ số phòng (như `050`) hoặc một phần họ tên rồi bấm **Tìm**. Bảng bên dưới sẽ chỉ hiện các dòng khớp điều kiện. Muốn quay lại danh sách đầy đủ, bấm **Xóa tìm kiếm**.

### Cập nhật tình trạng cư trú và xem lịch sử

Mặc định nhân khẩu mới thêm có trạng thái là `Thường trú`. Khi cần ghi nhận thay đổi:

1. Ở dòng của nhân khẩu đó trong bảng, bấm **Cập nhật trạng thái**.
2. Kéo xuống form **Cập nhật cư trú** vừa hiện ra ở cuối trang.
3. Chọn trạng thái mới (`Thường trú`, `Tạm trú`, `Tạm vắng`, `Chuyển đến`, hoặc `Chuyển đi`), nhập **Ngày bắt đầu** và **Ngày kết thúc** (ngày kết thúc không được trước ngày bắt đầu).
4. Bấm **Xác nhận**.

Mỗi lần cập nhật đều được ghi lại. Bạn có thể bấm vào dòng `X lần` ở cột **Lịch sử** để mở xem nhân khẩu đó từng chuyển qua những trạng thái nào và trong khoảng thời gian nào.

### Xuất danh sách nhân khẩu ra Excel

Ở khối **Xuất danh sách nhân khẩu**, chọn trạng thái cư trú muốn lấy rồi bấm **Xuất Excel**. Trình duyệt sẽ tải về file `.xlsx` theo tên `nhan-khau-<trạng thái>.xlsx`.

Vài điểm cần biết khi xuất file:

- File chỉ lấy những người đang có trạng thái hiện tại trùng với lựa chọn (mỗi người một dòng, không lặp lại các trạng thái cũ trong lịch sử).
- Danh sách xuất độc lập với ô tìm kiếm bên dưới, nên dù bạn đang lọc tìm một phòng cụ thể thì file xuất vẫn lấy đủ theo trạng thái đã chọn.
- Số phòng có số 0 ở đầu (ví dụ `050`) được giữ nguyên dạng chữ, ngày sinh định dạng `dd/mm/yyyy`.
- Nếu không có nhân khẩu nào ở trạng thái đã chọn, web sẽ báo lỗi thay vì tải về một file trắng.

## 3. Cư dân tự đăng ký và BQT duyệt tài khoản cư dân

Để giảm thao tác nhập liệu thủ công cho Ban quản trị, hệ thống hỗ trợ quy trình rút gọn:

1. **Cư dân tự đăng ký tại trang Đăng nhập:** Bấm nút **Cư dân tự đăng ký tài khoản**, nhập **Số phòng**, **Họ và tên nhân khẩu** (khớp với hồ sơ đã khai báo), tự chọn **Tên đăng nhập** và **Mật khẩu** rồi bấm **Gửi yêu cầu duyệt**.
2. **BQT duyệt 1-click:** Vào mục **Cấp tài khoản cư dân**, các yêu cầu mới sẽ nằm ở bảng **Yêu cầu cư dân tự đăng ký chờ duyệt** ngay đầu trang. BQT chỉ cần bấm **Duyệt** (hoặc **Từ chối**) bằng 1 cú nhấp chuột.
3. **Chủ động cấp nhanh hoặc Đặt lại mật khẩu:** BQT vẫn có thể mở mục *BQT chủ động cấp nhanh tài khoản cư dân* để tạo trực tiếp, hoặc bấm **Đặt lại MK** ở bảng tài khoản đang hoạt động để reset mật khẩu cư dân về `123456` khi cư dân quên mật khẩu.

## 4. Cấp tài khoản cho thành viên BQT (chỉ Quản trị viên)

Đăng nhập bằng tài khoản `ADMIN` và vào mục **Cấp tài khoản**:

1. Nhập **Tên đăng nhập**, **Họ tên** và **Mật khẩu khởi tạo** (tối thiểu 6 ký tự).
2. Bấm **Cấp**. Tài khoản mới tạo sẽ có vai trò là Thành viên BQT.

Bảng **Tài khoản đã cấp** bên dưới cho phép bấm **Đặt lại MK** (reset mật khẩu về `123456` và mở khóa đăng nhập) hoặc xóa các tài khoản khác (bấm **Xóa** rồi **Xác nhận**). Bạn không thể tự xóa tài khoản mình đang dùng để đăng nhập.

## 5. Cập nhật hồ sơ và đổi mật khẩu

Với tài khoản Quản trị và Thành viên BQT, vào mục **Hồ sơ cá nhân**. Khối đầu tiên dùng để sửa họ tên, số điện thoại rồi bấm **Lưu hồ sơ**. Khối thứ hai dùng để đổi mật khẩu (nhập đúng mật khẩu hiện tại, mật khẩu mới ít nhất 6 ký tự và nhập lại cho khớp).

Với tài khoản Cư dân, thanh menu chỉ hiện mục **Đổi mật khẩu**. Cư dân tự đổi mật khẩu của mình tại đây; nếu sai họ tên hay số phòng thì báo BQT sửa lại.
