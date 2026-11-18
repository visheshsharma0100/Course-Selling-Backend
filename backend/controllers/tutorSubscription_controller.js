import crypto from "crypto";
import mongoose from "mongoose";
import TutorSubscription from "../Schema/tutorSubscription.schema.js";
import Purchase from "../Schema/purchases.schema.js";
import { getTutorPlan, publicTutorPlans } from "../config/tutorPlans.js";
import { getRazorpayClient, getRazorpayKeyId } from "../utils/razorpay.js";
import { attemptTutorTransfer } from "./Purchases_controller.js";

const subscriptionError = (res, status, message) => res.status(status).json({ message });

const developmentSubscriptionsEnabled = () => process.env.NODE_ENV !== "production"
    && process.env.ALLOW_DEVELOPMENT_TUTOR_SUBSCRIPTIONS === "true";

const expirePastSubscriptions = async (tutorId) => {
    await TutorSubscription.updateMany(
        { tutor_id: tutorId, status: "active", expiresAt: { $lte: new Date() } },
        { $set: { status: "expired" } },
    );
};

export const getActiveTutorSubscription = async (tutorId) => {
    await expirePastSubscriptions(tutorId);
    return TutorSubscription.findOne({
        tutor_id: tutorId,
        status: "active",
        expiresAt: { $gt: new Date() },
    }).sort({ expiresAt: -1 });
};

const activateSubscription = async ({ subscription, paymentId, eventId, paymentStatus = "captured" }) => {
    const activeSubscription = await getActiveTutorSubscription(subscription.tutor_id);
    if (activeSubscription && String(activeSubscription._id) !== String(subscription._id)) {
        return { conflict: true, subscription: activeSubscription };
    }

    if (subscription.status === "active") return { subscription };
    const startsAt = new Date();
    const expiresAt = new Date(startsAt);
    expiresAt.setMonth(expiresAt.getMonth() + subscription.durationMonths);
    subscription.status = "active";
    subscription.paymentStatus = paymentStatus;
    subscription.razorpayPaymentId = paymentId;
    subscription.startsAt = startsAt;
    subscription.expiresAt = expiresAt;
    if (eventId && !subscription.webhookEventIds.includes(eventId)) subscription.webhookEventIds.push(eventId);
    await subscription.save();
    return { subscription };
};

export const getTutorSubscription = async (req, res) => {
    try {
        const subscription = await getActiveTutorSubscription(req.user._id);
        return res.status(200).json({
            message: "Tutor subscription fetched successfully.",
            data: {
                plans: publicTutorPlans(),
                subscription,
                // Explicitly labelled local-only test mode; never available in
                // production and never invokes or represents Razorpay payment.
                developmentMode: developmentSubscriptionsEnabled(),
            },
        });
    } catch (error) {
        return subscriptionError(res, 500, "Unable to fetch tutor subscription.");
    }
};

export const activateDevelopmentTutorSubscription = async (req, res) => {
    if (!developmentSubscriptionsEnabled()) {
        return subscriptionError(res, 404, "Development tutor subscriptions are disabled.");
    }
    const plan = getTutorPlan(req.body?.planKey);
    if (!plan) return subscriptionError(res, 400, "Choose a valid tutor plan.");
    if (req.user.tutorApprovalStatus !== "approved") {
        return subscriptionError(res, 403, "Your tutor application must be approved before you can activate a development plan.");
    }
    try {
        const activeSubscription = await getActiveTutorSubscription(req.user._id);
        if (activeSubscription) return subscriptionError(res, 409, "You already have an active tutor subscription.");

        const reference = `dev_order_${String(req.user._id).slice(-8)}_${Date.now()}`;
        const subscription = await TutorSubscription.create({
            tutor_id: req.user._id,
            planKey: plan.key,
            amount: plan.amount,
            durationMonths: plan.months,
            razorpayOrderId: reference,
        });
        const result = await activateSubscription({
            subscription,
            paymentId: `dev_payment_${Date.now()}`,
            paymentStatus: "development",
        });
        if (result.conflict) return subscriptionError(res, 409, "Another active tutor subscription already exists.");
        return res.status(201).json({
            message: "Development tutor plan activated. No payment was taken or recorded with Razorpay.",
            data: result.subscription,
        });
    } catch (error) {
        if (error?.code === 11000) return subscriptionError(res, 409, "Another active tutor subscription already exists.");
        return subscriptionError(res, 500, "Unable to activate the development tutor plan.");
    }
};

