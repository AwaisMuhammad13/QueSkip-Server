import { Router } from "express";
import { SubscriptionController } from "../controllers/subscriptionController";
import { authenticateToken } from "../middleware/auth";
import { basicRateLimit } from "../middleware/validation";

const router = Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     SubscriptionPlan:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *         name:
 *           type: string
 *         description:
 *           type: string
 *         type:
 *           type: string
 *           enum: [one_time, monthly, yearly]
 *         price:
 *           type: number
 *         currency:
 *           type: string
 *         features:
 *           type: array
 *           items:
 *             type: string
 *     Subscription:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         planType:
 *           type: string
 *         status:
 *           type: string
 *         startDate:
 *           type: string
 *           format: date-time
 *         endDate:
 *           type: string
 *           format: date-time
 *         amount:
 *           type: number
 */

/**
 * @swagger
 * /api/subscriptions/plans:
 *   get:
 *     summary: Get available subscription plans
 *     tags: [Subscriptions]
 *     responses:
 *       200:
 *         description: Subscription plans retrieved successfully
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
 *                     $ref: '#/components/schemas/SubscriptionPlan'
 */
router.get("/plans", basicRateLimit, SubscriptionController.getPlans);

/**
 * @swagger
 * /api/subscriptions/purchase:
 *   post:
 *     summary: Purchase a subscription or pass
 *     tags: [Subscriptions]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - planId
 *               - paymentMethodId
 *             properties:
 *               planId:
 *                 type: string
 *               paymentMethodId:
 *                 type: string
 *               billingDetails:
 *                 type: object
 *     responses:
 *       201:
 *         description: Subscription purchased successfully
 *       400:
 *         description: Invalid request data
 *       401:
 *         description: Unauthorized
 */
router.post(
  "/purchase",
  authenticateToken,
  basicRateLimit,
  SubscriptionController.purchaseSubscription
);

/**
 * @swagger
 * /api/subscriptions/my-subscriptions:
 *   get:
 *     summary: Get user's active subscriptions and passes
 *     tags: [Subscriptions]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User subscriptions retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     subscriptions:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Subscription'
 *                     passes:
 *                       type: array
 *                     hasActiveSubscription:
 *                       type: boolean
 *                     hasAvailablePasses:
 *                       type: boolean
 */
router.get("/my-subscriptions", authenticateToken, SubscriptionController.getUserSubscriptions);

/**
 * @swagger
 * /api/subscriptions/use-pass:
 *   post:
 *     summary: Use a skip pass at a business
 *     tags: [Subscriptions]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - businessId
 *             properties:
 *               businessId:
 *                 type: string
 *                 format: uuid
 *               queueId:
 *                 type: string
 *                 format: uuid
 *     responses:
 *       200:
 *         description: Skip pass used successfully
 *       400:
 *         description: No active passes available
 *       401:
 *         description: Unauthorized
 */
router.post("/use-pass", authenticateToken, SubscriptionController.useSkipPass);

/**
 * @swagger
 * /api/subscriptions/usage-history:
 *   get:
 *     summary: Get subscription usage history
 *     tags: [Subscriptions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *     responses:
 *       200:
 *         description: Usage history retrieved successfully
 */
router.get("/usage-history", authenticateToken, SubscriptionController.getUsageHistory);

/**
 * @swagger
 * /api/subscriptions/cancel:
 *   post:
 *     summary: Cancel a subscription
 *     tags: [Subscriptions]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - subscriptionId
 *             properties:
 *               subscriptionId:
 *                 type: string
 *                 format: uuid
 *               reason:
 *                 type: string
 *     responses:
 *       200:
 *         description: Subscription cancelled successfully
 *       404:
 *         description: Subscription not found
 *       401:
 *         description: Unauthorized
 */
router.post("/cancel", authenticateToken, SubscriptionController.cancelSubscription);

export default router;
