export type OHLCVCandle = {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
};

export type IndicatorResult = {
  name: string;
  value: number;
  signal: "BUY" | "SELL" | "NEUTRAL";
  weight: number;
  description: string;
};

export function calcRSI(closes: number[], period = 14): number {
  if (closes.length < period + 1) return 50;
  let gains = 0;
  let losses = 0;
  for (let i = closes.length - period; i < closes.length; i++) {
    const diff = closes[i] - closes[i - 1];
    if (diff > 0) gains += diff;
    else losses += Math.abs(diff);
  }
  const avgGain = gains / period;
  const avgLoss = losses / period;
  if (avgLoss === 0) return 100;
  const rs = avgGain / avgLoss;
  return 100 - 100 / (1 + rs);
}

export function calcEMA(closes: number[], period: number): number[] {
  if (closes.length < period) return closes.map(() => closes[0]);
  const k = 2 / (period + 1);
  const emas: number[] = [];
  let ema = closes.slice(0, period).reduce((a, b) => a + b, 0) / period;
  emas.push(ema);
  for (let i = period; i < closes.length; i++) {
    ema = closes[i] * k + ema * (1 - k);
    emas.push(ema);
  }
  return emas;
}

export function calcMACD(closes: number[]): { macd: number; signal: number; histogram: number } {
  const ema12 = calcEMA(closes, 12);
  const ema26 = calcEMA(closes, 26);
  const minLen = Math.min(ema12.length, ema26.length);
  const macdLine = ema12.slice(-minLen).map((v, i) => v - ema26.slice(-minLen)[i]);
  const signalLine = calcEMA(macdLine, 9);
  const macd = macdLine[macdLine.length - 1];
  const sig = signalLine[signalLine.length - 1];
  return { macd, signal: sig, histogram: macd - sig };
}

export function calcBollingerBands(closes: number[], period = 20, stdDev = 2): {
  upper: number;
  middle: number;
  lower: number;
  percentB: number;
} {
  if (closes.length < period) {
    const price = closes[closes.length - 1];
    return { upper: price * 1.02, middle: price, lower: price * 0.98, percentB: 0.5 };
  }
  const slice = closes.slice(-period);
  const mean = slice.reduce((a, b) => a + b, 0) / period;
  const variance = slice.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / period;
  const std = Math.sqrt(variance);
  const upper = mean + stdDev * std;
  const lower = mean - stdDev * std;
  const price = closes[closes.length - 1];
  const percentB = std === 0 ? 0.5 : (price - lower) / (upper - lower);
  return { upper, middle: mean, lower, percentB };
}

export function calcStochastic(candles: OHLCVCandle[], period = 14): { k: number; d: number } {
  if (candles.length < period) return { k: 50, d: 50 };
  const slice = candles.slice(-period);
  const highs = slice.map((c) => c.high);
  const lows = slice.map((c) => c.low);
  const highestHigh = Math.max(...highs);
  const lowestLow = Math.min(...lows);
  const currentClose = candles[candles.length - 1].close;
  const k = highestHigh === lowestLow ? 50 : ((currentClose - lowestLow) / (highestHigh - lowestLow)) * 100;
  const k2 = candles.length >= period + 1
    ? (() => {
        const s2 = candles.slice(-period - 1, -1);
        const h2 = Math.max(...s2.map((c) => c.high));
        const l2 = Math.min(...s2.map((c) => c.low));
        const c2 = candles[candles.length - 2].close;
        return h2 === l2 ? 50 : ((c2 - l2) / (h2 - l2)) * 100;
      })()
    : k;
  const d = (k + k2) / 2;
  return { k, d };
}

export function calcATR(candles: OHLCVCandle[], period = 14): number {
  if (candles.length < 2) return 0;
  const trs: number[] = [];
  for (let i = 1; i < candles.length; i++) {
    const hl = candles[i].high - candles[i].low;
    const hc = Math.abs(candles[i].high - candles[i - 1].close);
    const lc = Math.abs(candles[i].low - candles[i - 1].close);
    trs.push(Math.max(hl, hc, lc));
  }
  const recent = trs.slice(-period);
  return recent.reduce((a, b) => a + b, 0) / recent.length;
}

