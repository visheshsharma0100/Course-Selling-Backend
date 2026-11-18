import mongoose from "mongoose";
import fs from "fs/promises";
import path from "path";
import crypto from "crypto";
import Course from "../Schema/Course.schema.js";
import Purchase from "../Schema/purchases.schema.js";
import TutorProfile from "../Schema/tutorProfile.schema.js";
import { courseVideoDirectory } from "../middleware/courseVideoUpload.js";
import { normalizeRole } from "../utils/users.js";
import { getJwtSecret } from "../utils/jwt.js";
import { invalidateCourseCache } from "../utils/cache.js";

const invalidId = (res) => res.status(400).json({
    message: "Invalid course ID.",
});

const handleCourseError = (res, error) => {
    if (error.name === "ValidationError" || error.name === "CastError") {
        return res.status(400).json({ message: error.message });
    }
    return res.status(500).json({ message: error.message });
};

const normalizeSyllabus = (syllabus) => {
    if (!Array.isArray(syllabus)) return [];
    return syllabus
        .map((topic) => {
            if (typeof topic === "string") return { title: topic.trim() };
            if (topic && typeof topic === "object" && typeof topic.title === "string") {
                return { title: topic.title.trim(), ...(topic.video ? { video: topic.video } : {}) };
            }
            return null;
        })
        .filter((topic) => topic?.title);
};

const getTopicIndex = (value) => {
    if (!/^\d+$/.test(value || "")) return null;
    return Number(value);
};

const hasCourseAccess = async (user, courseId) => {
    if (user?.role === "admin") return true;
    return Boolean(await Purchase.exists({
        user_id: user?._id,
        course_id: courseId,
        $or: [{ payment_status: "captured" }, { payment_status: { $exists: false } }],
    }));
};

const isAdmin = (user) => normalizeRole(user?.role) === "admin";

const publicCourseFilter = (courseId) => ({
    ...(courseId ? { _id: courseId } : {}),
    isPublished: true,
    // Existing published records created before approvalStatus was introduced
    // remain visible until a controlled course migration is run.
    $or: [{ approvalStatus: "approved" }, { approvalStatus: { $exists: false } }],
});

const canManageCourse = (user, course) => isAdmin(user)
    || (course.instructor_id && String(course.instructor_id) === String(user?._id));

const canWatchCourse = async (user, course) => canManageCourse(user, course)
    || await hasCourseAccess(user, course._id);

const signVideoAccess = (courseId, topicIndex) => {
    const payload = Buffer.from(JSON.stringify({
        courseId: String(courseId),
        topicIndex,
        expiresAt: Date.now() + (5 * 60 * 1000),
    })).toString("base64url");
    const signature = crypto.createHmac("sha256", getJwtSecret()).update(payload).digest("base64url");
    return `${payload}.${signature}`;
};

const verifyVideoAccess = (token, courseId, topicIndex) => {
    if (typeof token !== "string") return false;
    const [payload, signature] = token.split(".");
    if (!payload || !signature) return false;
    const expected = crypto.createHmac("sha256", getJwtSecret()).update(payload).digest("base64url");
    if (expected.length !== signature.length || !crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature))) return false;
    try {
        const decoded = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
        return decoded.courseId === String(courseId)
            && decoded.topicIndex === topicIndex
            && Number.isSafeInteger(decoded.expiresAt)
            && decoded.expiresAt > Date.now();
    } catch {
        return false;
    }
};

const isMp4File = async (filePath) => {
    const handle = await fs.open(filePath, "r");
    try {
        const { buffer, bytesRead } = await handle.read(Buffer.alloc(12), 0, 12, 0);
        // ISO Base Media format files (which include MP4) contain the ftyp box
        // after the initial 4-byte size field.
        return bytesRead >= 8 && buffer.subarray(4, 8).toString("ascii") === "ftyp";
    } finally {
        await handle.close();
    }
};

