import Razorpay from "razorpay";

export const getRazorpayClient = () => {
    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
        throw new Error("Razorpay payments are not configured. Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET.");
    }
    return new Razorpay({
        key_id: process.env.RAZORPAY_KEY_ID,
        key_secret: process.env.RAZORPAY_KEY_SECRET,
    });
};

export const getRazorpayKeyId = () => {
    if (!process.env.RAZORPAY_KEY_ID) {
        throw new Error("Razorpay payments are not configured. Set RAZORPAY_KEY_ID.");
    }
    return process.env.RAZORPAY_KEY_ID;
};
