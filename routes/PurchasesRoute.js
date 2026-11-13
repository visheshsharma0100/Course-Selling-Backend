import { Router } from "express";
import { DeletePurchase, GetAllPurchases, GetMyPurchases, PostPurchase, UpdatePurchase } from "../controllers/Purchases_controller.js";
import authMiddleware from "../middleware/authMiddleware.js"
import adminMiddleware from "../middleware/adminMiddleware.js"
const PurchaseRouter = Router();

// Post route for buy 
PurchaseRouter.post("/purchase/:courseId",authMiddleware,PostPurchase);

// Get all brought course
PurchaseRouter.get("/purchase",authMiddleware,GetAllPurchases);

// Get Brought course by id from admin end
PurchaseRouter.get("/purchase/:Courseid",adminMiddleware,authMiddleware,GetMyPurchases);

// update purchase course
PurchaseRouter.put("/purchase/:CourseId",adminMiddleware,authMiddleware,UpdatePurchase);

// delete purchase course
PurchaseRouter.delete("/purchase/:CourseId",adminMiddleware,authMiddleware,DeletePurchase);
