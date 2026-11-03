"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const trafficController_1 = require("../controllers/trafficController");
const router = (0, express_1.Router)();
router.get('/current', trafficController_1.TrafficController.getCurrent);
router.get('/history', trafficController_1.TrafficController.getHistory);
router.get('/heatmap', trafficController_1.TrafficController.getHeatmap);
router.post('/simulate', trafficController_1.TrafficController.triggerSimulation);
exports.default = router;
//# sourceMappingURL=trafficRoutes.js.map