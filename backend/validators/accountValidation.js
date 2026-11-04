export function validateAccountIssue(
  usernameInput,
  fullNameInput,
  passwordInput,
) {
  const username = String(usernameInput || "").trim();
  const fullName = String(fullNameInput || "").trim();
  const password = String(passwordInput || "");

  if (username.length < 3 || !/^[a-zA-Z0-9._-]+$/.test(username)) {
    return "Tên đăng nhập từ 3 ký tự, không dấu cách.";
  }

  if (fullName.length < 2) {
    return "Nhập họ tên thành viên BQT.";
  }

  if (password.length < 6) {
    return "Mật khẩu khởi tạo tối thiểu 6 ký tự.";
  }
  return null;
}
