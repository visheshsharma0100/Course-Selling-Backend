import mongoose from "mongoose";
import { config } from "dotenv";
config();

const ConnectedToDB = async()=>{
    try {
        await mongoose.connect(process.env.MONGO_URL);
        console.log("DB connected");
    } catch (error) {
        console.log("DB errro",error);
    }
}

export default ConnectedToDB;