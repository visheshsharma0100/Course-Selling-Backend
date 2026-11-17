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

const Purchase = mongoose.model("purchase", PurchaseSchema);

export default Purchase;