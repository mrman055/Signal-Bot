<<<<<<< HEAD
import { useEffect, useState, useRef } from "react";
=======
<<<<<<< HEAD
import { useEffect, useState, useRef } from "react";
=======
>>>>>>> 27d569cd44bd6e7ad726fffd73ff4097f6683b52
>>>>>>> 794c4ee6bcd6a708c73d5d1539900ef9d01d1f5e
import { useRoute } from "wouter";
import { useGetSignalBySymbol, getGetSignalBySymbolQueryKey } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
<<<<<<< HEAD
=======
<<<<<<< HEAD
>>>>>>> 794c4ee6bcd6a708c73d5d1539900ef9d01d1f5e
import { ArrowLeft, ArrowUpRight, ArrowDownRight, Minus, AlertTriangle, Target, Activity, Radio, RefreshCw } from "lucide-react";
import { Link } from "wouter";
import { Skeleton } from "@/components/ui/skeleton";
import { CandlestickChart } from "@/components/ui/candlestick-chart";
import { useQueryClient } from "@tanstack/react-query";

const REFRESH_INTERVAL = 30;

function LiveBadge() {
  return (
    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-sm bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold uppercase tracking-widest">
      <span className="relative flex h-2 w-2">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
      </span>
      LIVE
    </span>
  );
}

function CountdownBar({ seconds, total }: { seconds: number; total: number }) {
  const pct = (seconds / total) * 100;
  return (
    <div className="flex items-center gap-2 text-xs text-muted-foreground font-mono">
      <RefreshCw className={`w-3 h-3 ${seconds <= 5 ? "animate-spin text-primary" : ""}`} />
      <span>Refreshes in {seconds}s</span>
      <div className="flex-1 h-0.5 bg-secondary rounded-full overflow-hidden min-w-[60px]">
        <div
          className="h-full bg-primary/60 transition-all duration-1000"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

export default function SignalDetail() {
  const [, params] = useRoute("/signals/:symbol");
  const symbolStr = params?.symbol ? params.symbol.replace(/_/g, '/') : "";
  const encodedSymbol = symbolStr ? encodeURIComponent(symbolStr) : "";

  const [countdown, setCountdown] = useState(REFRESH_INTERVAL);
  const [prevPrice, setPrevPrice] = useState<number | null>(null);
  const [priceFlash, setPriceFlash] = useState<"up" | "down" | null>(null);
  const queryClient = useQueryClient();

  const { data: signal, isLoading, dataUpdatedAt } = useGetSignalBySymbol(encodedSymbol, {
    query: {
      enabled: !!encodedSymbol,
      queryKey: getGetSignalBySymbolQueryKey(encodedSymbol),
      refetchInterval: REFRESH_INTERVAL * 1000,
    }
  });

  // Countdown timer
  useEffect(() => {
    setCountdown(REFRESH_INTERVAL);
    const tick = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) return REFRESH_INTERVAL;
        return c - 1;
      });
    }, 1000);
    return () => clearInterval(tick);
  }, [dataUpdatedAt]);

  // Price flash animation on change
  useEffect(() => {
    if (!signal?.price) return undefined;
    if (prevPrice !== null && signal.price !== prevPrice) {
      setPriceFlash(signal.price > prevPrice ? "up" : "down");
      const t = setTimeout(() => setPriceFlash(null), 800);
      setPrevPrice(signal.price);
      return () => clearTimeout(t);
    }
    setPrevPrice(signal.price);
    return undefined;
  }, [signal?.price]);

<<<<<<< HEAD
=======
=======
import { ArrowLeft, ArrowUpRight, ArrowDownRight, Minus, AlertTriangle, Target, Activity } from "lucide-react";
import { Link } from "wouter";
import { Skeleton } from "@/components/ui/skeleton";

