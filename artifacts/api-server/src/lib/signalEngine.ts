import { getCachedCandles, invalidateCandleCache, TRACKED_PAIRS } from "./marketData.js";
import { analyzeSignal } from "./technicalAnalysis.js";

export type ComputedSignal = {
  symbol: string;
  market: "crypto" | "forex" | "commodity";
  direction: "BUY" | "SELL" | "NEUTRAL";
  strength: number;
  price: number;
  change24h: number;
  changePercent24h: number;
  volume24h: number | null;
  entryPrice: number | null;
  stopLoss: number | null;
  takeProfit: number | null;
  timeframe: string;
  updatedAt: string;
};

export type ComputedSignalDetail = ComputedSignal & {
  indicators: {
    name: string;
    value: number;
    signal: "BUY" | "SELL" | "NEUTRAL";
    weight: number;
    description: string;
  }[];
  candles: {
    time: number;
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
  }[];
};

const signalCache: Map<string, { signal: ComputedSignalDetail; cachedAt: number }> = new Map();
const SIGNAL_TTL = 60_000;

export function computeSignalDetail(symbol: string): ComputedSignalDetail | null {
  const pair = TRACKED_PAIRS.find((p) => p.symbol === symbol);
  if (!pair) return null;

  const cached = signalCache.get(symbol);
  if (cached && Date.now() - cached.cachedAt < SIGNAL_TTL) {
    return cached.signal;
  }

  const candles = getCachedCandles(symbol);
  if (candles.length < 2) return null;

  const closes = candles.map((c) => c.close);
  const currentPrice = closes[closes.length - 1];
  const openPrice24h = closes[Math.max(0, closes.length - 24)];
  const change24h = currentPrice - openPrice24h;
  const changePercent24h = (change24h / openPrice24h) * 100;

  const totalVolume = candles
    .slice(-24)
    .reduce((sum, c) => sum + c.volume, 0);

  const analysis = analyzeSignal(candles);

  const detail: ComputedSignalDetail = {
    symbol: pair.symbol,
    market: pair.market,
    direction: analysis.direction,
    strength: analysis.strength,
    price: currentPrice,
    change24h: Math.round(change24h * 10000) / 10000,
    changePercent24h: Math.round(changePercent24h * 100) / 100,
    volume24h: Math.round(totalVolume * 100) / 100,
    entryPrice: analysis.entryPrice,
    stopLoss: analysis.stopLoss,
    takeProfit: analysis.takeProfit,
    timeframe: "1h",
    updatedAt: new Date().toISOString(),
    indicators: analysis.indicators,
    candles: candles.slice(-50),
  };

  signalCache.set(symbol, { signal: detail, cachedAt: Date.now() });
  return detail;
}

export function getAllSignals(): ComputedSignal[] {
  return TRACKED_PAIRS.map((pair) => {
    const detail = computeSignalDetail(pair.symbol);
    if (!detail) return null;
    const { indicators: _i, candles: _c, ...signal } = detail;
    return signal;
  }).filter((s): s is ComputedSignal => s !== null);
}

export function refreshSignal(symbol: string): ComputedSignalDetail | null {
  signalCache.delete(symbol);
  invalidateCandleCache(symbol);
  return computeSignalDetail(symbol);
}
