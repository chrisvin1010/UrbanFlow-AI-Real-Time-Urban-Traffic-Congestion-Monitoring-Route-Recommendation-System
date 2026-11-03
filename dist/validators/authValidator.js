"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updatePreferencesSchema = exports.loginSchema = exports.registerSchema = void 0;
const zod_1 = require("zod");
exports.registerSchema = zod_1.z.object({
    body: zod_1.z.object({
        name: zod_1.z.string().min(2, 'Name must be at least 2 characters long').max(100),
        email: zod_1.z.string().email('Valid email is required'),
        password: zod_1.z.string().min(6, 'Password must be at least 6 characters long').max(100),
        role: zod_1.z.enum(['admin', 'user']).optional().default('user'),
    }),
});
exports.loginSchema = zod_1.z.object({
    body: zod_1.z.object({
        email: zod_1.z.string().email('Valid email is required'),
        password: zod_1.z.string().min(1, 'Password is required'),
    }),
});
exports.updatePreferencesSchema = zod_1.z.object({
    body: zod_1.z.object({
        theme: zod_1.z.enum(['dark', 'light', 'system']).optional(),
        speedUnit: zod_1.z.enum(['km/h', 'mph']).optional(),
        defaultCity: zod_1.z.string().optional(),
        defaultMapCenter: zod_1.z.array(zod_1.z.number()).length(2).optional(),
        defaultZoom: zod_1.z.number().min(1).max(20).optional(),
        notificationAlerts: zod_1.z.boolean().optional(),
        refreshIntervalSeconds: zod_1.z.number().min(5).max(120).optional(),
    }),
});
//# sourceMappingURL=authValidator.js.map