export default function SignalDetail() {
  const [, params] = useRoute("/signals/:symbol");
  const symbolStr = params?.symbol ? decodeURIComponent(params.symbol) : "";

  const { data: signal, isLoading } = useGetSignalBySymbol(symbolStr, {
    query: {
      enabled: !!symbolStr,
      queryKey: getGetSignalBySymbolQueryKey(symbolStr),
      refetchInterval: 30000,
    }
  });

>>>>>>> 27d569cd44bd6e7ad726fffd73ff4097f6683b52
>>>>>>> 794c4ee6bcd6a708c73d5d1539900ef9d01d1f5e
  if (isLoading) {
    return (
      <div className="space-y-6 max-w-5xl mx-auto">
        <Skeleton className="h-10 w-48" />
<<<<<<< HEAD
        <Skeleton className="h-56 w-full" />
        <Skeleton className="h-96 w-full" />
=======
<<<<<<< HEAD
        <Skeleton className="h-56 w-full" />
        <Skeleton className="h-96 w-full" />
=======
        <Skeleton className="h-48 w-full" />
>>>>>>> 27d569cd44bd6e7ad726fffd73ff4097f6683b52
>>>>>>> 794c4ee6bcd6a708c73d5d1539900ef9d01d1f5e
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!signal) {
    return <div className="p-8 text-center text-muted-foreground">Signal not found</div>;
  }

  const isBuy = signal.direction === "BUY";
  const isSell = signal.direction === "SELL";

  const directionColorClass = isBuy
<<<<<<< HEAD
=======
<<<<<<< HEAD
>>>>>>> 794c4ee6bcd6a708c73d5d1539900ef9d01d1f5e
    ? "text-emerald-400 border-emerald-500/30 bg-emerald-500/10"
    : isSell
    ? "text-red-400 border-red-500/30 bg-red-500/10"
    : "text-muted-foreground border-border bg-secondary";

  const accentColor = isBuy ? "bg-emerald-500" : isSell ? "bg-red-500" : "bg-muted-foreground";

  const priceFlashClass =
    priceFlash === "up"
      ? "text-emerald-400 transition-colors duration-300"
      : priceFlash === "down"
      ? "text-red-400 transition-colors duration-300"
      : "text-foreground transition-colors duration-700";

  const lastUpdated = dataUpdatedAt ? new Date(dataUpdatedAt).toLocaleTimeString() : "—";

  return (
    <div className="space-y-5 max-w-5xl mx-auto pb-12">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/signals">
<<<<<<< HEAD
=======
=======
    ? "text-primary border-primary/20 bg-primary/10"
    : isSell
    ? "text-destructive border-destructive/20 bg-destructive/10"
    : "text-muted-foreground border-border bg-secondary";

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/">
>>>>>>> 27d569cd44bd6e7ad726fffd73ff4097f6683b52
>>>>>>> 794c4ee6bcd6a708c73d5d1539900ef9d01d1f5e
            <Button variant="outline" size="icon" className="h-8 w-8 rounded-full">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
<<<<<<< HEAD
=======
<<<<<<< HEAD
>>>>>>> 794c4ee6bcd6a708c73d5d1539900ef9d01d1f5e
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-black tracking-tight">{signal.symbol}</h1>
              <LiveBadge />
            </div>
            <p className="text-xs text-muted-foreground uppercase tracking-widest mt-0.5">
              {signal.market} • {signal.timeframe || "1H"} • Twelve Data
            </p>
          </div>
        </div>
        <CountdownBar seconds={countdown} total={REFRESH_INTERVAL} />
      </div>

      {/* Top stats bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Live Price</p>
            <p className={`text-2xl font-bold font-mono ${priceFlashClass}`}>
              {signal.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 5 })}
            </p>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">24h Change</p>
            <p className={`text-2xl font-bold font-mono ${signal.changePercent24h >= 0 ? "text-emerald-400" : "text-red-400"}`}>
              {signal.changePercent24h >= 0 ? "+" : ""}{signal.changePercent24h.toFixed(2)}%
            </p>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Signal</p>
            <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded border text-sm font-bold ${directionColorClass}`}>
              {isBuy && <ArrowUpRight className="w-4 h-4" />}
              {isSell && <ArrowDownRight className="w-4 h-4" />}
              {!isBuy && !isSell && <Minus className="w-4 h-4" />}
              {signal.direction}
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Confidence</p>
            <div className="flex items-end gap-2">
              <p className={`text-2xl font-bold font-mono ${signal.strength >= 75 ? "text-emerald-400" : signal.strength >= 60 ? "text-yellow-400" : "text-red-400"}`}>
                {signal.strength}%
              </p>
            </div>
            <div className="h-1 w-full bg-secondary rounded-full overflow-hidden mt-2">
              <div
                className={`h-full ${isBuy ? "bg-emerald-500" : isSell ? "bg-red-500" : "bg-muted-foreground"} transition-all`}
                style={{ width: `${signal.strength}%` }}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Candlestick Chart */}
      <Card className="bg-card border-border overflow-hidden">
        <CardHeader className="py-3 px-5 border-b border-border flex flex-row items-center justify-between">
          <CardTitle className="text-sm font-bold uppercase tracking-widest flex items-center gap-2">
            <Activity className="w-4 h-4 text-primary" />
            {signal.symbol} — 1H Chart (Last {signal.candles?.length ?? 0} Candles)
          </CardTitle>
          <div className="flex items-center gap-3 text-xs text-muted-foreground font-mono">
            <span className="flex items-center gap-1">
              <span className="w-2 h-0.5 bg-blue-400 inline-block" style={{ borderTop: "1px dashed" }} /> Entry
            </span>
            <span className="flex items-center gap-1 text-red-400">
              <span className="w-2 h-0.5 bg-red-400 inline-block" /> SL
            </span>
            <span className="flex items-center gap-1 text-emerald-400">
              <span className="w-2 h-0.5 bg-emerald-400 inline-block" /> TP
            </span>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {signal.candles && signal.candles.length > 0 ? (
            <CandlestickChart
              candles={signal.candles}
              isBuy={isBuy}
              isSell={isSell}
              entryPrice={signal.entryPrice ?? undefined}
              stopLoss={signal.stopLoss ?? undefined}
              takeProfit={signal.takeProfit ?? undefined}
            />
          ) : (
            <div className="h-64 flex items-center justify-center text-muted-foreground text-sm">
              No candle data available
            </div>
          )}
        </CardContent>
      </Card>

      {/* Trading Targets */}
      {(signal.entryPrice || signal.stopLoss || signal.takeProfit) && (
        <Card className="bg-card border-border">
          <CardHeader className="pb-3 border-b border-border py-3 px-5">
            <CardTitle className="text-sm font-bold uppercase tracking-widest flex items-center gap-2">
              <Target className="w-4 h-4 text-primary" />
<<<<<<< HEAD
=======
=======
            <h1 className="text-3xl font-bold tracking-tight">{signal.symbol}</h1>
            <p className="text-sm text-muted-foreground uppercase tracking-widest">
              {signal.market} • {signal.timeframe || "1H"}
            </p>
          </div>
        </div>
      </div>

      <Card className="border-2 overflow-hidden bg-card relative">
        <div className={`absolute top-0 left-0 w-2 h-full ${isBuy ? "bg-primary" : isSell ? "bg-destructive" : "bg-muted-foreground"}`} />
        <CardContent className="p-6 md:p-8 pl-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="flex flex-col justify-center space-y-4">
              <div>
                <p className="text-sm text-muted-foreground uppercase tracking-wider mb-2">Signal Direction</p>
                <div className={`inline-flex px-4 py-2 rounded border text-xl font-bold items-center gap-2 ${directionColorClass}`}>
                  {isBuy && <ArrowUpRight className="w-5 h-5" />}
                  {isSell && <ArrowDownRight className="w-5 h-5" />}
                  {!isBuy && !isSell && <Minus className="w-5 h-5" />}
                  {signal.direction}
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm font-mono mb-1">
                  <span className="text-muted-foreground">Confidence Level</span>
                  <span className={signal.strength >= 80 ? "text-primary" : ""}>{signal.strength}%</span>
                </div>
                <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                  <div
                    className={`h-full ${isBuy ? "bg-primary" : isSell ? "bg-destructive" : "bg-muted-foreground"}`}
                    style={{ width: `${signal.strength}%` }}
                  />
                </div>
              </div>
            </div>

            <div className="md:col-span-2 grid grid-cols-2 gap-4">
              <div className="bg-secondary p-4 rounded-lg border border-border flex flex-col justify-center">
                <span className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Current Price</span>
                <span className="text-2xl font-bold font-mono">
                  {signal.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 6 })}
                </span>
              </div>
              <div className="bg-secondary p-4 rounded-lg border border-border flex flex-col justify-center">
                <span className="text-xs text-muted-foreground uppercase tracking-wider mb-1">24h Change</span>
                <span className={`text-2xl font-bold font-mono ${signal.changePercent24h >= 0 ? "text-primary" : "text-destructive"}`}>
                  {signal.changePercent24h >= 0 ? "+" : ""}{signal.changePercent24h.toFixed(2)}%
                </span>
              </div>
              <div className="bg-secondary p-4 rounded-lg border border-border flex flex-col justify-center">
                <span className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Last Updated</span>
                <span className="text-sm font-mono">{new Date(signal.updatedAt).toLocaleTimeString()}</span>
              </div>
              <div className="bg-secondary p-4 rounded-lg border border-border flex flex-col justify-center">
                <span className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Timeframe</span>
                <span className="text-sm font-mono uppercase">{signal.timeframe || "1H"}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {(signal.entryPrice || signal.stopLoss || signal.takeProfit) && (
        <Card className="bg-card">
          <CardHeader className="pb-3 border-b border-border">
            <CardTitle className="text-lg flex items-center gap-2">
              <Target className="w-5 h-5 text-primary" />
>>>>>>> 27d569cd44bd6e7ad726fffd73ff4097f6683b52
>>>>>>> 794c4ee6bcd6a708c73d5d1539900ef9d01d1f5e
              Trading Targets
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-border">
<<<<<<< HEAD
=======
<<<<<<< HEAD
>>>>>>> 794c4ee6bcd6a708c73d5d1539900ef9d01d1f5e
              <div className="p-5 relative overflow-hidden">
                <div className="absolute left-0 top-0 h-full w-1 bg-blue-500/50" />
                <span className="text-xs text-muted-foreground uppercase tracking-wider block mb-1">Entry Target</span>
                <span className="text-xl font-bold font-mono">{signal.entryPrice?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 5 }) ?? "—"}</span>
              </div>
              <div className="p-5 relative overflow-hidden bg-red-500/5">
                <div className="absolute left-0 top-0 h-full w-1 bg-red-500" />
                <span className="text-xs text-red-400 uppercase tracking-wider flex items-center gap-1 mb-1">
                  <AlertTriangle className="w-3 h-3" /> Stop Loss
                </span>
                <span className="text-xl font-bold font-mono text-red-400">{signal.stopLoss?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 5 }) ?? "—"}</span>
                {signal.entryPrice && signal.stopLoss && (
                  <span className="text-xs text-muted-foreground mt-1 block font-mono">
                    Risk: {Math.abs(((signal.stopLoss - signal.entryPrice) / signal.entryPrice) * 100).toFixed(2)}%
                  </span>
                )}
              </div>
              <div className="p-5 relative overflow-hidden bg-emerald-500/5">
                <div className="absolute left-0 top-0 h-full w-1 bg-emerald-500" />
                <span className="text-xs text-emerald-400 uppercase tracking-wider flex items-center gap-1 mb-1">
                  <Target className="w-3 h-3" /> Take Profit
                </span>
                <span className="text-xl font-bold font-mono text-emerald-400">{signal.takeProfit?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 5 }) ?? "—"}</span>
                {signal.entryPrice && signal.takeProfit && signal.stopLoss && (
                  <span className="text-xs text-muted-foreground mt-1 block font-mono">
                    R:R {(Math.abs(signal.takeProfit - signal.entryPrice) / Math.abs(signal.stopLoss - signal.entryPrice)).toFixed(1)}:1
                  </span>
                )}
