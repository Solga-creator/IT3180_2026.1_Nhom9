export function validateProfile(fullNameInput, phoneInput) {
  const fullName = String(fullNameInput || "").trim();
  const phone = String(phoneInput || "").trim();

  if (fullName.length < 2 || fullName.length > 120) {
    return "Họ tên phải từ 2 đến 120 ký tự.";
  }

  if (phone.length > 30 || (phone && !/^[+0-9(). -]+$/.test(phone))) {
    return "Số điện thoại không hợp lệ.";
  }
  return null;
}

export function validatePasswordChange(currentPasswordInput, newPasswordInput) {
  const currentPassword = String(currentPasswordInput || "");
  const newPassword = String(newPasswordInput || "");

  if (!currentPassword || !newPassword) {
    return "Nhập mật khẩu hiện tại và mật khẩu mới.";
  }
  if (newPassword.length < 6) {
    return "Mật khẩu mới tối thiểu 6 ký tự.";
  }
  return null;
}
