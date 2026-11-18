import jwt from "jsonwebtoken";

// Keeps backwards compatibility with the existing Secret_key variable while
// allowing the conventional JWT_SECRET name for new environments.
export const getJwtSecret = () => {
    const secret = process.env.Secret_key || process.env.JWT_SECRET;
    if (!secret) {
        throw new Error("JWT secret is missing. Set Secret_key in backend/.env.");
    }
    return secret;
};

export const signToken = (userId) => jwt.sign({ id: userId }, getJwtSecret(), { expiresIn: "7d" });
