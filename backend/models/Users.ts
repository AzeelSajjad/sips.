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
    password: {type: String, required: true, unique: true},
    profilePicture: {type: String, default: null},
    createdAt: {type: Date, default: Date}
})

export default mongoose.model<IUSER>('User', UserSchema);