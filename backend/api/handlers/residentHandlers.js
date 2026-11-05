import {
  addResident as saveResident,
  getResidents as listResidents,
  updateResidencyStatus,
} from "../../services/residentService.js";

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
