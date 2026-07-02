import type { OHLCVCandle } from "./technicalAnalysis.js";
import { logger } from "./logger.js";

export type PairConfig = {
  symbol: string;
  market: "crypto" | "forex" | "commodity";
  baseAsset: string;
  quoteAsset: string;
  twelveDataSymbol: string;
};

export const TRACKED_PAIRS: PairConfig[] = [
  // Commodities — most popular MT5 pairs
  { symbol: "XAU/USD",  market: "commodity", baseAsset: "XAU", quoteAsset: "USD", twelveDataSymbol: "XAU/USD" },
  { symbol: "XAG/USD",  market: "commodity", baseAsset: "XAG", quoteAsset: "USD", twelveDataSymbol: "XAG/USD" },
  { symbol: "WTI/USD",  market: "commodity", baseAsset: "WTI", quoteAsset: "USD", twelveDataSymbol: "WTI/USD" },
  // Major Forex pairs — all available on standard MT5 brokers
  { symbol: "EUR/USD",  market: "forex",     baseAsset: "EUR", quoteAsset: "USD", twelveDataSymbol: "EUR/USD" },
  { symbol: "GBP/USD",  market: "forex",     baseAsset: "GBP", quoteAsset: "USD", twelveDataSymbol: "GBP/USD" },
  { symbol: "USD/JPY",  market: "forex",     baseAsset: "USD", quoteAsset: "JPY", twelveDataSymbol: "USD/JPY" },
  { symbol: "AUD/USD",  market: "forex",     baseAsset: "AUD", quoteAsset: "USD", twelveDataSymbol: "AUD/USD" },
  { symbol: "USD/CAD",  market: "forex",     baseAsset: "USD", quoteAsset: "CAD", twelveDataSymbol: "USD/CAD" },
  { symbol: "USD/CHF",  market: "forex",     baseAsset: "USD", quoteAsset: "CHF", twelveDataSymbol: "USD/CHF" },
  { symbol: "NZD/USD",  market: "forex",     baseAsset: "NZD", quoteAsset: "USD", twelveDataSymbol: "NZD/USD" },
  // Cross pairs — popular on MT5
  { symbol: "GBP/JPY",  market: "forex",     baseAsset: "GBP", quoteAsset: "JPY", twelveDataSymbol: "GBP/JPY" },
  { symbol: "EUR/JPY",  market: "forex",     baseAsset: "EUR", quoteAsset: "JPY", twelveDataSymbol: "EUR/JPY" },
  { symbol: "EUR/GBP",  market: "forex",     baseAsset: "EUR", quoteAsset: "GBP", twelveDataSymbol: "EUR/GBP" },
  // Crypto — also available on many MT5 brokers
  { symbol: "BTC/USD",  market: "crypto",    baseAsset: "BTC", quoteAsset: "USD", twelveDataSymbol: "BTC/USD" },
  { symbol: "ETH/USD",  market: "crypto",    baseAsset: "ETH", quoteAsset: "USD", twelveDataSymbol: "ETH/USD" },
];

// ---------------------------------------------------------------------------
// Proxy configuration — for symbols not on the current Twelve Data plan.
// We fetch a freely-available proxy instrument (ETF that closely tracks the
// underlying) and scale the candles to the real spot price.
// ---------------------------------------------------------------------------
type ProxyConfig = {
  /** Twelve Data symbol for the proxy instrument (must be on free plan). */
  proxySymbol: string;
  /**
   * Optional async function that fetches the current real spot price.
   * When available, all proxy candles are scaled so the latest close equals
   * the real spot price, giving accurate RSI/MACD/Bollinger levels.
   */
  spotPriceFetcher?: () => Promise<number | null>;
};

// XAG/USD → SLV (iShares Silver Trust ETF, free on Twelve Data)
// Spot price fetched from the free, no-auth currency-api CDN.
async function fetchXagSpotPrice(): Promise<number | null> {
  try {
    const res = await fetchWithTimeout(
      "https://latest.currency-api.pages.dev/v1/currencies/xag.json",
      8000,
    );
    if (!res.ok) return null;
    const data = await res.json() as { xag?: Record<string, number> };
    const price = data.xag?.usd ?? data.xag?.bmd ?? null;
    return typeof price === "number" && price > 0 ? price : null;
  } catch {
    return null;
  }
}

// WTI/USD → USO (US Oil Fund ETF, free on Twelve Data)
// No free no-auth spot-price API for crude oil — we use the ETF price directly
// scaled by the long-run USO/WTI ratio (~0.70).  Close enough for indicator math.
const USO_TO_WTI_RATIO = 0.70;
async function fetchWtiSpotPrice(): Promise<number | null> {
  // USO price → approximate WTI by applying the historical ratio.
  // This is updated by the proxy candle fetch so we read from cache.
  return null; // scaling handled inside fetchProxyCandles
}

