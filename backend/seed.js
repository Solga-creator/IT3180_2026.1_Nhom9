import "dotenv/config";
import bcrypt from "bcrypt";
import { migrate, pool } from "./config/database.js";
import {
  createUser,
  findUserByResidentId,
  findUserByUsername,
} from "./repositories/userRepository.js";
import {
  createApartment,
  findApartmentByRoomNumber,
} from "./repositories/apartmentRepository.js";
import {
  createResidencyEvent,
  createResident,
  listResidents,
} from "./repositories/residentRepository.js";
import { debug } from "./helpers/debug.js";

await migrate();

const adminUsername = process.env.ADMIN_USERNAME || "admin";
const adminPassword = process.env.ADMIN_PASSWORD || "admin123";
const adminFullName = process.env.ADMIN_FULL_NAME || "Quản trị viên SE09";
const adminHash = await bcrypt.hash(adminPassword, 10);
const defaultHash = await bcrypt.hash("123456", 10);

let adminUser = await findUserByUsername(adminUsername);
if (!adminUser) {
  const adminId = await createUser({
    username: adminUsername,
    fullName: adminFullName,
    passwordHash: adminHash,
    role: "ADMIN",
  });
  adminUser = { id: adminId, username: adminUsername };
  debug("seeded admin", adminUsername);
}

const bqtSeeds = [
  { username: "bqt01", fullName: "Lê Tuấn Vĩ (BQT)" },
  { username: "bqt02", fullName: "Nguyễn Quang Nhật (BQT)" },
];
for (const bqt of bqtSeeds) {
  if (!(await findUserByUsername(bqt.username))) {
    await createUser({
      username: bqt.username,
      fullName: bqt.fullName,
      passwordHash: defaultHash,
      role: "BQT",
    });
    debug("seeded bqt", bqt.username);
  }
}

const apartmentSeeds = [
  { roomNumber: "050", area: 60.0 },
  { roomNumber: "101", area: 75.5 },
  { roomNumber: "102", area: 68.0 },
  { roomNumber: "201", area: 82.0 },
  { roomNumber: "202", area: 54.5 },
  { roomNumber: "301", area: 95.0 },
];

const apartmentMap = new Map();
for (const apt of apartmentSeeds) {
  let existing = await findApartmentByRoomNumber(apt.roomNumber);
  if (!existing) {
    const id = await createApartment(apt);
    existing = { id, ...apt };
    debug("seeded apartment", apt.roomNumber);
  }
  apartmentMap.set(apt.roomNumber, existing.id);
}

const existingResidents = await listResidents("");
if (existingResidents.length === 0) {
  const residentSeeds = [
    {
      roomNumber: "050",
      fullName: "Nguyễn Văn An",
      birthDate: "1985-05-15",
      cccd: "001085012345",
      relationship: "Chủ hộ",
    },
    {
      roomNumber: "050",
      fullName: "Trần Thị Bình",
      birthDate: "1988-09-20",
      cccd: "001188023456",
      relationship: "Vợ/chồng",
    },
    {
      roomNumber: "050",
      fullName: "Nguyễn Minh Khôi",
      birthDate: "2015-10-12",
      cccd: "",
      relationship: "Con",
    },
    {
      roomNumber: "101",
      fullName: "Lê Hoàng Nam",
      birthDate: "1979-03-10",
      cccd: "001079034567",
      relationship: "Chủ hộ",
      event: {
        status: "Tạm vắng",
        startDate: "2026-11-05",
        endDate: "2026-11-25",
      },
    },
    {
      roomNumber: "101",
      fullName: "Phạm Thu Hà",
      birthDate: "1982-11-02",
      cccd: "001182045678",
      relationship: "Vợ/chồng",
    },
    {
      roomNumber: "102",
      fullName: "Đặng Quốc Bảo",
      birthDate: "1992-07-18",
      cccd: "001092056789",
      relationship: "Chủ hộ",
    },
    {
      roomNumber: "102",
      fullName: "Đặng Gia Hưng",
      birthDate: "1995-12-01",
      cccd: "001095067890",
      relationship: "Anh/chị/em",
      event: {
        status: "Tạm trú",
        startDate: "2026-11-01",
        endDate: "2026-12-31",
      },
    },
    {
      roomNumber: "201",
      fullName: "Vũ Thị Mai",
      birthDate: "1990-04-22",
      cccd: "001190078901",
      relationship: "Chủ hộ",
    },
    {
      roomNumber: "202",
      fullName: "Hoàng Đức Minh",
      birthDate: "1987-08-14",
      cccd: "001087089012",
      relationship: "Chủ hộ",
      event: {
        status: "Chuyển đi",
        startDate: "2026-11-07",
        endDate: "2026-11-30",
      },
    },
    {
      roomNumber: "301",
      fullName: "Bùi Thanh Tùng",
      birthDate: "1983-01-25",
      cccd: "001083090123",
      relationship: "Chủ hộ",
    },
  ];

  const createdResidents = [];
  for (const item of residentSeeds) {
    const apartmentId = apartmentMap.get(item.roomNumber);
    if (!apartmentId) continue;
    const { resident } = await createResident({
      apartmentId,
      fullName: item.fullName,
      birthDate: item.birthDate,
      cccd: item.cccd,
      relationship: item.relationship,
    });
    if (resident && item.event) {
      await createResidencyEvent(resident.id, item.event, adminUser.id);
    }
    if (resident) {
      createdResidents.push(resident);
    }
  }

  const resident050 = createdResidents.find((r) => r.roomNumber === "050" && r.relationship === "Chủ hộ");
  if (
    resident050 &&
    !(await findUserByUsername("cudan050")) &&
    !(await findUserByResidentId(resident050.id))
  ) {
    await createUser({
      username: "cudan050",
      fullName: resident050.fullName,
      passwordHash: defaultHash,
      role: "RESIDENT",
      residentId: resident050.id,
      accountStatus: "ACTIVE",
    });
  }

  const resident102 = createdResidents.find((r) => r.roomNumber === "102" && r.relationship === "Chủ hộ");
  if (
    resident102 &&
    !(await findUserByUsername("cudan102")) &&
    !(await findUserByResidentId(resident102.id))
  ) {
    await createUser({
      username: "cudan102",
      fullName: resident102.fullName,
      passwordHash: defaultHash,
      role: "RESIDENT",
      residentId: resident102.id,
      accountStatus: "PENDING",
    });
  }
}

await pool.end();
console.info(
  "Seed xong. Tài khoản mẫu: ADMIN (%s / %s), BQT (bqt01 / 123456), Cư dân đã duyệt (cudan050 / 123456), Cư dân chờ duyệt (cudan102 / 123456).",
  adminUsername,
  adminPassword,
);
