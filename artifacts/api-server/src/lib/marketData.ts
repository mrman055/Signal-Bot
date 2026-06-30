import type { OHLCVCandle } from "./technicalAnalysis.js";

export type PairConfig = {
  symbol: string;
  market: "crypto" | "forex" | "commodity";
  baseAsset: string;
  quoteAsset: string;
  binanceSymbol?: string;
  yahooSymbol?: string;
};

export const TRACKED_PAIRS: PairConfig[] = [
  { symbol: "BTC/USDT", market: "crypto", baseAsset: "BTC", quoteAsset: "USDT", binanceSymbol: "BTCUSDT" },
  { symbol: "ETH/USDT", market: "crypto", baseAsset: "ETH", quoteAsset: "USDT", binanceSymbol: "ETHUSDT" },
  { symbol: "SOL/USDT", market: "crypto", baseAsset: "SOL", quoteAsset: "USDT", binanceSymbol: "SOLUSDT" },
  { symbol: "BNB/USDT", market: "crypto", baseAsset: "BNB", quoteAsset: "USDT", binanceSymbol: "BNBUSDT" },
  { symbol: "XRP/USDT", market: "crypto", baseAsset: "XRP", quoteAsset: "USDT", binanceSymbol: "XRPUSDT" },
  { symbol: "EUR/USD", market: "forex", baseAsset: "EUR", quoteAsset: "USD" },
  { symbol: "GBP/USD", market: "forex", baseAsset: "GBP", quoteAsset: "USD" },
  { symbol: "USD/JPY", market: "forex", baseAsset: "USD", quoteAsset: "JPY" },
  { symbol: "AUD/USD", market: "forex", baseAsset: "AUD", quoteAsset: "USD" },
  { symbol: "USD/CAD", market: "forex", baseAsset: "USD", quoteAsset: "CAD" },
  { symbol: "XAU/USD", market: "commodity", baseAsset: "XAU", quoteAsset: "USD" },
  { symbol: "XAG/USD", market: "commodity", baseAsset: "XAG", quoteAsset: "USD" },
  { symbol: "WTI/USD", market: "commodity", baseAsset: "WTI", quoteAsset: "USD" },
];

const BASE_PRICES: Record<string, number> = {
  "BTC/USDT": 67500,
  "ETH/USDT": 3520,
  "SOL/USDT": 155,
  "BNB/USDT": 605,
  "XRP/USDT": 0.635,
  "EUR/USD": 1.0845,
  "GBP/USD": 1.2715,
  "USD/JPY": 157.45,
  "AUD/USD": 0.6545,
  "USD/CAD": 1.3625,
  "XAU/USD": 2338,
  "XAG/USD": 29.45,
  "WTI/USD": 79.8,
};

function seededRandom(seed: number): number {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

export function generateCandles(symbol: string, count = 100): OHLCVCandle[] {
  const basePrice = BASE_PRICES[symbol] ?? 100;
  const volatility = basePrice * 0.015;
  const seed = symbol.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  const candles: OHLCVCandle[] = [];
  const now = Math.floor(Date.now() / 1000);
  const interval = 3600;

  let price = basePrice;
  const trendSeed = seededRandom(seed * 7) * 0.6 - 0.3;
  const trend = trendSeed * volatility * 0.1;

  for (let i = count; i >= 0; i--) {
    const timeSeed = seed + i * 13;
    const rand1 = seededRandom(timeSeed) * 2 - 1;
    const rand2 = seededRandom(timeSeed + 1) * 2 - 1;
    const rand3 = seededRandom(timeSeed + 2) * 2 - 1;
    const rand4 = seededRandom(timeSeed + 3);

    const change = rand1 * volatility + trend;
    const open = price;
    const close = Math.max(open * 0.8, open + change);
    const highExtra = Math.abs(rand2) * volatility * 0.5;
    const lowExtra = Math.abs(rand3) * volatility * 0.5;
    const high = Math.max(open, close) + highExtra;
    const low = Math.min(open, close) - lowExtra;
    const volume = basePrice * (1000 + rand4 * 5000);

    candles.push({
      time: now - i * interval,
      open: Math.round(open * 10000) / 10000,
      high: Math.round(high * 10000) / 10000,
      low: Math.round(Math.max(low, 0.0001) * 10000) / 10000,
      close: Math.round(close * 10000) / 10000,
      volume: Math.round(volume * 100) / 100,
    });

    price = close;
  }

  return candles;
}

const candleCache: Map<string, { candles: OHLCVCandle[]; fetchedAt: number }> = new Map();
const CACHE_TTL = 60_000;

export function getCachedCandles(symbol: string): OHLCVCandle[] {
  const cached = candleCache.get(symbol);
  if (cached && Date.now() - cached.fetchedAt < CACHE_TTL) {
    return cached.candles;
  }
  const candles = generateCandles(symbol, 100);
  candleCache.set(symbol, { candles, fetchedAt: Date.now() });
  return candles;
}

export function invalidateCandleCache(symbol: string): void {
  candleCache.delete(symbol);
}
