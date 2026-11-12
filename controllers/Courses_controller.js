import Course from "../Schema/Course.schema.js"

// Get All Courses
 export const GetCourse = async(req,res)=>{
    try {
        const course_content = await Course.find();
        return res.status(200).json({
                message : "All courses",
                course_content
            })
    } catch (error) {
        return res.status(500).json({
            message : error.message
        })
    }
}

// Get course by Id
export const GetCourseById = async(req,res)=>{
    try {
        const course_id = req.params.id;
        if(!course_id){
            return res.status(400).json({
                message : "Wrong credentials or re-login"
            })
        }
        const data = await Course.findById(course_id);
        if(!data){
            return res.status(400).json({
                message: "could not get any course"
            });
        }
        return res.status(200).json({
            message : "Your content",
            data
        })
    } catch (error) {
        return res.status(500).json({message : error.message});
    }
}

// Post a course 

export const PostCourses = async(req,res)=>{
    try {
        const {title, description, image_url,price,isRequired,syllabus} = req.body;
     const newCouse =  await Course.create({
            title,
            description,
            image_url,
            price,
            isRequired,
            syllabus
        })
        return res.status(200).json({
            message : "Course Created",
            newCouse
        })
    } catch (error) {
        return res.status(500).json({
            message : error.message
        })
    }
}

// Update Course by id

 export const updateCourseById = async(req,res)=>{
    const { title, description, image_url, price, syllabus } = req.body;
    try {
        const course_id = req.params.id;
        if(!course_id){
              return res.status(400).json({
                message : "Wrong credentials or re-login"
            })
        }
        const updatedCourse = await Course.findByIdAndUpdate(course_id,{title, description, image_url, price, syllabus},{ new: true, runValidators: true })

        if(!updatedCourse){
            return res.status(400).json({message : "Somthing went wrong at updating, please try again later"});
        }

        return res.status(200).json({
            message:"Course Updated",
            updatedCourse
        })

    } catch (error) {
        return res.status(500).json({
            message:error.message
        })
    }
}

// Delete Course by id

export const deleteCourseById = async(req,res)=>{
    try {
         const course_id = req.params.id;
        if(!course_id){
              return res.status(400).json({
                message : "Wrong credentials or re-login"
            })
        }
        const deleteCourse = await Course.findByIdAndDelete(course_id);
        if(!deleteCourse){
            return res.status(400).json({
                message : "Something went wrong, please try again later",
            });
        }
        return res.status(200).json({
            message : "Course deleted"
        })
    } catch (error) {
        return res.status(500).json({
            message : error.message
        })
    }
}
