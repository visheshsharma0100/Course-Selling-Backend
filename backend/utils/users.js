// The pre-marketplace schema used "student". Reads stay tolerant of that value
// so accounts created before the migration keep working until the migration
// script rewrites them.
export const normalizeRole = (role) => (role === "student" ? "learner" : role);

// Single place that decides which user fields may reach a client.
export const publicUser = (user) => ({
    id: user._id,
    username: user.username,
    email: user.email,
    role: normalizeRole(user.role),
    accountStatus: user.accountStatus,
    tutorApprovalStatus: user.tutorApprovalStatus,
    tutorRejectionReason: user.tutorRejectionReason || "",
    profileImage: user.profileImage || "",
    createdAt: user.createdAt,
});

export const isTutor = (user) => normalizeRole(user?.role) === "tutor";
