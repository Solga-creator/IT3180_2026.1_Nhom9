import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { transformWithOxc } from "vite";

// Execute the actual page handlers/effects with controlled hooks and network timing.
// No DOM is needed: this regression concerns which request may update page state.
const source = (await readFile(new URL("../src/pages/ResidentsPage.jsx", import.meta.url), "utf8"))
  .replace(/^import .*;\r?\n/gm, "")
  .replace("export default function ResidentsPage", "function ResidentsPage")
  .replace(
    /  return \(\s*<section>/,
    `  capture({
    onUpdateResidency,
    onAddResident,
    onConfirmMakeHead,
    openResidencyModal,
    startEditResident,
    handleApartmentSelect,
    toggleAddForm,
    clearApartmentFilter,
    selectedResident,
    selectedResidentId,
    editingResidentId,
    apartmentId,
    headCheck,
    addingResident,
    fullName,
    setFullName,
    residents,
    loading,
    error,
  });
  return (<section>`,
  );
const transformed = await transformWithOxc(source, "ResidentsPage.jsx", {
  jsx: { runtime: "classic" },
});
const createPage = new Function(
  "useState", "useRef", "useEffect", "useNavigate", "useSearchParams", "api",
  "getBusinessDate", "AddResidentForm", "ResidencyStatusForm", "React", "capture",
  `${transformed.code}\nreturn ResidentsPage;`,
);

const formsSource = (await readFile(new URL("../src/pages/ResidentForms.jsx", import.meta.url), "utf8"))
  .replace(/^import .*;\r?\n/gm, "")
  .replace(/export function /g, "function ");
const transformedForms = await transformWithOxc(formsSource, "ResidentForms.jsx", {
  jsx: { runtime: "classic" },
});
const createForms = new Function(
  "React",
  "getBusinessDate",
  `${transformedForms.code}\nreturn { AddResidentForm, ResidencyStatusForm };`,
);

function deferred() {
  let resolve;
  const promise = new Promise((done) => { resolve = done; });
  return { promise, resolve };
}

function mountPage(api) {
  const slots = [];
  let cursor = 0;
  let params = new URLSearchParams({ status: "Thường trú" });
  let pageState;
  let pendingEffects = [];
  const useState = (initial) => {
    const index = cursor++;
    if (!(index in slots)) slots[index] = typeof initial === "function" ? initial() : initial;
    return [slots[index], (value) => {
      slots[index] = typeof value === "function" ? value(slots[index]) : value;
    }];
  };
  const useRef = (initial) => {
    const index = cursor++;
    if (!(index in slots)) slots[index] = { current: initial };
    return slots[index];
  };
  const useEffect = (effect, deps) => {
    const index = cursor++;
    const previous = slots[index];
    if (!previous || deps.some((value, i) => !Object.is(value, previous.deps[i]))) {
      pendingEffects.push(() => {
        previous?.cleanup?.();
        slots[index] = { deps, cleanup: effect() };
      });
    }
  };
  const page = createPage(
    useState, useRef, useEffect, () => () => {},
    () => [params, (next) => { params = new URLSearchParams(next); }], api,
    () => "2026-11-28", () => null, () => null,
    { createElement: () => null }, (state) => { pageState = state; },
  );
  return {
    render(status, nextParams) {
      if (nextParams) params = new URLSearchParams(nextParams);
      else if (status) params = new URLSearchParams({ status });
      cursor = 0;
      pendingEffects = [];
      page();
      pendingEffects.forEach((effect) => effect());
      return pageState;
    },
    getParams() {
      return params;
    },
  };
}

const settle = () => new Promise((resolve) => setImmediate(resolve));

test("slow residency save refreshes the current URL filter, not the handler's old filter", async () => {
  const save = deferred();
  const requests = [];
  const currentRows = [{ id: 2, currentStatus: "Tạm vắng", residencyHistory: [] }];
  const harness = mountPage(async (path, options = {}) => {
    requests.push(path);
    if (options.method === "POST") return save.promise;
    if (path === "/api/apartments") return { apartments: [] };
    const status = new URL(path, "http://local").searchParams.get("status");
    return { residents: status === "Tạm vắng" ? currentRows : [{ id: 1, currentStatus: "Thường trú", residencyHistory: [] }] };
  });
  harness.render();
  await settle();
  const original = harness.render();
  const saving = original.onUpdateResidency({ preventDefault() {} });
  harness.render("Tạm vắng");
  await settle();
  assert.deepEqual(harness.render().residents, currentRows);
  save.resolve({ resident: { id: 1, fullName: "A", currentStatus: "Thường trú" } });
  await saving;
  harness.render();
  await settle();
  assert.equal(new URL(requests.at(-1), "http://local").searchParams.get("status"), "Tạm vắng");
  assert.deepEqual(harness.render().residents, currentRows);
  assert.equal(harness.render().loading, false);
});

test("a late response from the old filter cannot replace rows or finish the current load", async () => {
  const previousLoad = deferred();
  const currentLoad = deferred();
  const currentRows = [{ id: 2, currentStatus: "Tạm vắng", residencyHistory: [] }];
  const harness = mountPage(async (path) => {
    if (path === "/api/apartments") return { apartments: [] };
    return new URL(path, "http://local").searchParams.get("status") === "Tạm vắng"
      ? currentLoad.promise
      : previousLoad.promise;
  });
  harness.render();
  harness.render("Tạm vắng");
  previousLoad.resolve({ residents: [{ id: 1, residencyHistory: [] }] });
  await settle();
  assert.deepEqual(harness.render().residents, []);
  assert.equal(harness.render().loading, true);
  currentLoad.resolve({ residents: currentRows });
  await settle();
  assert.deepEqual(harness.render().residents, currentRows);
  assert.equal(harness.render().loading, false);
});

test("post-save reload does not close a newly opened modal and does not refetch apartments", async () => {
  const reload = deferred();
  let apartmentCalls = 0;
  let residentCalls = 0;
  const rows = [
    { id: 1, fullName: "A", roomNumber: "101", currentStatus: "Thường trú", residencyHistory: [] },
    { id: 2, fullName: "B", roomNumber: "101", currentStatus: "Thường trú", residencyHistory: [] },
  ];
  const harness = mountPage(async (path, options = {}) => {
    if (path === "/api/apartments") {
      apartmentCalls += 1;
      return { apartments: [{ id: 1, roomNumber: "101", area: 60 }] };
    }
    if (options.method === "POST") {
      return { resident: { ...rows[0], currentStatus: "Tạm vắng" } };
    }
    residentCalls += 1;
    if (residentCalls === 1) return { residents: rows };
    return reload.promise;
  });

  harness.render();
  await settle();
  assert.equal(apartmentCalls, 1);

  const beforeSave = harness.render();
  beforeSave.openResidencyModal(rows[0]);
  const saving = harness.render().onUpdateResidency({ preventDefault() {} });
  await saving;
  harness.render();

  // User opens modal for resident 2 while the post-save list reload is still in flight
  harness.render().openResidencyModal(rows[1]);
  assert.equal(harness.render().selectedResidentId, 2);

  reload.resolve({ residents: rows });
  await settle();
  const afterReload = harness.render();
  assert.equal(afterReload.selectedResidentId, 2);
  assert.equal(afterReload.selectedResident?.id, 2);
  assert.equal(apartmentCalls, 1);
});

test("Back/Forward filter change sets loading, closes old actions, and clears old rows on network error", async () => {
  const secondLoad = deferred();
  let apartmentCalls = 0;
  const initialRows = [
    { id: 1, fullName: "A", roomNumber: "101", currentStatus: "Thường trú", residencyHistory: [] },
  ];
  const harness = mountPage(async (path) => {
    if (path === "/api/apartments") {
      apartmentCalls += 1;
      return { apartments: [{ id: 1, roomNumber: "101", area: 60 }] };
    }
    const status = new URL(path, "http://local").searchParams.get("status");
    if (status === "Thường trú") return { residents: initialRows };
    return secondLoad.promise;
  });

  harness.render("Thường trú");
  await settle();
  const loaded = harness.render();
  assert.equal(loaded.loading, false);
  assert.equal(loaded.residents.length, 1);

  loaded.startEditResident(initialRows[0]);
  loaded.openResidencyModal(initialRows[0]);
  assert.equal(harness.render().editingResidentId, 1);
  assert.equal(harness.render().selectedResidentId, 1);

  // Simulate browser Back/Forward changing URL status without calling onStatusFilterChange
  const navigating = harness.render("Tạm vắng");
  assert.equal(navigating.loading, true);
  assert.equal(navigating.editingResidentId, null);
  assert.equal(navigating.selectedResidentId, null);

  // Reject the new filter request: old rows must not remain interactive under the new URL
  let rejectSecond;
  const failingLoad = new Promise((_, rej) => { rejectSecond = rej; });
  rejectSecond(new Error("Mất kết nối khi đổi bộ lọc."));
  secondLoad.resolve(failingLoad);
  await settle();

  const afterFail = harness.render();
  assert.equal(afterFail.loading, false);
  assert.equal(afterFail.error, "Mất kết nối khi đổi bộ lọc.");
  assert.deepEqual(afterFail.residents, []);
  assert.equal(afterFail.selectedResident, undefined);
  assert.equal(apartmentCalls, 1);
});

test("AddResidentForm locks inputs only while submitting, and page protects draft/headCheck + room filter clear", async () => {
  const { AddResidentForm } = createForms(
    {
      createElement(type, props, ...children) {
        return { type, props: props || {}, children };
      },
    },
    () => "2026-11-28",
  );

  function collectElements(node, out = []) {
    if (!node || typeof node !== "object") return out;
    out.push(node);
    if (Array.isArray(node.children)) {
      for (const child of node.children) {
        if (Array.isArray(child)) child.forEach((c) => collectElements(c, out));
        else collectElements(child, out);
      }
    }
    return out;
  }

  // 1. When submitting=true, select/inputs/close/submit are all disabled
  const treeSubmitting = AddResidentForm({
    apartments: [{ id: 1, roomNumber: "101", area: 60 }],
    apartmentId: "1",
    onApartmentChange() {},
    fullName: "Nguyễn Văn A",
    setFullName() {},
    nameInputRef: { current: null },
    birthDate: "1990-01-01",
    setBirthDate() {},
    cccd: "001090000001",
    setCccd() {},
    relationship: "Chủ hộ",
    setRelationship() {},
    hasHeadForSelectedApartment: false,
    submitting: true,
    busy: true,
    loading: false,
    onSubmit() {},
    onClose() {},
  });
  const submittingNodes = collectElements(treeSubmitting);
  const submittingControls = submittingNodes.filter((n) =>
    ["select", "input", "button"].includes(n.type),
  );
  assert.equal(submittingControls.length, 7);
  for (const ctrl of submittingControls) {
    assert.equal(
      ctrl.props.disabled,
      true,
      `Expected ${ctrl.type} to be disabled when submitting=true`,
    );
  }

  // 2. When submitting=false but busy=true (headCheck loading/error), apartment select & inputs stay enabled while submit is disabled
  const treeHeadBusy = AddResidentForm({
    apartments: [{ id: 1, roomNumber: "101", area: 60 }],
    apartmentId: "1",
    onApartmentChange() {},
    fullName: "Nguyễn Văn A",
    setFullName() {},
    nameInputRef: { current: null },
    birthDate: "1990-01-01",
    setBirthDate() {},
    cccd: "001090000001",
    setCccd() {},
    relationship: "Chủ hộ",
    setRelationship() {},
    hasHeadForSelectedApartment: false,
    submitting: false,
    busy: true,
    loading: false,
    onSubmit() {},
    onClose() {},
  });
  const headBusyNodes = collectElements(treeHeadBusy);
  const selectsAndInputs = headBusyNodes.filter((n) =>
    ["select", "input"].includes(n.type),
  );
  for (const field of selectsAndInputs) {
    assert.equal(
      Boolean(field.props.disabled),
      false,
      `Expected ${field.type} to remain enabled when submitting=false`,
    );
  }
  const submitBtn = headBusyNodes.find(
    (n) => n.type === "button" && n.props.type === "submit",
  );
  const closeBtn = headBusyNodes.find(
    (n) => n.type === "button" && n.props.type === "button",
  );
  assert.equal(submitBtn.props.disabled, true);
  assert.equal(Boolean(closeBtn.props.disabled), false);

  // 3. Page level: handleApartmentSelect is locked while POST add is in flight; clearApartmentFilter keeps search & status
  const postAdd = deferred();
  const harness = mountPage(async (path, options = {}) => {
    if (path === "/api/apartments") {
      return {
        apartments: [
          { id: 1, roomNumber: "101", area: 60 },
          { id: 2, roomNumber: "102", area: 70 },
        ],
      };
    }
    if (options.method === "POST") return postAdd.promise;
    const aptId = new URL(path, "http://local").searchParams.get("apartmentId");
    if (aptId === "1") {
      return { residents: [{ id: 10, apartmentId: 1, relationship: "Chủ hộ", householdHeadId: 10, residencyHistory: [] }] };
    }
    return { residents: [] };
  });

  harness.render(null, { search: "An", apartmentId: "1", room: "101", status: "Thường trú" });
  await settle();

  // Opening add form via toggleAddForm triggers headCheck outside setShowAddForm updater
  harness.render().toggleAddForm();
  await settle();
  assert.equal(harness.render().headCheck.status, "ready");
  assert.equal(harness.render().headCheck.apartmentId, "1");
  assert.equal(harness.render().headCheck.hasHead, true);

  harness.render().setFullName("Nguyễn Văn Con");
  const adding = harness.render().onAddResident({ preventDefault() {} });
  assert.equal(harness.render().addingResident, true);

  // Trying to switch to apartment 2 while POST is in flight is ignored
  harness.render().handleApartmentSelect("2");
  assert.equal(harness.render().apartmentId, "1");

  postAdd.resolve({ resident: { id: 11, fullName: "Nguyễn Văn Con", roomNumber: "101" } });
  await adding;
  await settle();
  assert.equal(harness.render().addingResident, false);
  assert.equal(harness.render().fullName, "");
  assert.equal(harness.render().headCheck.apartmentId, "1");

  // clearApartmentFilter removes only apartmentId & room, preserving search & status
  harness.render().clearApartmentFilter();
  assert.equal(harness.getParams().get("apartmentId"), null);
  assert.equal(harness.getParams().get("room"), null);
  assert.equal(harness.getParams().get("search"), "An");
  assert.equal(harness.getParams().get("status"), "Thường trú");
});
