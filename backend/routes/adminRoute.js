import { Router } from "express";
import { getTutors, updateTutorApproval } from "../controllers/adminTutor_controller.js";
import { GetAdminCourses } from "../controllers/Courses_controller.js";
import adminMiddleware from "../middleware/adminMiddleware.js";
import authMiddleware from "../middleware/authMiddleware.js";

const adminRouter = Router();

adminRouter.get("/admin/tutors", authMiddleware, adminMiddleware, getTutors);
adminRouter.put("/admin/tutors/:tutorId/approval", authMiddleware, adminMiddleware, updateTutorApproval);
adminRouter.get("/admin/courses", authMiddleware, adminMiddleware, GetAdminCourses);

export default adminRouter;
