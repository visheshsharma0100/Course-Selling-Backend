import mongoose from "mongoose";
import TutorProfile from "../Schema/tutorProfile.schema.js";
import users from "../Schema/user.schema.js";
import { publicUser } from "../utils/users.js";
import { z } from "zod";

const approvalSchema = z.object({
    status: z.enum(["approved", "rejected"]),
    rejectionReason: z.string().trim().max(500).optional().default(""),
}).strict();

export const getTutors = async (req, res) => {
    const allowedStatuses = new Set(["pending", "approved", "rejected"]);
    const filter = { role: "tutor" };
    if (allowedStatuses.has(req.query.status)) filter.tutorApprovalStatus = req.query.status;

    try {
        const tutorUsers = await users.find(filter)
            .select("_id username email role accountStatus tutorApprovalStatus tutorRejectionReason profileImage createdAt")
            .sort({ createdAt: -1 });
        const profiles = await TutorProfile.find({ user_id: { $in: tutorUsers.map((user) => user._id) } });
        const profileByUserId = new Map(profiles.map((profile) => [String(profile.user_id), profile]));
        return res.status(200).json({
            message: "Tutors fetched successfully.",
            data: tutorUsers.map((user) => ({
                user: publicUser(user),
                profile: profileByUserId.get(String(user._id)) || null,
            })),
        });
    } catch (error) {
        return res.status(500).json({ message: "Unable to fetch tutors." });
    }
};

export const updateTutorApproval = async (req, res) => {
    if (!mongoose.isObjectIdOrHexString(req.params.tutorId)) {
        return res.status(400).json({ message: "Invalid tutor ID." });
    }
    const result = approvalSchema.safeParse(req.body);
    if (!result.success) return res.status(400).json({ message: result.error.issues });

    try {
        const updates = {
            tutorApprovalStatus: result.data.status,
            tutorRejectionReason: result.data.status === "rejected" ? result.data.rejectionReason : "",
        };
        const tutor = await users.findOneAndUpdate(
            { _id: req.params.tutorId, role: "tutor" },
            updates,
            { returnDocument: "after", runValidators: true },
        ).select("_id username email role accountStatus tutorApprovalStatus tutorRejectionReason profileImage createdAt");
        if (!tutor) return res.status(404).json({ message: "Tutor not found." });

        const profile = await TutorProfile.findOne({ user_id: tutor._id });
        return res.status(200).json({
            message: `Tutor application ${result.data.status}.`,
            data: { user: publicUser(tutor), profile },
        });
    } catch (error) {
        return res.status(500).json({ message: "Unable to update tutor approval." });
    }
};
