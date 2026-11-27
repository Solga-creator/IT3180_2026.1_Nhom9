import {
  editApartment,
  getApartments as fetchApartments,
  removeApartment,
  saveApartment,
} from "../../services/apartmentService.js";

export async function createApartment(req, res) {
  const apartment = await saveApartment(req.body);
  return res.status(201).json({
    success: true,
    apartment,
  });
}

export async function getApartments(_req, res) {
  const apartments = await fetchApartments();
  return res.json({
    success: true,
    apartments,
  });
}

export async function updateApartment(req, res) {
  const apartment = await editApartment(req.params.id, req.body);
  return res.json({
    success: true,
    apartment,
  });
}

export async function deleteApartment(req, res) {
  const roomNumber = await removeApartment(req.params.id);
  return res.json({
    success: true,
    roomNumber,
  });
}