<<<<<<< HEAD
=======
=======
              <div className="p-6 flex justify-between items-center md:flex-col md:items-start md:justify-center">
                <span className="text-sm text-muted-foreground uppercase tracking-wider md:mb-2">Entry Target</span>
                <span className="text-xl font-bold font-mono">{signal.entryPrice ?? "-"}</span>
              </div>
              <div className="p-6 flex justify-between items-center md:flex-col md:items-start md:justify-center bg-destructive/5 relative overflow-hidden">
                <div className="absolute left-0 top-0 h-full w-1 bg-destructive/50" />
                <span className="text-sm text-destructive uppercase tracking-wider md:mb-2 flex items-center gap-1">
                  <AlertTriangle className="w-4 h-4" /> Stop Loss
                </span>
                <span className="text-xl font-bold font-mono text-destructive">{signal.stopLoss ?? "-"}</span>
              </div>
              <div className="p-6 flex justify-between items-center md:flex-col md:items-start md:justify-center bg-primary/5 relative overflow-hidden">
                <div className="absolute left-0 top-0 h-full w-1 bg-primary/50" />
                <span className="text-sm text-primary uppercase tracking-wider md:mb-2 flex items-center gap-1">
                  <Target className="w-4 h-4" /> Take Profit
                </span>
                <span className="text-xl font-bold font-mono text-primary">{signal.takeProfit ?? "-"}</span>
