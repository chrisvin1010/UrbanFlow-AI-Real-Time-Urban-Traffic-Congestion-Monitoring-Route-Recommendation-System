import { Router } from 'express';
import { IncidentController } from '../controllers/incidentController';
import { authenticate } from '../middleware/authMiddleware';
import { requireRole } from '../middleware/roleMiddleware';
import { validate } from '../middleware/validationMiddleware';
import { createIncidentSchema, updateIncidentSchema } from '../validators/incidentValidator';

const router = Router();

router.get('/', IncidentController.getIncidents);
router.get('/:id', IncidentController.getIncidentById);
router.post('/', authenticate, validate(createIncidentSchema), IncidentController.createIncident);
router.patch('/:id', authenticate, validate(updateIncidentSchema), IncidentController.updateIncident);
router.delete('/:id', authenticate, requireRole('admin'), IncidentController.deleteIncident);

export default router;