const PROXY_MAP: Record<string, ProxyConfig> = {
  "XAG/USD": { proxySymbol: "SLV",  spotPriceFetcher: fetchXagSpotPrice },
  "WTI/USD": { proxySymbol: "USO",  spotPriceFetcher: fetchWtiSpotPrice },
};

// ---------------------------------------------------------------------------
// Fallback prices — used only when BOTH Twelve Data AND all proxies fail.
// Last updated: July 2026 (user-confirmed from MT5).
// ---------------------------------------------------------------------------
const FALLBACK_PRICES: Record<string, number> = {
  "XAU/USD": 4064.0, "XAG/USD": 59.83,  "WTI/USD": 72.0,
  "EUR/USD": 1.0820, "GBP/USD": 1.2680, "USD/JPY": 145.50,
  "AUD/USD": 0.6380, "USD/CAD": 1.3750, "USD/CHF": 0.8920,
  "NZD/USD": 0.5920, "GBP/JPY": 184.40, "EUR/JPY": 157.50,
  "EUR/GBP": 0.8530, "BTC/USD": 107000, "ETH/USD": 2850,
};

const API_KEY = process.env.TWELVE_DATA_API_KEY;
const BASE_URL = "https://api.twelvedata.com";

type TwelveDataCandle = {
  datetime: string; open: string; high: string; low: string; close: string; volume: string;
};
type TwelveDataTimeSeriesResponse = {
  status?: string; code?: number; message?: string; values?: TwelveDataCandle[];
};

async function fetchWithTimeout(url: string, timeoutMs = 10000): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timer);
    return res;
  } catch (e) {
    clearTimeout(timer);
    throw e;
  }
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Parse a Twelve Data values array into sorted OHLCVCandle[]. */
function parseTwelveDataCandles(values: TwelveDataCandle[]): OHLCVCandle[] {
  return values
    .map((v) => ({
      time:   Math.floor(new Date(v.datetime).getTime() / 1000),
      open:   parseFloat(v.open),
      high:   parseFloat(v.high),
      low:    parseFloat(v.low),
      close:  parseFloat(v.close),
      volume: parseFloat(v.volume) || 0,
    }))
    .filter((c) => !isNaN(c.open) && !isNaN(c.close))
    .reverse(); // oldest first
}

/** Scale every price in a candle array so the latest close = targetPrice. */
function scaleCandles(candles: OHLCVCandle[], targetPrice: number): OHLCVCandle[] {
  if (candles.length === 0) return candles;
  const latestClose = candles[candles.length - 1].close;
  if (latestClose === 0) return candles;
  const factor = targetPrice / latestClose;
  return candles.map((c) => ({
    ...c,
    open:  Math.round(c.open  * factor * 10000) / 10000,
    high:  Math.round(c.high  * factor * 10000) / 10000,
    low:   Math.round(c.low   * factor * 10000) / 10000,
    close: Math.round(c.close * factor * 10000) / 10000,
  }));
}

type CandleCache = { candles: OHLCVCandle[]; fetchedAt: number; isLive: boolean };
const candleCache: Map<string, CandleCache> = new Map();

// Symbols with NO proxy that returned a permanent 404 — never re-queued.
const permanentFail: Set<string> = new Set();

const LIVE_CACHE_TTL     = 10 * 60 * 1000;
const FALLBACK_CACHE_TTL =  1 * 60 * 1000;

let fetchQueue: string[] = [];
let fetchInProgress = false;

type ProxyFetchResult = "ok" | "rate_limited" | "not_found" | "invalid_data" | "transient_error";

/**
 * Attempt to load candles via a proxy ETF instrument when the primary symbol
 * is unavailable on the current Twelve Data plan.
 * Returns a structured result so the caller can handle each outcome correctly.
 */
