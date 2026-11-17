import express from 'express';
import  { config } from 'dotenv';
import ConnectedToDB from './config/connection.js';
import authRouter from './config/routes/authRoute.js';
import CourseRouter from './config/routes/CourseRoute.js';
import PurchaseRouter from './config/routes/PurchasesRoute.js';

config();
const app = express();
const port = process.env.port
app.use(express.json());

app.get("/", (req, res) => {
    res.send("Hello from the server");
});

// user endpoints
app.use("/api/v1/",authRouter);

// course endpoints
app.use("/api/v1/",CourseRouter);

// purchase endpoints
app.use("/api/v1/",PurchaseRouter);

const startServer = async () => {
    await ConnectedToDB();
    app.listen(port, () => {
        console.log(`Server has been started at port: ${port}`);
    });
};

startServer().catch((error) => {
    console.error("Server startup failed:", error.message);
    process.exitCode = 1;
});