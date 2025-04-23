import mongoose, {Schema, Document} from "mongoose";
export interface IDRINKS extends Document {
    drink: string;
    category: string;
    description: string;
    price: number;
    image: string;
    created_at: Date;
    average_rating: number;
    total_ratings: number;
    cafe: mongoose.Types.ObjectId;
}

const DrinksSchema: Schema = new Schema({
    drink: {type: String, required: true},
    category: {type: String},
    description: {type: String},
    price: {type: Number, required: true},
    image: {type: String},
    created_at: {type: Date, default: Date.now},
    average_rating: { type: Number, default: 0, min: 0, max: 10},
    total_ratings: { type: Number, default: 0},
    cafe: {type: Schema.Types.ObjectId, ref: 'Cafe', required: true}
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

export default mongoose.model<IDRINKS>('Drinks', DrinksSchema);
