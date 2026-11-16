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
    isPublished: {
        type: Boolean,
        default: false,
    },
    syllabus: {
        type: [String],
        default: [],
    },
}, { timestamps: true });

const Course = mongoose.model("Course", courseSchema);

export default Course;