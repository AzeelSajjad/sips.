import mongoose, {Schema, Document} from "mongoose";
export interface IRATINGS extends Document {
    user: mongoose.Types.ObjectId;
    drink: mongoose.Types.ObjectId;
    rating: number;
    comment: string;
    created_at: Date;
    image: string;
}

const RatingsSchema: Schema = new Schema({
    user: {type: Schema.Types.ObjectId, ref: 'User', required: true},
    drink: {type: Schema.Types.ObjectId, ref: 'Drinks', required: true},
    rating: {type: Number, required: true, min: 1, max: 10},
    comment: {type: String},
    created_at: {type: Date, default: Date.now},
    image: {type: String}
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

export default mongoose.model<IRATINGS>('Ratings', RatingsSchema);