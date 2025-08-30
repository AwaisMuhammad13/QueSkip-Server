import { Request, Response } from "express";
import { AuthenticatedRequest } from "../middleware/auth";
import database from "../config/database";
import { ResponseUtils, ValidationUtils } from "../utils";
import { logger } from "../middleware/errorHandler";

export class ReviewController {
  /**
   * Create a new review
   */
  static async createReview(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const { businessId, queueId, rating, comment } = req.body;

      // Validate required fields
      if (!businessId || !rating) {
        res.status(400).json(ResponseUtils.error("Business ID and rating are required"));
        return;
      }

      if (!ValidationUtils.isValidUUID(businessId)) {
        res.status(400).json(ResponseUtils.error("Invalid business ID"));
        return;
      }

      // Validate rating range
      if (rating < 1 || rating > 5) {
        res.status(400).json(ResponseUtils.error("Rating must be between 1 and 5"));
        return;
      }

      // Validate queue ID if provided
      if (queueId && !ValidationUtils.isValidUUID(queueId)) {
        res.status(400).json(ResponseUtils.error("Invalid queue ID"));
        return;
      }

      // Check if business exists
      const businessResult = await database.query(
        "SELECT id, name FROM businesses WHERE id = $1",
        [businessId]
      );

      if (businessResult.rows.length === 0) {
        res.status(404).json(ResponseUtils.error("Business not found"));
        return;
      }

      // Check if user already reviewed this business
      const existingReview = await database.query(
        "SELECT id FROM reviews WHERE user_id = $1 AND business_id = $2",
        [userId, businessId]
      );

      if (existingReview.rows.length > 0) {
        res.status(409).json(ResponseUtils.error("You have already reviewed this business"));
        return;
      }

      // If queueId is provided, verify it belongs to the user and business
      if (queueId) {
        const queueResult = await database.query(
          "SELECT id FROM queues WHERE id = $1 AND user_id = $2 AND business_id = $3",
          [queueId, userId, businessId]
        );

        if (queueResult.rows.length === 0) {
          res.status(400).json(ResponseUtils.error("Invalid queue ID for this business"));
          return;
        }
      }

      const client = await database.getClient();

      try {
        await client.query("BEGIN");

        // Create the review
        const reviewResult = await client.query(
          `INSERT INTO reviews (user_id, business_id, queue_id, rating, comment)
           VALUES ($1, $2, $3, $4, $5)
           RETURNING id, rating, comment, created_at`,
          [userId, businessId, queueId || null, rating, comment || null]
        );

        // Update business rating statistics
        const statsResult = await client.query(
          `SELECT AVG(rating)::DECIMAL(3,2) as avg_rating, COUNT(*) as total_reviews
           FROM reviews WHERE business_id = $1`,
          [businessId]
        );

        const stats = statsResult.rows[0];

        await client.query(
          `UPDATE businesses 
           SET average_rating = $1, total_reviews = $2 
           WHERE id = $3`,
          [stats.avg_rating, stats.total_reviews, businessId]
        );

        await client.query("COMMIT");

        const review = reviewResult.rows[0];
        const business = businessResult.rows[0];

        logger.info("Review created", { 
          userId, 
          businessId, 
          reviewId: review.id, 
          rating: review.rating 
        });

        res.status(201).json(ResponseUtils.success({
          id: review.id,
          businessId,
          businessName: business.name,
          queueId: queueId || null,
          rating: review.rating,
          comment: review.comment,
          createdAt: review.created_at,
        }, "Review created successfully"));

      } catch (error) {
        await client.query("ROLLBACK");
        throw error;
      } finally {
        client.release();
      }

    } catch (error) {
      logger.error("Create review error:", error);
      res.status(500).json(ResponseUtils.error("Failed to create review"));
    }
  }

  /**
   * Get reviews for a business
   */
  static async getBusinessReviews(req: Request, res: Response): Promise<void> {
    try {
      const { businessId } = req.params;
      const { page = 1, limit = 10, rating } = req.query;

      if (!ValidationUtils.isValidUUID(businessId)) {
        res.status(400).json(ResponseUtils.error("Invalid business ID"));
        return;
      }

      let whereConditions = ["r.business_id = $1"];
      let queryParams: any[] = [businessId];
      let paramCount = 1;

      if (rating) {
        paramCount++;
        whereConditions.push(`r.rating = $${paramCount}`);
        queryParams.push(Number(rating));
      }

      const whereClause = whereConditions.join(" AND ");
      const offset = (Number(page) - 1) * Number(limit);

      // Get total count
      const countQuery = `SELECT COUNT(*) FROM reviews r WHERE ${whereClause}`;
      const countResult = await database.query(countQuery, queryParams);
      const total = parseInt(countResult.rows[0].count);

      // Get reviews
      paramCount += 2;
      const query = `
        SELECT r.id, r.rating, r.comment, r.created_at,
               u.first_name, u.last_name, u.profile_image
        FROM reviews r
        JOIN users u ON r.user_id = u.id
        WHERE ${whereClause}
        ORDER BY r.created_at DESC
        LIMIT $${paramCount - 1} OFFSET $${paramCount}
      `;

      queryParams.push(limit, offset);
      const result = await database.query(query, queryParams);

      const reviews = result.rows.map((review: any) => ({
        id: review.id,
        rating: review.rating,
        comment: review.comment,
        createdAt: review.created_at,
        user: {
          firstName: review.first_name,
          lastName: review.last_name,
          profileImage: review.profile_image,
        },
      }));

      // Get rating distribution
      const distributionQuery = `
        SELECT rating, COUNT(*) as count
        FROM reviews
        WHERE business_id = $1
        GROUP BY rating
        ORDER BY rating DESC
      `;

      const distributionResult = await database.query(distributionQuery, [businessId]);
      const ratingDistribution = distributionResult.rows.reduce((acc: any, row: any) => {
        acc[row.rating] = parseInt(row.count);
        return acc;
      }, {});

      res.json(ResponseUtils.paginated(reviews, Number(page), Number(limit), total, {
        ratingDistribution,
      }));
    } catch (error) {
      logger.error("Get business reviews error:", error);
      res.status(500).json(ResponseUtils.error("Failed to get business reviews"));
    }
  }

  /**
   * Get user's reviews
   */
  static async getUserReviews(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const { page = 1, limit = 10 } = req.query;

      const offset = (Number(page) - 1) * Number(limit);

      // Get total count
      const countResult = await database.query(
        "SELECT COUNT(*) FROM reviews WHERE user_id = $1",
        [userId]
      );
      const total = parseInt(countResult.rows[0].count);

      // Get reviews
      const query = `
        SELECT r.id, r.rating, r.comment, r.created_at,
               b.id as business_id, b.name as business_name, 
               b.address as business_address, b.category as business_category
        FROM reviews r
        JOIN businesses b ON r.business_id = b.id
        WHERE r.user_id = $1
        ORDER BY r.created_at DESC
        LIMIT $2 OFFSET $3
      `;

      const result = await database.query(query, [userId, limit, offset]);

      const reviews = result.rows.map((review: any) => ({
        id: review.id,
        rating: review.rating,
        comment: review.comment,
        createdAt: review.created_at,
        business: {
          id: review.business_id,
          name: review.business_name,
          address: review.business_address,
          category: review.business_category,
        },
      }));

      res.json(ResponseUtils.paginated(reviews, Number(page), Number(limit), total));
    } catch (error) {
      logger.error("Get user reviews error:", error);
      res.status(500).json(ResponseUtils.error("Failed to get user reviews"));
    }
  }

  /**
   * Update a review
   */
  static async updateReview(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const { reviewId } = req.params;
      const { rating, comment } = req.body;

      if (!ValidationUtils.isValidUUID(reviewId)) {
        res.status(400).json(ResponseUtils.error("Invalid review ID"));
        return;
      }

      // Validate rating if provided
      if (rating && (rating < 1 || rating > 5)) {
        res.status(400).json(ResponseUtils.error("Rating must be between 1 and 5"));
        return;
      }

      // Check if review exists and belongs to user
      const reviewResult = await database.query(
        "SELECT id, business_id, rating as old_rating FROM reviews WHERE id = $1 AND user_id = $2",
        [reviewId, userId]
      );

      if (reviewResult.rows.length === 0) {
        res.status(404).json(ResponseUtils.error("Review not found"));
        return;
      }

      const existingReview = reviewResult.rows[0];
      const client = await database.getClient();

      try {
        await client.query("BEGIN");

        // Build update query dynamically
        const updates: string[] = [];
        const values: any[] = [];
        let paramCount = 0;

        if (rating !== undefined) {
          paramCount++;
          updates.push(`rating = $${paramCount}`);
          values.push(rating);
        }

        if (comment !== undefined) {
          paramCount++;
          updates.push(`comment = $${paramCount}`);
          values.push(comment);
        }

        if (updates.length === 0) {
          res.status(400).json(ResponseUtils.error("No valid fields to update"));
          return;
        }

        paramCount++;
        updates.push(`updated_at = CURRENT_TIMESTAMP`);
        values.push(reviewId);

        const updateQuery = `
          UPDATE reviews 
          SET ${updates.join(", ")}
          WHERE id = $${paramCount}
          RETURNING id, rating, comment, updated_at
        `;

        const updatedReview = await client.query(updateQuery, values);

        // If rating was updated, recalculate business statistics
        if (rating !== undefined && rating !== existingReview.old_rating) {
          const statsResult = await client.query(
            `SELECT AVG(rating)::DECIMAL(3,2) as avg_rating, COUNT(*) as total_reviews
             FROM reviews WHERE business_id = $1`,
            [existingReview.business_id]
          );

          const stats = statsResult.rows[0];

          await client.query(
            `UPDATE businesses 
             SET average_rating = $1, total_reviews = $2 
             WHERE id = $3`,
            [stats.avg_rating, stats.total_reviews, existingReview.business_id]
          );
        }

        await client.query("COMMIT");

        const review = updatedReview.rows[0];

        logger.info("Review updated", { 
          userId, 
          reviewId, 
          businessId: existingReview.business_id 
        });

        res.json(ResponseUtils.success({
          id: review.id,
          rating: review.rating,
          comment: review.comment,
          updatedAt: review.updated_at,
        }, "Review updated successfully"));

      } catch (error) {
        await client.query("ROLLBACK");
        throw error;
      } finally {
        client.release();
      }

    } catch (error) {
      logger.error("Update review error:", error);
      res.status(500).json(ResponseUtils.error("Failed to update review"));
    }
  }

  /**
   * Delete a review
   */
  static async deleteReview(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const { reviewId } = req.params;

      if (!ValidationUtils.isValidUUID(reviewId)) {
        res.status(400).json(ResponseUtils.error("Invalid review ID"));
        return;
      }

      // Check if review exists and belongs to user
      const reviewResult = await database.query(
        "SELECT id, business_id FROM reviews WHERE id = $1 AND user_id = $2",
        [reviewId, userId]
      );

      if (reviewResult.rows.length === 0) {
        res.status(404).json(ResponseUtils.error("Review not found"));
        return;
      }

      const review = reviewResult.rows[0];
      const client = await database.getClient();

      try {
        await client.query("BEGIN");

        // Delete the review
        await client.query("DELETE FROM reviews WHERE id = $1", [reviewId]);

        // Recalculate business statistics
        const statsResult = await client.query(
          `SELECT AVG(rating)::DECIMAL(3,2) as avg_rating, COUNT(*) as total_reviews
           FROM reviews WHERE business_id = $1`,
          [review.business_id]
        );

        const stats = statsResult.rows[0];

        await client.query(
          `UPDATE businesses 
           SET average_rating = $1, total_reviews = $2 
           WHERE id = $3`,
          [stats.avg_rating || 0, stats.total_reviews, review.business_id]
        );

        await client.query("COMMIT");

        logger.info("Review deleted", { 
          userId, 
          reviewId, 
          businessId: review.business_id 
        });

        res.json(ResponseUtils.success(null, "Review deleted successfully"));

      } catch (error) {
        await client.query("ROLLBACK");
        throw error;
      } finally {
        client.release();
      }

    } catch (error) {
      logger.error("Delete review error:", error);
      res.status(500).json(ResponseUtils.error("Failed to delete review"));
    }
  }

  /**
   * Get review by ID
   */
  static async getReviewById(req: Request, res: Response): Promise<void> {
    try {
      const { reviewId } = req.params;

      if (!ValidationUtils.isValidUUID(reviewId)) {
        res.status(400).json(ResponseUtils.error("Invalid review ID"));
        return;
      }

      const query = `
        SELECT r.id, r.rating, r.comment, r.created_at, r.updated_at,
               u.first_name, u.last_name, u.profile_image,
               b.id as business_id, b.name as business_name
        FROM reviews r
        JOIN users u ON r.user_id = u.id
        JOIN businesses b ON r.business_id = b.id
        WHERE r.id = $1
      `;

      const result = await database.query(query, [reviewId]);

      if (result.rows.length === 0) {
        res.status(404).json(ResponseUtils.error("Review not found"));
        return;
      }

      const review = result.rows[0];

      res.json(ResponseUtils.success({
        id: review.id,
        rating: review.rating,
        comment: review.comment,
        createdAt: review.created_at,
        updatedAt: review.updated_at,
        user: {
          firstName: review.first_name,
          lastName: review.last_name,
          profileImage: review.profile_image,
        },
        business: {
          id: review.business_id,
          name: review.business_name,
        },
      }));
    } catch (error) {
      logger.error("Get review by ID error:", error);
      res.status(500).json(ResponseUtils.error("Failed to get review"));
    }
  }
}
