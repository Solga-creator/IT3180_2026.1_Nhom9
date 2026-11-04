import "dotenv/config";
import app from "./app.js";
import { migrate } from "./config/database.js";

const port = Number(process.env.PORT || 3001);
await migrate();

const server = app.listen(port, "127.0.0.1", () => {
  console.info(`BlueMoon SE09 API http://127.0.0.1:${port}`);
});
server.on("error", (err) => {
  console.error("listen failed", err.message);
  process.exit(1);
});
