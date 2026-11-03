import { z } from 'zod';

export const recommendRouteSchema = z.object({
  body: z.object({
    origin: z.string().min(2, 'Origin location or coordinates required'),
    destination: z.string().min(2, 'Destination location or coordinates required'),
    preference: z.enum(['fastest', 'least_congested', 'shortest']).optional().default('fastest'),
    originCoords: z.array(z.number()).length(2).optional(), // [lat, lng]
    destinationCoords: z.array(z.number()).length(2).optional(), // [lat, lng]
  }),
});
