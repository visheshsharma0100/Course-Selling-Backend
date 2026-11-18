import { Router } from "express";
import { CreatePurchaseOrder, DeletePurchase, GetAllPurchases, GetMyPurchases, GetPurchaseById, UpdatePurchase, VerifyPurchasePayment } from "../controllers/Purchases_controller.js";
import authMiddleware from "../middleware/authMiddleware.js";
import adminMiddleware from "../middleware/adminMiddleware.js";

const PurchaseRouter = Router();

PurchaseRouter.post("/purchase/:courseId/order", authMiddleware, CreatePurchaseOrder);
PurchaseRouter.post("/purchase/:courseId/verify", authMiddleware, VerifyPurchasePayment);

PurchaseRouter.get("/purchase/my", authMiddleware, GetMyPurchases);
PurchaseRouter.get("/purchase/all", authMiddleware, adminMiddleware, GetAllPurchases);
PurchaseRouter.get("/purchase/:purchaseId", authMiddleware, adminMiddleware, GetPurchaseById);

// Preserve the original user-scoped endpoint without exposing other users' purchases.
PurchaseRouter.get("/purchase", authMiddleware, GetMyPurchases);

PurchaseRouter.put("/purchase/:purchaseId", authMiddleware, adminMiddleware, UpdatePurchase);
PurchaseRouter.delete("/purchase/:purchaseId", authMiddleware, adminMiddleware, DeletePurchase);

export default PurchaseRouter;
