import mongoose, {Schema, Document} from "mongoose"

export enum ratingContext {
    Loved = 'loved',
    Liked = 'liked',
    Disliked = 'disliked'
}

export interface IPREFERENCE extends Document {
    user: mongoose.Types.ObjectId;
    preferred: mongoose.Types.ObjectId;
    against: mongoose.Types.ObjectId;
    createdAt: Date;
}

const PreferenceSchema: Schema = new Schema({
    user: {type: mongoose.Types.ObjectId, ref: 'User', required: true},
    preferred: {type: mongoose.Types.ObjectId, ref: 'Drinks', required: true},
    against: {type: mongoose.Types.ObjectId, ref: 'Drinks', required: true},
    ratingContext : {
        type: String,
        enum: Object.values(ratingContext),
        required: true
    },
    createdAt: {type: Date, default: Date.now}
},{
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

export default mongoose.model<IPREFERENCE>('Preference', PreferenceSchema)