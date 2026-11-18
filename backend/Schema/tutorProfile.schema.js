import mongoose from "mongoose";

const TutorProfileSchema = new mongoose.Schema({
    user_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "users",
        required: true,
        unique: true,
    },
    bio: {
        type: String,
        default: "",
        trim: true,
        maxlength: 2000,
    },
    expertise: {
        type: String,
        default: "",
        trim: true,
        maxlength: 300,
    },
    education: {
        type: String,
        default: "",
        trim: true,
        maxlength: 500,
    },
    profileImage: {
        type: String,
        default: "",
        trim: true,
    },
    // Reserved for the Razorpay Route linked account (Phase 7).
    razorpayAccountId: {
        type: String,
        default: "",
        trim: true,
    },
    verificationStatus: {
        type: String,
        enum: ["not_started", "pending", "verified", "rejected"],
        default: "not_started",
    },
    ratingAverage: {
        type: Number,
        default: 0,
        min: 0,
        max: 5,
    },
    ratingCount: {
        type: Number,
        default: 0,
        min: 0,
    },
}, { timestamps: true });

const TutorProfile = mongoose.model("tutorProfile", TutorProfileSchema);

export default TutorProfile;
