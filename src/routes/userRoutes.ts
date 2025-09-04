import { Router } from "express";
import { UserController } from "../controllers/userController";
import { authenticateToken } from "../middleware/auth";
import { basicRateLimit } from "../middleware/validation";

const router = Router();

/**
 * @swagger
 * /api/users/location:
 *   put:
 *     summary: Update user location
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - latitude
 *               - longitude
 *             properties:
 *               latitude:
 *                 type: number
 *                 minimum: -90
 *                 maximum: 90
 *               longitude:
 *                 type: number
 *                 minimum: -180
 *                 maximum: 180
 *     responses:
 *       200:
 *         description: Location updated successfully
 *       400:
 *         description: Invalid coordinates
 *       401:
 *         description: Unauthorized
 */
router.put("/location", authenticateToken, basicRateLimit, UserController.updateLocation);

/**
 * @swagger
 * /api/users/notification-token:
 *   put:
 *     summary: Update push notification token
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - token
 *             properties:
 *               token:
 *                 type: string
 *               platform:
 *                 type: string
 *                 enum: [ios, android, web]
 *     responses:
 *       200:
 *         description: Notification token updated successfully
 *       401:
 *         description: Unauthorized
 */
router.put("/notification-token", authenticateToken, UserController.updateNotificationToken);

/**
 * @swagger
 * /api/users/preferences:
 *   get:
 *     summary: Get user preferences
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User preferences retrieved successfully
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
 *                     notificationSettings:
 *                       type: object
 *                     privacySettings:
 *                       type: object
 *                     appSettings:
 *                       type: object
 */
router.get("/preferences", authenticateToken, UserController.getPreferences);

/**
 * @swagger
 * /api/users/preferences:
 *   put:
 *     summary: Update user preferences
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               notificationSettings:
 *                 type: object
 *               privacySettings:
 *                 type: object
 *               appSettings:
 *                 type: object
 *     responses:
 *       200:
 *         description: Preferences updated successfully
 *       401:
 *         description: Unauthorized
 */
router.put("/preferences", authenticateToken, UserController.updatePreferences);

/**
 * @swagger
 * /api/users/dashboard:
 *   get:
 *     summary: Get user dashboard data
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dashboard data retrieved successfully
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
 *                     currentQueue:
 *                       type: object
 *                     recentActivity:
 *                       type: array
 *                     subscriptions:
 *                       type: array
 *                     favoriteBusinesses:
 *                       type: array
 */
router.get("/dashboard", authenticateToken, UserController.getDashboard);

/**
 * @swagger
 * /api/users/delete-account:
 *   delete:
 *     summary: Delete user account
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - password
 *             properties:
 *               password:
 *                 type: string
 *               reason:
 *                 type: string
 *     responses:
 *       200:
 *         description: Account deleted successfully
 *       400:
 *         description: Invalid password
 *       401:
 *         description: Unauthorized
 */
router.delete("/delete-account", authenticateToken, UserController.deleteAccount);

export default router;