async function fetchProxyCandles(symbol: string, proxy: ProxyConfig): Promise<ProxyFetchResult> {
  const url = `${BASE_URL}/time_series?symbol=${encodeURIComponent(proxy.proxySymbol)}&interval=1h&outputsize=100&apikey=${API_KEY}`;
  try {
    const res = await fetchWithTimeout(url);
    const data = await res.json() as TwelveDataTimeSeriesResponse;

    if (data.code === 429) return "rate_limited";
    if (data.code === 404) return "not_found";

    if (data.code || data.status === "error" || !data.values || data.values.length < 30) {
      logger.warn({ symbol, proxy: proxy.proxySymbol, code: data.code }, "Proxy fetch failed");
      return "transient_error";
    }

    let candles = parseTwelveDataCandles(data.values);

    // Post-parse validation: require at least 30 valid candles with finite OHLC
    const validCandles = candles.filter(
      (c) => isFinite(c.open) && isFinite(c.high) && isFinite(c.low) && isFinite(c.close)
        && c.open > 0 && c.close > 0,
    );
    if (validCandles.length < 30) {
      logger.warn({ symbol, proxy: proxy.proxySymbol, parsed: candles.length, valid: validCandles.length }, "Proxy candles failed post-parse validation");
      return "invalid_data";
    }
    candles = validCandles;

    // For WTI/USD via USO ETF: scale by the USO→WTI ratio so the displayed
    // price is in the WTI ballpark rather than the ETF share price.
    if (symbol === "WTI/USD") {
      const latestUSOClose = candles[candles.length - 1]?.close ?? 0;
      const impliedWTI = latestUSOClose * USO_TO_WTI_RATIO;
      candles = scaleCandles(candles, impliedWTI > 0 ? impliedWTI : FALLBACK_PRICES["WTI/USD"]);
    }

    // Fetch real spot price and re-scale candles to that level.
    if (proxy.spotPriceFetcher) {
      const spotPrice = await proxy.spotPriceFetcher();
      if (spotPrice && spotPrice > 0) {
        candles = scaleCandles(candles, spotPrice);
        logger.info({ symbol, proxy: proxy.proxySymbol, spotPrice }, "Proxy candles loaded with real spot price");
      } else {
        logger.info({ symbol, proxy: proxy.proxySymbol }, "Proxy candles loaded (spot price unavailable, using ETF price)");
      }
    } else {
      logger.info({ symbol, proxy: proxy.proxySymbol }, "Proxy candles loaded");
    }

    candleCache.set(symbol, { candles, fetchedAt: Date.now(), isLive: true });
    return "ok";
  } catch (err) {
    logger.warn({ symbol, proxy: proxy.proxySymbol, err }, "Proxy fetch error");
    return "transient_error";
  }
}

async function runFetchQueue(): Promise<void> {
  if (fetchInProgress) return;
  fetchInProgress = true;

  while (fetchQueue.length > 0) {
    const symbol = fetchQueue.shift()!;

    if (permanentFail.has(symbol)) continue;

    const cached = candleCache.get(symbol);
    if (cached?.isLive && Date.now() - cached.fetchedAt < LIVE_CACHE_TTL) {
      continue;
    }

    try {
      const pair = TRACKED_PAIRS.find((p) => p.symbol === symbol);
      if (!pair) continue;

      const url = `${BASE_URL}/time_series?symbol=${encodeURIComponent(pair.twelveDataSymbol)}&interval=1h&outputsize=100&apikey=${API_KEY}`;
      const res = await fetchWithTimeout(url);
      const data = await res.json() as TwelveDataTimeSeriesResponse;

      if (data.code === 429) {
        logger.warn({ symbol }, "Twelve Data rate limit hit — pausing 60s");
        fetchQueue.unshift(symbol);
        await sleep(61_000);
        continue;
      }

      if (data.code === 404) {
        // Not on this plan — check for a proxy instrument first.
        const proxy = PROXY_MAP[symbol];
        if (proxy) {
          const result = await fetchProxyCandles(symbol, proxy);
          if (result === "rate_limited") {
            // Requeue the symbol and back off, same as primary rate limit.
            logger.warn({ symbol, proxy: proxy.proxySymbol }, "Proxy rate limited — requeueing after 60s");
            fetchQueue.unshift(symbol);
            await sleep(61_000);
            continue;
          }
          if (result === "not_found") {
            // The proxy ETF itself is not on this plan — mark permanently.
            logger.warn({ symbol, proxy: proxy.proxySymbol }, "Proxy symbol also unavailable — using synthetic data permanently");
            permanentFail.add(symbol);
            if (!candleCache.has(symbol)) {
              candleCache.set(symbol, { candles: generateFallbackCandles(symbol), fetchedAt: Date.now(), isLive: false });
            }
            continue;
          }
          if (result !== "ok") {
            // Transient error or invalid data — keep any existing cache, use fallback if nothing cached.
            if (!candleCache.has(symbol)) {
              candleCache.set(symbol, { candles: generateFallbackCandles(symbol), fetchedAt: Date.now(), isLive: false });
            }
          }
          // For ok/transient/invalid: proxy symbols are re-enqueued naturally by
          // preloadAllPairs on the next cycle (not marked permanentFail).
          continue;
        }
        // No proxy — mark as permanent fail.
        logger.warn({ symbol }, "Twelve Data: symbol unavailable on this plan, no proxy — using synthetic data");
        permanentFail.add(symbol);
        if (!candleCache.has(symbol)) {
          candleCache.set(symbol, { candles: generateFallbackCandles(symbol), fetchedAt: Date.now(), isLive: false });
        }
        continue;
      }

      if (data.code || data.status === "error" || !data.values || data.values.length < 30) {
        logger.warn({ symbol, msg: data.message, code: data.code }, "Twelve Data error");
        if (!candleCache.has(symbol)) {
          candleCache.set(symbol, { candles: generateFallbackCandles(symbol), fetchedAt: Date.now(), isLive: false });
        }
      } else {
        const candles = parseTwelveDataCandles(data.values);
        candleCache.set(symbol, { candles, fetchedAt: Date.now(), isLive: true });
        logger.info({ symbol }, "Live candles loaded from Twelve Data");
      }
    } catch (err) {
      logger.error({ symbol, err }, "Twelve Data fetch error");
      if (!candleCache.has(symbol)) {
        candleCache.set(symbol, { candles: generateFallbackCandles(symbol), fetchedAt: Date.now(), isLive: false });
      }
    }

    if (fetchQueue.length > 0) await sleep(8_000);
  }

  fetchInProgress = false;
}

