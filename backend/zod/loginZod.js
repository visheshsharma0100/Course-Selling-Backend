import { z } from "zod";

const loginSchema = z.object({
    email: z
        .string()
        .trim()
        .email("Please enter a valid email address")
        .transform((email) => email.toLowerCase()),

    password: z
        .string()
        .min(5, "Password is required")
});

export default loginSchema;