import { Request, Response } from 'express';
import { analyticsService } from '../services/analyticsService';

export class AnalyticsController {
  public static async getOverview(req: Request, res: Response): Promise<void> {
    try {
      const area = req.query.area as string;
      const data = await analyticsService.getOverview(area);
      res.status(200).json({ success: true, data });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  public static async getPeakHours(_req: Request, res: Response): Promise<void> {
    try {
      const data = await analyticsService.getPeakHours();
      res.status(200).json({ success: true, data });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  public static async getRoadComparison(req: Request, res: Response): Promise<void> {
    try {
      const limit = parseInt((req.query.limit as string) || '10', 10);
      const data = await analyticsService.getRoadComparisons(limit);
      res.status(200).json({ success: true, data });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  public static async exportCsv(req: Request, res: Response): Promise<void> {
    try {
      const area = req.query.area as string;
      const csvContent = await analyticsService.exportCsvReport(area);

      const timestamp = new Date().toISOString().split('T')[0];
      const filename = `urbanflow_traffic_report_${timestamp}.csv`;

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.status(200).send(csvContent);
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
}
