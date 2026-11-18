import mongoose from "mongoose";

const UserSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        trim: true,
    },
    email: {
        type: String,
        required: true,
        trim: true,
        lowercase: true,
    },
    password: {
        type: String,
        required: true,
    },
    // "learner" | "tutor" | "admin". Never accepted from a public signup body;
    // the signup controller only allows learner or tutor and admins are seeded.
    role: {
        type: String,
        enum: ["learner", "tutor", "admin"],
        default: "learner",
    },
    accountStatus: {
        type: String,
        enum: ["active", "suspended"],
        default: "active",
    },
    // Only meaningful for tutors. Learners and admins stay on "not_applicable".
    tutorApprovalStatus: {
        type: String,
        enum: ["not_applicable", "pending", "approved", "rejected"],
        default: "not_applicable",
    },
    tutorRejectionReason: {
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
}, { timestamps: true });

// Prevents duplicate accounts (and the check-then-insert race in signup).
UserSchema.index({ email: 1 }, { unique: true });
UserSchema.index({ username: 1 }, { unique: true });

const users = mongoose.model("users", UserSchema);

export default users;
