import mongoose from "mongoose";
import Course from "../Schema/Course.schema.js";
import Purchase from "../Schema/purchases.schema.js";

const invalidPurchaseId = (res) => res.status(400).json({
    success: false,
    message: "Invalid purchase ID.",
});

const handlePurchaseError = (res, error) => {
    if (error.code === 11000) {
        return res.status(409).json({
            success: false,
            message: "You have already purchased this course.",
        });
    }
    if (error.name === "ValidationError" || error.name === "CastError") {
        return res.status(400).json({
            success: false,
            message: error.message,
        });
    }
    return res.status(500).json({
        success: false,
        message: error.message,
    });
};

export const PostPurchase = async (req, res) => {
    const userId = req.user_id;
    const courseId = req.params.courseId;

    if (!userId) {
        return res.status(401).json({
            success: false,
            message: "Authentication required.",
        });
    }
    if (!mongoose.isObjectIdOrHexString(courseId)) {
        return res.status(400).json({
            success: false,
            message: "Invalid course ID.",
        });
    }

    try {
        const course = await Course.findById(courseId);
        if (!course || !course.isPublished) {
            return res.status(404).json({
                success: false,
                message: "Published course not found.",
            });
        }

        const existingPurchase = await Purchase.findOne({
            user_id: userId,
            course_id: courseId,
        });
        if (existingPurchase) {
            return res.status(409).json({
                success: false,
                message: "You have already purchased this course.",
            });
        }

        const purchase = await Purchase.create({
            user_id: userId,
            course_id: courseId,
        });
        return res.status(201).json({
            success: true,
            message: "Course purchase successful.",
            data: purchase,
        });
    } catch (error) {
        return handlePurchaseError(res, error);
    }
};

export const GetMyPurchases = async (req, res) => {
    try {
        const purchases = await Purchase.find({ user_id: req.user_id }).populate("course_id");
        return res.status(200).json({
            success: true,
            message: "Your purchases fetched successfully.",
            data: purchases,
        });
    } catch (error) {
        return handlePurchaseError(res, error);
    }
};

export const GetAllPurchases = async (req, res) => {
    try {
        const purchases = await Purchase.find()
            .populate("user_id", "username email")
            .populate("course_id");
        return res.status(200).json({
            success: true,
            message: "All purchases fetched successfully.",
            data: purchases,
        });
    } catch (error) {
        return handlePurchaseError(res, error);
    }
};

export const GetPurchaseById = async (req, res) => {
    const purchaseId = req.params.purchaseId;
    if (!mongoose.isObjectIdOrHexString(purchaseId)) {
        return invalidPurchaseId(res);
    }

    try {
        const purchase = await Purchase.findById(purchaseId)
            .populate("user_id", "username email")
            .populate("course_id");
        if (!purchase) {
            return res.status(404).json({
                success: false,
                message: "Purchase record not found.",
            });
        }
        return res.status(200).json({
            success: true,
            message: "Purchase fetched successfully.",
            data: purchase,
        });
    } catch (error) {
        return handlePurchaseError(res, error);
    }
};

export const UpdatePurchase = async (req, res) => {
    const purchaseId = req.params.purchaseId;
    if (!mongoose.isObjectIdOrHexString(purchaseId)) {
        return invalidPurchaseId(res);
    }

    if (req.body?.expiry_date === undefined) {
        return res.status(400).json({
            success: false,
            message: "expiry_date is required.",
        });
    }
    const expiryDate = new Date(req.body.expiry_date);
    if (Number.isNaN(expiryDate.getTime())) {
        return res.status(400).json({
            success: false,
            message: "expiry_date must be a valid date.",
        });
    }

    try {
        const purchase = await Purchase.findByIdAndUpdate(
            purchaseId,
            { expiry_date: expiryDate },
            { new: true, runValidators: true }
        )
            .populate("user_id", "username email")
            .populate("course_id");
        if (!purchase) {
            return res.status(404).json({
                success: false,
                message: "Purchase record not found.",
            });
        }
        return res.status(200).json({
            success: true,
            message: "Purchase updated successfully.",
            data: purchase,
        });
    } catch (error) {
        return handlePurchaseError(res, error);
    }
};

export const DeletePurchase = async (req, res) => {
    const purchaseId = req.params.purchaseId;
    if (!mongoose.isObjectIdOrHexString(purchaseId)) {
        return invalidPurchaseId(res);
    }

    try {
        const purchase = await Purchase.findByIdAndDelete(purchaseId);
        if (!purchase) {
            return res.status(404).json({
                success: false,
                message: "Purchase record not found.",
            });
        }
        return res.status(200).json({
            success: true,
            message: "Purchase deleted successfully.",
            data: purchase,
        });
    } catch (error) {
        return handlePurchaseError(res, error);
    }
};