export const createTutorSubscriptionOrder = async (req, res) => {
    const plan = getTutorPlan(req.body?.planKey);
    if (!plan) return subscriptionError(res, 400, "Choose a valid tutor plan.");
    if (req.user.tutorApprovalStatus !== "approved") {
        return subscriptionError(res, 403, "Your tutor application must be approved before you can purchase a tutor plan.");
    }

    try {
        const activeSubscription = await getActiveTutorSubscription(req.user._id);
        if (activeSubscription) {
            return subscriptionError(res, 409, "You already have an active tutor subscription.");
        }

        const razorpay = getRazorpayClient();
        const receipt = `tutor_${String(req.user._id).slice(-8)}_${Date.now()}`;
        const order = await razorpay.orders.create({
            amount: plan.amount * 100,
            currency: "INR",
            receipt,
            notes: {
                purpose: "skillstack_tutor_subscription",
                tutorId: String(req.user._id),
                planKey: plan.key,
            },
        });
        const subscription = await TutorSubscription.create({
            tutor_id: req.user._id,
            planKey: plan.key,
            amount: plan.amount,
            durationMonths: plan.months,
            razorpayOrderId: order.id,
        });
        return res.status(201).json({
            message: "Tutor subscription order created successfully.",
            data: {
                subscriptionId: subscription._id,
                orderId: order.id,
                amount: order.amount,
                currency: order.currency,
                keyId: getRazorpayKeyId(),
                plan: { key: plan.key, name: plan.name, amount: plan.amount, months: plan.months },
            },
        });
    } catch (error) {
        return subscriptionError(res, 503, error.message.includes("not configured") ? error.message : "Unable to create a tutor subscription order.");
    }
};

export const verifyTutorSubscriptionPayment = async (req, res) => {
    const { subscriptionId, razorpay_order_id: orderId, razorpay_payment_id: paymentId, razorpay_signature: signature } = req.body || {};
    if (!mongoose.isObjectIdOrHexString(subscriptionId) || !orderId || !paymentId || !signature) {
        return subscriptionError(res, 400, "Incomplete payment verification details.");
    }
    try {
        const subscription = await TutorSubscription.findOne({ _id: subscriptionId, tutor_id: req.user._id });
        if (!subscription) return subscriptionError(res, 404, "Subscription order not found.");
        if (subscription.status === "active") return res.status(200).json({ message: "Tutor subscription is already active.", data: subscription });
        if (subscription.razorpayOrderId !== orderId) return subscriptionError(res, 400, "Payment order does not match this subscription.");

        const expected = crypto.createHmac("sha256", process.env.RAZORPAY_KEY_SECRET || "")
            .update(`${subscription.razorpayOrderId}|${paymentId}`)
            .digest("hex");
        if (expected.length !== signature.length || !crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature))) {
            return subscriptionError(res, 400, "Invalid payment signature.");
        }

        const payment = await getRazorpayClient().payments.fetch(paymentId);
        if (payment.order_id !== subscription.razorpayOrderId || payment.status !== "captured" || Number(payment.amount) !== subscription.amount * 100) {
            return subscriptionError(res, 400, "Payment is not captured for the expected subscription amount.");
        }
        const result = await activateSubscription({ subscription, paymentId });
        if (result.conflict) return subscriptionError(res, 409, "Another active tutor subscription already exists.");
        return res.status(200).json({ message: "Tutor subscription activated successfully.", data: result.subscription });
    } catch (error) {
        if (error?.code === 11000) return subscriptionError(res, 409, "Another active tutor subscription already exists.");
        return subscriptionError(res, 500, "Unable to verify tutor subscription payment.");
    }
};

export const handleRazorpayWebhook = async (req, res) => {
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
    if (!secret) return subscriptionError(res, 503, "Webhook processing is not configured.");
    const signature = req.headers["x-razorpay-signature"];
    const rawBody = Buffer.isBuffer(req.body) ? req.body : Buffer.from("");
    const expected = crypto.createHmac("sha256", secret).update(rawBody).digest("hex");
    if (typeof signature !== "string" || expected.length !== signature.length || !crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature))) {
        return subscriptionError(res, 400, "Invalid webhook signature.");
    }

    try {
        const event = JSON.parse(rawBody.toString("utf8"));
        if (!["payment.captured", "order.paid"].includes(event.event)) return res.status(200).json({ received: true });
        const payment = event.payload?.payment?.entity;
        if (!payment?.order_id || payment.status !== "captured") return res.status(200).json({ received: true });
        const subscription = await TutorSubscription.findOne({ razorpayOrderId: payment.order_id });
        if (!subscription) {
            const purchase = await Purchase.findOne({ order_id: payment.order_id });
            if (!purchase || Number(payment.amount) !== Math.round(purchase.amount * 100)) return res.status(200).json({ received: true });
            if (purchase.payment_status !== "captured") {
                purchase.payment_id = payment.id;
                purchase.payment_status = "captured";
                purchase.purchase_date = new Date();
                await purchase.save();
                await attemptTutorTransfer(purchase);
            }
            return res.status(200).json({ received: true });
        }
        if (Number(payment.amount) !== subscription.amount * 100) return res.status(200).json({ received: true });
        const eventId = req.headers["x-razorpay-event-id"];
        if (eventId && subscription.webhookEventIds.includes(eventId)) return res.status(200).json({ received: true });
        await activateSubscription({ subscription, paymentId: payment.id, eventId });
        return res.status(200).json({ received: true });
    } catch (error) {
        return subscriptionError(res, 500, "Unable to process payment webhook.");
    }
};
