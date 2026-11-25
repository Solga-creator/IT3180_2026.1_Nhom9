# Hướng dẫn sử dụng BlueMoon SE09

Tài liệu này hướng dẫn cách thao tác trên ứng dụng web quản lý chung cư BlueMoon SE09. Nếu bạn chưa cài chạy dự án trên máy, xem trước file [huong-dan-cai-dat.md](./huong-dan-cai-dat.md).

## Đăng nhập và phân quyền

Mở trình duyệt vào `http://localhost:5174`. Chưa đăng nhập thì web sẽ tự đẩy về trang đăng nhập. Nếu bạn giữ nguyên file cấu hình mẫu lúc cài đặt, đăng nhập quản trị bằng tài khoản `admin` / `admin123`.

Web có ba loại tài khoản, thanh menu phía trên sẽ tự ẩn/hiện tùy theo quyền của bạn:

- Tài khoản Quản trị (`ADMIN`) dùng được hết các chức năng quản lý chung cư, cộng thêm mục **Cấp tài khoản** để tạo hoặc xóa tài khoản cho thành viên BQT.
- Tài khoản Thành viên BQT (`BQT`) quản lý căn hộ, hộ và nhân khẩu, xuất Excel, cấp tài khoản cho cư dân và tự sửa hồ sơ cá nhân.
- Tài khoản Cư dân (`RESIDENT`) chỉ xem được thông tin căn hộ và quan hệ với chủ hộ của mình ở màn hình chính, kèm trang đổi mật khẩu.

## 1. Lưu và xem danh mục căn hộ

Chức năng này nằm ngay tại **Màn hình chính** (dành cho Quản trị và BQT). Bạn nên nhập căn hộ trước, vì bước thêm chủ hộ và nhân khẩu sau đó sẽ lấy danh sách từ đây.

1. Nhập **Số phòng** (ví dụ `050`, `101`, `12A04`) và **Diện tích (m²)** (bắt buộc lớn hơn 0).
2. Bấm **Lưu**.

Căn hộ vừa tạo sẽ hiện ngay trong bảng **Danh mục căn hộ** bên dưới. Số phòng không được trùng nhau; nếu nhập lại số phòng đã có, web sẽ báo lỗi và không ghi đè.

## 2. Quản lý hộ và nhân khẩu

Chọn mục **Hộ và nhân khẩu** trên thanh menu. Màn hình này gom 4 thao tác chính: thêm nhân khẩu, xuất Excel, tra cứu và cập nhật tình trạng cư trú.

### Thêm chủ hộ và thành viên

1. Chọn căn hộ ở danh sách thả xuống.
2. Nhập **Họ và tên** (tối thiểu 2 ký tự), chọn **Ngày sinh** (không được chọn ngày trong tương lai) và **Quan hệ với chủ hộ** (`Chủ hộ`, `Vợ/chồng`, `Con`, `Cha/mẹ`, `Anh/chị/em`, `Khác`).
3. Bấm **Thêm nhân khẩu**.

Cần chú ý thứ tự nhập: mỗi căn hộ phải có **Chủ hộ** trước rồi mới thêm được các thành viên khác, và một căn hộ chỉ có duy nhất một chủ hộ. Sau khi bạn thêm xong chủ hộ, ô quan hệ sẽ tự chuyển sang `Con` để tiện nhập tiếp các thành viên còn lại.

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

## 3. Cấp tài khoản cho cư dân

Vào mục **Cấp tài khoản cư dân** (cả Quản trị và BQT đều thao tác được):

1. Ở ô **Nhân khẩu**, chọn người cần cấp tài khoản. Danh sách này chỉ hiện những nhân khẩu chưa có tài khoản đăng nhập.
2. Nhập **Tên đăng nhập** và **Mật khẩu khởi tạo** (tối thiểu 6 ký tự), rồi bấm **Cấp**.

Các tài khoản đã cấp hiện ở bảng bên dưới. Khi cần thu hồi, bấm **Xóa** rồi bấm **Xác nhận**. Thao tác này chỉ xóa tài khoản đăng nhập của cư dân đó, hồ sơ nhân khẩu vẫn giữ nguyên.

## 4. Cấp tài khoản cho thành viên BQT (chỉ Quản trị viên)

Đăng nhập bằng tài khoản `ADMIN` và vào mục **Cấp tài khoản**:

1. Nhập **Tên đăng nhập**, **Họ tên** và **Mật khẩu khởi tạo** (tối thiểu 6 ký tự).
2. Bấm **Cấp**. Tài khoản mới tạo sẽ có vai trò là Thành viên BQT.

Bảng **Tài khoản đã cấp** bên dưới cho phép xóa các tài khoản khác (bấm **Xóa** rồi **Xác nhận**). Bạn không thể tự xóa tài khoản mình đang dùng để đăng nhập.

## 5. Cập nhật hồ sơ và đổi mật khẩu

Với tài khoản Quản trị và Thành viên BQT, vào mục **Hồ sơ cá nhân**. Khối đầu tiên dùng để sửa họ tên, số điện thoại rồi bấm **Lưu hồ sơ**. Khối thứ hai dùng để đổi mật khẩu (nhập đúng mật khẩu hiện tại, mật khẩu mới ít nhất 6 ký tự và nhập lại cho khớp).

Với tài khoản Cư dân, thanh menu chỉ hiện mục **Đổi mật khẩu**. Cư dân tự đổi mật khẩu của mình tại đây; nếu sai họ tên hay số phòng thì báo BQT sửa lại.
