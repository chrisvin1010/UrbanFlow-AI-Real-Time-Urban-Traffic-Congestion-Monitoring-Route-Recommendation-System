import { Router } from 'express';
import { AuthController } from '../controllers/authController';
import { validate } from '../middleware/validationMiddleware';
import { registerSchema, loginSchema, updatePreferencesSchema } from '../validators/authValidator';
import { authenticate } from '../middleware/authMiddleware';

const router = Router();

router.post('/register', validate(registerSchema), AuthController.register);
router.post('/login', validate(loginSchema), AuthController.login);
router.get('/me', authenticate, AuthController.me);
router.patch('/preferences', authenticate, validate(updatePreferencesSchema), AuthController.updatePreferences);
router.post('/logout', authenticate, AuthController.logout);

export default router;
