import app from "./app";
import { logger } from "./lib/logger";
import { getAllSignals } from "./lib/signalEngine.js";

const rawPort = process.env["PORT"];

if (!rawPort) {
  throw new Error(
    "PORT environment variable is required but was not provided.",
  );
}

const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

app.listen(port, (err) => {
  if (err) {
    logger.error({ err }, "Error listening on port");
    process.exit(1);
  }

  logger.info({ port }, "Server listening");

  // Pre-warm the signal cache ~3 s after boot so the first client request
  // is served from cache rather than waiting 6 s for candle data.
  setTimeout(() => {
    getAllSignals()
      .then((signals) => logger.info({ count: signals.length }, "Signal cache warmed"))
      .catch((err) => logger.warn({ err }, "Signal pre-warm failed (non-fatal)"));
  }, 3000);
});
