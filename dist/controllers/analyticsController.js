"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AnalyticsController = void 0;
const analyticsService_1 = require("../services/analyticsService");
class AnalyticsController {
    static async getOverview(req, res) {
        try {
            const area = req.query.area;
            const data = await analyticsService_1.analyticsService.getOverview(area);
            res.status(200).json({ success: true, data });
        }
        catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
    static async getPeakHours(_req, res) {
        try {
            const data = await analyticsService_1.analyticsService.getPeakHours();
            res.status(200).json({ success: true, data });
        }
        catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
    static async getRoadComparison(req, res) {
        try {
            const limit = parseInt(req.query.limit || '10', 10);
            const data = await analyticsService_1.analyticsService.getRoadComparisons(limit);
            res.status(200).json({ success: true, data });
        }
        catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
    static async exportCsv(req, res) {
        try {
            const area = req.query.area;
            const csvContent = await analyticsService_1.analyticsService.exportCsvReport(area);
            const timestamp = new Date().toISOString().split('T')[0];
            const filename = `urbanflow_traffic_report_${timestamp}.csv`;
            res.setHeader('Content-Type', 'text/csv');
            res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
            res.status(200).send(csvContent);
        }
        catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
}
exports.AnalyticsController = AnalyticsController;
//# sourceMappingURL=analyticsController.js.map