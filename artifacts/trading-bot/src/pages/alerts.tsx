import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  useGetAlerts,
  useGetTriggeredAlerts,
  useCreateAlert,
  useDeleteAlert,
  useToggleAlert,
  getGetAlertsQueryKey,
  getGetTriggeredAlertsQueryKey,
} from "@workspace/api-client-react";
import { TRACKED_PAIRS } from "@/lib/pairs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { Bell, BellRing, Trash2, Plus, TrendingUp, TrendingDown, Minus } from "lucide-react";

const DIRECTION_LABELS: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  BUY:  { label: "BUY",  color: "text-green-400",  icon: <TrendingUp className="h-3.5 w-3.5" /> },
  SELL: { label: "SELL", color: "text-red-400",    icon: <TrendingDown className="h-3.5 w-3.5" /> },
  BOTH: { label: "BUY or SELL", color: "text-yellow-400", icon: <Minus className="h-3.5 w-3.5" /> },
};

export default function Alerts() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [symbol, setSymbol] = useState("");
  const [direction, setDirection] = useState<"BUY" | "SELL" | "BOTH">("BUY");
  const [minConfidence, setMinConfidence] = useState(70);

  const { data: alerts, isLoading: loadingAlerts } = useGetAlerts({
    query: { refetchInterval: 30000, queryKey: getGetAlertsQueryKey() },
  });
  const { data: triggered, isLoading: loadingTriggered } = useGetTriggeredAlerts({
    query: { refetchInterval: 30000, queryKey: getGetTriggeredAlertsQueryKey() },
  });

  const createMutation = useCreateAlert({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetAlertsQueryKey() });
        toast({ title: "Alert created", description: `${symbol} ${direction} alert set at ${minConfidence}% confidence` });
        setSymbol("");
        setDirection("BUY");
        setMinConfidence(70);
      },
      onError: () => toast({ title: "Failed to create alert", variant: "destructive" }),
    },
  });

  const deleteMutation = useDeleteAlert({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetAlertsQueryKey() });
        toast({ title: "Alert removed" });
      },
    },
  });

  const toggleMutation = useToggleAlert({
    mutation: {
      onSuccess: () => queryClient.invalidateQueries({ queryKey: getGetAlertsQueryKey() }),
    },
  });

  const handleCreate = (): void => {
    if (!symbol) { toast({ title: "Select a symbol", variant: "destructive" }); return; }
    const pair = TRACKED_PAIRS.find((p) => p.symbol === symbol);
    if (!pair) return;
    createMutation.mutate({ data: { symbol, market: pair.market, direction, minConfidence } });
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div className="flex items-center gap-3">
        <Bell className="h-6 w-6 text-primary" />
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Price Alerts</h1>
          <p className="text-sm text-muted-foreground">Get notified when a signal fires above your confidence threshold</p>
        </div>
      </div>

      {/* Triggered Now */}
      {(triggered && triggered.length > 0) && (
        <Card className="border-primary/40 bg-primary/5">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold uppercase tracking-wider flex items-center gap-2 text-primary">
              <BellRing className="h-4 w-4 animate-pulse" />
              Firing Now — {triggered.length} active signal{triggered.length > 1 ? "s" : ""}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {triggered.map((t) => (
              <div key={t.alertId} className="flex items-center justify-between bg-card rounded-lg px-4 py-3 border border-border">
                <div className="flex items-center gap-3">
                  <Badge
                    className={`text-xs font-bold ${t.direction === "BUY" ? "bg-green-500/20 text-green-400 border-green-500/30" : "bg-red-500/20 text-red-400 border-red-500/30"}`}
                    variant="outline"
                  >
                    {t.direction}
                  </Badge>
                  <span className="font-semibold">{t.symbol}</span>
                  <span className="text-muted-foreground text-sm">@ {t.price?.toFixed(4)}</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <span className="text-primary font-bold">{t.strength}% confidence</span>
                  {t.stopLoss && <span className="text-red-400 text-xs">SL {t.stopLoss?.toFixed(4)}</span>}
                  {t.takeProfit && <span className="text-green-400 text-xs">TP {t.takeProfit?.toFixed(4)}</span>}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {loadingTriggered && (
        <Card>
          <CardContent className="pt-4"><Skeleton className="h-16 w-full" /></CardContent>
        </Card>
      )}

      {/* Create Alert */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold uppercase tracking-wider flex items-center gap-2">
            <Plus className="h-4 w-4" />
            New Alert
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs text-muted-foreground uppercase tracking-wider">Symbol</label>
              <Select value={symbol} onValueChange={setSymbol}>
                <SelectTrigger>
                  <SelectValue placeholder="Select pair..." />
                </SelectTrigger>
                <SelectContent>
                  {TRACKED_PAIRS.map((p) => (
                    <SelectItem key={p.symbol} value={p.symbol}>
                      {p.symbol} <span className="text-muted-foreground capitalize ml-1">({p.market})</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs text-muted-foreground uppercase tracking-wider">Direction</label>
              <Select value={direction} onValueChange={(v) => setDirection(v as "BUY" | "SELL" | "BOTH")}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="BUY">📈 BUY signal</SelectItem>
                  <SelectItem value="SELL">📉 SELL signal</SelectItem>
                  <SelectItem value="BOTH">↕️ BUY or SELL</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs text-muted-foreground uppercase tracking-wider">Min Confidence</label>
              <span className="text-sm font-bold text-primary">{minConfidence}%</span>
            </div>
            <Slider
              min={50}
              max={95}
              step={5}
              value={[minConfidence]}
              onValueChange={([v]) => setMinConfidence(v)}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>50% — more alerts</span>
              <span>95% — only strongest</span>
            </div>
          </div>

          <Button onClick={handleCreate} disabled={createMutation.isPending || !symbol} className="w-full">
            {createMutation.isPending ? "Creating..." : "Create Alert"}
          </Button>
        </CardContent>
      </Card>

      {/* Existing Alerts */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold uppercase tracking-wider">Your Alerts</CardTitle>
        </CardHeader>
        <CardContent>
          {loadingAlerts && (
            <div className="space-y-3">
              {[1, 2].map((i) => <Skeleton key={i} className="h-14 w-full" />)}
            </div>
          )}

          {!loadingAlerts && (!alerts || alerts.length === 0) && (
            <div className="text-center py-10 text-muted-foreground">
              <Bell className="h-8 w-8 mx-auto mb-3 opacity-30" />
              <p className="text-sm">No alerts configured yet</p>
              <p className="text-xs mt-1">Create one above to get notified when signals fire</p>
            </div>
          )}

          <div className="space-y-2">
            {alerts?.map((alert) => {
              const meta = DIRECTION_LABELS[alert.direction];
              return (
                <div
                  key={alert.id}
                  className={`flex items-center justify-between rounded-lg px-4 py-3 border transition-opacity ${alert.isActive ? "border-border bg-card" : "border-border/40 bg-card/40 opacity-60"}`}
                >
                  <div className="flex items-center gap-3">
                    <span className={`flex items-center gap-1 text-xs font-bold ${meta.color}`}>
                      {meta.icon}{meta.label}
                    </span>
                    <span className="font-semibold">{alert.symbol}</span>
                    <span className="text-muted-foreground text-xs">≥{alert.minConfidence}% confidence</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Switch
                      checked={alert.isActive}
                      onCheckedChange={(checked) =>
                        toggleMutation.mutate({ id: alert.id, data: { isActive: checked } })
                      }
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-muted-foreground hover:text-destructive h-8 w-8"
                      onClick={() => deleteMutation.mutate({ id: alert.id })}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
