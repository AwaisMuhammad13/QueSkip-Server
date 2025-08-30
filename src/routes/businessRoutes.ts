import { Router } from "express";
import { BusinessController } from "../controllers/businessController";
import { basicRateLimit } from "../middleware/validation";

const router = Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     Business:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         name:
 *           type: string
 *         category:
 *           type: string
 *         address:
 *           type: string
 *         coordinates:
 *           type: object
 *           properties:
 *             latitude:
 *               type: number
 *             longitude:
 *               type: number
 *         phoneNumber:
 *           type: string
 *         email:
 *           type: string
 *         website:
 *           type: string
 *         description:
 *           type: string
 *         images:
 *           type: array
 *           items:
 *             type: string
 *         operatingHours:
 *           type: object
 *         averageRating:
 *           type: number
 *         totalReviews:
 *           type: integer
 *         currentQueueCount:
 *           type: integer
 *         maxQueueCapacity:
 *           type: integer
 *         averageWaitTime:
 *           type: integer
 *         isActive:
 *           type: boolean
 *         amenities:
 *           type: array
 *           items:
 *             type: string
 *         createdAt:
 *           type: string
 *           format: date-time
 */

/**
 * @swagger
 * /api/businesses/search:
 *   get:
 *     summary: Search businesses
 *     tags: [Businesses]
 *     parameters:
 *       - in: query
 *         name: q
 *         schema:
 *           type: string
 *         description: Search query
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: Business category
 *       - in: query
 *         name: latitude
 *         schema:
 *           type: number
 *         description: User latitude
 *       - in: query
 *         name: longitude
 *         schema:
 *           type: number
 *         description: User longitude
 *       - in: query
 *         name: radius
 *         schema:
 *           type: number
 *         description: Search radius in kilometers
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Items per page
 *     responses:
 *       200:
 *         description: Businesses retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Business'
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     page:
 *                       type: integer
 *                     limit:
 *                       type: integer
 *                     total:
 *                       type: integer
 *                     totalPages:
 *                       type: integer
 */
router.get("/search", basicRateLimit, BusinessController.searchBusinesses);

/**
 * @swagger
 * /api/businesses/categories:
 *   get:
 *     summary: Get business categories
 *     tags: [Businesses]
 *     responses:
 *       200:
 *         description: Categories retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       name:
 *                         type: string
 *                       count:
 *                         type: integer
 */
router.get("/categories", BusinessController.getCategories);

/**
 * @swagger
 * /api/businesses/nearby:
 *   get:
 *     summary: Get nearby businesses
 *     tags: [Businesses]
 *     parameters:
 *       - in: query
 *         name: latitude
 *         required: true
 *         schema:
 *           type: number
 *         description: User latitude
 *       - in: query
 *         name: longitude
 *         required: true
 *         schema:
 *           type: number
 *         description: User longitude
 *       - in: query
 *         name: radius
 *         schema:
 *           type: number
 *           default: 5
 *         description: Search radius in kilometers
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Maximum number of businesses to return
 *     responses:
 *       200:
 *         description: Nearby businesses retrieved successfully
 */
router.get("/nearby", BusinessController.getNearbyBusinesses);

/**
 * @swagger
 * /api/businesses/{id}:
 *   get:
 *     summary: Get business details
 *     tags: [Businesses]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Business ID
 *     responses:
 *       200:
 *         description: Business details retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Business'
 *       404:
 *         description: Business not found
 */
router.get("/:id", BusinessController.getBusinessById);

export default router;
