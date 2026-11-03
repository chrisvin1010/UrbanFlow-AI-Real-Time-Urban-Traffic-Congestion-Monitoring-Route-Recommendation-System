import { Router } from 'express';
import { DashboardController } from '../controllers/dashboardController';

const router = Router();

router.get('/summary', DashboardController.getSummary);
router.get('/congestion-distribution', DashboardController.getCongestionDistribution);
router.get('/traffic-trends', DashboardController.getTrafficTrends);
router.get('/top-congested-roads', DashboardController.getTopCongestedRoads);
router.get('/recent-events', DashboardController.getRecentEvents);

export default router;
