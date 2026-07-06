import { useEffect, useState } from "react";
import { useRoute } from "wouter";
import { useGetSignalBySymbol, getGetSignalBySymbolQueryKey } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowUpRight, ArrowDownRight, Minus, RefreshCw, Target, Activity } from "lucide-react";
import { Link } from "wouter";
import { CandlestickChart } from "@/components/ui/candlestick-chart";
import { useQueryClient } from "@tanstack/react-query";

const REFRESH_INTERVAL = 30;

export default function SignalDetail() {
  const [, params] = useRoute("/signals/:symbol");
  const symbolStr = params?.symbol ? params.symbol.replace(/_/g, "/") : "";
  const [countdown, setCountdown] = useState(REFRESH_INTERVAL);
  const [prevPrice, setPrevPrice] = useState<number | null>(null);
  const [priceFlash, setPriceFlash] = useState<"up" | "down" | null>(null);
  const queryClient = useQueryClient();

  const { data: signal, isLoading, dataUpdatedAt } = useGetSignalBySymbol(symbolStr, {
    query: {
      enabled: !!symbolStr,
      queryKey: getGetSignalBySymbolQueryKey(symbolStr),
      refetchInterval: REFRESH_INTERVAL * 1000,
    }
  });

  useEffect(() => {
    setCountdown(REFRESH_INTERVAL);
    const tick = setInterval(() => {
      setCountdown((c) => (c <= 1 ? REFRESH_INTERVAL : c - 1));
    }, 1000);
    return () => clearInterval(tick);
  }, [dataUpdatedAt]);

  useEffect(() => {
    if (!signal?.price) return;
    if (prevPrice !== null && signal.price !== prevPrice) {
      setPriceFlash(signal.price > prevPrice ? "up" : "down");
      setTimeout(() => setPriceFlash(null), 800);
    }
    setPrevPrice(signal.price);
  }, [signal?.price]);

  if (isLoading) {
    return (
      <div className="space-y-6 pb-12">
        <div className="h-8 w-32 bg-card animate-pulse" />
        <div className="h-48 bg-card animate-pulse border border-border" />
        <div className="h-96 bg-card animate-pulse border border-border" />
      </div>
    );
  }

  if (!signal) {
    return (
      <div className="py-24 text-center">
        <p className="text-muted-foreground mb-4">Signal not found for {symbolStr}</p>
        <Link href="/signals">
          <Button variant="outline">Back to Signals</Button>
        </Link>
      </div>
    );
  }

  const isBuy = signal.direction === "BUY";
  const isSell = signal.direction === "SELL";

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/signals">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-black tracking-tight">{signal.symbol}</h1>
          <p className="text-muted-foreground uppercase tracking-widest text-xs">{signal.market} • {signal.timeframe}</p>
        </div>
        <div className="ml-auto flex items-center gap-3">
          {signal.isLive && (
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-sm bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold uppercase">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
              </span>
              LIVE
            </span>
          )}
          <div className="flex items-center gap-2 text-xs text-muted-foreground font-mono">
            <RefreshCw className={`w-3 h-3 ${countdown <= 5 ? "animate-spin text-primary" : ""}`} />
            <span>Refreshes in {countdown}s</span>
          </div>
        </div>
      </div>

      {/* Signal Summary */}
      <div className="border-4 border-border bg-card p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-6">
            <div className={`text-3xl font-black px-4 py-2 border-2 ${
              isBuy ? "text-green-400 border-green-400" :
              isSell ? "text-red-400 border-red-400" :
              "text-muted-foreground border-border"
            }`}>
              {isBuy && <ArrowUpRight className="inline w-6 h-6 mr-1" />}
              {isSell && <ArrowDownRight className="inline w-6 h-6 mr-1" />}
              {!isBuy && !isSell && <Minus className="inline w-6 h-6 mr-1" />}
              {signal.direction}
            </div>
            <div>
              <div className={`font-mono text-4xl font-black transition-colors ${
                priceFlash === "up" ? "text-green-400" :
                priceFlash === "down" ? "text-red-400" : ""
              }`}>
                {signal.price.toLocaleString(undefined, { maximumFractionDigits: 6 })}
              </div>
              <div className={`text-sm font-mono ${signal.changePercent24h >= 0 ? "text-green-400" : "text-red-400"}`}>
                {signal.changePercent24h >= 0 ? "+" : ""}{signal.changePercent24h.toFixed(2)}% 24h
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm text-muted-foreground uppercase tracking-widest mb-1">Confidence</div>
            <div className="text-4xl font-black">{signal.strength}%</div>
            <div className="h-2 w-32 bg-secondary mt-2 ml-auto">
              <div className={`h-full ${isBuy ? "bg-green-400" : isSell ? "bg-red-400" : "bg-muted-foreground"}`}
                style={{ width: `${signal.strength}%` }} />
            </div>
          </div>
        </div>
      </div>

      {/* Entry / SL / TP */}
      {signal.entryPrice && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-card border border-border p-4">
            <div className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1 flex items-center gap-2">
              <Target className="w-4 h-4" /> Entry
            </div>
            <div className="font-mono text-xl">{signal.entryPrice.toLocaleString(undefined, { maximumFractionDigits: 6 })}</div>
          </div>
          <div className="bg-red-950/20 border border-red-500/20 p-4">
            <div className="text-xs font-bold uppercase tracking-widest text-red-400 mb-1">Stop Loss</div>
            <div className="font-mono text-xl text-red-400">{signal.stopLoss?.toLocaleString(undefined, { maximumFractionDigits: 6 }) ?? "-"}</div>
          </div>
          <div className="bg-green-950/20 border border-green-500/20 p-4">
            <div className="text-xs font-bold uppercase tracking-widest text-green-400 mb-1">Take Profit</div>
            <div className="font-mono text-xl text-green-400">{signal.takeProfit?.toLocaleString(undefined, { maximumFractionDigits: 6 }) ?? "-"}</div>
          </div>
        </div>
      )}

      {/* Chart */}
      {signal.candles && signal.candles.length > 0 && (
        <div className="border border-border bg-card p-4">
          <h2 className="text-sm font-bold uppercase tracking-widest text-muted-foreground mb-4">Price Chart (1M)</h2>
          <CandlestickChart candles={signal.candles} />
        </div>
      )}

      {/* Indicators */}
      {signal.indicators && signal.indicators.length > 0 && (
        <div className="border border-border bg-card p-6">
          <h2 className="text-sm font-bold uppercase tracking-widest text-muted-foreground mb-4 flex items-center gap-2">
            <Activity className="w-4 h-4" /> Technical Indicators
          </h2>
          <div className="space-y-3">
            {signal.indicators.map((ind) => (
              <div key={ind.name} className="flex items-center justify-between border-b border-border pb-3">
                <div>
                  <div className="font-bold text-sm">{ind.name}</div>
                  <div className="text-xs text-muted-foreground">{ind.description}</div>
                </div>
                <div className="text-right">
                  <div className={`font-mono font-bold ${
                    ind.signal === "BUY" ? "text-green-400" :
                    ind.signal === "SELL" ? "text-red-400" :
                    "text-muted-foreground"
                  }`}>{ind.signal}</div>
                  <div className="text-xs text-muted-foreground font-mono">{ind.value.toFixed(2)}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
