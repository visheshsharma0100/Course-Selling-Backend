import jwt from 'jsonwebtoken'
import mongoose from "mongoose";
import users from "../Schema/user.schema.js";
import { getJwtSecret } from "../utils/jwt.js";
import { normalizeRole } from "../utils/users.js";

const authMiddleware = async (req, res, next) => {
    try {
        const [scheme, token] = (req.headers.authorization || "").split(" ");
        if (scheme?.toLowerCase() !== "bearer" || !token) {
            return res.status(401).json({
                message: "Authentication required. Provide a Bearer token.",
            });
        }

        const decoded = jwt.verify(token, getJwtSecret());
        if (!decoded || typeof decoded === "string" || !mongoose.isObjectIdOrHexString(decoded.id)) {
            return res.status(401).json({
                message: "Invalid authentication token.",
            });
        }

        const user = await users.findById(decoded.id)
            .select("_id username email role accountStatus tutorApprovalStatus tutorRejectionReason profileImage");
        if (!user) {
            return res.status(401).json({
                message: "Authenticated user no longer exists.",
            });
        }
        if (user.accountStatus === "suspended") {
            return res.status(403).json({
                message: "This account has been suspended.",
            });
        }

        // Legacy records may still have role "student" until the data migration
        // runs. Normalize it in-memory for authorization and response use.
        user.role = normalizeRole(user.role);
        req.user = user;
        req.user_id = user._id;
        return next();
    } catch (error) {
        if (error.name === "JsonWebTokenError" || error.name === "TokenExpiredError") {
            return res.status(401).json({
                message: "Invalid or expired authentication token.",
            });
        }
        return res.status(500).json({
            message: "Unable to authenticate the request.",
        });
    }
}

export default authMiddleware
