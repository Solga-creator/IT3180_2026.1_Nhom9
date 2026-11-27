import { NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../contexts/useAuth.js";

export default function AppLayout() {
  const {
    user,
    logout,
  } = useAuth();
  return (
    <div className="app">
      <header className="top">
        <div>
          <strong>BlueMoon</strong>
        </div>
        <div className="who">
          {user.fullName} (
          {user.role === "ADMIN"
            ? "Quản trị"
            : user.role === "RESIDENT"
              ? "Cư dân"
              : "Thành viên BQT"})
          <button type="button" className="link" onClick={logout}>
            Đăng xuất
          </button>
        </div>
      </header>
      <nav className="nav">
        <NavLink to="/" end>
          {user.role === "RESIDENT" ? "Căn hộ của tôi" : "Căn hộ"}
        </NavLink>
        {user.role === "RESIDENT" ? (
          <NavLink to="/profile">Đổi mật khẩu</NavLink>
        ) : (
          <>
            <NavLink to="/residents">Hộ và nhân khẩu</NavLink>
            <NavLink to="/resident-accounts">Tài khoản cư dân</NavLink>
            <NavLink to="/profile">Hồ sơ cá nhân</NavLink>
            {user.role === "ADMIN" && (
              <NavLink to="/accounts">Tài khoản BQT</NavLink>
            )}
          </>
        )}
      </nav>
      <main className="main">
        {user.mustChangePassword && (
          <p className="error" role="alert">
            Bạn đang đăng nhập bằng mật khẩu tạm thời sau khi khôi phục. Vui lòng vào mục{" "}
            <NavLink to="/profile">
              <strong>Đổi mật khẩu</strong>
            </NavLink>{" "}
            để đặt mật khẩu mới.
          </p>
        )}
        <Outlet />
      </main>
    </div>
  );
}
