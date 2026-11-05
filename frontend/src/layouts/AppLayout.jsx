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
          {user.role === "ADMIN" ? "Quản trị" : "Thành viên BQT"})
          <button type="button" className="link" onClick={logout}>
            Đăng xuất
          </button>
        </div>
      </header>
      <nav className="nav">
        <NavLink to="/" end>
          Màn hình chính
        </NavLink>
        <NavLink to="/residents">Hộ và nhân khẩu</NavLink>
        <NavLink to="/profile">Hồ sơ cá nhân</NavLink>
        {user.role === "ADMIN" && (
          <NavLink to="/accounts">Cấp tài khoản</NavLink>
        )}
      </nav>
      <main className="main">
        <Outlet />
      </main>
    </div>
  );
}
