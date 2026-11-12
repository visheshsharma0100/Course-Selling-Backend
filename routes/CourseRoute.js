import { Router } from "express";
import { deleteCourseById, GetCourse, GetCourseById, PostCourses, updateCourseById } from "../controllers/Courses_controller.js";
import adminMiddleware from "../middleware/adminMiddleware.js"
import authmiddleware from "../middleware/authMiddleware.js"
const CourseRouter = Router();

// Post course by admin
CourseRouter.post("/course", authmiddleware, adminMiddleware, PostCourses)

// Get courses by user 
CourseRouter.get("/course", GetCourse);

// Get course by given id 
CourseRouter.get("/course/:id", GetCourseById);

// Update Course by admin
CourseRouter.put("/course/:id", authmiddleware, adminMiddleware, updateCourseById);

// delete Course by admin
CourseRouter.delete("/course/:id", authmiddleware, adminMiddleware, deleteCourseById);

export default CourseRouter;