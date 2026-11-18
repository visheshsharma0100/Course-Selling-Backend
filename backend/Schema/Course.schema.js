import mongoose from "mongoose";

const courseSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
    },
    description: {
        type: String,
        required: true,
    },
    image_url: {
        type: String,
    },
    price: {
        type: Number,
        required: true,
        min: 0,
    },
    category: {
        type: String,
        default: "General",
        trim: true,
        maxlength: 100,
    },
    // New marketplace courses always set this from the verified JWT. It is not
    // required at schema level yet so pre-marketplace documents stay readable
    // until their data migration assigns an owner.
    instructor_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "users",
        default: null,
        index: true,
    },
    approvalStatus: {
        type: String,
        enum: ["draft", "pending", "approved", "rejected"],
        default: "approved",
        index: true,
    },
    isPublished: {
        type: Boolean,
        default: false,
    },
    syllabus: {
        // Supports legacy string topics as well as { title, video } topics.
        // Mixed keeps existing course records readable while video metadata is added.
        type: [mongoose.Schema.Types.Mixed],
        default: [],
    },
}, { timestamps: true });

const Course = mongoose.model("Course", courseSchema);

export default Course;
