import mongoose, { Schema, Document } from 'mongoose';
export interface IUSER extends Document {
    name: string;
    email: string;
    password: string;
    profilePicture : string;
    rankedDrinks: mongoose.Types.ObjectId;
    createdAt: Date;
}

const UserSchema: Schema = new Schema({
    name: {type: String, required: true, unique: true},
    email: {type: String, required: true, unique: true},
    password: {type: String, required: true},
    profilePicture: {type: String, default: null},
    rankedDrinks: [{ type: Schema.Types.ObjectId, ref: 'Drinks' }],
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