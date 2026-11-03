"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateRoadSchema = exports.createRoadSchema = void 0;
const zod_1 = require("zod");
exports.createRoadSchema = zod_1.z.object({
    body: zod_1.z.object({
        roadName: zod_1.z.string().min(2, 'Road name is required'),
        area: zod_1.z.string().min(2, 'Area is required'),
        city: zod_1.z.string().optional().default('San Francisco'),
        coordinates: zod_1.z.array(zod_1.z.array(zod_1.z.number()).length(2)).min(2, 'At least 2 coordinate pairs required'),
        freeFlowSpeed: zod_1.z.number().min(10).max(150).default(50),
        currentSpeed: zod_1.z.number().min(0).max(150).optional(),
        vehicleCount: zod_1.z.number().min(0).optional(),
        lanes: zod_1.z.number().min(1).max(12).optional().default(2),
        lengthKm: zod_1.z.number().min(0.1).optional().default(1.0),
    }),
});
exports.updateRoadSchema = zod_1.z.object({
    body: zod_1.z.object({
        roadName: zod_1.z.string().min(2).optional(),
        area: zod_1.z.string().min(2).optional(),
        freeFlowSpeed: zod_1.z.number().min(10).max(150).optional(),
        currentSpeed: zod_1.z.number().min(0).max(150).optional(),
        vehicleCount: zod_1.z.number().min(0).optional(),
        lanes: zod_1.z.number().min(1).max(12).optional(),
        coordinates: zod_1.z.array(zod_1.z.array(zod_1.z.number()).length(2)).min(2).optional(),
    }),
});
//# sourceMappingURL=roadValidator.js.map