const instructorPopulate = { path: "instructor_id", select: "username role profileImage" };

const attachPublicInstructor = async (course) => {
    const data = course.toObject();
    const user = data.instructor_id;
    // Legacy courses predate instructor ownership and were platform-created.
    if (!user || typeof user !== "object") {
        data.instructor = { id: null, name: "SkillStack Admin", role: "admin" };
        return data;
    }
    if (normalizeRole(user.role) === "admin") {
        data.instructor = { id: user._id, name: "SkillStack Admin", role: "admin" };
        return data;
    }
    if (normalizeRole(user.role) !== "tutor") return data;
    const profile = await TutorProfile.findOne({ user_id: user._id })
        .select("bio expertise education profileImage ratingAverage ratingCount");
    data.instructor = {
        id: user._id,
        name: user.username,
        role: "tutor",
        profileImage: profile?.profileImage || user.profileImage || "",
        bio: profile?.bio || "",
        expertise: profile?.expertise || "",
        education: profile?.education || "",
        ratingAverage: profile?.ratingAverage || 0,
        ratingCount: profile?.ratingCount || 0,
    };
    return data;
};

export const GetCourse = async (req, res) => {
    try {
        const courses = await Course.find(publicCourseFilter()).populate(instructorPopulate);
        return res.status(200).json({
            message: "Published courses",
            data: await Promise.all(courses.map(attachPublicInstructor)),
        });
    } catch (error) {
        return handleCourseError(res, error);
    }
};

export const GetCourseById = async (req, res) => {
    const courseId = req.params.id;
    if (!mongoose.isObjectIdOrHexString(courseId)) {
        return invalidId(res);
    }

    try {
        const course = await Course.findOne(publicCourseFilter(courseId)).populate(instructorPopulate);
        if (!course) {
            return res.status(404).json({ message: "Course not found." });
        }
        return res.status(200).json({
            message: "Course details",
            data: await attachPublicInstructor(course),
        });
    } catch (error) {
        return handleCourseError(res, error);
    }
};

export const PostCourses = async (req, res) => {
    try {
        const {
            title,
            description,
            image_url,
            price,
            isPublished,
            syllabus,
        } = req.body || {};
        const course = await Course.create({
            title,
            description,
            image_url,
            price,
            category: req.body?.category,
            instructor_id: req.user._id,
            // A tutor with an approved account and active subscription is
            // self-service: they control publication of their own courses.
            // The route middleware has already enforced that eligibility.
            isPublished: Boolean(isPublished),
            approvalStatus: "approved",
            syllabus: normalizeSyllabus(syllabus),
        });
        await invalidateCourseCache();
        return res.status(201).json({
            message: "Course created.",
            data: course,
        });
    } catch (error) {
        return handleCourseError(res, error);
    }
};

export const updateCourseById = async (req, res) => {
    const courseId = req.params.id;
    if (!mongoose.isObjectIdOrHexString(courseId)) {
        return invalidId(res);
    }

    let course;
    try {
        course = await Course.findById(courseId);
    } catch (error) {
        return handleCourseError(res, error);
    }
    if (!course) return res.status(404).json({ message: "Course not found." });
    if (!canManageCourse(req.user, course)) {
        return res.status(403).json({ message: "You can only edit your own courses." });
    }

    const allowedFields = isAdmin(req.user)
        ? ["title", "description", "image_url", "price", "category", "isPublished", "approvalStatus", "syllabus"]
        : ["title", "description", "image_url", "price", "category", "isPublished", "syllabus"];
    const updates = Object.fromEntries(
        allowedFields
            .filter((field) => Object.hasOwn(req.body || {}, field))
            .map((field) => [field, req.body[field]])
    );
    if (Object.hasOwn(updates, "syllabus")) {
        updates.syllabus = normalizeSyllabus(updates.syllabus);
    }
    if (Object.keys(updates).length === 0) {
        return res.status(400).json({ message: "Provide at least one valid course field to update." });
    }

    try {
        const course = await Course.findByIdAndUpdate(
            courseId,
            updates,
            { returnDocument: "after", runValidators: true }
        );
        if (!course) {
            return res.status(404).json({ message: "Course not found." });
        }
        await invalidateCourseCache(courseId);
        return res.status(200).json({
            message: "Course updated.",
            data: course,
        });
    } catch (error) {
        return handleCourseError(res, error);
    }
};

