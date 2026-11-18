import { z } from "zod";

const signupSchema = z.object({
     username: z
        .string()
        .trim()
        .min(3, "Username must be at least 3 characters")
        .max(20, "Username cannot exceed 20 characters"),

         email: z
        .string()
        .trim()
        .email("Please enter a valid email address")
        .max(254, "Email is too long")
        .transform((email) => email.toLowerCase()),

        password: z
        .string()
        .min(5, "Password must be at least 5 characters")
        .max(128, "Password cannot exceed 128 characters"),

    // A public registration may select learner or tutor only. Admin is never
    // accepted from a request body.
    accountType: z.enum(["learner", "tutor"]).default("learner"),

    bio: z.string().trim().max(2000, "Bio cannot exceed 2,000 characters").optional().default(""),
    expertise: z.string().trim().max(300, "Expertise cannot exceed 300 characters").optional().default(""),
    education: z.string().trim().max(500, "Education cannot exceed 500 characters").optional().default(""),
    profileImage: z.string().trim().url("Profile image must be a valid URL").optional().or(z.literal("")).default(""),
}).strict();

export default signupSchema;
