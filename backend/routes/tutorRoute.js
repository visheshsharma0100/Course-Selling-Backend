import { Router } from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import tutorMiddleware from "../middleware/tutorMiddleware.js";
import { getTutorProfile, updateTutorProfile } from "../controllers/tutor_controller.js";
import { GetTutorCourses } from "../controllers/Courses_controller.js";
import { activateDevelopmentTutorSubscription, createTutorSubscriptionOrder, getTutorSubscription, verifyTutorSubscriptionPayment } from "../controllers/tutorSubscription_controller.js";

const tutorRouter = Router();

tutorRouter.get("/tutor/profile", authMiddleware, tutorMiddleware, getTutorProfile);
tutorRouter.put("/tutor/profile", authMiddleware, tutorMiddleware, updateTutorProfile);
tutorRouter.get("/tutor/courses", authMiddleware, tutorMiddleware, GetTutorCourses);
tutorRouter.get("/tutor/subscription", authMiddleware, tutorMiddleware, getTutorSubscription);
tutorRouter.post("/tutor/subscription/order", authMiddleware, tutorMiddleware, createTutorSubscriptionOrder);
tutorRouter.post("/tutor/subscription/verify", authMiddleware, tutorMiddleware, verifyTutorSubscriptionPayment);
tutorRouter.post("/tutor/subscription/development-activate", authMiddleware, tutorMiddleware, activateDevelopmentTutorSubscription);

export default tutorRouter;
