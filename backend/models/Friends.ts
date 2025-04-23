import mongoose, {Schema, Document} from "mongoose";
export interface IFRIENDS extends Document {
    friend: mongoose.Types.ObjectId;
    user: mongoose.Types.ObjectId;
    created_at: Date;
}

const FriendsSchema: Schema = new Schema({
    friend: {type: Schema.Types.ObjectId, ref: 'User', required: true},
    user: {type: Schema.Types.ObjectId, ref: 'User', required: true},
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

export default mongoose.model<IFRIENDS>('Friends', FriendsSchema);