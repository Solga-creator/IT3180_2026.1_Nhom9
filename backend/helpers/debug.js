export function debug(...args) {
  if (process.env.DEBUG === "true") {
    console.info("[debug]", ...args);
  }
}
