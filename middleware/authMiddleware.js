import jwt from 'jsonwebtoken'

const authmiddleware = (req,res,next) =>{
    const authHeader = req.headers.authorization;
    try {
        const token = authHeader?.split(" ")[1]
        if(!token){
            return res.status(400).json({
                message : "Token not found"
            })
        }

        const decoded = jwt.verify(token,process.env.Secret_key);


        if(!decoded){
            return res.status(400).json({
                message : "Token malwared"
            })
        }
        
        
        req.user_id = decoded.id
        next();


    } catch (error) {
        return res.status(500).json({
            message : error.message
        })
    }
}

export default authmiddleware