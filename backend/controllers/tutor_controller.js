import TutorProfile from "../Schema/tutorProfile.schema.js";
import tutorProfileSchema from "../zod/tutorProfileZod.js";
import { publicUser } from "../utils/users.js";

export const getTutorProfile = async (req, res) => {
    try {
        const profile = await TutorProfile.findOne({ user_id: req.user._id });
        if (!profile) {
            return res.status(404).json({ message: "Tutor profile not found." });
        }
        return res.status(200).json({
            message: "Tutor profile fetched successfully.",
            data: { user: publicUser(req.user), profile },
        });
    } catch (error) {
        return res.status(500).json({ message: "Unable to fetch tutor profile." });
    }
};

export const updateTutorProfile = async (req, res) => {
    const result = tutorProfileSchema.safeParse(req.body);
    if (!result.success) {
        return res.status(400).json({ message: result.error.issues });
    }
    if (Object.keys(result.data).length === 0) {
        return res.status(400).json({ message: "Provide at least one profile field to update." });
    }

    try {
        const profile = await TutorProfile.findOneAndUpdate(
            { user_id: req.user._id },
            result.data,
            { returnDocument: "after", runValidators: true },
        );
        if (!profile) return res.status(404).json({ message: "Tutor profile not found." });

        if (result.data.profileImage !== undefined) {
            req.user.profileImage = result.data.profileImage;
            await req.user.save();
        }
        return res.status(200).json({
            message: "Tutor profile updated successfully.",
            data: { user: publicUser(req.user), profile },
        });
    } catch (error) {
        return res.status(500).json({ message: "Unable to update tutor profile." });
    }
};
