"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const authController_1 = require("../controllers/authController");
const validationMiddleware_1 = require("../middleware/validationMiddleware");
const authValidator_1 = require("../validators/authValidator");
const authMiddleware_1 = require("../middleware/authMiddleware");
const router = (0, express_1.Router)();
router.post('/register', (0, validationMiddleware_1.validate)(authValidator_1.registerSchema), authController_1.AuthController.register);
router.post('/login', (0, validationMiddleware_1.validate)(authValidator_1.loginSchema), authController_1.AuthController.login);
router.get('/me', authMiddleware_1.authenticate, authController_1.AuthController.me);
router.patch('/preferences', authMiddleware_1.authenticate, (0, validationMiddleware_1.validate)(authValidator_1.updatePreferencesSchema), authController_1.AuthController.updatePreferences);
router.post('/logout', authMiddleware_1.authenticate, authController_1.AuthController.logout);
exports.default = router;
//# sourceMappingURL=authRoutes.js.map