import test from "node:test";
import assert from "node:assert/strict";
import { api } from "../src/services/api.js";

test("US-005: tải blob có JWT; giữ lỗi JSON và hành vi API JSON cũ", async (t) => {
  const descriptor = Object.getOwnPropertyDescriptor(globalThis, "sessionStorage");
  Object.defineProperty(globalThis, "sessionStorage", {
    configurable: true,
    value: { getItem: () => "test-token" },
  });
  t.after(() => {
    if (descriptor) Object.defineProperty(globalThis, "sessionStorage", descriptor);
    else delete globalThis.sessionStorage;
  });
  let response = new Response(new Uint8Array([80, 75]), {
    headers: { "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" },
  });
  t.mock.method(globalThis, "fetch", async (_path, options) => {
    assert.equal(options.headers.Authorization, "Bearer test-token");
    return response;
  });
  const blob = await api("/api/residents/export?status=test", {}, "blob");
  assert(blob instanceof Blob);
  assert.deepEqual([...new Uint8Array(await blob.arrayBuffer())], [80, 75]);
  response = Response.json({ message: "Không có nhân khẩu thuộc trạng thái đã chọn." }, { status: 404 });
  await assert.rejects(api("/api/residents/export", {}, "blob"), {
    status: 404,
    message: "Không có nhân khẩu thuộc trạng thái đã chọn.",
  });
  response = Response.json({ residents: [] });
  assert.deepEqual(await api("/api/residents"), { residents: [] });
});
