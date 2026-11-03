import mongoose, { Document, Schema } from 'mongoose';

export interface ITrafficSnapshotDocument extends Document {
  roadSegment: mongoose.Types.ObjectId;
  roadName: string;
  averageSpeed: number;
  vehicleCount: number;
  congestionScore: number;
  recordedAt: Date;
  dataSource: 'simulated' | 'live_feed';
  createdAt: Date;
}

const TrafficSnapshotSchema = new Schema<ITrafficSnapshotDocument>(
  {
    roadSegment: {
      type: Schema.Types.ObjectId,
      ref: 'RoadSegment',
      required: true,
      index: true,
    },
    roadName: {
      type: String,
      required: true,
      index: true,
    },
    averageSpeed: {
      type: Number,
      required: true,
    },
    vehicleCount: {
      type: Number,
      required: true,
    },
    congestionScore: {
      type: Number,
      required: true,
    },
    recordedAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
    dataSource: {
      type: String,
      enum: ['simulated', 'live_feed'],
      default: 'simulated',
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
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

// Compound indexes for time-series analytics
TrafficSnapshotSchema.index({ roadSegment: 1, recordedAt: -1 });
TrafficSnapshotSchema.index({ recordedAt: -1, congestionScore: -1 });

export const TrafficSnapshot = mongoose.model<ITrafficSnapshotDocument>('TrafficSnapshot', TrafficSnapshotSchema);
