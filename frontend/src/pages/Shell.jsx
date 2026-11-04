import { NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../AuthContext.jsx";

export default function Shell() {
  const { user, logout } = useAuth();
  return (
    <div className="app">
      <header className="top">
        <div>
          <strong>BlueMoon</strong>
        </div>
        <div className="who">
          {user.fullName} ({user.role === "ADMIN" ? "Quản trị" : "Thành viên BQT"})
          <button type="button" className="link" onClick={logout}>
            Đăng xuất
          </button>
        </div>
      </header>
      <nav className="nav">
        <NavLink to="/" end>
          Màn hình chính
        </NavLink>
        {user.role === "ADMIN" && <NavLink to="/accounts">Cấp tài khoản</NavLink>}
        <NavLink to="/apartments">Căn hộ</NavLink>
        <NavLink to="/residents">Nhân khẩu</NavLink>
        <NavLink to="/fees">Thu phí</NavLink>
        <NavLink to="/reports">Báo cáo</NavLink>
      </nav>
      <main className="main">
        <Outlet />
      </main>
    </div>
  );
}