>>>>>>> 27d569cd44bd6e7ad726fffd73ff4097f6683b52
>>>>>>> 794c4ee6bcd6a708c73d5d1539900ef9d01d1f5e
              </div>
            </div>
          </CardContent>
        </Card>
      )}

<<<<<<< HEAD
=======
<<<<<<< HEAD
>>>>>>> 794c4ee6bcd6a708c73d5d1539900ef9d01d1f5e
      {/* Indicator Analysis */}
      <Card className="bg-card border-border">
        <CardHeader className="border-b border-border py-3 px-5">
          <CardTitle className="text-sm font-bold uppercase tracking-widest flex items-center gap-2">
            <Activity className="w-4 h-4 text-primary" />
            Indicator Breakdown
<<<<<<< HEAD
=======
=======
      <Card className="bg-card">
        <CardHeader className="border-b border-border">
          <CardTitle className="text-lg flex items-center gap-2">
            <Activity className="w-5 h-5 text-primary" />
            Indicator Analysis
>>>>>>> 27d569cd44bd6e7ad726fffd73ff4097f6683b52
>>>>>>> 794c4ee6bcd6a708c73d5d1539900ef9d01d1f5e
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-border">
<<<<<<< HEAD
=======
<<<<<<< HEAD
>>>>>>> 794c4ee6bcd6a708c73d5d1539900ef9d01d1f5e
            {signal.indicators.map((ind, i) => {
              const isUp = ind.signal === "BUY";
              const isDown = ind.signal === "SELL";
              return (
                <div key={i} className="p-4 flex items-center justify-between hover:bg-secondary/40 transition-colors">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${isUp ? "bg-emerald-400" : isDown ? "bg-red-400" : "bg-yellow-400"}`} />
                      <h4 className="font-bold text-sm">{ind.name}</h4>
                      <span className="text-xs text-muted-foreground font-mono">weight {Math.round((ind.weight ?? 0) * 100)}%</span>
                    </div>
                    {ind.description && (
                      <p className="text-xs text-muted-foreground mt-1 ml-3.5 leading-relaxed">{ind.description}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-4 text-right shrink-0 ml-4">
                    <div className="font-mono text-sm text-muted-foreground">{ind.value.toFixed(2)}</div>
                    <Badge variant="outline" className={`w-20 justify-center font-bold text-xs ${
                      isUp ? "text-emerald-400 border-emerald-500/30 bg-emerald-500/10" :
                      isDown ? "text-red-400 border-red-500/30 bg-red-500/10" :
                      "text-yellow-400 border-yellow-500/30 bg-yellow-500/10"
                    }`}>
                      {ind.signal}
                    </Badge>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Data source footer */}
      <div className="flex items-center justify-between text-xs text-muted-foreground pt-1">
        <span className="flex items-center gap-1.5">
          <Radio className="w-3 h-3 text-emerald-400" />
          Data: Twelve Data API · MT5-standard pairs
        </span>
        <span className="font-mono">Last fetch: {lastUpdated}</span>
      </div>
<<<<<<< HEAD
=======
=======
            {signal.indicators.map((ind, i) => (
              <div key={i} className="p-4 flex items-center justify-between hover:bg-secondary/50 transition-colors">
                <div className="flex-1">
                  <h4 className="font-bold">{ind.name}</h4>
                  {ind.description && <p className="text-xs text-muted-foreground mt-1">{ind.description}</p>}
                </div>
                <div className="flex items-center gap-4 text-right shrink-0">
                  <div className="font-mono text-sm">{ind.value.toFixed(2)}</div>
                  <Badge variant="outline" className={`w-20 justify-center font-bold ${
                    ind.signal === "BUY" ? "text-primary border-primary/20 bg-primary/10" :
                    ind.signal === "SELL" ? "text-destructive border-destructive/20 bg-destructive/10" :
                    "text-muted-foreground"
                  }`}>
                    {ind.signal}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
>>>>>>> 27d569cd44bd6e7ad726fffd73ff4097f6683b52
>>>>>>> 794c4ee6bcd6a708c73d5d1539900ef9d01d1f5e
    </div>
  );
}
