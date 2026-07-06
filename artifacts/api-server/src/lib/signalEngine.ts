import { getCachedCandles, invalidateCandleCache, isLiveData, TRACKED_PAIRS } from "./marketData.js";
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
  isLive: boolean;
  updatedAt: string;
  tradeStyle: string;
  holdTime: string;
  riskReward: string;
  trendBias: "BULLISH" | "BEARISH" | "NEUTRAL";
  closeAlert: string | null;
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
  advice: string;
};

export const signalCache: Map<string, { signal: ComputedSignalDetail; cachedAt: number; wasLive: boolean }> = new Map();

const SIGNAL_TTL = 30 * 1000;

function calcTrendBias(candles: { close: number; open: number; high: number; low: number }[]): "BULLISH" | "BEARISH" | "NEUTRAL" {
  if (candles.length < 10) return "NEUTRAL";
  const last10 = candles.slice(-10);
  const first = last10[0].close;
  const last  = last10[last10.length - 1].close;
  const change = ((last - first) / first) * 100;
  if (change > 0.1)  return "BULLISH";
  if (change < -0.1) return "BEARISH";
  return "NEUTRAL";
}

function calcCloseAlert(
  symbol: string,
  direction: "BUY" | "SELL" | "NEUTRAL",
  entryPrice: number | null,
  currentPrice: number,
  stopLoss: number | null,
  takeProfit: number | null,
  strength: number,
  trendBias: "BULLISH" | "BEARISH" | "NEUTRAL"
): string | null {
  if (!entryPrice || direction === "NEUTRAL") return null;

  // Check if price is near TP (within 20%)
  if (takeProfit) {
    const tpDist   = Math.abs(takeProfit - entryPrice);
    const currDist = Math.abs(currentPrice - entryPrice);
    const pctToTP  = (currDist / tpDist) * 100;
    if (pctToTP >= 80) return "CLOSE NOW — Price is 80% of the way to Take Profit. Lock in your profit!";
  }

  // Check if signal reversed against trade
  if (direction === "BUY"  && trendBias === "BEARISH" && strength < 50)
    return "WARNING — Market reversing BEARISH. Consider closing your BUY trade to protect profit.";
  if (direction === "SELL" && trendBias === "BULLISH" && strength < 50)
    return "WARNING — Market reversing BULLISH. Consider closing your SELL trade to protect profit.";

  // Check if price is near SL (danger zone)
  if (stopLoss) {
    const slDist   = Math.abs(stopLoss - entryPrice);
    const currDist = Math.abs(currentPrice - entryPrice);
    if (direction === "BUY"  && currentPrice < entryPrice) {
      const pctToSL = (Math.abs(currentPrice - entryPrice) / slDist) * 100;
      if (pctToSL >= 60) return "DANGER — Price moving against your BUY. You are 60% toward Stop Loss. Exit now to cut losses!";
    }
    if (direction === "SELL" && currentPrice > entryPrice) {
      const pctToSL = (Math.abs(currentPrice - entryPrice) / slDist) * 100;
      if (pctToSL >= 60) return "DANGER — Price moving against your SELL. You are 60% toward Stop Loss. Exit now to cut losses!";
    }
  }

  return null;
}

function calcHoldTime(symbol: string): string {
  if (symbol.includes("BTC") || symbol.includes("ETH")) return "15 - 45 mins";
  if (symbol.includes("XAU"))                           return "30 - 60 mins";
  return "20 - 60 mins";
}

function calcAdvice(
  symbol: string,
  direction: "BUY" | "SELL" | "NEUTRAL",
  strength: number,
  trendBias: "BULLISH" | "BEARISH" | "NEUTRAL",
  entryPrice: number | null,
  stopLoss: number | null,
  takeProfit: number | null
): string {
  if (direction === "NEUTRAL") {
    return "No clear signal right now. Market is consolidating — wait for a stronger setup before entering.";
  }

  const trendMatch = (direction === "BUY" && trendBias === "BULLISH") ||
                     (direction === "SELL" && trendBias === "BEARISH");

  const strengthDesc = strength >= 80 ? "very strong" : strength >= 70 ? "strong" : "moderate";

  let advice = `${strengthDesc.charAt(0).toUpperCase() + strengthDesc.slice(1)} ${direction} signal on ${symbol}. `;

  if (trendMatch) {
    advice += `Hourly trend confirms ${direction === "BUY" ? "upward" : "downward"} momentum. `;
  } else {
    advice += `Note: Hourly trend is ${trendBias} — this is a counter-trend trade, use smaller size. `;
  }

  if (entryPrice && stopLoss && takeProfit) {
    const risk   = Math.abs(entryPrice - stopLoss);
    const reward = Math.abs(takeProfit - entryPrice);
    const rr     = (reward / risk).toFixed(1);
    advice += `Risk/Reward is 1:${rr}. `;
  }

  advice += `Hold for ${calcHoldTime(symbol)} then reassess. Close early if market shows signs of reversal.`;
  return advice;
}

