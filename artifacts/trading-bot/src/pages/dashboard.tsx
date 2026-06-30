import { useState } from "react";
import { 
  useGetAnalyticsSummary, 
  useListTopSignals, 
  useGetMarketOverview, 
  useListSignals,
  SignalDirection
} from "@workspace/api-client-react";
import { SignalCard } from "@/components/ui/signal-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Activity, ArrowDownRight, ArrowUpRight, BarChart3, Clock, Minus, Target } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

export default function Dashboard() {
  const [selectedMarket, setSelectedMarket] = useState<string>("all");
  const [selectedDirection, setSelectedDirection] = useState<string>("ALL");

  const { data: summary, isLoading: loadingSummary } = useGetAnalyticsSummary();
  const { data: topSignals, isLoading: loadingTop } = useListTopSignals({ limit: 4 });
  const { data: marketOverview, isLoading: loadingOverview } = useGetMarketOverview();
  
  const { data: signals, isLoading: loadingSignals } = useListSignals({
    market: selectedMarket !== "all" ? selectedMarket as any : undefined,
    direction: selectedDirection !== "ALL" ? selectedDirection as SignalDirection : undefined,
  });

  return (
    <div className="space-y-6">
      {/* Analytics Summary */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-card">
          <CardContent className="p-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Total Pairs</span>
              <Activity className="h-4 w-4 text-primary" />
            </div>
            {loadingSummary ? (
              <div className="h-8 w-16 bg-secondary animate-pulse rounded" />
            ) : (
              <div className="text-2xl font-bold font-mono">{summary?.totalPairs || 0}</div>
            )}
          </CardContent>
        </Card>
        
        <Card className="bg-card">
          <CardContent className="p-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Buy Signals</span>
              <ArrowUpRight className="h-4 w-4 text-primary" />
            </div>
            {loadingSummary ? (
              <div className="h-8 w-16 bg-secondary animate-pulse rounded" />
            ) : (
              <div className="text-2xl font-bold font-mono text-primary">{summary?.buySignals || 0}</div>
            )}
          </CardContent>
        </Card>

        <Card className="bg-card">
          <CardContent className="p-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Sell Signals</span>
              <ArrowDownRight className="h-4 w-4 text-destructive" />
            </div>
            {loadingSummary ? (
              <div className="h-8 w-16 bg-secondary animate-pulse rounded" />
            ) : (
              <div className="text-2xl font-bold font-mono text-destructive">{summary?.sellSignals || 0}</div>
            )}
          </CardContent>
        </Card>

        <Card className="bg-card border-primary/20">
          <CardContent className="p-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-primary uppercase tracking-wider">High Conviction</span>
              <Target className="h-4 w-4 text-primary" />
            </div>
            {loadingSummary ? (
              <div className="h-8 w-16 bg-secondary animate-pulse rounded" />
            ) : (
              <div className="text-2xl font-bold font-mono text-primary">{summary?.highConfidenceCount || 0}</div>
            )}
          </CardContent>
        </Card>
      </section>

      {/* Top Signals */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <BarChart3 className="h-5 w-5 text-primary" />
          <h2 className="text-xl font-bold tracking-tight">High Confidence Signals</h2>
        </div>
        
        {loadingTop ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => <div key={i} className="h-32 bg-card animate-pulse rounded-lg border border-border" />)}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {topSignals?.map((signal) => (
              <SignalCard key={signal.symbol} signal={signal} />
            ))}
            {(!topSignals || topSignals.length === 0) && (
              <div className="col-span-full py-8 text-center text-muted-foreground border border-dashed rounded-lg">
                No high confidence signals at the moment
              </div>
            )}
          </div>
        )}
      </section>

      {/* Market Overview */}
      <section>
        <Card className="bg-card">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg flex items-center justify-between">
              <span>Market Overview</span>
              {summary?.lastUpdated && (
                <span className="text-xs font-normal text-muted-foreground flex items-center gap-1 font-mono">
                  <Clock className="h-3 w-3" />
                  Updated {formatDistanceToNow(new Date(summary.lastUpdated))} ago
                </span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loadingOverview ? (
              <div className="h-40 bg-secondary/50 animate-pulse rounded" />
            ) : (
              <Tabs defaultValue="crypto">
                <TabsList className="mb-4">
                  <TabsTrigger value="crypto" className="uppercase tracking-widest text-xs">Crypto</TabsTrigger>
                  <TabsTrigger value="forex" className="uppercase tracking-widest text-xs">Forex</TabsTrigger>
                  <TabsTrigger value="commodity" className="uppercase tracking-widest text-xs">Commodities</TabsTrigger>
                </TabsList>
                
                {["crypto", "forex", "commodity"].map((marketKey) => {
                  const data = marketOverview?.[marketKey as keyof typeof marketOverview];
                  return (
                    <TabsContent key={marketKey} value={marketKey}>
                      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                        <div className="p-4 bg-secondary rounded-lg border border-border">
                          <p className="text-xs text-muted-foreground mb-1 uppercase tracking-wider">Total Pairs</p>
                          <p className="text-xl font-mono">{data?.total || 0}</p>
                        </div>
                        <div className="p-4 bg-secondary rounded-lg border border-border">
                          <p className="text-xs text-muted-foreground mb-1 uppercase tracking-wider">Avg Strength</p>
                          <p className="text-xl font-mono">{data?.avgStrength || 0}%</p>
                        </div>
                        <div className="p-4 bg-primary/10 rounded-lg border border-primary/20 text-primary">
                          <p className="text-xs mb-1 uppercase tracking-wider">Buy Signals</p>
                          <p className="text-xl font-mono">{data?.buy || 0}</p>
                        </div>
                        <div className="p-4 bg-destructive/10 rounded-lg border border-destructive/20 text-destructive">
                          <p className="text-xs mb-1 uppercase tracking-wider">Sell Signals</p>
                          <p className="text-xl font-mono">{data?.sell || 0}</p>
                        </div>
                        <div className="p-4 bg-secondary rounded-lg border border-border col-span-2 md:col-span-1">
                          <p className="text-xs text-muted-foreground mb-1 uppercase tracking-wider">Top Signal</p>
                          <p className="text-xl font-mono truncate">{data?.topSignal || "-"}</p>
                        </div>
                      </div>
                    </TabsContent>
                  );
                })}
              </Tabs>
            )}
          </CardContent>
        </Card>
      </section>

      {/* All Signals */}
      <section>
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
          <h2 className="text-xl font-bold tracking-tight">Signal Screener</h2>
          
          <div className="flex gap-2 w-full md:w-auto">
            <Select value={selectedMarket} onValueChange={setSelectedMarket}>
              <SelectTrigger className="w-full md:w-32 uppercase tracking-widest text-xs font-bold">
                <SelectValue placeholder="Market" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">ALL</SelectItem>
                <SelectItem value="crypto">CRYPTO</SelectItem>
                <SelectItem value="forex">FOREX</SelectItem>
                <SelectItem value="commodity">COMMODITY</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={selectedDirection} onValueChange={setSelectedDirection}>
              <SelectTrigger className="w-full md:w-32 uppercase tracking-widest text-xs font-bold">
                <SelectValue placeholder="Direction" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">ALL</SelectItem>
                <SelectItem value="BUY">BUY</SelectItem>
                <SelectItem value="SELL">SELL</SelectItem>
                <SelectItem value="NEUTRAL">NEUTRAL</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {loadingSignals ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4, 5, 6, 7, 8].map(i => <div key={i} className="h-32 bg-card animate-pulse rounded-lg border border-border" />)}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {signals?.map((signal) => (
              <SignalCard key={signal.symbol} signal={signal} />
            ))}
            {(!signals || signals.length === 0) && (
              <div className="col-span-full py-12 text-center text-muted-foreground border border-dashed rounded-lg bg-card">
                No signals match your criteria
              </div>
            )}
          </div>
        )}
      </section>
    </div>
  );
}
