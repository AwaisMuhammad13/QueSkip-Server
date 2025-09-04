import { Request, Response } from "express";
import { AuthenticatedRequest } from "../middleware/auth";
import database from "../config/database";
import { ResponseUtils } from "../utils";
import { logger } from "../middleware/errorHandler";

export class UserController {
  /**
   * Update user location (for nearby business features)
   */
  static async updateLocation(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const { latitude, longitude } = req.body;

      if (!latitude || !longitude) {
        res.status(400).json(ResponseUtils.error("Latitude and longitude are required"));
        return;
      }

      // Validate coordinates
      if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
        res.status(400).json(ResponseUtils.error("Invalid coordinates"));
        return;
      }

      await database.query(
        `UPDATE users 
         SET last_location_lat = $1, last_location_lng = $2, location_updated_at = CURRENT_TIMESTAMP 
         WHERE id = $3`,
        [latitude, longitude, userId]
      );

      logger.info("User location updated", { userId, latitude, longitude });

      res.json(ResponseUtils.success({
        latitude,
        longitude,
        updatedAt: new Date().toISOString()
      }, "Location updated successfully"));

    } catch (error) {
      logger.error("Update location error:", error);
      res.status(500).json(ResponseUtils.error("Failed to update location"));
    }
  }

  /**
   * Update notification token (for push notifications)
   */
  static async updateNotificationToken(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const { token, platform } = req.body;

      if (!token) {
        res.status(400).json(ResponseUtils.error("Notification token is required"));
        return;
      }

      await database.query(
        "UPDATE users SET notification_token = $1 WHERE id = $2",
        [token, userId]
      );

      logger.info("Notification token updated", { userId, platform: platform || 'unknown' });

      res.json(ResponseUtils.success(null, "Notification token updated successfully"));

    } catch (error) {
      logger.error("Update notification token error:", error);
      res.status(500).json(ResponseUtils.error("Failed to update notification token"));
    }
  }

  /**
   * Get user preferences
   */
  static async getPreferences(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;

      const result = await database.query(
        "SELECT * FROM user_preferences WHERE user_id = $1",
        [userId]
      );

      let preferences;
      if (result.rows.length === 0) {
        // Create default preferences
        const defaultPrefs = {
          notification_settings: {
            push: true,
            email: true,
            queue_updates: true,
            promotions: false
          },
          privacy_settings: {
            location_sharing: true,
            profile_visibility: "public"
          },
          app_settings: {
            theme: "light",
            language: "en",
            auto_join_queue: false
          }
        };

        const insertResult = await database.query(
          `INSERT INTO user_preferences (user_id, notification_settings, privacy_settings, app_settings)
           VALUES ($1, $2, $3, $4)
           RETURNING *`,
          [userId, JSON.stringify(defaultPrefs.notification_settings), 
           JSON.stringify(defaultPrefs.privacy_settings), 
           JSON.stringify(defaultPrefs.app_settings)]
        );

        preferences = insertResult.rows[0];
      } else {
        preferences = result.rows[0];
      }

      res.json(ResponseUtils.success({
        notificationSettings: preferences.notification_settings,
        privacySettings: preferences.privacy_settings,
        appSettings: preferences.app_settings
      }));

    } catch (error) {
      logger.error("Get preferences error:", error);
      res.status(500).json(ResponseUtils.error("Failed to get preferences"));
    }
  }

  /**
   * Update user preferences
   */
  static async updatePreferences(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const { notificationSettings, privacySettings, appSettings } = req.body;

      const updates: string[] = [];
      const values: any[] = [];
      let paramCount = 0;

      if (notificationSettings) {
        paramCount++;
        updates.push(`notification_settings = $${paramCount}`);
        values.push(JSON.stringify(notificationSettings));
      }

      if (privacySettings) {
        paramCount++;
        updates.push(`privacy_settings = $${paramCount}`);
        values.push(JSON.stringify(privacySettings));
      }

      if (appSettings) {
        paramCount++;
        updates.push(`app_settings = $${paramCount}`);
        values.push(JSON.stringify(appSettings));
      }

      if (updates.length === 0) {
        res.status(400).json(ResponseUtils.error("No preferences to update"));
        return;
      }

      paramCount++;
      values.push(userId);

      const query = `
        UPDATE user_preferences 
        SET ${updates.join(", ")}, updated_at = CURRENT_TIMESTAMP
        WHERE user_id = $${paramCount}
        RETURNING *
      `;

      const result = await database.query(query, values);

      if (result.rows.length === 0) {
        res.status(404).json(ResponseUtils.error("User preferences not found"));
        return;
      }

      const preferences = result.rows[0];

      logger.info("User preferences updated", { userId });

      res.json(ResponseUtils.success({
        notificationSettings: preferences.notification_settings,
        privacySettings: preferences.privacy_settings,
        appSettings: preferences.app_settings
      }, "Preferences updated successfully"));

    } catch (error) {
      logger.error("Update preferences error:", error);
      res.status(500).json(ResponseUtils.error("Failed to update preferences"));
    }
  }

  /**
   * Get user dashboard data
   */
  static async getDashboard(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;

      // Get current queue
      const currentQueueResult = await database.query(
        `SELECT q.*, b.name as business_name, b.address as business_address, 
                b.category as business_category
         FROM queues q
         JOIN businesses b ON q.business_id = b.id
         WHERE q.user_id = $1 AND q.status = 'waiting'
         ORDER BY q.created_at DESC
         LIMIT 1`,
        [userId]
      );

      // Get recent activity
      const recentActivityResult = await database.query(
        `SELECT q.*, b.name as business_name, b.category as business_category
         FROM queues q
         JOIN businesses b ON q.business_id = b.id
         WHERE q.user_id = $1 AND q.status IN ('completed', 'cancelled')
         ORDER BY q.updated_at DESC
         LIMIT 5`,
        [userId]
      );

      // Get active subscriptions/passes
      const subscriptionsResult = await database.query(
        `SELECT s.*, 
                (SELECT COUNT(*) FROM user_passes WHERE user_id = $1 AND status = 'active' AND expires_at > CURRENT_TIMESTAMP) as available_passes
         FROM subscriptions s
         WHERE s.user_id = $1 AND s.status = 'active' AND s.end_date > CURRENT_TIMESTAMP
         ORDER BY s.created_at DESC`,
        [userId]
      );

      // Get favorite businesses (most visited)
      const favoriteBusinessesResult = await database.query(
        `SELECT b.id, b.name, b.category, b.address, b.images, COUNT(q.id) as visit_count
         FROM businesses b
         JOIN queues q ON b.id = q.business_id
         WHERE q.user_id = $1
         GROUP BY b.id, b.name, b.category, b.address, b.images
         ORDER BY visit_count DESC
         LIMIT 3`,
        [userId]
      );

      const currentQueue = currentQueueResult.rows.length > 0 ? {
        id: currentQueueResult.rows[0].id,
        position: currentQueueResult.rows[0].position,
        estimatedWaitTime: currentQueueResult.rows[0].estimated_wait_time,
        business: {
          name: currentQueueResult.rows[0].business_name,
          address: currentQueueResult.rows[0].business_address,
          category: currentQueueResult.rows[0].business_category
        },
        joinedAt: currentQueueResult.rows[0].joined_at
      } : null;

      const recentActivity = recentActivityResult.rows.map((queue: any) => ({
        id: queue.id,
        businessName: queue.business_name,
        category: queue.business_category,
        status: queue.status,
        completedAt: queue.completed_at || queue.cancelled_at,
        waitTime: queue.estimated_wait_time
      }));

      const subscriptions = subscriptionsResult.rows.map((sub: any) => ({
        id: sub.id,
        planType: sub.plan_type,
        status: sub.status,
        endDate: sub.end_date,
        availablePasses: parseInt(sub.available_passes) || 0
      }));

      const favoriteBusinesses = favoriteBusinessesResult.rows.map((business: any) => ({
        id: business.id,
        name: business.name,
        category: business.category,
        address: business.address,
        images: business.images,
        visitCount: parseInt(business.visit_count)
      }));

      res.json(ResponseUtils.success({
        currentQueue,
        recentActivity,
        subscriptions,
        favoriteBusinesses,
        hasActiveSubscription: subscriptions.length > 0
      }));

    } catch (error) {
      logger.error("Get dashboard error:", error);
      res.status(500).json(ResponseUtils.error("Failed to get dashboard data"));
    }
  }

  /**
   * Delete user account
   */
  static async deleteAccount(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const { password, reason } = req.body;

      if (!password) {
        res.status(400).json(ResponseUtils.error("Password is required to delete account"));
        return;
      }

      // Verify password before deletion
      const userResult = await database.query(
        "SELECT password_hash FROM users WHERE id = $1",
        [userId]
      );

      if (userResult.rows.length === 0) {
        res.status(404).json(ResponseUtils.error("User not found"));
        return;
      }

      // Note: You'll need to implement password verification
      // const isPasswordValid = await AuthUtils.comparePassword(password, userResult.rows[0].password_hash);
      // if (!isPasswordValid) {
      //   res.status(400).json(ResponseUtils.error("Invalid password"));
      //   return;
      // }

      const client = await database.getClient();

      try {
        await client.query("BEGIN");

        // Log account deletion
        if (reason) {
          await client.query(
            `INSERT INTO account_deletions (user_id, reason, deleted_at)
             VALUES ($1, $2, CURRENT_TIMESTAMP)`,
            [userId, reason]
          );
        }

        // Soft delete - mark user as inactive instead of hard delete
        await client.query(
          `UPDATE users 
           SET is_active = FALSE, email = CONCAT(email, '_deleted_', EXTRACT(EPOCH FROM CURRENT_TIMESTAMP)),
               updated_at = CURRENT_TIMESTAMP
           WHERE id = $1`,
          [userId]
        );

        // Cancel active subscriptions
        await client.query(
          "UPDATE subscriptions SET status = 'cancelled' WHERE user_id = $1 AND status = 'active'",
          [userId]
        );

        await client.query("COMMIT");

        logger.info("User account deleted", { userId, reason: reason || 'No reason provided' });

        res.json(ResponseUtils.success(null, "Account deleted successfully"));

      } catch (error) {
        await client.query("ROLLBACK");
        throw error;
      } finally {
        client.release();
      }

    } catch (error) {
      logger.error("Delete account error:", error);
      res.status(500).json(ResponseUtils.error("Failed to delete account"));
    }
  }
}
