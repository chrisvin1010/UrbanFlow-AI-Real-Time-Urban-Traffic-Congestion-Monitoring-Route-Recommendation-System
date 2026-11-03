import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User } from '../models/User';
import { AuditLog } from '../models/AuditLog';
import { ENV } from '../config/environment';
import { AuthenticatedRequest } from '../middleware/authMiddleware';

export class AuthController {
  public static async register(req: Request, res: Response): Promise<void> {
    try {
      const { name, email, password, role } = req.body;

      const existingUser = await User.findOne({ email: email.toLowerCase() });
      if (existingUser) {
        res.status(409).json({
          success: false,
          message: 'An account with this email address already exists. Please log in.',
        });
        return;
      }

      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(password, salt);

      const userRole = role === 'admin' ? 'admin' : 'user';

      const newUser = await User.create({
        name,
        email: email.toLowerCase(),
        passwordHash,
        role: userRole,
      });

      const token = jwt.sign(
        { id: newUser._id, role: newUser.role, email: newUser.email },
        ENV.JWT_SECRET,
        { expiresIn: ENV.JWT_EXPIRES_IN as any }
      );

      // Audit log
      await AuditLog.create({
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
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  public static async login(req: Request, res: Response): Promise<void> {
    try {
      const { email, password } = req.body;

      const user = await User.findOne({ email: email.toLowerCase() });
      if (!user) {
        res.status(401).json({
          success: false,
          message: 'Invalid credentials. Please verify your email and password.',
        });
        return;
      }

      const isMatch = await bcrypt.compare(password, user.passwordHash);
      if (!isMatch) {
        res.status(401).json({
          success: false,
          message: 'Invalid credentials. Please verify your email and password.',
        });
        return;
      }

      const token = jwt.sign(
        { id: user._id, role: user.role, email: user.email },
        ENV.JWT_SECRET,
        { expiresIn: ENV.JWT_EXPIRES_IN as any }
      );

      await AuditLog.create({
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
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  public static async me(req: AuthenticatedRequest, res: Response): Promise<void> {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Not authenticated' });
      return;
    }
    res.status(200).json({
      success: true,
      user: req.user,
    });
  }

  public static async updatePreferences(req: AuthenticatedRequest, res: Response): Promise<void> {
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
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  public static async logout(req: AuthenticatedRequest, res: Response): Promise<void> {
    if (req.user) {
      await AuditLog.create({
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
