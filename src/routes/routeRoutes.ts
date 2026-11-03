import { Router } from 'express';
import { RouteController } from '../controllers/routeController';
import { optionalAuthenticate, authenticate } from '../middleware/authMiddleware';
import { validate } from '../middleware/validationMiddleware';
import { recommendRouteSchema } from '../validators/routeValidator';

const router = Router();

router.post('/recommend', optionalAuthenticate, validate(recommendRouteSchema), RouteController.recommend);
router.get('/history', authenticate, RouteController.getHistory);

export default router;
