import { Router } from "express";
import { ReviewController } from "../controllers/reviewController";
import { authenticateToken } from "../middleware/auth";
import { validateReviewCreation } from "../middleware/validation";

const router = Router();

// Create a review
router.post(
  "/",
  authenticateToken,
  validateReviewCreation,
  ReviewController.createReview
);

// Get business reviews
router.get("/business/:businessId", ReviewController.getBusinessReviews);

// Get user's reviews
router.get("/my-reviews", authenticateToken, ReviewController.getUserReviews);

// Get review by ID
router.get("/:reviewId", ReviewController.getReviewById);

// Update review
router.put("/:reviewId", authenticateToken, ReviewController.updateReview);

// Delete review
router.delete("/:reviewId", authenticateToken, ReviewController.deleteReview);

export default router;
