"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthController = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const User_1 = require("../models/User");
const AuditLog_1 = require("../models/AuditLog");
const environment_1 = require("../config/environment");
class AuthController {
    static async register(req, res) {
        try {
            const { name, email, password, role } = req.body;
            const existingUser = await User_1.User.findOne({ email: email.toLowerCase() });
            if (existingUser) {
                res.status(409).json({
                    success: false,
                    message: 'An account with this email address already exists. Please log in.',
                });
                return;
            }
            const salt = await bcryptjs_1.default.genSalt(10);
            const passwordHash = await bcryptjs_1.default.hash(password, salt);
            const userRole = role === 'admin' ? 'admin' : 'user';
            const newUser = await User_1.User.create({
                name,
                email: email.toLowerCase(),
                passwordHash,
                role: userRole,
            });
            const token = jsonwebtoken_1.default.sign({ id: newUser._id, role: newUser.role, email: newUser.email }, environment_1.ENV.JWT_SECRET, { expiresIn: environment_1.ENV.JWT_EXPIRES_IN });
            // Audit log
            await AuditLog_1.AuditLog.create({
                user: newUser._id,
                userName: newUser.name,
                action: 'USER_REGISTERED',
                entityType: 'User',
                entityId: newUser._id.toString(),
                ipAddress: req.ip,
            });
            res.status(201).json({
                success: true,
                message: 'Account registered successfully.',
                token,
                user: newUser,
            });
        }
        catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
    static async login(req, res) {
        try {
            const { email, password } = req.body;
            const user = await User_1.User.findOne({ email: email.toLowerCase() });
            if (!user) {
                res.status(401).json({
                    success: false,
                    message: 'Invalid credentials. Please verify your email and password.',
                });
                return;
            }
            const isMatch = await bcryptjs_1.default.compare(password, user.passwordHash);
            if (!isMatch) {
                res.status(401).json({
                    success: false,
                    message: 'Invalid credentials. Please verify your email and password.',
                });
                return;
            }
            const token = jsonwebtoken_1.default.sign({ id: user._id, role: user.role, email: user.email }, environment_1.ENV.JWT_SECRET, { expiresIn: environment_1.ENV.JWT_EXPIRES_IN });
            await AuditLog_1.AuditLog.create({
                user: user._id,
                userName: user.name,
                action: 'USER_LOGIN',
                entityType: 'User',
                entityId: user._id.toString(),
                ipAddress: req.ip,
            });
            res.status(200).json({
                success: true,
                message: 'Logged in successfully.',
                token,
                user,
            });
        }
        catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
    static async me(req, res) {
        if (!req.user) {
            res.status(401).json({ success: false, message: 'Not authenticated' });
            return;
        }
        res.status(200).json({
            success: true,
            user: req.user,
        });
    }
    static async updatePreferences(req, res) {
        if (!req.user) {
            res.status(401).json({ success: false, message: 'Not authenticated' });
            return;
        }
        try {
            const user = req.user;
            user.preferences = {
                ...user.preferences,
                ...req.body,
            };
            await user.save();
            res.status(200).json({
                success: true,
                message: 'Preferences updated successfully.',
                preferences: user.preferences,
            });
        }
        catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
    static async logout(req, res) {
        if (req.user) {
            await AuditLog_1.AuditLog.create({
                user: req.user._id,
                userName: req.user.name,
                action: 'USER_LOGOUT',
                entityType: 'User',
                entityId: req.user._id.toString(),
            });
        }
        res.status(200).json({
            success: true,
            message: 'Logged out successfully.',
        });
    }
}
exports.AuthController = AuthController;
//# sourceMappingURL=authController.js.map