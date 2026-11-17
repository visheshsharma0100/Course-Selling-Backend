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

});

export default signupSchema;