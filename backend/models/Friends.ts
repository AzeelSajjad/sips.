import mongoose, {Schema, Document} from "mongoose";
export interface IFRIENDS extends Document {
    friend: mongoose.Types.ObjectId;
    user: mongoose.Types.ObjectId;
    created_at: Date;
}
