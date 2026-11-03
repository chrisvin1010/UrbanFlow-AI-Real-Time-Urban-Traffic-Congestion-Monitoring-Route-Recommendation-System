"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateIncidentSchema = exports.createIncidentSchema = void 0;
const zod_1 = require("zod");
exports.createIncidentSchema = zod_1.z.object({
    body: zod_1.z.object({
        title: zod_1.z.string().min(3, 'Title is required'),
        type: zod_1.z.enum(['accident', 'construction', 'congestion', 'hazard', 'roadwork', 'event']),
        description: zod_1.z.string().min(5, 'Detailed description is required'),
        roadName: zod_1.z.string().min(2, 'Road name is required'),
        latitude: zod_1.z.number().min(-90).max(90),
        longitude: zod_1.z.number().min(-180).max(180),
        severity: zod_1.z.enum(['low', 'medium', 'high', 'critical']).default('medium'),
        impactRadiusMeters: zod_1.z.number().min(50).max(10000).optional().default(500),
        estimatedDelayMinutes: zod_1.z.number().min(0).max(300).optional().default(10),
    }),
});
exports.updateIncidentSchema = zod_1.z.object({
    body: zod_1.z.object({
        title: zod_1.z.string().min(3).optional(),
        type: zod_1.z.enum(['accident', 'construction', 'congestion', 'hazard', 'roadwork', 'event']).optional(),
        description: zod_1.z.string().min(5).optional(),
        severity: zod_1.z.enum(['low', 'medium', 'high', 'critical']).optional(),
        status: zod_1.z.enum(['reported', 'investigating', 'confirmed', 'clearing', 'resolved']).optional(),
        estimatedDelayMinutes: zod_1.z.number().min(0).max(300).optional(),
    }),
});
//# sourceMappingURL=incidentValidator.js.map