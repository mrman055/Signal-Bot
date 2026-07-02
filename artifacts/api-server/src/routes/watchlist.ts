import { Router } from "express";
import { db } from "@workspace/db";
import { watchlistTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const router = Router();

router.get("/watchlist", async (req, res) => {
  const items = await db.select().from(watchlistTable).orderBy(watchlistTable.addedAt);
  return res.json(
    items.map((item) => ({
      id: item.id,
      symbol: item.symbol,
      market: item.market,
      addedAt: item.addedAt.toISOString(),
      notes: item.notes ?? null,
    }))
  );
});

router.post("/watchlist", async (req, res) => {
  const { symbol, market, notes } = req.body;
  if (!symbol || !market) {
    return res.status(400).json({ error: "symbol and market are required" });
  }
  const [item] = await db
    .insert(watchlistTable)
    .values({ symbol, market, notes: notes ?? null })
    .returning();
  return res.status(201).json({
    id: item.id,
    symbol: item.symbol,
    market: item.market,
    addedAt: item.addedAt.toISOString(),
    notes: item.notes ?? null,
  });
});

router.delete("/watchlist/:id", async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) {
    return res.status(400).json({ error: "Invalid id" });
  }
  await db.delete(watchlistTable).where(eq(watchlistTable.id, id));
  return res.status(204).send();
});

export default router;
