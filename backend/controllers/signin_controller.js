
import users from "../Schema/user.schema.js";
import jwt from 'jsonwebtoken';
import loginSchema from "../zod/loginZod.js";
import bcrypt from 'bcrypt';

const signin = async (req, res) => {
    try {
        const result = loginSchema.safeParse(req.body);
        if (!result.success) {
          return res.status(400).json({
                message: result.error.issues
            });
        }

        const { email, password } = result.data;

        const userExists = await users.findOne({
            email
        });
        if (!userExists) {
            return res.status(400).json({
                message: "Invaild credentials"
            });
        }

        const isPasswordVaild = await bcrypt.compare(password, userExists.password);

        if (!isPasswordVaild) {
            return res.status(401).json({
                message: "Invalid email or password"
            });
        }

        const token = jwt.sign(
            { id: userExists._id },
            process.env.Secret_key,
            { expiresIn: "7d" }
        );
        return res.status(200).json({
            message: "Login Successfull",
            token
        });

    } catch (error) {
        return res.status(500).json({
            message: error.message
        });
    }
}

export default signin;