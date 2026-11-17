import mongoose from "mongoose";
import { config } from "dotenv";
config();

const ConnectedToDB = async()=>{
    await mongoose.connect(process.env.MONGO_URL);
    console.log("DB connected");
}

export default ConnectedToDB;