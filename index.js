import express from 'express';
import  { config } from 'dotenv';
import ConnectedToDB from './config/connection.js';
import authRouter from './routes/authRoute.js';
import authmiddleware from './middleware/authMiddleware.js';

config();
const app = express();
const port = process.env.port
app.use(express.json())

app.get("/",(req,res)=>{
    res.send("Hello from the server");
})

app.use("/api/v1/",authRouter);



app.listen(port,()=>{
    ConnectedToDB();
    console.log(`Server has been started at port: ${port}`)
});