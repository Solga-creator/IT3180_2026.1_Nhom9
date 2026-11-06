import {
  addResident as saveResident,
  getResidents as listResidents,
  updateResidencyStatus,
  exportResidents as buildResidentExport,
} from "../../services/residentService.js";

export async function exportResidents(req, res) {
  const buffer = await buildResidentExport(req.query.status);
  res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
  res.setHeader("Content-Disposition", 'attachment; filename="danh-sach-nhan-khau.xlsx"');
  res.setHeader("Cache-Control", "no-store");
  return res.send(Buffer.from(buffer));
}

export async function getResidents(req, res) {
  const residents = await listResidents(req.query.search);
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
