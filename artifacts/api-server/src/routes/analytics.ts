import { Router } from "express";
import { getAllSignals, computeSignalDetail } from "../lib/signalEngine.js";

const router = Router();

router.get("/analytics/summary", (_req, res) => {
  const signals = getAllSignals();
  const buy = signals.filter((s) => s.direction === "BUY").length;
  const sell = signals.filter((s) => s.direction === "SELL").length;
  const neutral = signals.filter((s) => s.direction === "NEUTRAL").length;
  const avgStrength =
    signals.length > 0
      ? Math.round((signals.reduce((sum, s) => sum + s.strength, 0) / signals.length) * 100) / 100
      : 0;
  const highConfidenceCount = signals.filter((s) => s.strength >= 80).length;

  return res.json({
    totalPairs: signals.length,
    buySignals: buy,
    sellSignals: sell,
    neutralSignals: neutral,
    avgStrength,
    highConfidenceCount,
    lastUpdated: new Date().toISOString(),
  });
});

router.get("/analytics/top-signals", (req, res) => {
  const limit = parseInt((req.query.limit as string) ?? "5", 10);
  const signals = getAllSignals()
    .filter((s) => s.direction !== "NEUTRAL")
    .sort((a, b) => b.strength - a.strength)
    .slice(0, isNaN(limit) ? 5 : limit);
  return res.json(signals);
});

router.get("/analytics/market-overview", (_req, res) => {
  const signals = getAllSignals();
  const markets = ["crypto", "forex", "commodity"] as const;

  const overview: Record<string, {
    total: number;
    buy: number;
    sell: number;
    neutral: number;
    avgStrength: number;
    topSignal: string | null;
  }> = {};

  for (const market of markets) {
    const mkt = signals.filter((s) => s.market === market);
    const buy = mkt.filter((s) => s.direction === "BUY").length;
    const sell = mkt.filter((s) => s.direction === "SELL").length;
    const neutral = mkt.filter((s) => s.direction === "NEUTRAL").length;
    const avgStrength =
      mkt.length > 0
        ? Math.round((mkt.reduce((sum, s) => sum + s.strength, 0) / mkt.length) * 100) / 100
        : 0;
    const top = mkt
      .filter((s) => s.direction !== "NEUTRAL")
      .sort((a, b) => b.strength - a.strength)[0];
    overview[market] = {
      total: mkt.length,
      buy,
      sell,
      neutral,
      avgStrength,
      topSignal: top ? top.symbol : null,
    };
  }

  return res.json(overview);
});

export default router;
