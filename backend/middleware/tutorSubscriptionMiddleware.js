import { getActiveTutorSubscription } from "../controllers/tutorSubscription_controller.js";
import { isTutor, normalizeRole } from "../utils/users.js";

export const activeTutorSubscriptionMiddleware = async (req, res, next) => {
    if (!req.user) return res.status(401).json({ message: "Authentication required." });
    if (normalizeRole(req.user.role) === "admin") return next();
    if (!isTutor(req.user)) return res.status(403).json({ message: "Access denied. Tutor account required." });
    if (req.user.tutorApprovalStatus !== "approved") {
        return res.status(403).json({ message: "Your tutor application must be approved before you can manage courses." });
    }
    try {
        const subscription = await getActiveTutorSubscription(req.user._id);
        if (!subscription) {
            return res.status(403).json({ message: "An active tutor subscription is required to manage courses." });
        }
        req.tutorSubscription = subscription;
        return next();
    } catch (error) {
        return res.status(500).json({ message: "Unable to verify tutor subscription." });
    }
};
