<<<<<<< HEAD
=======
<<<<<<< HEAD
=======
import { Badge } from "@/components/ui/badge";
>>>>>>> 27d569cd44bd6e7ad726fffd73ff4097f6683b52
>>>>>>> 794c4ee6bcd6a708c73d5d1539900ef9d01d1f5e
import { Card, CardContent } from "@/components/ui/card";
import { Signal, SignalDirection } from "@workspace/api-client-react";
import { ArrowUpRight, ArrowDownRight, Minus } from "lucide-react";
import { Link } from "wouter";

interface SignalCardProps {
  signal: Signal;
}

export function SignalCard({ signal }: SignalCardProps) {
  const isBuy = signal.direction === SignalDirection.BUY;
  const isSell = signal.direction === SignalDirection.SELL;
  const isNeutral = signal.direction === SignalDirection.NEUTRAL;

  const getDirectionColor = () => {
    if (isBuy) return "text-primary border-primary/20 bg-primary/10";
    if (isSell) return "text-destructive border-destructive/20 bg-destructive/10";
    return "text-muted-foreground border-border bg-secondary";
  };

  const getStrengthBarColor = () => {
    if (isBuy) return "bg-primary";
    if (isSell) return "bg-destructive";
    return "bg-muted-foreground";
  };

  return (
<<<<<<< HEAD
    <Link href={`/signals/${signal.symbol.replace(/\//g, '_')}`}>
=======
<<<<<<< HEAD
    <Link href={`/signals/${signal.symbol.replace(/\//g, '_')}`}>
=======
    <Link href={`/signals/${encodeURIComponent(signal.symbol)}`}>
>>>>>>> 27d569cd44bd6e7ad726fffd73ff4097f6683b52
>>>>>>> 794c4ee6bcd6a708c73d5d1539900ef9d01d1f5e
      <Card className="hover:border-primary/50 transition-colors cursor-pointer group bg-card overflow-hidden">
        <CardContent className="p-4">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h3 className="font-bold text-lg">{signal.symbol}</h3>
              <p className="text-xs text-muted-foreground uppercase tracking-widest">{signal.market} • {signal.timeframe || "1H"}</p>
            </div>
            <div className={`px-2 py-1 rounded-sm border text-xs font-bold flex items-center gap-1 ${getDirectionColor()}`}>
              {isBuy && <ArrowUpRight className="w-3 h-3" />}
              {isSell && <ArrowDownRight className="w-3 h-3" />}
              {isNeutral && <Minus className="w-3 h-3" />}
              {signal.direction}
            </div>
          </div>

          <div className="flex justify-between items-end mb-4 font-mono">
            <div>
              <p className="text-xs text-muted-foreground mb-1">Price</p>
              <p className="text-lg">{signal.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 6 })}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-muted-foreground mb-1">24h Change</p>
              <p className={`text-sm ${signal.changePercent24h >= 0 ? "text-primary" : "text-destructive"}`}>
                {signal.changePercent24h >= 0 ? "+" : ""}{signal.changePercent24h.toFixed(2)}%
              </p>
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex justify-between text-xs font-mono">
              <span className="text-muted-foreground">Confidence</span>
              <span className={signal.strength >= 80 ? "text-primary" : ""}>{signal.strength}%</span>
            </div>
            <div className="h-1.5 w-full bg-secondary rounded-full overflow-hidden">
              <div 
                className={`h-full ${getStrengthBarColor()} transition-all`} 
                style={{ width: `${signal.strength}%` }} 
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
