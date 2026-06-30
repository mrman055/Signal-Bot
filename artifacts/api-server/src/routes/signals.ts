import { Router } from "express";
import { getAllSignals, computeSignalDetail, refreshSignal } from "../lib/signalEngine.js";
import { TRACKED_PAIRS } from "../lib/marketData.js";

const router = Router();

router.get("/signals", async (req, res) => {
  const { market, direction } = req.query;
  let signals = await getAllSignals();

  if (market && market !== "all") {
    signals = signals.filter((s) => s.market === market);
  }
  if (direction) {
    signals = signals.filter((s) => s.direction === direction);
  }

  return res.json(signals);
});

router.get("/signals/:symbol", async (req, res) => {
  const symbol = decodeURIComponent(req.params.symbol);
  const detail = await computeSignalDetail(symbol);
  if (!detail) {
    return res.status(404).json({ error: "Symbol not found" });
  }
  return res.json(detail);
});

router.post("/signals/:symbol/refresh", async (req, res) => {
  const symbol = decodeURIComponent(req.params.symbol);
  const pair = TRACKED_PAIRS.find((p) => p.symbol === symbol);
  if (!pair) {
    return res.status(404).json({ error: "Symbol not found" });
  }
  const detail = await refreshSignal(symbol);
  if (!detail) {
    return res.status(404).json({ error: "Could not compute signal" });
  }
  return res.json(detail);
});

export default router;
