
import users from "../Schema/user.schema.js";
import loginSchema from "../zod/loginZod.js";
import bcrypt from 'bcrypt';
import { signToken } from "../utils/jwt.js";
import { publicUser } from "../utils/users.js";

const signin = async (req, res) => {
    try {
        const result = loginSchema.safeParse(req.body);
        if (!result.success) {
          return res.status(400).json({
                message: result.error.issues
            });
        }

        const { email, password } = result.data;

        const userExists = await users.findOne({ email })
            .collation({ locale: "en", strength: 2 });
        if (!userExists) {
            return res.status(401).json({
                message: "Invalid email or password."
            });
        }

        const isPasswordVaild = await bcrypt.compare(password, userExists.password);

        if (!isPasswordVaild) {
            return res.status(401).json({
                message: "Invalid email or password"
            });
        }
        if (userExists.accountStatus === "suspended") {
            return res.status(403).json({
                message: "This account has been suspended.",
            });
        }

        const token = signToken(userExists._id);
        return res.status(200).json({
            message: "Login successful.",
            token,
            user: publicUser(userExists),
        });

    } catch (error) {
        return res.status(500).json({
            message: error.message
        });
    }
}

export default signin;
