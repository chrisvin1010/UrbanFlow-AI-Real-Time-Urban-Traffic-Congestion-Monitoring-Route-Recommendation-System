import { z } from 'zod';

export const createRoadSchema = z.object({
  body: z.object({
    roadName: z.string().min(2, 'Road name is required'),
    area: z.string().min(2, 'Area is required'),
    city: z.string().optional().default('San Francisco'),
    coordinates: z.array(z.array(z.number()).length(2)).min(2, 'At least 2 coordinate pairs required'),
    freeFlowSpeed: z.number().min(10).max(150).default(50),
    currentSpeed: z.number().min(0).max(150).optional(),
    vehicleCount: z.number().min(0).optional(),
    lanes: z.number().min(1).max(12).optional().default(2),
    lengthKm: z.number().min(0.1).optional().default(1.0),
  }),
});

export const updateRoadSchema = z.object({
  body: z.object({
    roadName: z.string().min(2).optional(),
    area: z.string().min(2).optional(),
    freeFlowSpeed: z.number().min(10).max(150).optional(),
    currentSpeed: z.number().min(0).max(150).optional(),
    vehicleCount: z.number().min(0).optional(),
    lanes: z.number().min(1).max(12).optional(),
    coordinates: z.array(z.array(z.number()).length(2)).min(2).optional(),
  }),
});
