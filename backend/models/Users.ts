import mongoose, { Schema, Document } from 'mongoose';

export interface IRankedDrink {
    drink: mongoose.Types.ObjectId;
    rating: number;
    comparisons: number;
}

export interface IUSER extends Document {
    name: string;
    email: string;
    password: string;
    profilePicture : string;
    rankedDrinks: IRankedDrink[];
    createdAt: Date;
}

const RankedDrinkSchema: Schema = new Schema({
    drink: { type: Schema.Types.ObjectId, ref: 'Drinks', required: true },
    rating: { type: Number, required: true, min: 1, max: 10, default: 5.0 },
    comparisons: { type: Number, default: 0 }
}, { _id: false });

const UserSchema: Schema = new Schema({
    name: {type: String, required: true, unique: true},
    email: {type: String, required: true, unique: true},
    password: {type: String, required: true},
    profilePicture: {type: String, default: null},
    rankedDrinks: [RankedDrinkSchema],
    createdAt: {type: Date, default: Date.now }
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

export default mongoose.model<IUSER>('User', UserSchema);