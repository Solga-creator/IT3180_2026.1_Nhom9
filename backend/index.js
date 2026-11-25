import "dotenv/config";
import app from "./app.js";
import { migrate } from "./config/database.js";

const port = Number(process.env.PORT || 3001);
const host = process.env.HOST || "0.0.0.0";
await migrate();

const server = app.listen(port, host, () => {
  console.info(`BlueMoon SE09 API http://${host}:${port}`);
});
server.on("error", (err) => {
  console.error("listen failed", err.message);
  process.exit(1);
});
