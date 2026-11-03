"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const incidentController_1 = require("../controllers/incidentController");
const authMiddleware_1 = require("../middleware/authMiddleware");
const roleMiddleware_1 = require("../middleware/roleMiddleware");
const validationMiddleware_1 = require("../middleware/validationMiddleware");
const incidentValidator_1 = require("../validators/incidentValidator");
const router = (0, express_1.Router)();
router.get('/', incidentController_1.IncidentController.getIncidents);
router.get('/:id', incidentController_1.IncidentController.getIncidentById);
router.post('/', authMiddleware_1.authenticate, (0, validationMiddleware_1.validate)(incidentValidator_1.createIncidentSchema), incidentController_1.IncidentController.createIncident);
router.patch('/:id', authMiddleware_1.authenticate, (0, validationMiddleware_1.validate)(incidentValidator_1.updateIncidentSchema), incidentController_1.IncidentController.updateIncident);
router.delete('/:id', authMiddleware_1.authenticate, (0, roleMiddleware_1.requireRole)('admin'), incidentController_1.IncidentController.deleteIncident);
exports.default = router;
//# sourceMappingURL=incidentRoutes.js.map