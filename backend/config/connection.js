import mongoose from "mongoose";
import { config } from "dotenv";
config();

const ConnectedToDB = async()=>{
    if (!process.env.MONGO_URL) {
        throw new Error("MONGO_URL is missing. Add it to backend/.env before starting the server.");
    }
    await mongoose.connect(process.env.MONGO_URL, {
        serverSelectionTimeoutMS: 10000,
    });
    console.log("DB connected");
}

export default ConnectedToDB;
