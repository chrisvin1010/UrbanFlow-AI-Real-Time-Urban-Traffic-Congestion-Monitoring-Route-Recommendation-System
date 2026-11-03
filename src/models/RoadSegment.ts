import mongoose, { Document, Schema } from 'mongoose';

export type CongestionCategory = 'free_flow' | 'moderate' | 'heavy' | 'severe';

export interface IRoadSegmentDocument extends Document {
  roadName: string;
  area: string;
  city: string;
  geometry: {
    type: 'LineString';
    coordinates: number[][]; // GeoJSON format: [lng, lat][]
  };
  // Precomputed [lat, lng][] array for direct Leaflet consumption
  leafletCoordinates: [number, number][];
  currentSpeed: number; // km/h
  freeFlowSpeed: number; // km/h
  congestionScore: number; // 0 to 100
  congestionCategory: CongestionCategory;
  vehicleCount: number;
  lengthKm: number;
  lanes: number;
  trafficSource: 'simulated' | 'live_feed' | 'manual';
  lastUpdated: Date;
  createdAt: Date;
  updatedAt: Date;
}

const RoadSegmentSchema = new Schema<IRoadSegmentDocument>(
  {
    roadName: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    area: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    city: {
      type: String,
      default: 'San Francisco',
      index: true,
    },
    geometry: {
      type: {
        type: String,
        enum: ['LineString'],
        default: 'LineString',
        required: true,
      },
      coordinates: {
        type: [[Number]], // array of [lng, lat]
        required: true,
      },
    },
    leafletCoordinates: {
      type: [[Number]], // array of [lat, lng]
      required: true,
    },
    currentSpeed: {
      type: Number,
      required: true,
      min: 0,
    },
    freeFlowSpeed: {
      type: Number,
      required: true,
      min: 10,
      default: 50,
    },
    congestionScore: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
      index: true,
    },
    congestionCategory: {
      type: String,
      enum: ['free_flow', 'moderate', 'heavy', 'severe'],
      default: 'free_flow',
      index: true,
    },
    vehicleCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    lengthKm: {
      type: Number,
      default: 1.5,
    },
    lanes: {
      type: Number,
      default: 2,
    },
    trafficSource: {
      type: String,
      enum: ['simulated', 'live_feed', 'manual'],
      default: 'simulated',
    },
    lastUpdated: {
      type: Date,
      default: Date.now,
      index: true,
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

// 2dsphere index on GeoJSON geometry
RoadSegmentSchema.index({ geometry: '2dsphere' });
RoadSegmentSchema.index({ city: 1, area: 1, congestionCategory: 1 });

export const RoadSegment = mongoose.model<IRoadSegmentDocument>('RoadSegment', RoadSegmentSchema);
