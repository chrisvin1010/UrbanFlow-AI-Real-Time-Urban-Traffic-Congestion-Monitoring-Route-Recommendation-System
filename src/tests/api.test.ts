import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { createApp } from '../app';
import { connectDatabase, disconnectDatabase } from '../config/database';
import { runSeed } from '../seed/seed';
import { Application } from 'express';

describe('UrbanFlow AI - End-to-End API Integration Test Suite', () => {
  let app: Application;
  let adminToken: string;
  let userToken: string;
  let testRoadId: string;
  let testIncidentId: string;

  beforeAll(async () => {
    // 1. Initialize Database & Seed
    await connectDatabase();
    await runSeed();
    app = createApp();

    // 2. Obtain Admin Token
    const adminLoginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@urbanflow.ai', password: 'Admin@123456' });
    expect(adminLoginRes.status).toBe(200);
    adminToken = adminLoginRes.body.token;

    // 3. Obtain Standard User Token
    const userLoginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'demo@urbanflow.ai', password: 'User@123456' });
    expect(userLoginRes.status).toBe(200);
    userToken = userLoginRes.body.token;
  });

  afterAll(async () => {
    await disconnectDatabase();
  });

  // --- 1. Health Checks ---
  describe('Health Checks', () => {
    it('GET /api/health should report healthy system status', async () => {
      const res = await request(app).get('/api/health');
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('UP');
      expect(res.body.database).toBe('CONNECTED');
    });
  });

  // --- 2. Authentication & Roles ---
  describe('Authentication & Access Control', () => {
    it('POST /api/auth/register creates a new user account', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Marcus Vance',
          email: 'marcus.test@urbanflow.ai',
          password: 'Password@123',
          role: 'user',
        });
      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.token).toBeDefined();
      expect(res.body.user.email).toBe('marcus.test@urbanflow.ai');
    });

    it('POST /api/auth/login rejects invalid credentials', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'admin@urbanflow.ai',
          password: 'WrongPassword!',
        });
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('GET /api/auth/me returns authenticated profile', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
      expect(res.body.user.role).toBe('admin');
    });

    it('POST /api/roads rejects unauthenticated requests', async () => {
      const res = await request(app).post('/api/roads').send({});
      expect(res.status).toBe(401);
    });

    it('POST /api/roads rejects standard user without admin role', async () => {
      const res = await request(app)
        .post('/api/roads')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          roadName: 'Unauthorized Boulevard',
          area: 'Downtown',
          coordinates: [[37.78, -122.41], [37.79, -122.42]],
        });
      expect(res.status).toBe(403);
    });
  });

  // --- 3. Dashboard Aggregations ---
  describe('Dashboard Analytics & Aggregations', () => {
    it('GET /api/dashboard/summary returns database-backed KPI statistics', async () => {
      const res = await request(app).get('/api/dashboard/summary');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.totalRoadsMonitored).toBeGreaterThanOrEqual(20);
      expect(res.body.data.averageSpeedKmh).toBeGreaterThan(0);
      expect(res.body.data.trafficStatus).toBeDefined();
    });

    it('GET /api/dashboard/congestion-distribution returns categorized road buckets', async () => {
      const res = await request(app).get('/api/dashboard/congestion-distribution');
      expect(res.status).toBe(200);
      expect(res.body.data).toBeInstanceOf(Array);
      expect(res.body.data.length).toBe(4);
    });

    it('GET /api/dashboard/traffic-trends returns hourly progression curve', async () => {
      const res = await request(app).get('/api/dashboard/traffic-trends');
      expect(res.status).toBe(200);
      expect(res.body.data.length).toBeGreaterThan(0);
    });

    it('GET /api/dashboard/top-congested-roads returns sorted bottleneck corridors', async () => {
      const res = await request(app).get('/api/dashboard/top-congested-roads?limit=5');
      expect(res.status).toBe(200);
      expect(res.body.data.length).toBeLessThanOrEqual(5);
    });
  });

  // --- 4. Roads CRUD ---
  describe('Road Segments Telemetry & CRUD', () => {
    it('GET /api/roads returns paginated list of monitored roads', async () => {
      const res = await request(app).get('/api/roads?page=1&limit=10');
      expect(res.status).toBe(200);
      expect(res.body.data.length).toBe(10);
      expect(res.body.pagination.total).toBeGreaterThanOrEqual(20);
      testRoadId = res.body.data[0].id;
    });

    it('GET /api/roads/:id returns road details with snapshot history', async () => {
      const res = await request(app).get(`/api/roads/${testRoadId}`);
      expect(res.status).toBe(200);
      expect(res.body.data.road.roadName).toBeDefined();
      expect(res.body.data.history).toBeInstanceOf(Array);
    });

    it('POST /api/roads allows admin to create new corridor segment', async () => {
      const res = await request(app)
        .post('/api/roads')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          roadName: 'Embarcadero South Extension',
          area: 'South Beach',
          city: 'San Francisco',
          coordinates: [
            [37.7810, -122.3880],
            [37.7770, -122.3890],
          ],
          freeFlowSpeed: 50,
          currentSpeed: 42,
          lanes: 4,
          lengthKm: 1.1,
        });
      expect(res.status).toBe(201);
      expect(res.body.data.roadName).toBe('Embarcadero South Extension');
    });
  });

  // --- 5. Traffic Incidents Management ---
  describe('Incident Reporting & Clearance Workflow', () => {
    it('POST /api/incidents creates a traffic hazard report', async () => {
      const res = await request(app)
        .post('/api/incidents')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          title: 'Stalled Bus on Market St',
          type: 'hazard',
          description: 'Electric bus stalled blocking central transit lane.',
          roadName: 'Market Street (Downtown Corridor)',
          latitude: 37.7812,
          longitude: -122.4110,
          severity: 'medium',
          estimatedDelayMinutes: 12,
        });
      expect(res.status).toBe(201);
      expect(res.body.data.title).toBe('Stalled Bus on Market St');
      testIncidentId = res.body.data.id;
    });

    it('PATCH /api/incidents/:id marks incident as resolved', async () => {
      const res = await request(app)
        .patch(`/api/incidents/${testIncidentId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          status: 'resolved',
        });
      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('resolved');
      expect(res.body.data.resolvedAt).toBeDefined();
    });
  });

  // --- 6. Smart Route Recommendation ---
  describe('Smart Route Recommendation', () => {
    it('POST /api/routes/recommend calculates transparent ranked paths', async () => {
      const res = await request(app)
        .post('/api/routes/recommend')
        .send({
          origin: 'Market Street',
          destination: 'Golden Gate Bridge',
          preference: 'fastest',
        });
      expect(res.status).toBe(200);
      expect(res.body.data.bestRoute).toBeDefined();
      expect(res.body.data.bestRoute.distanceMeters).toBeGreaterThan(0);
      expect(res.body.data.bestRoute.recommendationReason).toBeDefined();
      expect(res.body.data.disclaimer).toBeDefined();
    });
  });

  // --- 7. Analytics & Export ---
  describe('Analytics & Reports', () => {
    it('GET /api/analytics/overview returns aggregate zone statistics', async () => {
      const res = await request(app).get('/api/analytics/overview');
      expect(res.status).toBe(200);
      expect(res.body.data.areaComparisons).toBeInstanceOf(Array);
    });

    it('GET /api/analytics/export streams CSV traffic report', async () => {
      const res = await request(app).get('/api/analytics/export');
      expect(res.status).toBe(200);
      expect(res.header['content-type']).toContain('text/csv');
      expect(res.text).toContain('ROAD_ID,ROAD_NAME');
    });
  });

  // --- 8. Admin Control & Audit ---
  describe('Administration Command Controls', () => {
    it('GET /api/admin/users lists operators', async () => {
      const res = await request(app)
        .get('/api/admin/users')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
      expect(res.body.data.length).toBeGreaterThan(0);
    });

    it('GET /api/admin/health returns full system diagnostics', async () => {
      const res = await request(app)
        .get('/api/admin/health')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('healthy');
      expect(res.body.data.database.connected).toBe(true);
    });
  });
});
