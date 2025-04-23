import mongoose, { Schema, Document } from 'mongoose';
export interface IUSER extends Document {
    username: string;
    email: string;
    password: string;
    profilePicture : string;
    createdAt: Date;
}

const UserSchema: Schema = new Schema({
    username: {type: String, required: true, unique: true},
    email: {type: String, required: true, unique: true},
    password: {type: String, required: true},
    profilePicture: {type: String, default: null},
    createdAt: {type: Date, default: Date}
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