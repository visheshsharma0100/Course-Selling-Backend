
import users from "../Schema/user.schema.js";

const adminMiddleware = async (req, res, next) => {
    try {
        // Find logged-in user using ID from auth middleware
        const user = await users.findById(req.user_id);

        if (!user) {
            return res.status(401).json({
                message: "User not found"
            });
        }

        // Check user role
        if (user.role !== "admin") {
            return res.status(403).json({
                message: "Access denied. Admin only."
            });
        }

        next();

    } catch (error) {
        return res.status(500).json({
            message: "Internal server error"
        });
    }
};

export default adminMiddleware;
