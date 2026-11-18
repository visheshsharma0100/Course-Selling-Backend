import mongoose from "mongoose";
import crypto from "crypto";
import Course from "../Schema/Course.schema.js";
import Purchase from "../Schema/purchases.schema.js";
import TutorProfile from "../Schema/tutorProfile.schema.js";
import { getRazorpayClient, getRazorpayKeyId } from "../utils/razorpay.js";
import { normalizeRole } from "../utils/users.js";

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

const getCommissionRate = () => {
    const configured = Number(process.env.PLATFORM_COMMISSION_PERCENT ?? 15);
    return Number.isFinite(configured) ? Math.min(100, Math.max(0, configured)) : 15;
};

const calculateSettlement = (price, instructor) => {
    const amountInPaise = Math.round(Number(price) * 100);
    const isTutorSale = normalizeRole(instructor?.role) === "tutor";
    const rate = isTutorSale ? getCommissionRate() : 100;
    const platformPaise = Math.round(amountInPaise * rate / 100);
    return {
        amount: amountInPaise / 100,
        platformCommission: platformPaise / 100,
        tutorEarning: (amountInPaise - platformPaise) / 100,
        commissionRate: rate,
        transferStatus: isTutorSale ? "pending" : "not_applicable",
    };
};

const paymentError = (res, status, message) => res.status(status).json({ success: false, message });

// Razorpay Route transfers are optional at first: a tutor must complete Route
// onboarding and save their linked account ID before funds can be sent. A
// failure here never revokes a valid learner purchase; it remains payable.
export const attemptTutorTransfer = async (purchase) => {
    if (purchase.transfer_status !== "pending" || !purchase.instructor_id || purchase.tutor_earning <= 0) return purchase;
    const profile = await TutorProfile.findOne({ user_id: purchase.instructor_id }).select("razorpayAccountId");
    if (!profile?.razorpayAccountId) return purchase;
    try {
        const transfer = await getRazorpayClient().transfers.create({
            account: profile.razorpayAccountId,
            amount: Math.round(purchase.tutor_earning * 100),
            currency: "INR",
            notes: { purpose: "skillstack_tutor_course_sale", purchaseId: String(purchase._id) },
        });
        purchase.transfer_id = transfer.id;
        purchase.transfer_status = "created";
        await purchase.save();
    } catch {
        // Keep the payout in the pending ledger for a later retry after Route
        // onboarding or account verification is completed.
    }
    return purchase;
};

export const CreatePurchaseOrder = async (req, res) => {
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
        const course = await Course.findById(courseId).populate("instructor_id", "role");
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
        // A missing record means this is a first-time purchase. A captured
        // record (including legacy records without a status) is already owned.
        if (existingPurchase && (existingPurchase.payment_status === "captured" || !existingPurchase.payment_status)) {
            return paymentError(res, 409, "You have already purchased this course.");
        }

        const settlement = calculateSettlement(course.price, course.instructor_id);
        const razorpay = getRazorpayClient();
        const order = await razorpay.orders.create({
            amount: Math.round(settlement.amount * 100),
            currency: "INR",
            receipt: `course_${String(courseId).slice(-8)}_${Date.now()}`,
            notes: {
                purpose: "skillstack_course_purchase",
                courseId: String(course._id),
                learnerId: String(userId),
                instructorId: course.instructor_id?._id ? String(course.instructor_id._id) : "platform",
            },
        });
        const purchase = existingPurchase || new Purchase({ user_id: userId, course_id: courseId });
        Object.assign(purchase, {
            instructor_id: course.instructor_id?._id || null,
            order_id: order.id,
            payment_id: undefined,
            amount: settlement.amount,
            currency: order.currency,
            platform_commission: settlement.platformCommission,
            tutor_earning: settlement.tutorEarning,
            commission_rate: settlement.commissionRate,
            payment_status: "pending",
            transfer_status: settlement.transferStatus,
        });
        await purchase.save();
        return res.status(201).json({
            success: true,
            message: "Course payment order created.",
            data: {
                purchaseId: purchase._id,
                orderId: order.id,
                amount: order.amount,
                currency: order.currency,
                keyId: getRazorpayKeyId(),
            },
        });
    } catch (error) {
        return paymentError(res, 503, error.message.includes("configured") ? error.message : "Unable to start Razorpay checkout.");
    }
};

export const VerifyPurchasePayment = async (req, res) => {
    const courseId = req.params.courseId;
    const { purchaseId, razorpay_order_id: orderId, razorpay_payment_id: paymentId, razorpay_signature: signature } = req.body || {};
    if (!mongoose.isObjectIdOrHexString(courseId) || !mongoose.isObjectIdOrHexString(purchaseId) || !orderId || !paymentId || !signature) {
        return paymentError(res, 400, "Incomplete payment verification details.");
    }
    try {
        const purchase = await Purchase.findOne({ _id: purchaseId, user_id: req.user_id, course_id: courseId });
        if (!purchase) return paymentError(res, 404, "Course payment order not found.");
        if (purchase.payment_status === "captured") return res.status(200).json({ success: true, message: "Course is already purchased.", data: purchase });
        if (purchase.order_id !== orderId) return paymentError(res, 400, "Payment order does not match this course purchase.");
        const expected = crypto.createHmac("sha256", process.env.RAZORPAY_KEY_SECRET || "")
            .update(`${purchase.order_id}|${paymentId}`).digest("hex");
        if (expected.length !== signature.length || !crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature))) {
            return paymentError(res, 400, "Invalid payment signature.");
        }
        const payment = await getRazorpayClient().payments.fetch(paymentId);
        if (payment.order_id !== purchase.order_id || payment.status !== "captured" || Number(payment.amount) !== Math.round(purchase.amount * 100)) {
            return paymentError(res, 400, "Payment is not captured for the expected course amount.");
        }
        purchase.payment_id = paymentId;
        purchase.payment_status = "captured";
        purchase.purchase_date = new Date();
        await purchase.save();
        await attemptTutorTransfer(purchase);
        return res.status(200).json({ success: true, message: "Course purchase successful.", data: purchase });
    } catch (error) {
        return paymentError(res, 500, "Unable to verify course payment.");
    }
};

// Backward-compatible export: this endpoint now creates a Razorpay order;
// it never grants course access before payment verification.
export const PostPurchase = CreatePurchaseOrder;

export const GetMyPurchases = async (req, res) => {
    try {
        // Filter in application code too, rather than relying on an $or query
        // against old documents that predate payment_status. This guarantees
        // local development purchases (captured) and legacy purchases appear
        // together in the learner library.
        const allPurchases = await Purchase.find({ user_id: req.user_id })
            .populate("course_id")
            .sort({ purchase_date: -1 });
        const purchases = allPurchases.filter((purchase) => !purchase.payment_status || purchase.payment_status === "captured");
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
            { returnDocument: "after", runValidators: true }
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
