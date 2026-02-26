import mongoose, { Schema, Document } from 'mongoose';
export interface ICAFE extends Document {
    name: string;
    placeId: string;
    location: string;
    address: string;
    description: string;
    createdAt: Date;
    average_rating: number;
    operating_hours: string;
    latitude: number;
    longitude: number;
}

const CafeSchema: Schema = new Schema({
    name: {type: String, required: true},
    placeId: {type: String, required: true, unique: true},
    location: {type: String},
    address: {type: String},
    description: {type: String},
    createdAt: {type: Date, default: Date.now},
    average_rating: {type: Number, default: 0},
    operating_hours: {type: String},
    latitude: {type: Number},
    longitude: {type: Number}
}, {
    timestamps: true,
    toJSON: {
        virtuals: true,
        versionKey: false,
        transform: (_, ret) => {
            ret.id = ret._id.toString();
            delete ret._id;
        }
    },
    toObject: {
        virtuals: true,
    },
});

export default mongoose.model<ICAFE>('Cafe', CafeSchema);