import mongoose, {Schema, Document} from "mongoose";
export interface IDRINKS extends Document {
    drink_name: string;
    category: string;
    description: string;
    price: number;
    image: string;
    created_at: Date;
}

const DrinksSchema: Schema = new Schema({
    drink_name: {type: String, required: true},
    category: {type: String},
    description: {type: String},
    price: {type: Number, required: true},
    image: {type: String},
    created_at: {type: Date, default: Date.now}
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
