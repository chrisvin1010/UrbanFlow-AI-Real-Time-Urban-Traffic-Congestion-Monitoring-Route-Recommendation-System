"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.recommendRouteSchema = void 0;
const zod_1 = require("zod");
exports.recommendRouteSchema = zod_1.z.object({
    body: zod_1.z.object({
        origin: zod_1.z.string().min(2, 'Origin location or coordinates required'),
        destination: zod_1.z.string().min(2, 'Destination location or coordinates required'),
        preference: zod_1.z.enum(['fastest', 'least_congested', 'shortest']).optional().default('fastest'),
        originCoords: zod_1.z.array(zod_1.z.number()).length(2).optional(), // [lat, lng]
        destinationCoords: zod_1.z.array(zod_1.z.number()).length(2).optional(), // [lat, lng]
    }),
});
//# sourceMappingURL=routeValidator.js.map