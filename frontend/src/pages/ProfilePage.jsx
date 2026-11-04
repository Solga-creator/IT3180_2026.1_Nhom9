import { useState } from "react";
import { api } from "../services/api.js";
import { useAuth } from "../contexts/useAuth.js";

export default function ProfilePage() {
  const {
    user,
    updateUser,
  } = useAuth();
  const [fullName, setFullName] = useState(user.fullName || "");
  const [phone, setPhone] = useState(user.phone || "");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [profileMessage, setProfileMessage] = useState("");
  const [passwordMessage, setPasswordMessage] = useState("");
  const [profileError, setProfileError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  async function saveProfile(event) {
    event.preventDefault();
    setProfileMessage("");
    setProfileError("");
    setSavingProfile(true);
    try {
      const data = await api("/api/auth/profile", {
        method: "PATCH",
        body: JSON.stringify({
          fullName,
          phone,
        }),
      });
      updateUser(data.user);
      setFullName(data.user.fullName);
      setPhone(data.user.phone);
      setProfileMessage("Đã cập nhật hồ sơ.");
    } catch (error) {
      setProfileError(error.message);
    } finally {
      setSavingProfile(false);
    }
  }

  async function changePassword(event) {
    event.preventDefault();
    setPasswordMessage("");
    setPasswordError("");
    if (newPassword !== confirmPassword) {
      setPasswordError("Mật khẩu xác nhận không khớp.");
      return;
    }
    setSavingPassword(true);
    try {
      const data = await api("/api/auth/password", {
        method: "POST",
        body: JSON.stringify({
          currentPassword,
          newPassword,
        }),
      });
      setPasswordMessage(data.message);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error) {
      setPasswordError(error.message);
    } finally {
      setSavingPassword(false);
    }
  }

  return (
    <section>
      <h1>Hồ sơ cá nhân</h1>
      <p className="muted">
        Tài khoản: <strong>{user.username}</strong>
      </p>
      <form className="form" onSubmit={saveProfile}>
        <h2>Thông tin cá nhân</h2>
        <label>
          Họ và tên
          <input
            required
            minLength={2}
            maxLength={120}
            value={fullName}
            onChange={(event) => setFullName(event.target.value)}
          />
        </label>
        <label>
          Số điện thoại
          <input
            type="tel"
            maxLength={30}
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
          />
        </label>
        {profileError && <p className="error">{profileError}</p>}
        {profileMessage && <p className="ok">{profileMessage}</p>}
        <button disabled={savingProfile}>
          {savingProfile ? "Đang lưu…" : "Lưu hồ sơ"}
        </button>
      </form>

      <form className="form" onSubmit={changePassword}>
        <h2>Đổi mật khẩu</h2>
        <label>
          Mật khẩu hiện tại
          <input
            type="password"
            required
            autoComplete="current-password"
            value={currentPassword}
            onChange={(event) => setCurrentPassword(event.target.value)}
          />
        </label>
        <label>
          Mật khẩu mới
          <input
            type="password"
            required
            minLength={6}
            autoComplete="new-password"
            value={newPassword}
            onChange={(event) => setNewPassword(event.target.value)}
          />
        </label>
        <label>
          Nhập lại mật khẩu mới
          <input
            type="password"
            required
            minLength={6}
            autoComplete="new-password"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
          />
        </label>
        {passwordError && <p className="error">{passwordError}</p>}
        {passwordMessage && <p className="ok">{passwordMessage}</p>}
        <button disabled={savingPassword}>
          {savingPassword ? "Đang đổi…" : "Đổi mật khẩu"}
        </button>
      </form>
    </section>
  );
}
