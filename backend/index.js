import express from 'express';
import  { config } from 'dotenv';
import ConnectedToDB from './config/connection.js';
import authRouter from './routes/authRoute.js';
import CourseRouter from './routes/CourseRoute.js';
import PurchaseRouter from './routes/PurchasesRoute.js';
import tutorRouter from './routes/tutorRoute.js';
import adminRouter from './routes/adminRoute.js';
import { createRateLimiter } from './middleware/rateLimit.js';
import { handleRazorpayWebhook } from './controllers/tutorSubscription_controller.js';

config();
const app = express();
const port = Number(process.env.PORT || process.env.port || 8000);
if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error("PORT must be a valid TCP port number.");
}

const configuredOrigins = (process.env.CLIENT_ORIGIN || "http://localhost:5173,http://127.0.0.1:5173")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);

app.disable("x-powered-by");
app.use((req, res, next) => {
    const origin = req.headers.origin;
    if (origin && configuredOrigins.includes(origin)) {
        res.set("Access-Control-Allow-Origin", origin);
        res.set("Vary", "Origin");
        res.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
        res.set("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS");
    }
    res.set("X-Content-Type-Options", "nosniff");
    res.set("X-Frame-Options", "DENY");
    res.set("Referrer-Policy", "strict-origin-when-cross-origin");
    if (req.method === "OPTIONS") return res.sendStatus(204);
    return next();
});

// Razorpay signs the exact raw JSON bytes. This route must stay before the
// JSON parser; it does its own signature verification in the controller.
app.post("/api/v1/payments/webhook", express.raw({ type: "application/json" }), handleRazorpayWebhook);
app.use(express.json({ limit: "1mb" }));
app.use("/api/v1", createRateLimiter({
    windowMs: 15 * 60 * 1000,
    max: 300,
    message: "Too many requests. Please try again later.",
}));

const authenticationRateLimit = createRateLimiter({
    windowMs: 15 * 60 * 1000,
    max: 10,
    message: "Too many authentication attempts. Please try again in 15 minutes.",
});

app.get("/", (req, res) => {
    res.send("Hello from the server");
});

// user endpoints
app.use("/api/v1/login", authenticationRateLimit);
app.use("/api/v1/signup", authenticationRateLimit);
app.use("/api/v1/", authRouter);

// course endpoints
app.use("/api/v1/",CourseRouter);

// purchase endpoints
app.use("/api/v1/",PurchaseRouter);

// tutor endpoints
app.use("/api/v1/", tutorRouter);

// platform administration endpoints
app.use("/api/v1/", adminRouter);

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
