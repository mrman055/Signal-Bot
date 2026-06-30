import { Router, type IRouter } from "express";
import healthRouter from "./health.js";
import signalsRouter from "./signals.js";
import pairsRouter from "./pairs.js";
import recommendationRouter from "./recommendation.js";
import monitorRouter from "./monitor.js";
import watchlistRouter from "./watchlist.js";
import analyticsRouter from "./analytics.js";

const router: IRouter = Router();

router.use(healthRouter);
router.use(recommendationRouter);
router.use(signalsRouter);
router.use(pairsRouter);
router.use(monitorRouter);
router.use(watchlistRouter);
router.use(analyticsRouter);

export default router;
