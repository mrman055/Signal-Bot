import { Router } from "express";
import { TRACKED_PAIRS, getCachedCandles } from "../lib/marketData.js";

const router = Router();

router.get("/pairs", (_req, res) => {
  const pairs = TRACKED_PAIRS.map((p) => ({
    symbol: p.symbol,
    market: p.market,
    baseAsset: p.baseAsset,
    quoteAsset: p.quoteAsset,
    isActive: true,
  }));
  return res.json(pairs);
});

<<<<<<< HEAD
router.get("/pairs/:symbol/candles", async (req, res) => {
=======
router.get("/pairs/:symbol/candles", (req, res) => {
>>>>>>> 27d569cd44bd6e7ad726fffd73ff4097f6683b52
  const symbol = decodeURIComponent(req.params.symbol);
  const pair = TRACKED_PAIRS.find((p) => p.symbol === symbol);
  if (!pair) {
    return res.status(404).json({ error: "Symbol not found" });
  }
<<<<<<< HEAD
  const candles = await getCachedCandles(symbol);
=======
  const candles = getCachedCandles(symbol);
>>>>>>> 27d569cd44bd6e7ad726fffd73ff4097f6683b52
  return res.json(candles);
});

export default router;
