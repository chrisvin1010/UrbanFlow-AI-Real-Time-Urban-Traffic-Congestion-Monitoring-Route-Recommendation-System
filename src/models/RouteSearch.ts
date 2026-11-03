import mongoose, { Document, Schema } from 'mongoose';

export interface IRouteSearchDocument extends Document {
  user?: mongoose.Types.ObjectId;
  originName: string;
  destinationName: string;
  originCoordinates: [number, number]; // [lat, lng]
  destinationCoordinates: [number, number]; // [lat, lng]
  routeDistanceMeters: number;
  durationSeconds: number;
  estimatedDurationSeconds: number;
  recommendationReason: string;
  dataSource: string;
  createdAt: Date;
}

const RouteSearchSchema = new Schema<IRouteSearchDocument>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      index: true,
    },
    originName: {
      type: String,
      required: true,
    },
    destinationName: {
      type: String,
      required: true,
    },
    originCoordinates: {
      type: [Number],
      required: true,
    },
    destinationCoordinates: {
      type: [Number],
      required: true,
    },
    routeDistanceMeters: {
      type: Number,
      required: true,
    },
    durationSeconds: {
      type: Number,
      required: true,
    },
    estimatedDurationSeconds: {
      type: Number,
      required: true,
    },
    recommendationReason: {
      type: String,
      required: true,
    },
    dataSource: {
      type: String,
      default: 'OSRM + Simulated Congestion Overlay',
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

RouteSearchSchema.index({ createdAt: -1 });

export const RouteSearch = mongoose.model<IRouteSearchDocument>('RouteSearch', RouteSearchSchema);
