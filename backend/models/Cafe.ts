import mongoose, { Schema, Document } from 'mongoose';
export interface ICAFE extends Document {
    name: string;
    location: string;
    description: string;
    createdAt: Date;
    average_rating: number;
    operating_hours: string;
}

const CafeSchema: Schema = new Schema({
    name: {type: String, required: true},
    location: {type: String, required: true},
    description: {type: String},
    createdAt: {type: Date, default: Date},
    average_rating: {type: Number, required: true, default: 0},
    operating_hours: {type: String, required: true}
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