import mongoose from "mongoose";
import Course from "../Schema/Course.schema.js";

const invalidId = (res) => res.status(400).json({
    message: "Invalid course ID.",
});

const handleCourseError = (res, error) => {
    if (error.name === "ValidationError" || error.name === "CastError") {
        return res.status(400).json({ message: error.message });
    }
    return res.status(500).json({ message: error.message });
};

export const GetCourse = async (req, res) => {
    try {
        const courses = await Course.find({ isPublished: true });
        return res.status(200).json({
            message: "Published courses",
            data: courses,
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
        const course = await Course.findOne({ _id: courseId, isPublished: true });
        if (!course) {
            return res.status(404).json({ message: "Course not found." });
        }
        return res.status(200).json({
            message: "Course details",
            data: course,
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
            isPublished,
            syllabus,
        });
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

    const allowedFields = ["title", "description", "image_url", "price", "isPublished", "syllabus"];
    const updates = Object.fromEntries(
        allowedFields
            .filter((field) => Object.hasOwn(req.body || {}, field))
            .map((field) => [field, req.body[field]])
    );
    if (Object.keys(updates).length === 0) {
        return res.status(400).json({ message: "Provide at least one valid course field to update." });
    }

    try {
        const course = await Course.findByIdAndUpdate(
            courseId,
            updates,
            { new: true, runValidators: true }
        );
        if (!course) {
            return res.status(404).json({ message: "Course not found." });
        }
        return res.status(200).json({
            message: "Course updated.",
            data: course,
        });
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
        const course = await Course.findByIdAndDelete(courseId);
        if (!course) {
            return res.status(404).json({ message: "Course not found." });
        }
        return res.status(200).json({ message: "Course deleted." });
    } catch (error) {
        return handleCourseError(res, error);
    }
};
