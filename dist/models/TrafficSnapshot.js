"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.TrafficSnapshot = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const TrafficSnapshotSchema = new mongoose_1.Schema({
    roadSegment: {
        type: mongoose_1.Schema.Types.ObjectId,
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
}, {
    timestamps: { createdAt: true, updatedAt: false },
    toJSON: {
        transform(_doc, ret) {
            ret.id = ret._id;
            delete ret._id;
            delete ret.__v;
            return ret;
        },
    },
});
// Compound indexes for time-series analytics
TrafficSnapshotSchema.index({ roadSegment: 1, recordedAt: -1 });
TrafficSnapshotSchema.index({ recordedAt: -1, congestionScore: -1 });
exports.TrafficSnapshot = mongoose_1.default.model('TrafficSnapshot', TrafficSnapshotSchema);
//# sourceMappingURL=TrafficSnapshot.js.map