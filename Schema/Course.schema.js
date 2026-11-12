import mongoose from "mongoose";


const courseSchema = new mongoose.Schema({
    id : {
        type : mongoose.Schema.Types.ObjectId
    },
    title : {
        type : String,
        required : true,
    },
    description : {
        type : String,
        required : true,
    },
    image_url : {
        type : String,
    },
    price : {
        type : Number,
        required : true,
    },
    isRequired : {
        type :  Boolean,
        default : false,
    },
    syllabus : {
        type : [String]
    }
} , { timestamps : true})

const Course = mongoose.model("Course", courseSchema);

export default Course;