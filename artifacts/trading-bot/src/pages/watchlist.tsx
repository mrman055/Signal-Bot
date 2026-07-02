import { useState } from "react";
import { 
  useGetWatchlist, 
  useGetPairs,
  useAddToWatchlist,
  useRemoveFromWatchlist,
  WatchlistInputMarket,
<<<<<<< HEAD
=======
<<<<<<< HEAD
>>>>>>> 794c4ee6bcd6a708c73d5d1539900ef9d01d1f5e
  getGetWatchlistQueryKey
} from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
<<<<<<< HEAD
=======
=======
  WatchlistInput
} from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
>>>>>>> 27d569cd44bd6e7ad726fffd73ff4097f6683b52
>>>>>>> 794c4ee6bcd6a708c73d5d1539900ef9d01d1f5e
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Trash2, Star, Plus } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
<<<<<<< HEAD
=======
<<<<<<< HEAD
=======
import { getGetWatchlistQueryKey } from "@workspace/api-client-react";
>>>>>>> 27d569cd44bd6e7ad726fffd73ff4097f6683b52
>>>>>>> 794c4ee6bcd6a708c73d5d1539900ef9d01d1f5e
import { useToast } from "@/hooks/use-toast";

export default function Watchlist() {
  const { data: watchlist, isLoading: loadingWatchlist } = useGetWatchlist();
  const { data: pairs, isLoading: loadingPairs } = useGetPairs();
  
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  const [selectedPair, setSelectedPair] = useState<string>("");
  
  const addMutation = useAddToWatchlist({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetWatchlistQueryKey() });
        toast({ title: "Added to Watchlist" });
        setSelectedPair("");
      }
    }
  });
  
  const removeMutation = useRemoveFromWatchlist({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetWatchlistQueryKey() });
        toast({ title: "Removed from Watchlist" });
      }
    }
  });

  const handleAdd = () => {
    if (!selectedPair) return;
    const pairObj = pairs?.find(p => p.symbol === selectedPair);
    if (!pairObj) return;
    
    addMutation.mutate({
      data: {
        symbol: pairObj.symbol,
        market: pairObj.market as WatchlistInputMarket
      }
    });
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-2 mb-8">
        <Star className="h-6 w-6 text-primary fill-primary/20" />
        <h1 className="text-2xl font-bold tracking-tight">Watchlist</h1>
      </div>

      <Card className="bg-card">
        <CardHeader className="border-b border-border bg-secondary/50">
          <CardTitle className="text-base uppercase tracking-widest text-muted-foreground flex items-center justify-between">
            <span>Add Symbol</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="flex gap-4 items-end">
            <div className="flex-1">
              <label className="text-xs uppercase tracking-widest text-muted-foreground mb-2 block font-bold">Select Trading Pair</label>
              <Select value={selectedPair} onValueChange={setSelectedPair} disabled={loadingPairs}>
                <SelectTrigger className="font-mono">
                  <SelectValue placeholder="Search symbol..." />
                </SelectTrigger>
                <SelectContent>
                  {pairs?.map(pair => (
                    <SelectItem key={pair.symbol} value={pair.symbol}>
                      {pair.symbol} <span className="text-muted-foreground text-xs ml-2">({pair.market})</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button 
              onClick={handleAdd} 
              disabled={!selectedPair || addMutation.isPending}
              className="uppercase tracking-widest text-xs font-bold"
            >
              <Plus className="h-4 w-4 mr-2" /> Add
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-card">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-border hover:bg-transparent">
                <TableHead className="uppercase tracking-widest text-xs">Symbol</TableHead>
                <TableHead className="uppercase tracking-widest text-xs">Market</TableHead>
                <TableHead className="uppercase tracking-widest text-xs">Added</TableHead>
                <TableHead className="uppercase tracking-widest text-xs text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loadingWatchlist ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8">Loading...</TableCell>
                </TableRow>
              ) : watchlist?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-12 text-muted-foreground border-dashed border-border border-b-0">
                    Your watchlist is empty. Add a symbol above.
                  </TableCell>
                </TableRow>
              ) : (
                watchlist?.map((item) => (
                  <TableRow key={item.id} className="border-border hover:bg-secondary/50">
                    <TableCell className="font-bold font-mono">{item.symbol}</TableCell>
                    <TableCell className="uppercase text-xs tracking-widest text-muted-foreground">{item.market}</TableCell>
                    <TableCell className="text-sm font-mono text-muted-foreground">{new Date(item.addedAt).toLocaleDateString()}</TableCell>
                    <TableCell className="text-right">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                        onClick={() => removeMutation.mutate({ id: item.id })}
                        disabled={removeMutation.isPending}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  );
}
