import mongoose from "mongoose";
import { environment } from "./environment";

const connectToDatabase = async () => {
    try {
        await mongoose.connect(environment.dbUri);
    } catch (error) {
        process.exit(1);
    }
}