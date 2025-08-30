import { Request, Response } from "express";
import { AuthenticatedRequest } from "../middleware/auth";
import database from "../config/database";
import { ResponseUtils, ValidationUtils, QueueUtils } from "../utils";
import { ApiResponse, QueueStatus } from "../types";
import { logger } from "../middleware/errorHandler";

export class QueueController {
  /**
   * Join a queue
   */
  static async joinQueue(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const { businessId } = req.body;

      if (!ValidationUtils.isValidUUID(businessId)) {
        res.status(400).json(ResponseUtils.error("Invalid business ID"));
        return;
      }

      // Check if business exists and is active
      const businessResult = await database.query(
        `SELECT id, name, current_queue_count, max_queue_capacity, average_wait_time, is_active
         FROM businesses WHERE id = $1`,
        [businessId]
      );

      if (businessResult.rows.length === 0) {
        res.status(404).json(ResponseUtils.error("Business not found"));
        return;
      }

      const business = businessResult.rows[0];

      if (!business.is_active) {
        res.status(400).json(ResponseUtils.error("Business is currently inactive"));
        return;
      }

      // Check if user is already in queue for this business
      const existingQueue = await database.query(
        `SELECT id FROM queues WHERE user_id = $1 AND business_id = $2 AND status = ''waiting''`,
        [userId, businessId]
      );

      if (existingQueue.rows.length > 0) {
        res.status(409).json(ResponseUtils.error("You are already in queue for this business"));
        return;
      }

      // Check queue capacity
      if (business.current_queue_count >= business.max_queue_capacity) {
        res.status(400).json(ResponseUtils.error("Queue is full"));
        return;
      }

      const client = await database.getClient();
      
      try {
        await client.query("BEGIN");

        // Calculate position and estimated wait time
        const position = QueueUtils.calculateQueuePosition(business.current_queue_count);
        const estimatedWaitTime = QueueUtils.calculateEstimatedWaitTime(
          position,
          business.average_wait_time
        );

        // Insert into queue
        const queueResult = await client.query(
          `INSERT INTO queues (business_id, user_id, position, estimated_wait_time, status)
           VALUES ($1, $2, $3, $4, $5)
           RETURNING id, position, estimated_wait_time, joined_at, created_at`,
          [businessId, userId, position, estimatedWaitTime, QueueStatus.WAITING]
        );

        // Update business queue count
        await client.query(
          `UPDATE businesses SET current_queue_count = current_queue_count + 1 WHERE id = $1`,
          [businessId]
        );

        await client.query("COMMIT");

        const queue = queueResult.rows[0];

        logger.info("User joined queue", { 
          userId, 
          businessId, 
          queueId: queue.id, 
          position: queue.position 
        });

        res.status(201).json(ResponseUtils.success({
          id: queue.id,
          businessId,
          businessName: business.name,
          position: queue.position,
          estimatedWaitTime: queue.estimated_wait_time,
          status: QueueStatus.WAITING,
          joinedAt: queue.joined_at,
          createdAt: queue.created_at,
        }, "Successfully joined the queue"));

      } catch (error) {
        await client.query("ROLLBACK");
        throw error;
      } finally {
        client.release();
      }

    } catch (error) {
      logger.error("Join queue error:", error);
      res.status(500).json(ResponseUtils.error("Failed to join queue"));
    }
  }

  /**
   * Leave a queue
   */
  static async leaveQueue(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const { queueId } = req.params;

      if (!ValidationUtils.isValidUUID(queueId)) {
        res.status(400).json(ResponseUtils.error("Invalid queue ID"));
        return;
      }

      // Find the queue entry
      const queueResult = await database.query(
        `SELECT id, business_id, position, status FROM queues 
         WHERE id = $1 AND user_id = $2`,
        [queueId, userId]
      );

      if (queueResult.rows.length === 0) {
        res.status(404).json(ResponseUtils.error("Queue entry not found"));
        return;
      }

      const queue = queueResult.rows[0];

      if (queue.status !== QueueStatus.WAITING) {
        res.status(400).json(ResponseUtils.error("Cannot leave queue with current status"));
        return;
      }

      const client = await database.getClient();

      try {
        await client.query("BEGIN");

        // Update queue status to cancelled
        await client.query(
          `UPDATE queues SET status = $1, cancelled_at = CURRENT_TIMESTAMP WHERE id = $2`,
          [QueueStatus.CANCELLED, queueId]
        );

        // Update positions of other users in the queue
        await client.query(
          `UPDATE queues SET position = position - 1 
           WHERE business_id = $1 AND position > $2 AND status = $3`,
          [queue.business_id, queue.position, QueueStatus.WAITING]
        );

        // Update business queue count
        await client.query(
          `UPDATE businesses SET current_queue_count = current_queue_count - 1 WHERE id = $1`,
          [queue.business_id]
        );

        await client.query("COMMIT");

        logger.info("User left queue", { userId, queueId, businessId: queue.business_id });

        res.json(ResponseUtils.success(null, "Successfully left the queue"));

      } catch (error) {
        await client.query("ROLLBACK");
        throw error;
      } finally {
        client.release();
      }

    } catch (error) {
      logger.error("Leave queue error:", error);
      res.status(500).json(ResponseUtils.error("Failed to leave queue"));
    }
  }

  /**
   * Get user''s queue status
   */
  static async getUserQueues(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const { status, page = 1, limit = 10 } = req.query;

      let whereConditions = ["q.user_id = $1"];
      let queryParams: any[] = [userId];
      let paramCount = 1;

      if (status) {
        paramCount++;
        whereConditions.push(`q.status = $${paramCount}`);
        queryParams.push(status);
      }

      const whereClause = whereConditions.join(" AND ");
      const offset = (Number(page) - 1) * Number(limit);

      // Get total count
      const countQuery = `SELECT COUNT(*) FROM queues q WHERE ${whereClause}`;
      const countResult = await database.query(countQuery, queryParams);
      const total = parseInt(countResult.rows[0].count);

      // Get queues
      paramCount += 2;
      const query = `
        SELECT q.id, q.business_id, q.position, q.estimated_wait_time, q.status,
               q.joined_at, q.notified_at, q.completed_at, q.cancelled_at, q.notes,
               q.created_at, q.updated_at,
               b.name as business_name, b.address as business_address,
               b.phone_number as business_phone, b.category as business_category
        FROM queues q
        JOIN businesses b ON q.business_id = b.id
        WHERE ${whereClause}
        ORDER BY q.created_at DESC
        LIMIT $${paramCount - 1} OFFSET $${paramCount}
      `;

      queryParams.push(limit, offset);
      const result = await database.query(query, queryParams);

      const queues = result.rows.map((queue: any) => ({
        id: queue.id,
        business: {
          id: queue.business_id,
          name: queue.business_name,
          address: queue.business_address,
          phoneNumber: queue.business_phone,
          category: queue.business_category,
        },
        position: queue.position,
        estimatedWaitTime: queue.estimated_wait_time,
        status: queue.status,
        joinedAt: queue.joined_at,
        notifiedAt: queue.notified_at,
        completedAt: queue.completed_at,
        cancelledAt: queue.cancelled_at,
        notes: queue.notes,
        createdAt: queue.created_at,
        updatedAt: queue.updated_at,
      }));

      res.json(ResponseUtils.paginated(queues, Number(page), Number(limit), total));
    } catch (error) {
      logger.error("Get user queues error:", error);
      res.status(500).json(ResponseUtils.error("Failed to get user queues"));
    }
  }

  /**
   * Get queue details by ID
   */
  static async getQueueById(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const { queueId } = req.params;

      if (!ValidationUtils.isValidUUID(queueId)) {
        res.status(400).json(ResponseUtils.error("Invalid queue ID"));
        return;
      }

      const query = `
        SELECT q.id, q.business_id, q.position, q.estimated_wait_time, q.status,
               q.joined_at, q.notified_at, q.completed_at, q.cancelled_at, q.notes,
               q.created_at, q.updated_at,
               b.name as business_name, b.address as business_address,
               b.phone_number as business_phone, b.category as business_category,
               b.images as business_images, b.current_queue_count
        FROM queues q
        JOIN businesses b ON q.business_id = b.id
        WHERE q.id = $1 AND q.user_id = $2
      `;

      const result = await database.query(query, [queueId, userId]);

      if (result.rows.length === 0) {
        res.status(404).json(ResponseUtils.error("Queue not found"));
        return;
      }

      const queue = result.rows[0];

      res.json(ResponseUtils.success({
        id: queue.id,
        business: {
          id: queue.business_id,
          name: queue.business_name,
          address: queue.business_address,
          phoneNumber: queue.business_phone,
          category: queue.business_category,
          images: queue.business_images || [],
          currentQueueCount: queue.current_queue_count,
        },
        position: queue.position,
        estimatedWaitTime: queue.estimated_wait_time,
        status: queue.status,
        joinedAt: queue.joined_at,
        notifiedAt: queue.notified_at,
        completedAt: queue.completed_at,
        cancelledAt: queue.cancelled_at,
        notes: queue.notes,
        createdAt: queue.created_at,
        updatedAt: queue.updated_at,
      }));
    } catch (error) {
      logger.error("Get queue by ID error:", error);
      res.status(500).json(ResponseUtils.error("Failed to get queue details"));
    }
  }

  /**
   * Get current active queue for user
   */
  static async getCurrentQueue(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;

      const query = `
        SELECT q.id, q.business_id, q.position, q.estimated_wait_time, q.status,
               q.joined_at, q.created_at,
               b.name as business_name, b.address as business_address,
               b.phone_number as business_phone, b.category as business_category,
               b.images as business_images
        FROM queues q
        JOIN businesses b ON q.business_id = b.id
        WHERE q.user_id = $1 AND q.status IN ($2, $3)
        ORDER BY q.created_at DESC
        LIMIT 1
      `;

      const result = await database.query(query, [
        userId, 
        QueueStatus.WAITING, 
        QueueStatus.NOTIFIED
      ]);

      if (result.rows.length === 0) {
        res.json(ResponseUtils.success(null, "No active queue found"));
        return;
      }

      const queue = result.rows[0];

      res.json(ResponseUtils.success({
        id: queue.id,
        business: {
          id: queue.business_id,
          name: queue.business_name,
          address: queue.business_address,
          phoneNumber: queue.business_phone,
          category: queue.business_category,
          images: queue.business_images || [],
        },
        position: queue.position,
        estimatedWaitTime: queue.estimated_wait_time,
        status: queue.status,
        joinedAt: queue.joined_at,
        createdAt: queue.created_at,
      }));
    } catch (error) {
      logger.error("Get current queue error:", error);
      res.status(500).json(ResponseUtils.error("Failed to get current queue"));
    }
  }

  /**
   * Update queue notes
   */
  static async updateQueueNotes(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const { queueId } = req.params;
      const { notes } = req.body;

      if (!ValidationUtils.isValidUUID(queueId)) {
        res.status(400).json(ResponseUtils.error("Invalid queue ID"));
        return;
      }

      const result = await database.query(
        `UPDATE queues SET notes = $1 WHERE id = $2 AND user_id = $3
         RETURNING id, notes, updated_at`,
        [notes, queueId, userId]
      );

      if (result.rows.length === 0) {
        res.status(404).json(ResponseUtils.error("Queue not found"));
        return;
      }

      const queue = result.rows[0];

      logger.info("Queue notes updated", { userId, queueId });

      res.json(ResponseUtils.success({
        id: queue.id,
        notes: queue.notes,
        updatedAt: queue.updated_at,
      }, "Queue notes updated successfully"));
    } catch (error) {
      logger.error("Update queue notes error:", error);
      res.status(500).json(ResponseUtils.error("Failed to update queue notes"));
    }
  }
}
