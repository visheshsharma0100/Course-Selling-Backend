import mongoose from "mongoose";

const PurchaseSchema = new mongoose.Schema({
    user_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "users",
        required: true,
    },
    course_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Course",
        required: true,
    },
    instructor_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "users",
        default: null,
    },
    order_id: { type: String, unique: true, sparse: true },
    payment_id: { type: String, unique: true, sparse: true },
    amount: { type: Number, default: 0, min: 0 },
    currency: { type: String, default: "INR" },
    platform_commission: { type: Number, default: 0, min: 0 },
    tutor_earning: { type: Number, default: 0, min: 0 },
    commission_rate: { type: Number, default: 15, min: 0, max: 100 },
    payment_status: {
        type: String,
        enum: ["pending", "captured", "failed"],
        default: "pending",
    },
    // A captured learner payment records the tutor's payable amount. Actual
    // settlement requires Razorpay Route account onboarding and is never
    // represented as completed before a transfer is made.
    transfer_status: {
        type: String,
        enum: ["not_applicable", "pending", "created", "paid"],
        default: "not_applicable",
    },
    transfer_id: { type: String, default: "" },
    purchase_date: {
        type: Date,
        default: Date.now,
    },
    expiry_date: {
        type: Date,
        default: function () {
            const expiryDate = new Date(this.purchase_date || Date.now());
            expiryDate.setFullYear(expiryDate.getFullYear() + 2);
            return expiryDate;
        },
    }
});

PurchaseSchema.index({ user_id: 1, course_id: 1 }, { unique: true });
PurchaseSchema.index({ instructor_id: 1, payment_status: 1 });

const Purchase = mongoose.model("purchase", PurchaseSchema);

export default Purchase;
