"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const analyticsController_1 = require("../controllers/analyticsController");
const router = (0, express_1.Router)();
router.get('/overview', analyticsController_1.AnalyticsController.getOverview);
router.get('/peak-hours', analyticsController_1.AnalyticsController.getPeakHours);
router.get('/road-comparison', analyticsController_1.AnalyticsController.getRoadComparison);
router.get('/export', analyticsController_1.AnalyticsController.exportCsv);
exports.default = router;
//# sourceMappingURL=analyticsRoutes.js.map