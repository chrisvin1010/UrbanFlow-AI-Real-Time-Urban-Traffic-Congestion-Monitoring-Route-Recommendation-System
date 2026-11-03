import { z } from 'zod';

export const createIncidentSchema = z.object({
  body: z.object({
    title: z.string().min(3, 'Title is required'),
    type: z.enum(['accident', 'construction', 'congestion', 'hazard', 'roadwork', 'event']),
    description: z.string().min(5, 'Detailed description is required'),
    roadName: z.string().min(2, 'Road name is required'),
    latitude: z.number().min(-90).max(90),
    longitude: z.number().min(-180).max(180),
    severity: z.enum(['low', 'medium', 'high', 'critical']).default('medium'),
    impactRadiusMeters: z.number().min(50).max(10000).optional().default(500),
    estimatedDelayMinutes: z.number().min(0).max(300).optional().default(10),
  }),
});

export const updateIncidentSchema = z.object({
  body: z.object({
    title: z.string().min(3).optional(),
    type: z.enum(['accident', 'construction', 'congestion', 'hazard', 'roadwork', 'event']).optional(),
    description: z.string().min(5).optional(),
    severity: z.enum(['low', 'medium', 'high', 'critical']).optional(),
    status: z.enum(['reported', 'investigating', 'confirmed', 'clearing', 'resolved']).optional(),
    estimatedDelayMinutes: z.number().min(0).max(300).optional(),
  }),
});
