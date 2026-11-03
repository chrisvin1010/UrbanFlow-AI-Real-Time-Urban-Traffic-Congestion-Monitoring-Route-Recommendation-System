"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RouteController = void 0;
const routingService_1 = require("../services/routingService");
const RouteSearch_1 = require("../models/RouteSearch");
class RouteController {
    static async recommend(req, res) {
        try {
            const { origin, destination, preference, originCoords, destinationCoords } = req.body;
            const userId = req.user ? req.user._id.toString() : undefined;
            const recommendation = await routingService_1.routingService.recommendRoute(origin, destination, preference, originCoords, destinationCoords, userId);
            res.status(200).json({
                success: true,
                data: recommendation,
            });
        }
        catch (error) {
            console.error('[RouteController] Error generating route recommendation:', error);
            res.status(500).json({
                success: false,
                message: `Failed to calculate smart route recommendation: ${error.message}`,
            });
        }
    }
    static async getHistory(req, res) {
        try {
            const query = {};
            if (req.user) {
                query.user = req.user._id;
            }
            const history = await RouteSearch_1.RouteSearch.find(query)
                .sort({ createdAt: -1 })
                .limit(20);
            res.status(200).json({
                success: true,
                data: history,
            });
        }
        catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
}
exports.RouteController = RouteController;
//# sourceMappingURL=routeController.js.map