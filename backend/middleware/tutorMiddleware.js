import { isTutor } from "../utils/users.js";

const tutorMiddleware = (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({ message: "Authentication required." });
    }
    if (!isTutor(req.user)) {
        return res.status(403).json({ message: "Access denied. Tutor account required." });
    }
    return next();
};

export const approvedTutorMiddleware = (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({ message: "Authentication required." });
    }
    if (!isTutor(req.user)) {
        return res.status(403).json({ message: "Access denied. Tutor account required." });
    }
    if (req.user.tutorApprovalStatus !== "approved") {
        return res.status(403).json({ message: "Your tutor application must be approved before you can publish courses." });
    }
    return next();
};

export default tutorMiddleware;
