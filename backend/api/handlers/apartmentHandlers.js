import {
  getApartments as fetchApartments,
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

