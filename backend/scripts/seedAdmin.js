import "dotenv/config";
import bcrypt from "bcrypt";
import ConnectedToDB from "../config/connection.js";
import users from "../Schema/user.schema.js";

const required = ["ADMIN_USERNAME", "ADMIN_EMAIL", "ADMIN_PASSWORD"];
const missing = required.filter((name) => !process.env[name]?.trim());
if (missing.length) {
    throw new Error(`Missing required environment values: ${missing.join(", ")}`);
}
if (process.env.ADMIN_PASSWORD.length < 12) {
    throw new Error("ADMIN_PASSWORD must be at least 12 characters long.");
}

await ConnectedToDB();
const username = process.env.ADMIN_USERNAME.trim();
const email = process.env.ADMIN_EMAIL.trim().toLowerCase();
const existing = await users.findOne({ $or: [{ username }, { email }] });

if (existing) {
    if (existing.role !== "admin") {
        throw new Error("A non-admin account already uses the supplied username or email. Choose unique admin credentials.");
    }
    console.log("Admin account already exists; no changes were made.");
    process.exit(0);
}

const password = await bcrypt.hash(process.env.ADMIN_PASSWORD, 12);
await users.create({
    username,
    email,
    password,
    role: "admin",
    accountStatus: "active",
    tutorApprovalStatus: "not_applicable",
});
console.log("Admin account created successfully.");
process.exit(0);
