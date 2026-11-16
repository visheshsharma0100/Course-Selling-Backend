import { Router } from "express";
import { deleteCourseById, GetCourse, GetCourseById, PostCourses, updateCourseById } from "../controllers/Courses_controller.js";
import adminMiddleware from "../middleware/adminMiddleware.js";
import authMiddleware from "../middleware/authMiddleware.js";

const CourseRouter = Router();

CourseRouter.get(["/courses", "/course"], GetCourse);
CourseRouter.get(["/courses/:id", "/course/:id"], GetCourseById);

CourseRouter.post(["/courses", "/course"], authMiddleware, adminMiddleware, PostCourses);
CourseRouter.put(["/courses/:id", "/course/:id"], authMiddleware, adminMiddleware, updateCourseById);
CourseRouter.delete(["/courses/:id", "/course/:id"], authMiddleware, adminMiddleware, deleteCourseById);

export default CourseRouter;