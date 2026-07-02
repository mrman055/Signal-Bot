import { useState } from "react";
import { useListSignals } from "@workspace/api-client-react";
import { SignalCard } from "@/components/ui/signal-card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function Signals() {
  const [market, setMarket] = useState<"all" | "crypto" | "forex" | "commodity">("all");
  
  const { data: signals, isLoading } = useListSignals({
    market: market !== "all" ? market : undefined
  });

  return (
    <div className="space-y-8 pb-12">
      <div>
        <h1 className="text-3xl font-black tracking-tight mb-2">ALL SIGNALS</h1>
        <p className="text-muted-foreground">Scan the market for the best opportunities across all tracked assets.</p>
      </div>

<<<<<<< HEAD
      <Tabs defaultValue="all" onValueChange={(v) => setMarket(v as "all" | "crypto" | "forex" | "commodity")}>
=======
<<<<<<< HEAD
      <Tabs defaultValue="all" onValueChange={(v) => setMarket(v as "all" | "crypto" | "forex" | "commodity")}>
=======
      <Tabs defaultValue="all" onValueChange={(v) => setMarket(v as any)}>
>>>>>>> 27d569cd44bd6e7ad726fffd73ff4097f6683b52
>>>>>>> 794c4ee6bcd6a708c73d5d1539900ef9d01d1f5e
        <TabsList className="w-full justify-start rounded-none border-b border-border bg-transparent h-auto p-0 mb-8 space-x-6">
          <TabsTrigger value="all" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-0 py-3 font-bold uppercase tracking-widest text-muted-foreground data-[state=active]:text-foreground">
            ALL
          </TabsTrigger>
          <TabsTrigger value="crypto" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-0 py-3 font-bold uppercase tracking-widest text-muted-foreground data-[state=active]:text-foreground">
            CRYPTO
          </TabsTrigger>
          <TabsTrigger value="forex" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-0 py-3 font-bold uppercase tracking-widest text-muted-foreground data-[state=active]:text-foreground">
            FOREX
          </TabsTrigger>
          <TabsTrigger value="commodity" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-0 py-3 font-bold uppercase tracking-widest text-muted-foreground data-[state=active]:text-foreground">
            COMMODITIES
          </TabsTrigger>
        </TabsList>

<<<<<<< HEAD
=======
<<<<<<< HEAD
>>>>>>> 794c4ee6bcd6a708c73d5d1539900ef9d01d1f5e
        <TabsContent value={market} className="mt-0">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {isLoading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-36 bg-card animate-pulse border border-border" />
              ))
            ) : signals && signals.length > 0 ? (
              signals.map((signal) => (
                <SignalCard key={signal.symbol} signal={signal} />
              ))
            ) : (
              <div className="col-span-full py-12 text-center text-muted-foreground border border-dashed border-border">
                No signals available for this market
              </div>
            )}
          </div>
        </TabsContent>
<<<<<<< HEAD
=======
=======
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {isLoading ? (
            Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-36 bg-card animate-pulse border border-border" />
            ))
          ) : signals && signals.length > 0 ? (
            signals.map((signal) => (
              <SignalCard key={signal.symbol} signal={signal} />
            ))
          ) : (
            <div className="col-span-full py-24 text-center text-muted-foreground border border-border border-dashed">
              No signals found for this market.
            </div>
          )}
        </div>
>>>>>>> 27d569cd44bd6e7ad726fffd73ff4097f6683b52
>>>>>>> 794c4ee6bcd6a708c73d5d1539900ef9d01d1f5e
      </Tabs>
    </div>
  );
}
