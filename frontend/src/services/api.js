const TOKEN_KEY = "bluemoon.token";
const API_BASE = (import.meta.env?.VITE_API_URL || "").replace(/\/+$/, "");

export function getToken() {
  return sessionStorage.getItem(TOKEN_KEY);
}

export function setToken(token) {
  if (token) sessionStorage.setItem(TOKEN_KEY, token);
  else sessionStorage.removeItem(TOKEN_KEY);
}

export async function api(path, options = {}, responseType = "json") {
  const headers = {
    ...(options.headers || {}),
  };
  if (options.body && !(options.body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
  }
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  const url = path.startsWith("http") ? path : `${API_BASE}${path}`;
  let res;
  try {
    res = await fetch(url, {
      ...options,
      headers,
    });
  } catch {
    const netErr = new Error(
      "Không thể kết nối tới máy chủ. Vui lòng kiểm tra kết nối mạng hoặc thử lại sau; nếu vẫn lỗi hãy liên hệ quản trị viên.",
    );
    netErr.status = 0;
    throw netErr;
  }
  if (res.ok && responseType === "blob") return res.blob();
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const fallbackMsg =
      res.status >= 500
        ? "Máy chủ đang bận hoặc gặp sự cố. Vui lòng thử lại sau hoặc liên hệ quản trị viên."
        : `Không thể thực hiện yêu cầu (mã ${res.status}). Vui lòng kiểm tra lại dữ liệu.`;
    const err = new Error(data.message || fallbackMsg);
    err.status = res.status;
    throw err;
  }
  return data;
}