export const UploadCourseVideo = async (req, res) => {
    const courseId = req.params.courseId;
    const topicIndex = getTopicIndex(req.params.topicIndex);
    if (!mongoose.isObjectIdOrHexString(courseId) || topicIndex === null) {
        return res.status(400).json({ message: "Invalid course or topic ID." });
    }
    if (!req.file) {
        return res.status(400).json({ message: "Attach an MP4 video file using the video field." });
    }

    try {
        if (!(await isMp4File(req.file.path))) {
            await fs.unlink(req.file.path).catch(() => {});
            return res.status(400).json({ message: "The uploaded file is not a valid MP4 video." });
        }
        const course = await Course.findById(courseId);
        if (!course) return res.status(404).json({ message: "Course not found." });

        const syllabus = normalizeSyllabus(course.syllabus);
        if (!syllabus[topicIndex]) {
            await fs.unlink(req.file.path).catch(() => {});
            return res.status(404).json({ message: "Syllabus topic not found." });
        }

        const previousFile = syllabus[topicIndex].video?.filename;
        syllabus[topicIndex].video = {
            filename: req.file.filename,
            originalName: req.file.originalname,
            mimeType: req.file.mimetype,
            size: req.file.size,
        };
        course.syllabus = syllabus;
        course.markModified("syllabus");
        await course.save();
        await invalidateCourseCache(courseId);

        if (previousFile && previousFile !== req.file.filename) {
            await fs.unlink(path.join(courseVideoDirectory, path.basename(previousFile))).catch(() => {});
        }
        return res.status(200).json({
            message: "Topic video uploaded successfully.",
            data: course,
        });
    } catch (error) {
        await fs.unlink(req.file.path).catch(() => {});
        return handleCourseError(res, error);
    }
};

export const CreateCourseVideoAccess = async (req, res) => {
    const courseId = req.params.courseId;
    const topicIndex = getTopicIndex(req.params.topicIndex);
    if (!mongoose.isObjectIdOrHexString(courseId) || topicIndex === null) {
        return res.status(400).json({ message: "Invalid course or topic ID." });
    }
    try {
        const course = await Course.findById(courseId);
        if (!course) return res.status(404).json({ message: "Course not found." });
        if (!(await canWatchCourse(req.user, course))) {
            return res.status(403).json({ message: "Purchase this course to watch its videos." });
        }
        const topic = normalizeSyllabus(course.syllabus)[topicIndex];
        if (!topic?.video?.filename) return res.status(404).json({ message: "No video has been added for this topic yet." });
        return res.status(200).json({
            message: "Video access granted.",
            data: {
                streamUrl: `/api/v1/courses/${courseId}/videos/${topicIndex}/stream?access_token=${encodeURIComponent(signVideoAccess(courseId, topicIndex))}`,
                expiresInSeconds: 300,
            },
        });
    } catch (error) {
        return handleCourseError(res, error);
    }
};

