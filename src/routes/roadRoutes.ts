import { Router } from 'express';
import { RoadController } from '../controllers/roadController';
import { authenticate } from '../middleware/authMiddleware';
import { requireRole } from '../middleware/roleMiddleware';
import { validate } from '../middleware/validationMiddleware';
import { createRoadSchema, updateRoadSchema } from '../validators/roadValidator';

const router = Router();

router.get('/', RoadController.getRoads);
router.get('/:id', RoadController.getRoadById);
router.post('/', authenticate, requireRole('admin'), validate(createRoadSchema), RoadController.createRoad);
router.patch('/:id', authenticate, requireRole('admin'), validate(updateRoadSchema), RoadController.updateRoad);
router.delete('/:id', authenticate, requireRole('admin'), RoadController.deleteRoad);

export default router;