export function analyzeSignal(candles: OHLCVCandle[]): {
  direction: "BUY" | "SELL" | "NEUTRAL";
  strength: number;
  indicators: IndicatorResult[];
  entryPrice: number | null;
  stopLoss: number | null;
  takeProfit: number | null;
} {
  if (candles.length < 30) {
    return {
      direction: "NEUTRAL",
      strength: 50,
      indicators: [],
      entryPrice: null,
      stopLoss: null,
      takeProfit: null,
    };
  }

  const closes = candles.map((c) => c.close);
  const currentPrice = closes[closes.length - 1];
  const indicators: IndicatorResult[] = [];

  const rsi = calcRSI(closes);
  const rsiSignal: "BUY" | "SELL" | "NEUTRAL" =
    rsi < 30 ? "BUY" : rsi > 70 ? "SELL" : "NEUTRAL";
  indicators.push({
    name: "RSI",
    value: Math.round(rsi * 100) / 100,
    signal: rsiSignal,
    weight: 0.25,
    description:
      rsi < 30
        ? `RSI at ${rsi.toFixed(1)} — oversold territory, potential reversal upward`
        : rsi > 70
        ? `RSI at ${rsi.toFixed(1)} — overbought territory, potential reversal downward`
        : `RSI at ${rsi.toFixed(1)} — neutral zone`,
  });

  const macdData = calcMACD(closes);
  const macdSignal: "BUY" | "SELL" | "NEUTRAL" =
    macdData.histogram > 0 && macdData.macd > macdData.signal
      ? "BUY"
      : macdData.histogram < 0 && macdData.macd < macdData.signal
      ? "SELL"
      : "NEUTRAL";
  indicators.push({
    name: "MACD",
    value: Math.round(macdData.histogram * 10000) / 10000,
    signal: macdSignal,
    weight: 0.25,
    description:
      macdSignal === "BUY"
        ? "MACD line crossed above signal — bullish momentum building"
        : macdSignal === "SELL"
        ? "MACD line crossed below signal — bearish momentum building"
        : "MACD near signal line — indecisive momentum",
  });

  const ema20 = calcEMA(closes, 20);
  const ema50 = calcEMA(closes, 50);
  const ema20Last = ema20[ema20.length - 1];
  const ema50Last = ema50[ema50.length - 1];
  const emaCrossSignal: "BUY" | "SELL" | "NEUTRAL" =
    currentPrice > ema20Last && ema20Last > ema50Last
      ? "BUY"
      : currentPrice < ema20Last && ema20Last < ema50Last
      ? "SELL"
      : "NEUTRAL";
  indicators.push({
    name: "EMA Cross",
    value: Math.round(((ema20Last - ema50Last) / ema50Last) * 10000) / 100,
    signal: emaCrossSignal,
    weight: 0.2,
    description:
      emaCrossSignal === "BUY"
        ? "Price above EMA20 > EMA50 — uptrend confirmed"
        : emaCrossSignal === "SELL"
        ? "Price below EMA20 < EMA50 — downtrend confirmed"
        : "EMAs converging — trend change possible",
  });

  const bb = calcBollingerBands(closes);
  const bbSignal: "BUY" | "SELL" | "NEUTRAL" =
    bb.percentB < 0.1 ? "BUY" : bb.percentB > 0.9 ? "SELL" : "NEUTRAL";
  indicators.push({
    name: "Bollinger Bands",
    value: Math.round(bb.percentB * 100) / 100,
    signal: bbSignal,
    weight: 0.15,
    description:
      bbSignal === "BUY"
        ? `Price near lower band (${bb.percentB.toFixed(2)}%B) — potential bounce`
        : bbSignal === "SELL"
        ? `Price near upper band (${bb.percentB.toFixed(2)}%B) — potential reversal`
        : `Price within bands (${bb.percentB.toFixed(2)}%B) — normal range`,
  });

  const stoch = calcStochastic(candles);
  const stochSignal: "BUY" | "SELL" | "NEUTRAL" =
    stoch.k < 20 && stoch.d < 20 ? "BUY" : stoch.k > 80 && stoch.d > 80 ? "SELL" : "NEUTRAL";
  indicators.push({
    name: "Stochastic",
    value: Math.round(stoch.k * 100) / 100,
    signal: stochSignal,
    weight: 0.15,
    description:
      stochSignal === "BUY"
        ? `Stoch K at ${stoch.k.toFixed(1)} — oversold, watch for upturn`
        : stochSignal === "SELL"
        ? `Stoch K at ${stoch.k.toFixed(1)} — overbought, watch for downturn`
        : `Stoch K at ${stoch.k.toFixed(1)} — neutral zone`,
  });

  let weightedBuy = 0;
  let weightedSell = 0;
  let totalWeight = 0;
  for (const ind of indicators) {
    if (ind.signal === "BUY") weightedBuy += ind.weight;
    else if (ind.signal === "SELL") weightedSell += ind.weight;
    totalWeight += ind.weight;
  }
  const buyScore = weightedBuy / totalWeight;
  const sellScore = weightedSell / totalWeight;

  let direction: "BUY" | "SELL" | "NEUTRAL";
  let rawStrength: number;
  if (buyScore > sellScore && buyScore > 0.4) {
    direction = "BUY";
    rawStrength = 50 + buyScore * 50;
  } else if (sellScore > buyScore && sellScore > 0.4) {
    direction = "SELL";
    rawStrength = 50 + sellScore * 50;
  } else {
    direction = "NEUTRAL";
    rawStrength = 50;
  }
  const strength = Math.min(99, Math.round(rawStrength));

  const atr = calcATR(candles);
  let entryPrice: number | null = null;
  let stopLoss: number | null = null;
  let takeProfit: number | null = null;
  if (direction !== "NEUTRAL" && atr > 0) {
    entryPrice = currentPrice;
    if (direction === "BUY") {
      stopLoss = Math.round((currentPrice - atr * 1.5) * 10000) / 10000;
      takeProfit = Math.round((currentPrice + atr * 3) * 10000) / 10000;
    } else {
      stopLoss = Math.round((currentPrice + atr * 1.5) * 10000) / 10000;
      takeProfit = Math.round((currentPrice - atr * 3) * 10000) / 10000;
    }
  }

  return { direction, strength, indicators, entryPrice, stopLoss, takeProfit };
}
