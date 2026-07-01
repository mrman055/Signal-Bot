import { Router } from "express";
import { db } from "@workspace/db";
import { alertsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { getAllSignals } from "../lib/signalEngine.js";

const router = Router();

router.get("/alerts", async (req, res) => {
  const items = await db.select().from(alertsTable).orderBy(alertsTable.createdAt);
  return res.json(
    items.map((a) => ({
      id: a.id,
      symbol: a.symbol,
      market: a.market,
      direction: a.direction,
      minConfidence: a.minConfidence,
      isActive: a.isActive,
      createdAt: a.createdAt.toISOString(),
    }))
  );
});

router.post("/alerts", async (req, res) => {
  const { symbol, market, direction, minConfidence } = req.body;
  if (!symbol || !market || !direction) {
    return res.status(400).json({ error: "symbol, market, and direction are required" });
  }
  const confidence = typeof minConfidence === "number" ? minConfidence : 70;
  const [item] = await db
    .insert(alertsTable)
    .values({ symbol, market, direction, minConfidence: confidence, isActive: true })
    .returning();
  return res.status(201).json({
    id: item.id,
    symbol: item.symbol,
    market: item.market,
    direction: item.direction,
    minConfidence: item.minConfidence,
    isActive: item.isActive,
    createdAt: item.createdAt.toISOString(),
  });
});

router.delete("/alerts/:id", async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) return res.status(400).json({ error: "Invalid id" });
  await db.delete(alertsTable).where(eq(alertsTable.id, id));
  return res.status(204).send();
});

router.patch("/alerts/:id", async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) return res.status(400).json({ error: "Invalid id" });
  const { isActive } = req.body;
  const [item] = await db
    .update(alertsTable)
    .set({ isActive: Boolean(isActive) })
    .where(eq(alertsTable.id, id))
    .returning();
  if (!item) return res.status(404).json({ error: "Alert not found" });
  return res.json({
    id: item.id,
    symbol: item.symbol,
    market: item.market,
    direction: item.direction,
    minConfidence: item.minConfidence,
    isActive: item.isActive,
    createdAt: item.createdAt.toISOString(),
  });
});

router.get("/alerts/triggered", async (req, res) => {
  const [alerts, signals] = await Promise.all([
    db.select().from(alertsTable).where(eq(alertsTable.isActive, true)),
    getAllSignals(),
  ]);

  const triggered = alerts
    .map((alert) => {
      const signal = signals.find((s) => s.symbol === alert.symbol);
      if (!signal) return null;
      const directionMatch =
        alert.direction === "BOTH"
          ? signal.direction !== "NEUTRAL"
          : signal.direction === alert.direction;
      if (!directionMatch || signal.strength < alert.minConfidence) return null;
      return {
        alertId: alert.id,
        symbol: alert.symbol,
        market: alert.market,
        direction: signal.direction,
        strength: signal.strength,
        price: signal.price,
        entryPrice: signal.entryPrice ?? null,
        stopLoss: signal.stopLoss ?? null,
        takeProfit: signal.takeProfit ?? null,
        minConfidence: alert.minConfidence,
      };
    })
    .filter(Boolean);

  return res.json(triggered);
});

export default router;
