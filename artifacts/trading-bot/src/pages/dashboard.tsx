import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { 
  useGetRecommendation,
  useGetMonitor,
  getGetMonitorQueryKey,
  useStartMonitor,
  useStopMonitor,
  useListSignals,
  MonitorInputDirection
} from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowUpRight, ArrowDownRight, AlertTriangle, Target, Activity, ShieldAlert, Crosshair, ChevronRight } from "lucide-react";
import { SignalCard } from "@/components/ui/signal-card";
import { Link } from "wouter";
import { useToast } from "@/hooks/use-toast";

export default function Dashboard() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: recommendation, isLoading: loadingRec } = useGetRecommendation({
    query: { refetchInterval: 30000 }
  });

  const { data: monitor, isLoading: loadingMonitor } = useGetMonitor({
    query: { 
      refetchInterval: 15000,
      queryKey: getGetMonitorQueryKey() 
    }
  });

  const { data: signals, isLoading: loadingSignals } = useListSignals();

  const startMonitorMutation = useStartMonitor({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetMonitorQueryKey() });
        setShowMonitorForm(false);
        toast({ title: "Monitoring Started", description: "Your trade is now being tracked." });
      }
    }
  });

  const stopMonitorMutation = useStopMonitor({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetMonitorQueryKey() });
        toast({ title: "Monitoring Stopped", description: "Trade marked as closed." });
      }
    }
  });

  const [showMonitorForm, setShowMonitorForm] = useState(false);
  const [entryPrice, setEntryPrice] = useState("");

  const handleStartMonitor = (e: React.FormEvent) => {
    e.preventDefault();
    if (!recommendation || !entryPrice) return;
    
    startMonitorMutation.mutate({
      data: {
        symbol: recommendation.symbol,
        direction: recommendation.direction as MonitorInputDirection,
        entryPrice: parseFloat(entryPrice)
      }
    });
  };

  const handleStopMonitor = () => {
    stopMonitorMutation.mutate({});
  };

  const otherSignals = signals?.filter(s => s.symbol !== recommendation?.symbol).slice(0, 4) || [];

  return (
    <div className="space-y-12 pb-12">
      
      {/* 1. TOP RECOMMENDATION */}
      <section>
        <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-widest mb-4">Trade Now</h2>
        
        {loadingRec ? (
          <div className="h-96 bg-card animate-pulse border border-border flex items-center justify-center">
            <span className="text-muted-foreground font-mono">Analyzing Markets...</span>
          </div>
        ) : recommendation ? (
          <div className="border-4 border-border bg-card overflow-hidden">
            <div className={`p-8 md:p-12 ${recommendation.direction === 'BUY' ? 'bg-[hsl(var(--buy))/0.05]' : 'bg-[hsl(var(--sell))/0.05]'}`}>
              
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 mb-8">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-sm font-bold uppercase tracking-widest bg-foreground text-background px-2 py-0.5">
                      {recommendation.market}
                    </span>
                    <span className="text-sm font-bold uppercase tracking-widest text-muted-foreground border border-border px-2 py-0.5">
                      {recommendation.timeframe}
                    </span>
                  </div>
                  <h1 className="text-5xl md:text-7xl font-black tracking-tighter mb-4">
                    {recommendation.symbol}
                  </h1>
                  <div className="flex items-center gap-4">
                    <div className={`text-2xl md:text-3xl font-black uppercase tracking-tighter px-4 py-2 border-2
                      ${recommendation.direction === 'BUY' 
                        ? 'text-[hsl(var(--buy))] border-[hsl(var(--buy))]' 
                        : 'text-[hsl(var(--sell))] border-[hsl(var(--sell))]'}`}
                    >
                      {recommendation.direction}
                    </div>
                    <div className="font-mono text-3xl md:text-4xl tracking-tight">
                      {recommendation.price.toLocaleString(undefined, { maximumFractionDigits: 6 })}
                    </div>
                  </div>
                </div>
                
                <div className="md:text-right w-full md:w-48">
                  <div className="text-sm font-bold uppercase tracking-widest text-muted-foreground mb-2">Confidence</div>
                  <div className="text-4xl font-black mb-2">{recommendation.strength}%</div>
                  <div className="h-2 w-full bg-secondary overflow-hidden">
                    <div 
                      className={`h-full ${recommendation.direction === 'BUY' ? 'bg-[hsl(var(--buy))]' : 'bg-[hsl(var(--sell))]'}`}
                      style={{ width: `${recommendation.strength}%` }}
                    />
                  </div>
                </div>
              </div>

              <div className="mb-8">
                <p className="text-lg md:text-xl text-muted-foreground leading-relaxed max-w-2xl border-l-4 border-primary pl-4">
                  {recommendation.reasoning}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                <div className="bg-background border border-border p-4">
                  <div className="text-sm font-bold uppercase tracking-widest text-muted-foreground mb-1 flex items-center gap-2">
                    <Target className="w-4 h-4" /> Entry
                  </div>
                  <div className="font-mono text-xl">{recommendation.entryPrice || "-"}</div>
                </div>
                <div className="bg-[hsl(var(--sell))/0.05] border border-[hsl(var(--sell))/0.2] p-4">
                  <div className="text-sm font-bold uppercase tracking-widest text-[hsl(var(--sell))] mb-1 flex items-center gap-2">
                    <ShieldAlert className="w-4 h-4" /> Stop Loss
                  </div>
                  <div className="font-mono text-xl text-[hsl(var(--sell))]">{recommendation.stopLoss || "-"}</div>
                </div>
                <div className="bg-[hsl(var(--buy))/0.05] border border-[hsl(var(--buy))/0.2] p-4">
                  <div className="text-sm font-bold uppercase tracking-widest text-[hsl(var(--buy))] mb-1 flex items-center gap-2">
                    <Crosshair className="w-4 h-4" /> Take Profit
                  </div>
                  <div className="font-mono text-xl text-[hsl(var(--buy))]">{recommendation.takeProfit || "-"}</div>
                </div>
              </div>

              {!showMonitorForm ? (
                <Button 
                  size="lg" 
                  className={`w-full md:w-auto text-lg font-black uppercase tracking-widest h-16 px-8
                    ${recommendation.direction === 'BUY' 
                      ? 'bg-[hsl(var(--buy))] hover:bg-[hsl(var(--buy))/0.8] text-black' 
                      : 'bg-[hsl(var(--sell))] hover:bg-[hsl(var(--sell))/0.8] text-white'}`}
                  onClick={() => {
                    setEntryPrice(recommendation.price.toString());
                    setShowMonitorForm(true);
                  }}
                  disabled={monitor?.isActive}
                >
                  I'm Trading This
                </Button>
              ) : (
                <form onSubmit={handleStartMonitor} className="bg-background border border-border p-6 flex flex-col md:flex-row gap-4 items-end">
                  <div className="w-full md:w-64">
                    <label className="text-sm font-bold uppercase tracking-widest text-muted-foreground mb-2 block">My Entry Price</label>
                    <Input 
                      type="number" 
                      step="any" 
                      required 
                      value={entryPrice} 
                      onChange={e => setEntryPrice(e.target.value)}
                      className="h-12 font-mono text-lg rounded-none border-2 focus-visible:ring-0 focus-visible:border-primary"
                    />
                  </div>
                  <Button 
                    type="submit" 
                    size="lg"
                    className="h-12 rounded-none font-bold uppercase tracking-widest w-full md:w-auto"
                    disabled={startMonitorMutation.isPending}
                  >
                    Start Monitoring
                  </Button>
                  <Button 
                    type="button" 
                    variant="ghost" 
                    size="lg"
                    className="h-12 rounded-none font-bold uppercase tracking-widest w-full md:w-auto"
                    onClick={() => setShowMonitorForm(false)}
                  >
                    Cancel
                  </Button>
                </form>
              )}
            </div>
          </div>
        ) : (
          <div className="border border-border p-8 text-center text-muted-foreground">
            No active recommendation found.
          </div>
        )}
      </section>

      {/* 2. ACTIVE TRADE MONITOR */}
      {monitor?.isActive && (
        <section>
          <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-widest mb-4">Active Trade</h2>
          
          <div className={`border-4 p-6 md:p-8 relative overflow-hidden
            ${monitor.alertLevel === 'danger' 
              ? 'border-[hsl(var(--sell))] bg-[hsl(var(--sell))/0.1] animate-pulse-fast' 
              : monitor.alertLevel === 'warning'
                ? 'border-yellow-500 bg-yellow-500/10'
                : 'border-[hsl(var(--buy))] bg-[hsl(var(--buy))/0.05]'
            }`}
          >
            {monitor.alertLevel === 'danger' && (
              <div className="absolute top-0 left-0 w-full bg-[hsl(var(--sell))] text-white text-center font-black uppercase tracking-widest py-1 text-sm">
                Action Required
              </div>
            )}
            
            <div className={`flex flex-col md:flex-row justify-between items-start md:items-center gap-6 ${monitor.alertLevel === 'danger' ? 'mt-4' : ''}`}>
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-2xl font-black tracking-tight">{monitor.symbol}</span>
                  <span className={`px-2 py-0.5 text-xs font-bold uppercase tracking-widest border
                    ${monitor.direction === 'BUY' ? 'text-[hsl(var(--buy))] border-[hsl(var(--buy))/0.5]' : 'text-[hsl(var(--sell))] border-[hsl(var(--sell))/0.5]'}`}
                  >
                    {monitor.direction}
                  </span>
                </div>
                
                {monitor.alert ? (
                  <p className={`text-lg md:text-2xl font-black mt-2 max-w-xl
                    ${monitor.alertLevel === 'danger' ? 'text-[hsl(var(--sell))]' : 'text-yellow-500'}`}
                  >
                    {monitor.alert}
                  </p>
                ) : (
                  <p className="text-lg font-bold text-[hsl(var(--buy))] mt-2 flex items-center gap-2">
                    <Activity className="w-5 h-5" /> Your trade is on track
                  </p>
                )}
              </div>
              
              <div className="flex items-center gap-8 w-full md:w-auto p-4 bg-background/50 border border-border">
                <div>
                  <div className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1">P&L</div>
                  <div className={`font-mono text-2xl font-black
                    ${(monitor.pnlPercent || 0) >= 0 ? 'text-[hsl(var(--buy))]' : 'text-[hsl(var(--sell))]'}`}
                  >
                    {(monitor.pnlPercent || 0) >= 0 ? "+" : ""}{(monitor.pnlPercent || 0).toFixed(2)}%
                  </div>
                </div>
                <div>
                  <div className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1">Entry</div>
                  <div className="font-mono text-lg">{monitor.entryPrice?.toLocaleString()}</div>
                </div>
                <div>
                  <div className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1">Current</div>
                  <div className="font-mono text-lg">{monitor.currentPrice?.toLocaleString()}</div>
                </div>
              </div>
            </div>

            <div className="mt-8 flex justify-end">
              <Button 
                variant={monitor.alertLevel === 'danger' ? "destructive" : "outline"}
                size="lg"
                className="font-black uppercase tracking-widest rounded-none border-2"
                onClick={handleStopMonitor}
                disabled={stopMonitorMutation.isPending}
              >
                Mark as Closed
              </Button>
            </div>
          </div>
        </section>
      )}

      {/* 3. OTHER SIGNALS */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-widest">Other Opportunities</h2>
          <Link href="/signals" className="text-sm font-bold text-primary flex items-center gap-1 hover:underline">
            View All <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
        
        {loadingSignals ? (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => <div key={i} className="h-32 bg-card animate-pulse border border-border" />)}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {otherSignals.map(signal => (
              <SignalCard key={signal.symbol} signal={signal} />
            ))}
            {otherSignals.length === 0 && (
              <div className="col-span-full py-8 text-center text-muted-foreground border border-border border-dashed">
                No other signals available
              </div>
            )}
          </div>
        )}
      </section>

    </div>
  );
}
