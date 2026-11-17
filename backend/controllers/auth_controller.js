
import users from "../Schema/user.schema.js";
import signupSchema from "../zod/authZod.js";
import bcrypt from 'bcrypt';
const signup = async (req,res)=>{
    try {
       const result = signupSchema.safeParse(req.body);
       if(!result.success){
      return res.status(400).json({
            message: result.error.issues
        })
       }

       const {username,email , password,role} = result.data;
        const userExists = await users.findOne({
            $or : [
                {username : username},
               { email : email}
            ]
        })
        if(userExists){
            return res.status(400).json({
                message:"User already exists with this credentials"
            });
        }

        // password hashing 

        const hassedPassword = await bcrypt.hash(password,10);

         const newUser = await users.create({username,email,password : hassedPassword,role});
            return res.status(200).json({
                message:"User created Successfully",
                id : newUser._id
            }
            )
    } catch (error) {
        return res.status(500).json({
            message:error.message
        });
    }
}

export default signup;