import mongoose, { Document, Schema } from 'mongoose';

export interface IUserDocument extends Document {
  name: string;
  email: string;
  passwordHash: string;
  role: 'admin' | 'user';
  preferences: {
    theme: 'dark' | 'light' | 'system';
    speedUnit: 'km/h' | 'mph';
    defaultCity: string;
    defaultMapCenter: [number, number];
    defaultZoom: number;
    notificationAlerts: boolean;
    refreshIntervalSeconds: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUserDocument>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    passwordHash: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      enum: ['admin', 'user'],
      default: 'user',
      index: true,
    },
    preferences: {
      theme: { type: String, enum: ['dark', 'light', 'system'], default: 'dark' },
      speedUnit: { type: String, enum: ['km/h', 'mph'], default: 'km/h' },
      defaultCity: { type: String, default: 'San Francisco' },
      defaultMapCenter: { type: [Number], default: [37.7749, -122.4194] },
      defaultZoom: { type: Number, default: 13 },
      notificationAlerts: { type: Boolean, default: true },
      refreshIntervalSeconds: { type: Number, default: 15 },
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform(_doc, ret: any) {
        delete ret.passwordHash;
        ret.id = ret._id;
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  }
);

export const User = mongoose.model<IUserDocument>('User', UserSchema);
