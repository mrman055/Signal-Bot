import { Router } from "express";
import { getActiveMonitor, setActiveMonitor, clearActiveMonitor } from "../lib/monitorStore.js";
import { computeSignalDetail } from "../lib/signalEngine.js";
import { getCachedCandles } from "../lib/marketData.js";

const router = Router();

function assessAlert(
  direction: "BUY" | "SELL",
  entryPrice: number,
  currentPrice: number,
  currentDirection: string,
  currentStrength: number
): { alert: string | null; alertLevel: "warning" | "danger" | null } {
  const pnlPercent = direction === "BUY"
    ? ((currentPrice - entryPrice) / entryPrice) * 100
    : ((entryPrice - currentPrice) / entryPrice) * 100;

  const signalFlipped = currentDirection !== "NEUTRAL" && currentDirection !== direction;

  if (signalFlipped && currentStrength >= 65) {
    return {
      alert: `Signal has reversed — market is now showing a strong ${currentDirection} signal on this pair. Close your ${direction} trade immediately to protect your capital.`,
      alertLevel: "danger",
    };
  }

  if (signalFlipped && currentStrength >= 45) {
    return {
      alert: `Market momentum is shifting against your ${direction} trade. The signal is weakening — consider closing soon before it turns against you.`,
      alertLevel: "warning",
    };
  }

  if (pnlPercent < -1.5 && currentStrength < 50) {
    return {
      alert: `Your trade is down ${Math.abs(pnlPercent).toFixed(2)}% and the signal confidence has dropped to ${currentStrength}%. The market is moving against you — close now to cut losses.`,
      alertLevel: "danger",
    };
  }

  if (pnlPercent < -0.8) {
    return {
      alert: `Your trade is down ${Math.abs(pnlPercent).toFixed(2)}%. Monitor closely — if it continues dropping, close to protect your capital.`,
      alertLevel: "warning",
    };
  }

  if (currentStrength < 45 && direction === currentDirection) {
    return {
      alert: `Signal confidence has dropped to ${currentStrength}%. The trade is weakening — consider securing your profits and closing.`,
      alertLevel: "warning",
    };
  }

  return { alert: null, alertLevel: null };
}

router.get("/monitor", (req, res) => {
  const monitor = getActiveMonitor();

  if (!monitor) {
    return res.json({
      isActive: false,
      symbol: null,
      direction: null,
      entryPrice: null,
      currentPrice: null,
      currentStrength: null,
      currentDirection: null,
      pnlPercent: null,
      alert: null,
      alertLevel: null,
      updatedAt: new Date().toISOString(),
    });
  }

  const detail = computeSignalDetail(monitor.symbol);
  const candles = getCachedCandles(monitor.symbol);
  const currentPrice = candles.length > 0 ? candles[candles.length - 1].close : monitor.entryPrice;

  const pnlPercent = monitor.direction === "BUY"
    ? ((currentPrice - monitor.entryPrice) / monitor.entryPrice) * 100
    : ((monitor.entryPrice - currentPrice) / monitor.entryPrice) * 100;

  const currentStrength = detail?.strength ?? 50;
  const currentDirection = detail?.direction ?? "NEUTRAL";

  const { alert, alertLevel } = assessAlert(
    monitor.direction,
    monitor.entryPrice,
    currentPrice,
    currentDirection,
    currentStrength
  );

  return res.json({
    isActive: true,
    symbol: monitor.symbol,
    direction: monitor.direction,
    entryPrice: monitor.entryPrice,
    currentPrice: Math.round(currentPrice * 10000) / 10000,
    currentStrength,
    currentDirection,
    pnlPercent: Math.round(pnlPercent * 100) / 100,
    alert,
    alertLevel,
    updatedAt: new Date().toISOString(),
  });
});

router.post("/monitor", (req, res) => {
  const { symbol, direction, entryPrice } = req.body;

  if (!symbol || !direction || entryPrice == null) {
    return res.status(400).json({ error: "symbol, direction, and entryPrice are required" });
  }
  if (!["BUY", "SELL"].includes(direction)) {
    return res.status(400).json({ error: "direction must be BUY or SELL" });
  }

  const monitor = {
    symbol,
    direction: direction as "BUY" | "SELL",
    entryPrice: parseFloat(entryPrice),
    startedAt: new Date(),
  };

  setActiveMonitor(monitor);

  const detail = computeSignalDetail(symbol);
  const currentPrice = monitor.entryPrice;
  const pnlPercent = 0;

  return res.json({
    isActive: true,
    symbol: monitor.symbol,
    direction: monitor.direction,
    entryPrice: monitor.entryPrice,
    currentPrice,
    currentStrength: detail?.strength ?? 50,
    currentDirection: detail?.direction ?? "NEUTRAL",
    pnlPercent,
    alert: null,
    alertLevel: null,
    updatedAt: new Date().toISOString(),
  });
});

router.delete("/monitor", (req, res) => {
  clearActiveMonitor();
  return res.status(204).send();
});

export default router;
