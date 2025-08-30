import { Router } from "express";
import { QueueController } from "../controllers/queueController";
import {
  basicRateLimit,
  validateQueueJoin,
  handleValidationErrors,
} from "../middleware/validation";
import { authenticateToken } from "../middleware/auth";

const router = Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     Queue:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         businessId:
 *           type: string
 *           format: uuid
 *         userId:
 *           type: string
 *           format: uuid
 *         position:
 *           type: integer
 *         estimatedWaitTime:
 *           type: integer
 *           description: Estimated wait time in minutes
 *         status:
 *           type: string
 *           enum: [waiting, notified, completed, cancelled]
 *         joinedAt:
 *           type: string
 *           format: date-time
 *         notifiedAt:
 *           type: string
 *           format: date-time
 *         completedAt:
 *           type: string
 *           format: date-time
 *         cancelledAt:
 *           type: string
 *           format: date-time
 *         notes:
 *           type: string
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 */

/**
 * @swagger
 * /api/queues/join:
 *   post:
 *     summary: Join a business queue
 *     tags: [Queues]
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
 *     responses:
 *       201:
 *         description: Successfully joined the queue
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Queue'
 *                 message:
 *                   type: string
 *       400:
 *         description: Invalid request or queue is full
 *       401:
 *         description: Unauthorized
 *       409:
 *         description: Already in queue for this business
 */
router.post(
  "/join",
  authenticateToken,
  basicRateLimit,
  validateQueueJoin,
  handleValidationErrors,
  QueueController.joinQueue
);

/**
 * @swagger
 * /api/queues/{queueId}/leave:
 *   post:
 *     summary: Leave a queue
 *     tags: [Queues]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: queueId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Queue ID
 *     responses:
 *       200:
 *         description: Successfully left the queue
 *       400:
 *         description: Cannot leave queue with current status
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Queue not found
 */
router.post("/:queueId/leave", authenticateToken, QueueController.leaveQueue);

/**
 * @swagger
 * /api/queues/my-queues:
 *   get:
 *     summary: Get user''s queue history
 *     tags: [Queues]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [waiting, notified, completed, cancelled]
 *         description: Filter by queue status
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
 *         description: User queues retrieved successfully
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
 *                     $ref: '#/components/schemas/Queue'
 *                 pagination:
 *                   type: object
 */
router.get("/my-queues", authenticateToken, QueueController.getUserQueues);

/**
 * @swagger
 * /api/queues/current:
 *   get:
 *     summary: Get current active queue for user
 *     tags: [Queues]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Current queue retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   oneOf:
 *                     - $ref: '#/components/schemas/Queue'
 *                     - type: "null"
 *                 message:
 *                   type: string
 */
router.get("/current", authenticateToken, QueueController.getCurrentQueue);

/**
 * @swagger
 * /api/queues/{queueId}:
 *   get:
 *     summary: Get queue details
 *     tags: [Queues]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: queueId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Queue ID
 *     responses:
 *       200:
 *         description: Queue details retrieved successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Queue not found
 */
router.get("/:queueId", authenticateToken, QueueController.getQueueById);

/**
 * @swagger
 * /api/queues/{queueId}/notes:
 *   put:
 *     summary: Update queue notes
 *     tags: [Queues]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: queueId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Queue ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               notes:
 *                 type: string
 *                 maxLength: 500
 *     responses:
 *       200:
 *         description: Queue notes updated successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Queue not found
 */
router.put("/:queueId/notes", authenticateToken, QueueController.updateQueueNotes);

export default router;
