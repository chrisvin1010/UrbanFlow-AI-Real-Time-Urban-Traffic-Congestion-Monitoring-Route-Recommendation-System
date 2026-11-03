import mongoose, { Document, Schema } from 'mongoose';

export type IncidentType = 'accident' | 'construction' | 'congestion' | 'hazard' | 'roadwork' | 'event';
export type IncidentSeverity = 'low' | 'medium' | 'high' | 'critical';
export type IncidentStatus = 'reported' | 'investigating' | 'confirmed' | 'clearing' | 'resolved';

export interface ITrafficIncidentDocument extends Document {
  title: string;
  type: IncidentType;
  description: string;
  roadName: string;
  location: {
    type: 'Point';
    coordinates: [number, number]; // [lng, lat] GeoJSON
  };
  latitude: number;
  longitude: number;
  severity: IncidentSeverity;
  status: IncidentStatus;
  impactRadiusMeters: number;
  estimatedDelayMinutes: number;
  reportedBy?: mongoose.Types.ObjectId;
  resolvedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const TrafficIncidentSchema = new Schema<ITrafficIncidentDocument>(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    type: {
      type: String,
      enum: ['accident', 'construction', 'congestion', 'hazard', 'roadwork', 'event'],
      required: true,
      index: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    roadName: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    location: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point',
      },
      coordinates: {
        type: [Number], // [lng, lat]
        required: true,
      },
    },
    latitude: {
      type: Number,
      required: true,
    },
    longitude: {
      type: Number,
      required: true,
    },
    severity: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical'],
      default: 'medium',
      index: true,
    },
    status: {
      type: String,
      enum: ['reported', 'investigating', 'confirmed', 'clearing', 'resolved'],
      default: 'reported',
      index: true,
    },
    impactRadiusMeters: {
      type: Number,
      default: 500,
    },
    estimatedDelayMinutes: {
      type: Number,
      default: 10,
    },
    reportedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    resolvedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform(_doc, ret: any) {
        ret.id = ret._id;
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  }
);

TrafficIncidentSchema.index({ location: '2dsphere' });
TrafficIncidentSchema.index({ status: 1, severity: 1, createdAt: -1 });

export const TrafficIncident = mongoose.model<ITrafficIncidentDocument>('TrafficIncident', TrafficIncidentSchema);
