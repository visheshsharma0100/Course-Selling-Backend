
import users from "../Schema/user.schema.js";
import TutorProfile from "../Schema/tutorProfile.schema.js";
import signupSchema from "../zod/authZod.js";
import bcrypt from 'bcrypt';
import { signToken } from "../utils/jwt.js";
import { publicUser } from "../utils/users.js";

export const getCurrentUser = async (req, res) => {
    return res.status(200).json({
        message: "Authenticated user fetched successfully.",
        user: publicUser(req.user),
    });
};

const signup = async (req,res)=>{
    try {
       const result = signupSchema.safeParse(req.body);
       if(!result.success){
      return res.status(400).json({
            message: result.error.issues
        })
       }

       const { username, email, password, accountType, bio, expertise, education, profileImage } = result.data;
        const userExists = await users.findOne({
            $or : [
                {username : username},
               { email : email}
            ]
        })
        if(userExists){
            return res.status(409).json({
                message:"User already exists with this credentials"
            });
        }

        // password hashing 

        const hassedPassword = await bcrypt.hash(password,10);

        // Public signup deliberately maps the account type to learner/tutor;
        // an incoming role field is rejected by the strict Zod schema.
        const isTutorApplication = accountType === "tutor";
        const newUser = await users.create({
            username,
            email,
            password: hassedPassword,
            role: isTutorApplication ? "tutor" : "learner",
            tutorApprovalStatus: isTutorApplication ? "pending" : "not_applicable",
            profileImage: profileImage || "",
        });

        let tutorProfile = null;
        if (isTutorApplication) {
            tutorProfile = await TutorProfile.create({
                user_id: newUser._id,
                bio,
                expertise,
                education,
                profileImage: profileImage || "",
                verificationStatus: "pending",
            });
        }

        return res.status(201).json({
            message: isTutorApplication
                ? "Tutor application submitted successfully. An administrator must approve it before you can publish courses."
                : "Account created successfully.",
            token: signToken(newUser._id),
            user: publicUser(newUser),
            ...(tutorProfile ? { tutorProfile } : {}),
        });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(409).json({ message: "An account with that username or email already exists." });
        }
        return res.status(500).json({
            message:error.message
        });
    }
}

export default signup;
