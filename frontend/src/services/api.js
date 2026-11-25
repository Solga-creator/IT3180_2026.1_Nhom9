const TOKEN_KEY = "bluemoon.token";
const API_BASE = (import.meta.env.VITE_API_URL || "").replace(/\/+$/, "");

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
  const res = await fetch(url, {
    ...options,
    headers,
  });
  if (res.ok && responseType === "blob") return res.blob();
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(data.message || "Yêu cầu thất bại.");
    err.status = res.status;
    throw err;
  }
  return data;
}
