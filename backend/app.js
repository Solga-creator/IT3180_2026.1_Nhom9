import express from "express";
import cors from "cors";
import apiRoutes from "./api/routes/index.js";
import { debug } from "./helpers/debug.js";

const app = express();
const extraOrigins = (process.env.CORS_ORIGIN || "")
  .split(",")
  .map((o) => o.trim().replace(/\/+$/, ""))
  .filter(Boolean);
const allowedOrigins = [
  "http://localhost:5174",
  "http://127.0.0.1:5174",
  ...extraOrigins,
];

app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
  }),
);
app.use(express.json());

app.get("/api/health", (_req, res) => {
  return res.json({
    ok: true,
  });
});
app.use("/api", apiRoutes);

app.use((err, _req, res, _next) => {
  debug("unhandled", err.message);
  res.status(err.statusCode || 500).json({
    success: false,
    message: err.statusCode ? err.message : "Lỗi máy chủ.",
  });
});

export default app;
