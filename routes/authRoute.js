import { Router } from "express";
import signup from "../controllers/auth_controller.js";
import signin from "../controllers/signin_controller.js";

const authRouter = Router();

authRouter.post("/signup", signup);

authRouter.post("/login",signin);

export default authRouter;