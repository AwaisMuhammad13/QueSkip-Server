import { Router } from "express";
import { QueueController } from "../controllers/queueController";
import { authenticateToken } from "../middleware/auth";
import { validateQueueJoin } from "../middleware/validation";

const router = Router();

// Join a queue
router.post(
  "/join",
  authenticateToken,
  validateQueueJoin,
  QueueController.joinQueue
);

// Leave a queue
router.post("/:queueId/leave", authenticateToken, QueueController.leaveQueue);

// Get user's queues
router.get("/my-queues", authenticateToken, QueueController.getUserQueues);

// Get current queue
router.get("/current", authenticateToken, QueueController.getCurrentQueue);

// Get queue by ID
router.get("/:queueId", authenticateToken, QueueController.getQueueById);

// Update queue notes
router.put("/:queueId/notes", authenticateToken, QueueController.updateQueueNotes);

// Mobile-specific endpoints

// Get queue statistics for a business
router.get("/business/:businessId/stats", QueueController.getQueueStats);

// Get wait time estimate for joining a queue
router.get("/business/:businessId/wait-estimate", QueueController.getWaitTimeEstimate);

export default router;
