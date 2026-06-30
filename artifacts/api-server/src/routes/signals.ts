import { Router } from "express";
import { getAllSignals, computeSignalDetail, refreshSignal } from "../lib/signalEngine.js";
import { TRACKED_PAIRS } from "../lib/marketData.js";

const router = Router();

router.get("/signals", (req, res) => {
  const { market, direction, minStrength } = req.query;
  let signals = getAllSignals();

  if (market && market !== "all") {
    signals = signals.filter((s) => s.market === market);
  }
  if (direction) {
    signals = signals.filter((s) => s.direction === direction);
  }
  if (minStrength) {
    const min = parseFloat(minStrength as string);
    if (!isNaN(min)) signals = signals.filter((s) => s.strength >= min);
  }

  return res.json(signals);
});

router.get("/signals/:symbol", (req, res) => {
  const symbol = decodeURIComponent(req.params.symbol);
  const detail = computeSignalDetail(symbol);
  if (!detail) {
    return res.status(404).json({ error: "Symbol not found" });
  }
  return res.json(detail);
});

router.post("/signals/:symbol/refresh", (req, res) => {
  const symbol = decodeURIComponent(req.params.symbol);
  const pair = TRACKED_PAIRS.find((p) => p.symbol === symbol);
  if (!pair) {
    return res.status(404).json({ error: "Symbol not found" });
  }
  const detail = refreshSignal(symbol);
  if (!detail) {
    return res.status(404).json({ error: "Could not compute signal" });
  }
  return res.json(detail);
});

export default router;
