import { z } from "zod";

const optionalImageUrl = z.string().trim().url("Profile image must be a valid URL").or(z.literal(""));

const tutorProfileSchema = z.object({
    bio: z.string().trim().max(2000, "Bio cannot exceed 2,000 characters").optional(),
    expertise: z.string().trim().max(300, "Expertise cannot exceed 300 characters").optional(),
    education: z.string().trim().max(500, "Education cannot exceed 500 characters").optional(),
    profileImage: optionalImageUrl.optional(),
}).strict();

export default tutorProfileSchema;
