import crypto from "node:crypto";
import jwt from "jsonwebtoken";
import { findUserById, toPublicUser } from "../repositories/userRepository.js";

const EPHEMERAL_TEST_SECRET =
  process.env.NODE_ENV === "test" ||
  Boolean(process.env.NODE_TEST_CONTEXT) ||
  process.execArgv.some((arg) => arg.startsWith("--test"))
    ? crypto.randomBytes(32).toString("hex")
    : "";

export function assertJwtConfigured(env = process.env) {
  const secret = String(env?.JWT_SECRET || "").trim();
  if (!secret) {
    throw new Error(
      "Thiếu cấu hình bắt buộc JWT_SECRET trong biến môi trường. Server dừng khởi động để đảm bảo an toàn.",
    );
  }
  return secret;
}

function getSigningSecret() {
  const configured = String(process.env.JWT_SECRET || "").trim();
  if (configured) return configured;
  if (EPHEMERAL_TEST_SECRET) return EPHEMERAL_TEST_SECRET;
  return assertJwtConfigured(process.env);
}

export function signToken(user) {
  return jwt.sign(
    {
      sub: user.id,
      role: user.role,
      username: user.username,
      tokenVersion: Number(user.token_version ?? user.tokenVersion ?? 0),
    },
    getSigningSecret(),
    {
      expiresIn: "12h",
    },
  );
}

export async function requireAuth(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) {
    return res.status(401).json({
      success: false,
      message: "Chưa đăng nhập.",
    });
  }

  try {
    const payload = jwt.verify(token, getSigningSecret());
    const user = await findUserById(payload.sub);
    if (!user || user.account_status === "PENDING") {
      return res.status(401).json({
        success: false,
        message: "Tài khoản không còn hiệu lực.",
      });
    }
    const tokenVersion = Number(payload.tokenVersion ?? 0);
    const currentVersion = Number(user.token_version ?? 0);
    if (tokenVersion !== currentVersion) {
      return res.status(401).json({
        success: false,
        message: "Phiên đăng nhập đã hết hiệu lực. Vui lòng đăng nhập lại.",
      });
    }

    req.user = toPublicUser(user);
    return next();
  } catch {
    return res.status(401).json({
      success: false,
      message: "Phiên đăng nhập không hợp lệ.",
    });
  }
}

export function requireStaff(req, res, next) {
  if (req.user?.role !== "ADMIN" && req.user?.role !== "BQT") {
    return res.status(403).json({
      success: false,
      message: "Cư dân không được vào màn hình này.",
    });
  }
  return next();
}

export function requireAdmin(req, res, next) {
  if (req.user?.role !== "ADMIN") {
    return res.status(403).json({
      success: false,
      message: "Chỉ quản trị viên được thao tác tài khoản.",
    });
  }
  return next();
}
