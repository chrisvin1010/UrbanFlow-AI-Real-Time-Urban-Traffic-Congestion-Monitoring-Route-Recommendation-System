import { Router } from 'express';
import { TrafficController } from '../controllers/trafficController';

const router = Router();

router.get('/current', TrafficController.getCurrent);
router.get('/history', TrafficController.getHistory);
router.get('/heatmap', TrafficController.getHeatmap);
router.post('/simulate', TrafficController.triggerSimulation);

export default router;
