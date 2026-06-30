export type ActiveMonitor = {
  symbol: string;
  direction: "BUY" | "SELL";
  entryPrice: number;
  startedAt: Date;
};

let active: ActiveMonitor | null = null;

export function getActiveMonitor(): ActiveMonitor | null {
  return active;
}

export function setActiveMonitor(monitor: ActiveMonitor): void {
  active = monitor;
}

export function clearActiveMonitor(): void {
  active = null;
}
