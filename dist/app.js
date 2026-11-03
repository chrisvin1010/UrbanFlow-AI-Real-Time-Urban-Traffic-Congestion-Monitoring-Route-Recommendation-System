"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createApp = createApp;
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const morgan_1 = __importDefault(require("morgan"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const authRoutes_1 = __importDefault(require("./routes/authRoutes"));
const dashboardRoutes_1 = __importDefault(require("./routes/dashboardRoutes"));
const roadRoutes_1 = __importDefault(require("./routes/roadRoutes"));
const trafficRoutes_1 = __importDefault(require("./routes/trafficRoutes"));
const routeRoutes_1 = __importDefault(require("./routes/routeRoutes"));
const incidentRoutes_1 = __importDefault(require("./routes/incidentRoutes"));
const analyticsRoutes_1 = __importDefault(require("./routes/analyticsRoutes"));
const adminRoutes_1 = __importDefault(require("./routes/adminRoutes"));
const healthRoutes_1 = __importDefault(require("./routes/healthRoutes"));
const errorHandler_1 = require("./middleware/errorHandler");
function createApp() {
    const app = (0, express_1.default)();
    // Security Headers
    app.use((0, helmet_1.default)({
        crossOriginResourcePolicy: false,
    }));
    // CORS Configuration
    app.use((0, cors_1.default)({
        origin: '*',
        credentials: true,
        methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization'],
    }));
    // Request logging in non-test env
    if (process.env.NODE_ENV !== 'test') {
        app.use((0, morgan_1.default)('dev'));
    }
    // Body parser
    app.use(express_1.default.json({ limit: '5mb' }));
    app.use(express_1.default.urlencoded({ extended: true, limit: '5mb' }));
    // General rate limiter
    const limiter = (0, express_rate_limit_1.default)({
        windowMs: 15 * 60 * 1000,
        max: 1000,
        standardHeaders: true,
        legacyHeaders: false,
        message: { success: false, message: 'Too many requests. Please try again later.' },
    });
    app.use('/api', limiter);
    // Mount API endpoints
    app.use('/api/auth', authRoutes_1.default);
    app.use('/api/dashboard', dashboardRoutes_1.default);
    app.use('/api/roads', roadRoutes_1.default);
    app.use('/api/traffic', trafficRoutes_1.default);
    app.use('/api/routes', routeRoutes_1.default);
    app.use('/api/incidents', incidentRoutes_1.default);
    app.use('/api/analytics', analyticsRoutes_1.default);
    app.use('/api/admin', adminRoutes_1.default);
    app.use('/api/health', healthRoutes_1.default);
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
    app.use(errorHandler_1.errorHandler);
    return app;
}
//# sourceMappingURL=app.js.map