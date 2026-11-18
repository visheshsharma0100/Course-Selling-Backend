import { Router } from "express";
import signup, { getCurrentUser } from "../controllers/auth_controller.js";
import signin from "../controllers/signin_controller.js";
import authMiddleware from "../middleware/authMiddleware.js";

const authRouter = Router();

authRouter.post("/signup", signup);

authRouter.post("/login",signin);
authRouter.get("/me", authMiddleware, getCurrentUser);

export default authRouter;
