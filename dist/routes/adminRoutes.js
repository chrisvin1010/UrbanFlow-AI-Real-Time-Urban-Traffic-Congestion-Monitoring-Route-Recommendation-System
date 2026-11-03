"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const adminController_1 = require("../controllers/adminController");
const authMiddleware_1 = require("../middleware/authMiddleware");
const roleMiddleware_1 = require("../middleware/roleMiddleware");
const router = (0, express_1.Router)();
router.use(authMiddleware_1.authenticate, (0, roleMiddleware_1.requireRole)('admin'));
router.get('/users', adminController_1.AdminController.getUsers);
router.patch('/users/:id/role', adminController_1.AdminController.updateUserRole);
router.get('/health', adminController_1.AdminController.getSystemHealth);
router.get('/audit-logs', adminController_1.AdminController.getAuditLogs);
exports.default = router;
//# sourceMappingURL=adminRoutes.js.map