export const StreamCourseVideo = async (req, res) => {
    const courseId = req.params.courseId;
    const topicIndex = getTopicIndex(req.params.topicIndex);
    if (!mongoose.isObjectIdOrHexString(courseId) || topicIndex === null) {
        return res.status(400).json({ message: "Invalid course or topic ID." });
    }

    try {
        if (!verifyVideoAccess(req.query.access_token, courseId, topicIndex)) {
            return res.status(401).json({ message: "Video access has expired. Reload the lesson and try again." });
        }
        const course = await Course.findById(courseId);
        if (!course) return res.status(404).json({ message: "Course not found." });

        const topic = normalizeSyllabus(course.syllabus)[topicIndex];
        const filename = topic?.video?.filename;
        if (!filename) return res.status(404).json({ message: "No video has been added for this topic yet." });

        const videoPath = path.join(courseVideoDirectory, path.basename(filename));
        await fs.access(videoPath);
        res.set({
            "Content-Type": "video/mp4",
            "Content-Disposition": "inline",
            "Cache-Control": "private, no-store",
            "Accept-Ranges": "bytes",
        });
        return res.sendFile(videoPath);
    } catch (error) {
        if (error.code === "ENOENT") {
            return res.status(404).json({ message: "The video file is unavailable." });
        }
        return handleCourseError(res, error);
    }
};

export const DeleteCourseVideo = async (req, res) => {
    const courseId = req.params.courseId;
    const topicIndex = getTopicIndex(req.params.topicIndex);
    if (!mongoose.isObjectIdOrHexString(courseId) || topicIndex === null) {
        return res.status(400).json({ message: "Invalid course or topic ID." });
    }
    try {
        const course = await Course.findById(courseId);
        if (!course) return res.status(404).json({ message: "Course not found." });
        const syllabus = normalizeSyllabus(course.syllabus);
        const topic = syllabus[topicIndex];
        if (!topic) return res.status(404).json({ message: "Syllabus topic not found." });
        if (!topic.video?.filename) return res.status(404).json({ message: "No video is attached to this topic." });

        const filename = topic.video.filename;
        delete topic.video;
        course.syllabus = syllabus;
        course.markModified("syllabus");
        await course.save();
        await invalidateCourseCache(courseId);
        await fs.unlink(path.join(courseVideoDirectory, path.basename(filename))).catch(() => {});
        return res.status(200).json({ message: "Topic video deleted successfully.", data: course });
    } catch (error) {
        return handleCourseError(res, error);
    }
};

export const deleteCourseById = async (req, res) => {
    const courseId = req.params.id;
    if (!mongoose.isObjectIdOrHexString(courseId)) {
        return invalidId(res);
    }

    try {
        const course = await Course.findById(courseId);
        if (!course) {
            return res.status(404).json({ message: "Course not found." });
        }
        if (!canManageCourse(req.user, course)) {
            return res.status(403).json({ message: "You can only delete your own courses." });
        }
        await course.deleteOne();
        await invalidateCourseCache(courseId);
        return res.status(200).json({ message: "Course deleted." });
    } catch (error) {
        return handleCourseError(res, error);
    }
};

export const GetTutorCourses = async (req, res) => {
    try {
        const courses = await Course.find({ instructor_id: req.user._id }).sort({ updatedAt: -1 });
        return res.status(200).json({ message: "Your tutor courses fetched successfully.", data: courses });
    } catch (error) {
        return handleCourseError(res, error);
    }
};

export const GetAdminCourses = async (_req, res) => {
    try {
        const courses = await Course.find()
            .populate("instructor_id", "username email profileImage")
            .sort({ updatedAt: -1 });
        return res.status(200).json({ message: "All courses fetched successfully.", data: courses });
    } catch (error) {
        return handleCourseError(res, error);
    }
};

export const ensureCourseManager = async (req, res, next) => {
    const courseId = req.params.courseId || req.params.id;
    if (!mongoose.isObjectIdOrHexString(courseId)) {
        return res.status(400).json({ message: "Invalid course ID." });
    }
    try {
        const course = await Course.findById(courseId);
        if (!course) return res.status(404).json({ message: "Course not found." });
        if (!canManageCourse(req.user, course)) {
            return res.status(403).json({ message: "You can only manage videos for your own courses." });
        }
        req.course = course;
        return next();
    } catch (error) {
        return handleCourseError(res, error);
    }
};
