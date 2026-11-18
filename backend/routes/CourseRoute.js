import { Router } from "express";
import { CreateCourseVideoAccess, DeleteCourseVideo, deleteCourseById, ensureCourseManager, GetCourse, GetCourseById, PostCourses, StreamCourseVideo, updateCourseById, UploadCourseVideo } from "../controllers/Courses_controller.js";
import authMiddleware from "../middleware/authMiddleware.js";
import courseVideoUpload, { maxCourseVideoSizeMb } from "../middleware/courseVideoUpload.js";
import { activeTutorSubscriptionMiddleware } from "../middleware/tutorSubscriptionMiddleware.js";
import { cachePublicGet } from "../utils/cache.js";

const CourseRouter = Router();

CourseRouter.get(["/courses/:courseId/videos/:topicIndex/access", "/course/:courseId/videos/:topicIndex/access"], authMiddleware, CreateCourseVideoAccess);
CourseRouter.get(["/courses/:courseId/videos/:topicIndex/stream", "/course/:courseId/videos/:topicIndex/stream"], StreamCourseVideo);
CourseRouter.post(["/courses/:courseId/videos/:topicIndex", "/course/:courseId/videos/:topicIndex"], authMiddleware, activeTutorSubscriptionMiddleware, ensureCourseManager, courseVideoUpload.single("video"), UploadCourseVideo);
CourseRouter.delete(["/courses/:courseId/videos/:topicIndex", "/course/:courseId/videos/:topicIndex"], authMiddleware, activeTutorSubscriptionMiddleware, ensureCourseManager, DeleteCourseVideo);

CourseRouter.get(["/courses", "/course"], cachePublicGet(() => "skillstack:courses:published", 60), GetCourse);
CourseRouter.get(["/courses/:id", "/course/:id"], cachePublicGet((req) => `skillstack:course:${req.params.id}`, 120), GetCourseById);

CourseRouter.post(["/courses", "/course"], authMiddleware, activeTutorSubscriptionMiddleware, PostCourses);
CourseRouter.put(["/courses/:id", "/course/:id"], authMiddleware, activeTutorSubscriptionMiddleware, updateCourseById);
CourseRouter.delete(["/courses/:id", "/course/:id"], authMiddleware, activeTutorSubscriptionMiddleware, deleteCourseById);

CourseRouter.use((error, _req, res, next) => {
    if (!error) return next();
    if (error.name === "MulterError") {
        return res.status(400).json({ message: error.code === "LIMIT_FILE_SIZE" ? `Video must be ${maxCourseVideoSizeMb} MB or smaller.` : error.message });
    }
    return res.status(400).json({ message: error.message || "Video upload failed." });
});

export default CourseRouter;
