import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import { Shell } from "@/components/layout/shell";

import Dashboard from "@/pages/dashboard";
import Signals from "@/pages/signals";
import SignalDetail from "@/pages/signal-detail";
import Watchlist from "@/pages/watchlist";
import Alerts from "@/pages/alerts";
import Watchlist from "@/pages/watchlist";
import Alerts from "@/pages/alerts";

const queryClient = new QueryClient();

function Router() {
  return (
    <Shell>
      <Switch>
        <Route path="/" component={Dashboard} />
        <Route path="/signals" component={Signals} />
        <Route path="/signals/:symbol" component={SignalDetail} />
        <Route path="/watchlist" component={Watchlist} />
        <Route path="/alerts" component={Alerts} />
        <Route path="/watchlist" component={Watchlist} />
        <Route path="/alerts" component={Alerts} />
        <Route component={NotFound} />
      </Switch>
    </Shell>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
