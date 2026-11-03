"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const roadController_1 = require("../controllers/roadController");
const authMiddleware_1 = require("../middleware/authMiddleware");
const roleMiddleware_1 = require("../middleware/roleMiddleware");
const validationMiddleware_1 = require("../middleware/validationMiddleware");
const roadValidator_1 = require("../validators/roadValidator");
const router = (0, express_1.Router)();
router.get('/', roadController_1.RoadController.getRoads);
router.get('/:id', roadController_1.RoadController.getRoadById);
router.post('/', authMiddleware_1.authenticate, (0, roleMiddleware_1.requireRole)('admin'), (0, validationMiddleware_1.validate)(roadValidator_1.createRoadSchema), roadController_1.RoadController.createRoad);
router.patch('/:id', authMiddleware_1.authenticate, (0, roleMiddleware_1.requireRole)('admin'), (0, validationMiddleware_1.validate)(roadValidator_1.updateRoadSchema), roadController_1.RoadController.updateRoad);
router.delete('/:id', authMiddleware_1.authenticate, (0, roleMiddleware_1.requireRole)('admin'), roadController_1.RoadController.deleteRoad);
exports.default = router;
//# sourceMappingURL=roadRoutes.js.map