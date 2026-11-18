
import { normalizeRole } from "../utils/users.js";

const adminMiddleware = (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({
            message: "Authentication required.",
        });
    }

    if (normalizeRole(req.user.role) !== "admin") {
        return res.status(403).json({
            message: "Access denied. Admin only.",
        });
    }

    return next();
};

export default adminMiddleware;
