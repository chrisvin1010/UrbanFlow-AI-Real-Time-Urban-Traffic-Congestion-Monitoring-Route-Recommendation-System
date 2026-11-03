import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';

import authRoutes from './routes/authRoutes';
import dashboardRoutes from './routes/dashboardRoutes';
import roadRoutes from './routes/roadRoutes';
import trafficRoutes from './routes/trafficRoutes';
import routeRoutes from './routes/routeRoutes';
import incidentRoutes from './routes/incidentRoutes';
import analyticsRoutes from './routes/analyticsRoutes';
import adminRoutes from './routes/adminRoutes';
import healthRoutes from './routes/healthRoutes';

import { errorHandler } from './middleware/errorHandler';

export function createApp(): Application {
  const app = express();

  // Security Headers
  app.use(
    helmet({
      crossOriginResourcePolicy: false,
    })
  );

  // CORS Configuration
  app.use(
    cors({
      origin: '*',
      credentials: true,
      methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
    })
  );

  // Request logging in non-test env
  if (process.env.NODE_ENV !== 'test') {
    app.use(morgan('dev'));
  }

  // Body parser
  app.use(express.json({ limit: '5mb' }));
  app.use(express.urlencoded({ extended: true, limit: '5mb' }));

  // General rate limiter
  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 1000,
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, message: 'Too many requests. Please try again later.' },
  });
  app.use('/api', limiter);

  // Mount API endpoints
  app.use('/api/auth', authRoutes);
  app.use('/api/dashboard', dashboardRoutes);
  app.use('/api/roads', roadRoutes);
  app.use('/api/traffic', trafficRoutes);
  app.use('/api/routes', routeRoutes);
  app.use('/api/incidents', incidentRoutes);
  app.use('/api/analytics', analyticsRoutes);
  app.use('/api/admin', adminRoutes);
  app.use('/api/health', healthRoutes);

  // Root welcome route
  app.get('/', (_req, res) => {
    res.json({
      name: 'UrbanFlow AI API',
      version: '1.0.0',
      description: 'Real-Time Urban Traffic Congestion Monitoring & Smart Route Recommendation System',
      docs: '/api/health',
    });
  });

  // 404 handler for unknown routes
  app.use((_req, res) => {
    res.status(404).json({
      success: false,
      message: 'The requested API endpoint was not found.',
    });
  });

  // Centralized Error Handler
  app.use(errorHandler);

  return app;
}
