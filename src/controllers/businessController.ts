import { Request, Response } from "express";
import { AuthenticatedRequest } from "../middleware/auth";
import database from "../config/database";
import { ResponseUtils, ValidationUtils } from "../utils";
import { ApiResponse, BusinessCategory } from "../types";
import { logger } from "../middleware/errorHandler";

export class BusinessController {
  /**
   * Get all businesses with filters
   */
  static async getBusinesses(req: Request, res: Response): Promise<void> {
    try {
      const { 
        category, 
        latitude, 
        longitude, 
        radius = 10, 
        page = 1, 
        limit = 20,
        search 
      } = req.query;

      let whereConditions = ["is_active = true"];
      let queryParams: any[] = [];
      let paramCount = 0;

      // Add category filter
      if (category) {
        paramCount++;
        whereConditions.push(`category = $${paramCount}`);
        queryParams.push(category);
      }

      // Add search filter
      if (search) {
        paramCount++;
        whereConditions.push(`(name ILIKE $${paramCount} OR description ILIKE $${paramCount})`);
        queryParams.push(`%${search}%`);
      }

      // Add location filter (within radius)
      if (latitude && longitude) {
        paramCount += 3;
        whereConditions.push(`
          ST_DWithin(
            ST_SetSRID(ST_MakePoint(longitude, latitude), 4326),
            ST_SetSRID(ST_MakePoint($${paramCount - 2}, $${paramCount - 1}), 4326),
            $${paramCount} * 1000
          )
        `);
        queryParams.push(longitude, latitude, radius);
      }

      const whereClause = whereConditions.join(" AND ");
      const offset = (Number(page) - 1) * Number(limit);

      // Get total count
      const countQuery = `SELECT COUNT(*) FROM businesses WHERE ${whereClause}`;
      const countResult = await database.query(countQuery, queryParams);
      const total = parseInt(countResult.rows[0].count);

      // Get businesses
      paramCount += 2;
      const query = `
        SELECT id, name, description, address, latitude, longitude, phone_number,
               category, images, average_wait_time, current_queue_count, 
               max_queue_capacity, operating_hours, created_at,
               (
                 SELECT AVG(rating) FROM reviews WHERE business_id = businesses.id
               ) as average_rating,
               (
                 SELECT COUNT(*) FROM reviews WHERE business_id = businesses.id
               ) as review_count
        FROM businesses 
        WHERE ${whereClause}
        ORDER BY created_at DESC
        LIMIT $${paramCount - 1} OFFSET $${paramCount}
      `;

      queryParams.push(limit, offset);
      const result = await database.query(query, queryParams);

      const businesses = result.rows.map((business: any) => ({
        id: business.id,
        name: business.name,
        description: business.description,
        address: business.address,
        latitude: parseFloat(business.latitude),
        longitude: parseFloat(business.longitude),
        phoneNumber: business.phone_number,
        category: business.category,
        images: business.images || [],
        averageWaitTime: business.average_wait_time,
        currentQueueCount: business.current_queue_count,
        maxQueueCapacity: business.max_queue_capacity,
        operatingHours: business.operating_hours,
        averageRating: business.average_rating ? parseFloat(business.average_rating) : 0,
        reviewCount: parseInt(business.review_count),
        createdAt: business.created_at,
      }));

      res.json(ResponseUtils.paginated(businesses, Number(page), Number(limit), total));
    } catch (error) {
      logger.error("Get businesses error:", error);
      res.status(500).json(ResponseUtils.error("Failed to get businesses"));
    }
  }

  /**
   * Get business by ID
   */
  static async getBusinessById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      if (!ValidationUtils.isValidUUID(id)) {
        res.status(400).json(ResponseUtils.error("Invalid business ID"));
        return;
      }

      const query = `
        SELECT b.id, b.name, b.description, b.address, b.latitude, b.longitude, 
               b.phone_number, b.category, b.images, b.average_wait_time, 
               b.current_queue_count, b.max_queue_capacity, b.operating_hours, 
               b.created_at,
               (SELECT AVG(rating) FROM reviews WHERE business_id = b.id) as average_rating,
               (SELECT COUNT(*) FROM reviews WHERE business_id = b.id) as review_count
        FROM businesses b
        WHERE b.id = $1 AND b.is_active = true
      `;

      const result = await database.query(query, [id]);

      if (result.rows.length === 0) {
        res.status(404).json(ResponseUtils.error("Business not found"));
        return;
      }

      const business = result.rows[0];

