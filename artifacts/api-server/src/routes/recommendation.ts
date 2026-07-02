import { Router } from "express";
import { getAllSignals, computeSignalDetail } from "../lib/signalEngine.js";

const router = Router();

function buildReasoning(
  symbol: string,
  direction: "BUY" | "SELL",
  strength: number,
  indicators: { name: string; signal: string; description: string }[]
): string {
  const topIndicators = indicators
    .filter((i) => i.signal === direction)
    .slice(0, 3)
    .map((i) => i.description);

  const confidenceWord =
    strength >= 85 ? "Very high" : strength >= 75 ? "High" : "Moderate";

  const dirWord = direction === "BUY" ? "buy" : "sell";

  const reasons =
    topIndicators.length > 0
      ? topIndicators.join(". ")
      : `Multiple indicators align for a ${dirWord} on ${symbol}.`;

  return `${confidenceWord} confidence to ${dirWord} ${symbol}. ${reasons}.`;
}

router.get("/recommendation", async (req, res) => {
  const allSignals = await getAllSignals();

  const ranked = allSignals
    .filter((s) => s.direction !== "NEUTRAL")
    .sort((a, b) => b.strength - a.strength);

  if (ranked.length === 0) {
    return res.status(503).json({ error: "No actionable signals available" });
  }

  const top = ranked[0];
  const detail = await computeSignalDetail(top.symbol);

  const reasoning = detail
    ? buildReasoning(top.symbol, top.direction as "BUY" | "SELL", top.strength, detail.indicators)
    : `${top.direction} signal on ${top.symbol} with ${top.strength}% confidence.`;

  return res.json({
    symbol: top.symbol,
    market: top.market,
    direction: top.direction,
    strength: top.strength,
    price: top.price,
    change24h: top.change24h,
    changePercent24h: top.changePercent24h,
    timeframe: top.timeframe,
    reasoning,
    entryPrice: top.entryPrice,
    stopLoss: top.stopLoss,
    takeProfit: top.takeProfit,
    isLive: top.isLive,
    updatedAt: top.updatedAt,
  });
});

export default router;