export async function computeSignalDetail(symbol: string): Promise<ComputedSignalDetail | null> {
  const pair = TRACKED_PAIRS.find((p) => p.symbol === symbol);
  if (!pair) return null;

  const cached = signalCache.get(symbol);
  const nowLive = isLiveData(symbol);
  const upgraded = nowLive && cached && !cached.wasLive;

  if (cached && !upgraded && Date.now() - cached.cachedAt < SIGNAL_TTL) {
    return cached.signal;
  }

  const candles = await getCachedCandles(symbol);
  if (candles.length < 2) return null;

  const closes        = candles.map((c) => c.close);
  const currentPrice  = closes[closes.length - 1];
  const openPrice24h  = closes[Math.max(0, closes.length - 24)];
  const change24h     = currentPrice - openPrice24h;
  const changePercent24h = (change24h / openPrice24h) * 100;
  const totalVolume   = candles.slice(-24).reduce((sum, c) => sum + c.volume, 0);

  const analysis   = analyzeSignal(candles);
  const live       = isLiveData(symbol);
  const trendBias  = calcTrendBias(candles);

  const closeAlert = calcCloseAlert(
    symbol,
    analysis.direction,
    analysis.entryPrice,
    currentPrice,
    analysis.stopLoss,
    analysis.takeProfit,
    analysis.strength,
    trendBias
  );

  const advice = calcAdvice(
    symbol,
    analysis.direction,
    analysis.strength,
    trendBias,
    analysis.entryPrice,
    analysis.stopLoss,
    analysis.takeProfit
  );

  const riskReward = analysis.entryPrice && analysis.stopLoss && analysis.takeProfit
    ? "1:" + (Math.abs(analysis.takeProfit - analysis.entryPrice) / Math.abs(analysis.stopLoss - analysis.entryPrice)).toFixed(1)
    : "N/A";

  const detail: ComputedSignalDetail = {
    symbol:           pair.symbol,
    market:           pair.market,
    direction:        analysis.direction,
    strength:         analysis.strength,
    price:            currentPrice,
    change24h:        Math.round(change24h * 10000) / 10000,
    changePercent24h: Math.round(changePercent24h * 100) / 100,
    volume24h:        Math.round(totalVolume * 100) / 100,
    entryPrice:       analysis.entryPrice,
    stopLoss:         analysis.stopLoss,
    takeProfit:       analysis.takeProfit,
    timeframe:        "1H",
    isLive:           live,
    updatedAt:        new Date().toISOString(),
    tradeStyle:       "Intraday",
    holdTime:         calcHoldTime(symbol),
    riskReward,
    trendBias,
    closeAlert,
    indicators:       analysis.indicators,
    candles:          candles.slice(-50),
    advice,
  };

  signalCache.set(symbol, { signal: detail, cachedAt: Date.now(), wasLive: live });
  return detail;
}

export async function getAllSignals(): Promise<ComputedSignal[]> {
  const results = await Promise.all(
    TRACKED_PAIRS.map(async (pair) => {
      const detail = await computeSignalDetail(pair.symbol);
      if (!detail) return null;
      const { indicators: _i, candles: _c, advice: _a, ...signal } = detail;
      return signal;
    })
  );
  return results.filter((s): s is ComputedSignal => s !== null);
}

export async function refreshSignal(symbol: string): Promise<ComputedSignalDetail | null> {
  signalCache.delete(symbol);
  invalidateCandleCache(symbol);
  return computeSignalDetail(symbol);
}