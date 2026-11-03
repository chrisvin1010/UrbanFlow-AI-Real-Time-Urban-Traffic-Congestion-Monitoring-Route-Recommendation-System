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
exports.RoadSegment = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const RoadSegmentSchema = new mongoose_1.Schema({
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
}, {
    timestamps: true,
    toJSON: {
        transform(_doc, ret) {
            ret.id = ret._id;
            delete ret._id;
            delete ret.__v;
            return ret;
        },
    },
});
// 2dsphere index on GeoJSON geometry
RoadSegmentSchema.index({ geometry: '2dsphere' });
RoadSegmentSchema.index({ city: 1, area: 1, congestionCategory: 1 });
exports.RoadSegment = mongoose_1.default.model('RoadSegment', RoadSegmentSchema);
//# sourceMappingURL=RoadSegment.js.map