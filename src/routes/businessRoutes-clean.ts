import { Router } from "express";
import { BusinessController } from "../controllers/businessController";
import { basicRateLimit } from "../middleware/validation";

const router = Router();

// Search businesses
router.get("/search", basicRateLimit, BusinessController.searchBusinesses);

// Get business categories
router.get("/categories", BusinessController.getCategories);

// Get nearby businesses
router.get("/nearby", BusinessController.getNearbyBusinesses);

// Get business by ID
router.get("/:id", BusinessController.getBusinessById);

export default router;
