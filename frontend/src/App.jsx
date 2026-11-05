import { Navigate, Route, Routes } from "react-router-dom";
import { useAuth } from "./contexts/useAuth.js";
import LoginPage from "./pages/LoginPage.jsx";
import HomePage from "./pages/HomePage.jsx";
import IssueAccountPage from "./pages/IssueAccountPage.jsx";
import AppLayout from "./layouts/AppLayout.jsx";
import ProfilePage from "./pages/ProfilePage.jsx";
import ResidentsPage from "./pages/ResidentsPage.jsx";

function GuestOnly({ children }) {
  const {
    user,
    ready,
  } = useAuth();
  if (!ready) return <p className="muted">Đang tải…</p>;
  if (user) return <Navigate to="/" replace />;
  return children;
}

function RequireAuth({ children }) {
  const {
    user,
    ready,
  } = useAuth();
  if (!ready) return <p className="muted">Đang tải…</p>;
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

function RequireAdmin({ children }) {
  const {
    user,
    ready,
  } = useAuth();
  if (!ready) return <p className="muted">Đang tải…</p>;
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== "ADMIN") return <Navigate to="/" replace />;
  return children;
}

export default function App() {
  return (
    <Routes>
      <Route
        path="/login"
        element={
          <GuestOnly>
            <LoginPage />
          </GuestOnly>
        }
      />
      <Route
        element={
          <RequireAuth>
            <AppLayout />
          </RequireAuth>
        }
      >
        <Route path="/" element={<HomePage />} />
        <Route path="/residents" element={<ResidentsPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route
          path="/accounts"
          element={
            <RequireAdmin>
              <IssueAccountPage />
            </RequireAdmin>
          }
        />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
