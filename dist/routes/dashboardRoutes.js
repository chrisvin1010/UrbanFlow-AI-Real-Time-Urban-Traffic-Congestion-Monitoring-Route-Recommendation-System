"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const dashboardController_1 = require("../controllers/dashboardController");
const router = (0, express_1.Router)();
router.get('/summary', dashboardController_1.DashboardController.getSummary);
router.get('/congestion-distribution', dashboardController_1.DashboardController.getCongestionDistribution);
router.get('/traffic-trends', dashboardController_1.DashboardController.getTrafficTrends);
router.get('/top-congested-roads', dashboardController_1.DashboardController.getTopCongestedRoads);
router.get('/recent-events', dashboardController_1.DashboardController.getRecentEvents);
exports.default = router;
//# sourceMappingURL=dashboardRoutes.js.map