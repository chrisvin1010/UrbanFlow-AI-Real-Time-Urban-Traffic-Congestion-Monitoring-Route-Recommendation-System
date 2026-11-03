"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const routeController_1 = require("../controllers/routeController");
const authMiddleware_1 = require("../middleware/authMiddleware");
const validationMiddleware_1 = require("../middleware/validationMiddleware");
const routeValidator_1 = require("../validators/routeValidator");
const router = (0, express_1.Router)();
router.post('/recommend', authMiddleware_1.optionalAuthenticate, (0, validationMiddleware_1.validate)(routeValidator_1.recommendRouteSchema), routeController_1.RouteController.recommend);
router.get('/history', authMiddleware_1.authenticate, routeController_1.RouteController.getHistory);
exports.default = router;
//# sourceMappingURL=routeRoutes.js.map