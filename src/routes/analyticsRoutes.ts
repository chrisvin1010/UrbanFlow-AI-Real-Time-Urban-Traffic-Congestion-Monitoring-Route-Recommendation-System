import { Router } from 'express';
import { AnalyticsController } from '../controllers/analyticsController';

const router = Router();

router.get('/overview', AnalyticsController.getOverview);
router.get('/peak-hours', AnalyticsController.getPeakHours);
router.get('/road-comparison', AnalyticsController.getRoadComparison);
router.get('/export', AnalyticsController.exportCsv);

export default router;
