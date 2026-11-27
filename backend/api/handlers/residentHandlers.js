import {
  addResident as saveResident,
  editResident,
  getResidentHistory as listResidentHistory,
  getResidents as listResidents,
  removeResident,
  updateResidencyStatus,
  exportResidents as buildResidentExport,
} from "../../services/residentService.js";

export async function exportResidents(req, res) {
  const buffer = await buildResidentExport(req.query.status, req.query.search, {
    apartmentId: req.query.apartmentId,
  });
  res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
  res.setHeader("Content-Disposition", 'attachment; filename="danh-sach-nhan-khau.xlsx"');
  res.setHeader("Cache-Control", "no-store");
  return res.send(Buffer.from(buffer));
}

export async function getResidents(req, res) {
  const options = {};
  if (req.query.status) options.status = req.query.status;
  if (req.query.apartmentId) options.apartmentId = req.query.apartmentId;
  if (req.query.includeHistory === "false") options.includeHistory = false;
  const residents = await listResidents(
    req.query.search,
    Object.keys(options).length > 0 ? options : undefined,
  );
  return res.json({
    success: true,
    residents,
  });
}

export async function createResident(req, res) {
  const resident = await saveResident(req.body);
  return res.status(201).json({
    success: true,
    resident,
  });
}

export async function updateResident(req, res) {
  const resident = await editResident(req.params.id, req.body);
  return res.json({
    success: true,
    resident,
  });
}

export async function deleteResident(req, res) {
  const fullName = await removeResident(req.params.id);
  return res.json({
    success: true,
    fullName,
  });
}

export async function getResidentHistory(req, res) {
  const history = await listResidentHistory(req.params.id);
  return res.json({
    success: true,
    history,
  });
}

export async function createResidencyEvent(req, res) {
  const resident = await updateResidencyStatus(
    req.params.id,
    req.body,
    req.user.id,
  );
  return res.status(201).json({
    success: true,
    resident,
  });
}
