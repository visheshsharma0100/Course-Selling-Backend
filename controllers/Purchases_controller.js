import purchase from "../Schema/purchases.schema.js";

// post purchase
export const PostPurchase = async (req, res) => {
    try {
        const user_id = req.user_id;
        const course_id = req.params.course_id;
        if (!user_id) {
            return res.status(401).json({
                success: false,
                message: "Authentication required. Please log in to continue."
            });
        }

        if (!course_id) {
            return res.status(400).json({
                success: false,
                message: "Course ID is required. Please select a valid course."
            });
        }
        return res.status(201).json({
            success: true,
            message: "Congratulations! Your course purchase was successful."
        });
    } catch (error) {
        return res.status(500).json({
            message: error.message
        })
    }
}

// Get Purchase by id
export const GetMyPurchases = async (req, res) => {
    try {
        const data = await purchase.find({
            userId: req.user_id
        }).populate("courseId");

        return res.status(200).json({
            success: true,
            message: "Your purchased courses fetched successfully.",
            data
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};


// Get all Purchase
export const GetAllPurchases = async (req, res) => {
    try {
        const data = await purchase.find()
            .populate("userId", "name email")
            .populate("courseId");

        return res.status(200).json({
            success: true,
            message: "All purchases fetched successfully.",
            data
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// update purchase
export const UpdatePurchase = async (req, res) => {
    try {
        const { purchaseId } = req.params;
        const { expiry_date } = req.body;

        const updatedPurchase = await Purchase.findByIdAndUpdate(
            purchaseId,
            { expiry_date },
            { new: true, runValidators: true }
        );

        if (!updatedPurchase) {
            return res.status(404).json({
                success: false,
                message: "Purchase record not found."
            });
        }

        return res.status(200).json({
            success: true,
            message: "Purchase updated successfully.",
            data: updatedPurchase
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};


// Delete purchase

export const DeletePurchase = async (req, res) => {
    try {
        const { purchaseId } = req.params;

        const deletedPurchase = await Purchase.findByIdAndDelete(purchaseId);

        if (!deletedPurchase) {
            return res.status(404).json({
                success: false,
                message: "Purchase record not found."
            });
        }

        return res.status(200).json({
            success: true,
            message: "Purchase deleted successfully.",
            data: deletedPurchase
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};