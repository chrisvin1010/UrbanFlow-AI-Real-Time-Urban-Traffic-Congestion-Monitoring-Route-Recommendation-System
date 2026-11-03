import { z } from 'zod';

export const registerSchema = z.object({
  body: z.object({
    name: z.string().min(2, 'Name must be at least 2 characters long').max(100),
    email: z.string().email('Valid email is required'),
    password: z.string().min(6, 'Password must be at least 6 characters long').max(100),
    role: z.enum(['admin', 'user']).optional().default('user'),
  }),
});

export const loginSchema = z.object({
  body: z.object({
    email: z.string().email('Valid email is required'),
    password: z.string().min(1, 'Password is required'),
  }),
});

export const updatePreferencesSchema = z.object({
  body: z.object({
    theme: z.enum(['dark', 'light', 'system']).optional(),
    speedUnit: z.enum(['km/h', 'mph']).optional(),
    defaultCity: z.string().optional(),
    defaultMapCenter: z.array(z.number()).length(2).optional(),
    defaultZoom: z.number().min(1).max(20).optional(),
    notificationAlerts: z.boolean().optional(),
    refreshIntervalSeconds: z.number().min(5).max(120).optional(),
  }),
});
