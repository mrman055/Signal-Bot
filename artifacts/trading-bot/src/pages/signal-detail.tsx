import { useRoute } from "wouter";
import { useGetSignalBySymbol, getGetSignalBySymbolQueryKey } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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

  if (isLoading) {
    return (
      <div className="space-y-6 max-w-5xl mx-auto">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-48 w-full" />
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
    ? "text-primary border-primary/20 bg-primary/10"
    : isSell
    ? "text-destructive border-destructive/20 bg-destructive/10"
    : "text-muted-foreground border-border bg-secondary";

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/signals">
            <Button variant="outline" size="icon" className="h-8 w-8 rounded-full">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
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
              Trading Targets
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-border">
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
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="bg-card">
        <CardHeader className="border-b border-border">
          <CardTitle className="text-lg flex items-center gap-2">
            <Activity className="w-5 h-5 text-primary" />
            Indicator Analysis
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-border">
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
    </div>
  );
}