function enqueueFetch(symbol: string): void {
  if (!API_KEY) return;
  if (permanentFail.has(symbol)) return;
  if (!fetchQueue.includes(symbol)) fetchQueue.push(symbol);
  void runFetchQueue();
}

function preloadAllPairs(): void {
  if (!API_KEY) return;
  for (const pair of TRACKED_PAIRS) {
    const cached = candleCache.get(pair.symbol);
    if (!cached || (!cached.isLive && Date.now() - cached.fetchedAt > FALLBACK_CACHE_TTL)) {
      if (!fetchQueue.includes(pair.symbol)) fetchQueue.push(pair.symbol);
    }
  }
  void runFetchQueue();
}

setTimeout(preloadAllPairs, 2000);

export async function getCachedCandles(symbol: string): Promise<OHLCVCandle[]> {
  const cached = candleCache.get(symbol);
  const now = Date.now();

  if (cached?.isLive && now - cached.fetchedAt < LIVE_CACHE_TTL) return cached.candles;
  if (cached && !cached.isLive && now - cached.fetchedAt < FALLBACK_CACHE_TTL) return cached.candles;

  if (API_KEY) {
    enqueueFetch(symbol);

    const deadline = Date.now() + 6_000;
    while (Date.now() < deadline) {
      await sleep(300);
      const c = candleCache.get(symbol);
      if (c) return c.candles;
    }
  }

  const fallback = generateFallbackCandles(symbol);
  candleCache.set(symbol, { candles: fallback, fetchedAt: now, isLive: false });
  return fallback;
}

export function isLiveData(symbol: string): boolean {
  return candleCache.get(symbol)?.isLive ?? false;
}

export function invalidateCandleCache(symbol: string): void {
  candleCache.delete(symbol);
  enqueueFetch(symbol);
}

function seededRandom(seed: number): number {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

export function generateFallbackCandles(symbol: string, count = 100): OHLCVCandle[] {
  const basePrice = FALLBACK_PRICES[symbol] ?? 100;
  const volatility = basePrice * 0.015;
  const seed = symbol.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  const candles: OHLCVCandle[] = [];
  const now = Math.floor(Date.now() / 1000);
  const interval = 3600;
  let price = basePrice;
  const trend = (seededRandom(seed * 7) * 0.6 - 0.3) * volatility * 0.1;

  for (let i = count; i >= 0; i--) {
    const ts = seed + i * 13;
    const r1 = seededRandom(ts) * 2 - 1;
    const r2 = seededRandom(ts + 1) * 2 - 1;
    const r3 = seededRandom(ts + 2) * 2 - 1;
    const r4 = seededRandom(ts + 3);
    const open  = price;
    const close = Math.max(open * 0.8, open + r1 * volatility + trend);
    const high  = Math.max(open, close) + Math.abs(r2) * volatility * 0.5;
    const low   = Math.min(open, close) - Math.abs(r3) * volatility * 0.5;
    candles.push({
      time:   now - i * interval,
      open:   Math.round(open  * 10000) / 10000,
      high:   Math.round(high  * 10000) / 10000,
      low:    Math.round(Math.max(low, 0.0001) * 10000) / 10000,
      close:  Math.round(close * 10000) / 10000,
      volume: Math.round(basePrice * (1000 + r4 * 5000) * 100) / 100,
    });
    price = close;
  }
  return candles;
}
