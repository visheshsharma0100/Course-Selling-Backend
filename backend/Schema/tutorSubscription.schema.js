import mongoose from "mongoose";

const TutorSubscriptionSchema = new mongoose.Schema({
    tutor_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "users",
        required: true,
    },
    planKey: {
        type: String,
        enum: ["monthly", "quarterly", "yearly"],
        required: true,
    },
    amount: {
        type: Number,
        required: true,
        min: 1,
    },
    durationMonths: {
        type: Number,
        required: true,
        min: 1,
    },
    status: {
        type: String,
        enum: ["pending", "active", "expired", "cancelled", "failed"],
        default: "pending",
        index: true,
    },
    paymentStatus: {
        type: String,
        enum: ["created", "captured", "development", "failed"],
        default: "created",
    },
    razorpayOrderId: {
        type: String,
        required: true,
        unique: true,
    },
    razorpayPaymentId: {
        type: String,
        unique: true,
        sparse: true,
    },
    startsAt: Date,
    expiresAt: Date,
    webhookEventIds: {
        type: [String],
        default: [],
    },
}, { timestamps: true });

// A tutor can never hold two active paid plans concurrently.
TutorSubscriptionSchema.index(
    { tutor_id: 1 },
    { unique: true, partialFilterExpression: { status: "active" } },
);

const TutorSubscription = mongoose.model("TutorSubscription", TutorSubscriptionSchema);

export default TutorSubscription;
