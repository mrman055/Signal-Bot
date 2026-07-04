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

export function calcRSI(closes: number[], period = 7): number {
  if (closes.length < period + 1) return 50;
  let gains = 0, losses = 0;
  for (let i = closes.length - period; i < closes.length; i++) {
    const diff = closes[i] - closes[i - 1];
    if (diff > 0) gains += diff;
    else losses += Math.abs(diff);
  }
  const avgGain = gains / period;
  const avgLoss = losses / period;
  if (avgLoss === 0) return 100;
  return 100 - 100 / (1 + avgGain / avgLoss);
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
  const ema5 = calcEMA(closes, 5);
  const ema13 = calcEMA(closes, 13);
  const minLen = Math.min(ema5.length, ema13.length);
  const macdLine = ema5.slice(-minLen).map((v, i) => v - ema13.slice(-minLen)[i]);
  const signalLine = calcEMA(macdLine, 4);
  const macd = macdLine[macdLine.length - 1];
  const sig = signalLine[signalLine.length - 1];
  return { macd, signal: sig, histogram: macd - sig };
}

export function calcBollingerBands(closes: number[], period = 10, stdDev = 2): {
  upper: number; middle: number; lower: number; percentB: number;
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

export function calcATR(candles: OHLCVCandle[], period = 7): number {
  if (candles.length < 2) return 0;
  const trs: number[] = [];
  for (let i = 1; i < candles.length; i++) {
    const hl = candles[i].high - candles[i].low;
    const hc = Math.abs(candles[i].high - candles[i - 1].close);
    const lc = Math.abs(candles[i].low - candles[i - 1].close);
    trs.push(Math.max(hl, hc, lc));
  }
  return trs.slice(-period).reduce((a, b) => a + b, 0) / period;
}

export function calcStochastic(candles: OHLCVCandle[], period = 5): { k: number; d: number } {
  if (candles.length < period) return { k: 50, d: 50 };
  const slice = candles.slice(-period);
  const highestHigh = Math.max(...slice.map((c) => c.high));
  const lowestLow = Math.min(...slice.map((c) => c.low));
  const currentClose = candles[candles.length - 1].close;
  const k = highestHigh === lowestLow ? 50 : ((currentClose - lowestLow) / (highestHigh - lowestLow)) * 100;
  const k2 = candles.length >= period + 1 ? (() => {
    const s2 = candles.slice(-period - 1, -1);
    const h2 = Math.max(...s2.map((c) => c.high));
    const l2 = Math.min(...s2.map((c) => c.low));
    const c2 = candles[candles.length - 2].close;
    return h2 === l2 ? 50 : ((c2 - l2) / (h2 - l2)) * 100;
  })() : k;
  return { k, d: (k + k2) / 2 };
}

function calcMomentum(candles: OHLCVCandle[]): { signal: "BUY" | "SELL" | "NEUTRAL"; strength: number } {
  if (candles.length < 4) return { signal: "NEUTRAL", strength: 0 };
  const last3 = candles.slice(-3);
  let bullish = 0, bearish = 0;
  for (const c of last3) {
    if (c.close > c.open) bullish++;
    else if (c.close < c.open) bearish++;
  }
  if (bullish === 3) return { signal: "BUY", strength: 1 };
  if (bearish === 3) return { signal: "SELL", strength: 1 };
  if (bullish === 2) return { signal: "BUY", strength: 0.6 };
  if (bearish === 2) return { signal: "SELL", strength: 0.6 };
  return { signal: "NEUTRAL", strength: 0 };
}

function calcScalpLevels(candles: OHLCVCandle[], direction: "BUY" | "SELL"): {
  entryPrice: number; stopLoss: number; takeProfit: number;
} {
  const currentPrice = candles[candles.length - 1].close;
  const atr = calcATR(candles, 7);
  const isGold = currentPrice > 1000;
  const slDistance = isGold ? Math.min(Math.max(atr * 1.2, 1.5), 3.0) : atr * 1.5;
  const tpDistance = slDistance * 2;
  if (direction === "BUY") {
    return {
      entryPrice: currentPrice,
      stopLoss: Math.round((currentPrice - slDistance) * 100) / 100,
      takeProfit: Math.round((currentPrice + tpDistance) * 100) / 100,
    };
  }
  return {
    entryPrice: currentPrice,
    stopLoss: Math.round((currentPrice + slDistance) * 100) / 100,
    takeProfit: Math.round((currentPrice - tpDistance) * 100) / 100,
  };
}

export function analyzeSignal(candles: OHLCVCandle[]): {
  direction: "BUY" | "SELL" | "NEUTRAL";
  strength: number;
  indicators: IndicatorResult[];
  entryPrice: number | null;
  stopLoss: number | null;
  takeProfit: number | null;
} {
  if (candles.length < 20) {
    return { direction: "NEUTRAL", strength: 50, indicators: [], entryPrice: null, stopLoss: null, takeProfit: null };
  }

  const closes = candles.map((c) => c.close);
  const indicators: IndicatorResult[] = [];

  const rsi = calcRSI(closes, 7);
  const rsiSignal: "BUY" | "SELL" | "NEUTRAL" = rsi < 35 ? "BUY" : rsi > 65 ? "SELL" : "NEUTRAL";
  indicators.push({
    name: "RSI (7)",
    value: Math.round(rsi * 100) / 100,
    signal: rsiSignal,
    weight: 0.25,
    description: rsi < 35 ? "RSI oversold — momentum may reverse up"
      : rsi > 65 ? "RSI overbought — momentum may reverse down"
      : "RSI neutral — wait for extremes",
  });

  const macdData = calcMACD(closes);
  const prevMacd = calcMACD(closes.slice(0, -1));
  const macdCrossedUp = prevMacd.histogram <= 0 && macdData.histogram > 0;
  const macdCrossedDown = prevMacd.histogram >= 0 && macdData.histogram < 0;
  const macdSignal: "BUY" | "SELL" | "NEUTRAL" = macdCrossedUp ? "BUY"
    : macdCrossedDown ? "SELL"
    : macdData.histogram > 0 ? "BUY"
    : macdData.histogram < 0 ? "SELL" : "NEUTRAL";
  indicators.push({
    name: "MACD (5/13/4)",
    value: Math.round(macdData.histogram * 100000) / 100000,
    signal: macdSignal,
    weight: 0.30,
    description: macdCrossedUp ? "MACD crossed above signal — strong BUY"
      : macdCrossedDown ? "MACD crossed below signal — strong SELL"
      : macdSignal === "BUY" ? "MACD above signal — bullish"
      : macdSignal === "SELL" ? "MACD below signal — bearish"
      : "MACD at signal — wait for crossover",
  });

  const ema5 = calcEMA(closes, 5);
  const ema13 = calcEMA(closes, 13);
  const ema5Last = ema5[ema5.length - 1];
  const ema13Last = ema13[ema13.length - 1];
  const emaCrossSignal: "BUY" | "SELL" | "NEUTRAL" = ema5Last > ema13Last ? "BUY"
    : ema5Last < ema13Last ? "SELL" : "NEUTRAL";
  indicators.push({
    name: "EMA Cross (5/13)",
    value: Math.round(((ema5Last - ema13Last) / ema13Last) * 10000) / 100,
    signal: emaCrossSignal,
    weight: 0.20,
    description: emaCrossSignal === "BUY" ? "EMA5 above EMA13 — uptrend"
      : emaCrossSignal === "SELL" ? "EMA5 below EMA13 — downtrend"
      : "EMAs converging — no trend",
  });

  const bb = calcBollingerBands(closes, 10);
  const bbSignal: "BUY" | "SELL" | "NEUTRAL" = bb.percentB < 0.15 ? "BUY"
    : bb.percentB > 0.85 ? "SELL" : "NEUTRAL";
  indicators.push({
    name: "Bollinger Bands (10)",
    value: Math.round(bb.percentB * 100) / 100,
    signal: bbSignal,
    weight: 0.15,
    description: bbSignal === "BUY" ? "Price at lower band — bounce likely"
      : bbSignal === "SELL" ? "Price at upper band — reversal likely"
      : "Price within bands — no edge",
  });

  const momentum = calcMomentum(candles);
  indicators.push({
    name: "Candle Momentum",
    value: Math.round(momentum.strength * 100) / 100,
    signal: momentum.signal,
    weight: 0.10,
    description: momentum.signal === "BUY" ? "Last 3 candles bullish — buyers in control"
      : momentum.signal === "SELL" ? "Last 3 candles bearish — sellers in control"
      : "Mixed candles — no momentum",
  });

  let weightedBuy = 0, weightedSell = 0, totalWeight = 0;
  for (const ind of indicators) {
    if (ind.signal === "BUY") weightedBuy += ind.weight;
    else if (ind.signal === "SELL") weightedSell += ind.weight;
    totalWeight += ind.weight;
  }
  const buyScore = weightedBuy / totalWeight;
  const sellScore = weightedSell / totalWeight;

  let direction: "BUY" | "SELL" | "NEUTRAL";
  let rawStrength: number;
  if (buyScore >= 0.65 && buyScore > sellScore) { direction = "BUY"; rawStrength = 50 + buyScore * 50; }
  else if (sellScore >= 0.65 && sellScore > buyScore) { direction = "SELL"; rawStrength = 50 + sellScore * 50; }
  else if (buyScore > sellScore && buyScore >= 0.45) { direction = "BUY"; rawStrength = 40 + buyScore * 40; }
  else if (sellScore > buyScore && sellScore >= 0.45) { direction = "SELL"; rawStrength = 40 + sellScore * 40; }
  else { direction = "NEUTRAL"; rawStrength = 50; }
  const strength = Math.min(99, Math.round(rawStrength));

  let entryPrice = null, stopLoss = null, takeProfit = null;
  if (direction !== "NEUTRAL") {
    const levels = calcScalpLevels(candles, direction);
    entryPrice = levels.entryPrice;
    stopLoss = levels.stopLoss;
    takeProfit = levels.takeProfit;
  }

  return { direction, strength, indicators, entryPrice, stopLoss, takeProfit };
}