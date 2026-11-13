import mongoose, { Mongoose } from "mongoose";
const PurchaseSchema = new mongoose.Schema({
    user_id : {
        type : mongoose.Schema.Types.ObjectId,
        ref : "users",
        required : true
    },

    course_id : {
        type : mongoose.Schema.Types.ObjectId,
        ref : "Course",
        required : true
    },

    purchase_date : {
        type : Date,
        default : Date.now
    },
    
    expiry_date : {
        type : Date,
        default : () =>{
            const date = new Date();
            date.setFullYear(date.getFullYear() + 2);
            return date;
        }
    }

});

const purchase = mongoose.model("purchase",PurchaseSchema);

export default purchase;