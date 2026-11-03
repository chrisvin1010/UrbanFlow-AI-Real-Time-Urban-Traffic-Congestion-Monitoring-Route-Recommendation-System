import { Response } from 'express';
import { routingService } from '../services/routingService';
import { RouteSearch } from '../models/RouteSearch';
import { AuthenticatedRequest } from '../middleware/authMiddleware';

export class RouteController {
  public static async recommend(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { origin, destination, preference, originCoords, destinationCoords } = req.body;
      const userId = req.user ? req.user._id.toString() : undefined;

      const recommendation = await routingService.recommendRoute(
        origin,
        destination,
        preference,
        originCoords,
        destinationCoords,
        userId
      );

      res.status(200).json({
        success: true,
        data: recommendation,
      });
    } catch (error: any) {
      console.error('[RouteController] Error generating route recommendation:', error);
      res.status(500).json({
        success: false,
        message: `Failed to calculate smart route recommendation: ${error.message}`,
      });
    }
  }

  public static async getHistory(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const query: any = {};
      if (req.user) {
        query.user = req.user._id;
      }

      const history = await RouteSearch.find(query)
        .sort({ createdAt: -1 })
        .limit(20);

      res.status(200).json({
        success: true,
        data: history,
      });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
}
