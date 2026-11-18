import "dotenv/config";
import ConnectedToDB from "../config/connection.js";
import users from "../Schema/user.schema.js";

await ConnectedToDB();

const [roles, statuses, approvals, rejections, images] = await Promise.all([
    users.updateMany({ role: "student" }, { $set: { role: "learner" } }),
    users.updateMany({ accountStatus: { $exists: false } }, { $set: { accountStatus: "active" } }),
    users.updateMany({ tutorApprovalStatus: { $exists: false } }, { $set: { tutorApprovalStatus: "not_applicable" } }),
    users.updateMany({ tutorRejectionReason: { $exists: false } }, { $set: { tutorRejectionReason: "" } }),
    users.updateMany({ profileImage: { $exists: false } }, { $set: { profileImage: "" } }),
]);

console.log(JSON.stringify({
    learnerRolesMigrated: roles.modifiedCount,
    accountStatusesAdded: statuses.modifiedCount,
    approvalStatusesAdded: approvals.modifiedCount,
    rejectionReasonsAdded: rejections.modifiedCount,
    profileImagesAdded: images.modifiedCount,
}, null, 2));
process.exit(0);
