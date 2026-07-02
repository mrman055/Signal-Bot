import { Router, type IRouter } from "express";
import healthRouter from "./health.js";
import signalsRouter from "./signals.js";
import pairsRouter from "./pairs.js";
import recommendationRouter from "./recommendation.js";
import monitorRouter from "./monitor.js";
<<<<<<< HEAD
import watchlistRouter from "./watchlist.js";
import analyticsRouter from "./analytics.js";
import alertsRouter from "./alerts.js";
=======
<<<<<<< HEAD
import watchlistRouter from "./watchlist.js";
import analyticsRouter from "./analytics.js";
import alertsRouter from "./alerts.js";
=======
>>>>>>> 27d569cd44bd6e7ad726fffd73ff4097f6683b52
>>>>>>> 794c4ee6bcd6a708c73d5d1539900ef9d01d1f5e

const router: IRouter = Router();

router.use(healthRouter);
router.use(recommendationRouter);
router.use(signalsRouter);
router.use(pairsRouter);
router.use(monitorRouter);
<<<<<<< HEAD
router.use(watchlistRouter);
router.use(analyticsRouter);
router.use(alertsRouter);
=======
<<<<<<< HEAD
router.use(watchlistRouter);
router.use(analyticsRouter);
router.use(alertsRouter);
=======
>>>>>>> 27d569cd44bd6e7ad726fffd73ff4097f6683b52
>>>>>>> 794c4ee6bcd6a708c73d5d1539900ef9d01d1f5e

export default router;