      res.json(ResponseUtils.success({
        id: business.id,
        name: business.name,
        description: business.description,
        address: business.address,
        latitude: parseFloat(business.latitude),
        longitude: parseFloat(business.longitude),
        phoneNumber: business.phone_number,
        category: business.category,
        images: business.images || [],
        averageWaitTime: business.average_wait_time,
        currentQueueCount: business.current_queue_count,
        maxQueueCapacity: business.max_queue_capacity,
        operatingHours: business.operating_hours,
        averageRating: business.average_rating ? parseFloat(business.average_rating) : 0,
        reviewCount: parseInt(business.review_count),
        createdAt: business.created_at,
      }));
    } catch (error) {
      logger.error("Get business by ID error:", error);
      res.status(500).json(ResponseUtils.error("Failed to get business"));
    }
  }

  /**
   * Get business categories
   */
  static async getCategories(req: Request, res: Response): Promise<void> {
    try {
      const categories = Object.values(BusinessCategory).map(category => ({
        key: category,
        label: category.charAt(0).toUpperCase() + category.slice(1),
      }));

      res.json(ResponseUtils.success(categories));
    } catch (error) {
      logger.error("Get categories error:", error);
      res.status(500).json(ResponseUtils.error("Failed to get categories"));
    }
  }

  /**
   * Search businesses
   */
  static async searchBusinesses(req: Request, res: Response): Promise<void> {
    try {
      const { q, category, limit = 10 } = req.query;

      if (!q || typeof q !== "string") {
        res.status(400).json(ResponseUtils.error("Search query is required"));
        return;
      }

      let whereConditions = ["is_active = true"];
      let queryParams: any[] = [];
      let paramCount = 0;

      // Add search condition
      paramCount++;
      whereConditions.push(`(name ILIKE $${paramCount} OR description ILIKE $${paramCount})`);
      queryParams.push(`%${q}%`);

      // Add category filter if provided
      if (category) {
        paramCount++;
        whereConditions.push(`category = $${paramCount}`);
        queryParams.push(category);
      }

      const whereClause = whereConditions.join(" AND ");

      const query = `
        SELECT id, name, description, address, category, images,
               average_wait_time, current_queue_count,
               (SELECT AVG(rating) FROM reviews WHERE business_id = businesses.id) as average_rating
        FROM businesses 
        WHERE ${whereClause}
        ORDER BY 
          CASE 
            WHEN name ILIKE $1 THEN 1
            WHEN name ILIKE $1 THEN 2
            ELSE 3
          END,
          average_wait_time ASC
        LIMIT $${paramCount + 1}
      `;

      queryParams.push(limit);
      const result = await database.query(query, queryParams);

      const businesses = result.rows.map((business: any) => ({
        id: business.id,
        name: business.name,
        description: business.description,
        address: business.address,
        category: business.category,
        images: business.images || [],
        averageWaitTime: business.average_wait_time,
        currentQueueCount: business.current_queue_count,
        averageRating: business.average_rating ? parseFloat(business.average_rating) : 0,
      }));

      res.json(ResponseUtils.success(businesses));
    } catch (error) {
      logger.error("Search businesses error:", error);
      res.status(500).json(ResponseUtils.error("Failed to search businesses"));
    }
  }

  /**
   * Get business reviews
   */
  static async getBusinessReviews(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { page = 1, limit = 10 } = req.query;

      if (!ValidationUtils.isValidUUID(id)) {
        res.status(400).json(ResponseUtils.error("Invalid business ID"));
        return;
      }

      const offset = (Number(page) - 1) * Number(limit);

      // Get total count
      const countResult = await database.query(
        "SELECT COUNT(*) FROM reviews WHERE business_id = $1",
        [id]
      );
      const total = parseInt(countResult.rows[0].count);

      // Get reviews
      const query = `
        SELECT r.id, r.rating, r.comment, r.created_at,
               u.full_name, u.profile_image
        FROM reviews r
        JOIN users u ON r.user_id = u.id
        WHERE r.business_id = $1
        ORDER BY r.created_at DESC
        LIMIT $2 OFFSET $3
      `;

      const result = await database.query(query, [id, limit, offset]);

      const reviews = result.rows.map((review: any) => ({
        id: review.id,
        rating: review.rating,
        comment: review.comment,
        createdAt: review.created_at,
        user: {
          fullName: review.full_name,
          profileImage: review.profile_image,
        },
      }));

      res.json(ResponseUtils.paginated(reviews, Number(page), Number(limit), total));
    } catch (error) {
      logger.error("Get business reviews error:", error);
      res.status(500).json(ResponseUtils.error("Failed to get business reviews"));
    }
  }

  /**
   * Get nearby businesses
   */
  static async getNearbyBusinesses(req: Request, res: Response): Promise<void> {
    try {
      const { latitude, longitude, radius = 5, limit = 10 } = req.query;

      if (!latitude || !longitude) {
        res.status(400).json(ResponseUtils.error("Latitude and longitude are required"));
        return;
      }

      if (!ValidationUtils.isValidLatitude(Number(latitude)) || 
          !ValidationUtils.isValidLongitude(Number(longitude))) {
        res.status(400).json(ResponseUtils.error("Invalid coordinates"));
        return;
      }

      const query = `
        SELECT id, name, address, latitude, longitude, category, images,
               average_wait_time, current_queue_count,
               ST_Distance(
                 ST_SetSRID(ST_MakePoint(longitude, latitude), 4326),
                 ST_SetSRID(ST_MakePoint($1, $2), 4326)
               ) * 111319.9 as distance_meters,
               (SELECT AVG(rating) FROM reviews WHERE business_id = businesses.id) as average_rating
        FROM businesses 
        WHERE is_active = true
          AND ST_DWithin(
            ST_SetSRID(ST_MakePoint(longitude, latitude), 4326),
            ST_SetSRID(ST_MakePoint($1, $2), 4326),
            $3 * 1000
          )
        ORDER BY distance_meters ASC
        LIMIT $4
      `;

      const result = await database.query(query, [longitude, latitude, radius, limit]);

      const businesses = result.rows.map((business: any) => ({
        id: business.id,
        name: business.name,
        address: business.address,
        latitude: parseFloat(business.latitude),
        longitude: parseFloat(business.longitude),
        category: business.category,
        images: business.images || [],
        averageWaitTime: business.average_wait_time,
        currentQueueCount: business.current_queue_count,
        averageRating: business.average_rating ? parseFloat(business.average_rating) : 0,
        distance: Math.round(business.distance_meters),
      }));

      res.json(ResponseUtils.success(businesses));
    } catch (error) {
      logger.error("Get nearby businesses error:", error);
      res.status(500).json(ResponseUtils.error("Failed to get nearby businesses"));
    }
  }
}
