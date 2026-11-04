import {
  changePassword as updatePassword,
  login as authenticate,
  saveProfile as updateProfile,
} from "../../services/authService.js";

export async function login(req, res) {
  const result = await authenticate(
    req.body?.username,
    req.body?.password,
  );
  return res.json({
    success: true,
    token: result.token,
    user: result.user,
  });
}

export function currentUser(req, res) {
  return res.json({
    success: true,
    user: req.user,
  });
}

export async function saveProfile(req, res) {
  const user = await updateProfile(req.user.id, req.body);
  return res.json({
    success: true,
    user,
  });
}

export async function changePassword(req, res) {
  await updatePassword(req.user.id, req.body);
  return res.json({
    success: true,
    message: "Đổi mật khẩu thành công.",
  });
}
