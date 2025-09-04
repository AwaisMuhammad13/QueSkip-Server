import { Request, Response } from "express";
import { AuthenticatedRequest } from "../middleware/auth";
import database from "../config/database";
import { ResponseUtils, ValidationUtils } from "../utils";
import { logger } from "../middleware/errorHandler";

export class SubscriptionController {
  /**
   * Get subscription plans
   */
  static async getPlans(req: Request, res: Response): Promise<void> {
    try {
      const plans = [
        {
          id: "one_time_skip",
          name: "One Time Q Skip Pass",
          description: "Skip the queue once at any business",
          type: "one_time",
          price: 15.00,
          currency: "USD",
          features: [
            "Skip to front of queue",
            "One-time use",
            "Valid for 30 days",
            "Works at any business"
          ]
        },
        {
          id: "monthly_unlimited",
          name: "Monthly Unlimited",
          description: "Unlimited queue skips for one month",
          type: "monthly",
          price: 29.99,
          currency: "USD",
          features: [
            "Unlimited queue skips",
            "Monthly subscription",
            "Priority customer support",
            "Early access to new features"
          ]
        },
        {
          id: "yearly_premium",
          name: "Yearly Premium",
          description: "Unlimited queue skips for one year with savings",
          type: "yearly",
          price: 299.99,
          currency: "USD",
          originalPrice: 359.88,
          savings: 59.89,
          features: [
            "Unlimited queue skips",
            "Yearly subscription",
            "Priority customer support",
            "Early access to new features",
            "Exclusive premium features"
          ]
        }
      ];

      res.json(ResponseUtils.success(plans));
    } catch (error) {
      logger.error("Get subscription plans error:", error);
      res.status(500).json(ResponseUtils.error("Failed to get subscription plans"));
    }
  }

  /**
   * Purchase a subscription or pass
   */
  static async purchaseSubscription(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const { planId, paymentMethodId, billingDetails } = req.body;

      if (!planId || !paymentMethodId) {
        res.status(400).json(ResponseUtils.error("Plan ID and payment method are required"));
        return;
      }

      // Get plan details
      const plans = [
        { id: "one_time_skip", price: 15.00, type: "one_time", duration: 30 },
        { id: "monthly_unlimited", price: 29.99, type: "monthly", duration: 30 },
        { id: "yearly_premium", price: 299.99, type: "yearly", duration: 365 }
      ];

      const plan = plans.find(p => p.id === planId);
      if (!plan) {
        res.status(400).json(ResponseUtils.error("Invalid plan ID"));
        return;
      }

      const client = await database.getClient();

      try {
        await client.query("BEGIN");

        // Calculate subscription dates
        const startDate = new Date();
        const endDate = new Date();
        endDate.setDate(startDate.getDate() + plan.duration);

        // Create subscription record
        const subscriptionResult = await client.query(
          `INSERT INTO subscriptions (user_id, plan_type, status, start_date, end_date, amount, currency, payment_method_id)
           VALUES ($1, $2, 'active', $3, $4, $5, 'USD', $6)
           RETURNING id, plan_type, status, start_date, end_date, amount`,
          [userId, plan.type, startDate, endDate, plan.price, paymentMethodId]
        );

        // Create payment record
        const paymentResult = await client.query(
          `INSERT INTO payments (user_id, subscription_id, amount, currency, payment_method, status, processed_at)
           VALUES ($1, $2, $3, 'USD', 'credit_card', 'completed', CURRENT_TIMESTAMP)
           RETURNING id, amount, status, processed_at`,
          [userId, subscriptionResult.rows[0].id, plan.price]
        );

        // If it's a one-time pass, create a pass record for tracking usage
        if (plan.type === "one_time") {
          await client.query(
            `INSERT INTO user_passes (user_id, subscription_id, pass_type, status, expires_at)
             VALUES ($1, $2, 'skip_pass', 'active', $3)`,
            [userId, subscriptionResult.rows[0].id, endDate]
          );
        }

        await client.query("COMMIT");

        const subscription = subscriptionResult.rows[0];
        const payment = paymentResult.rows[0];

        logger.info("Subscription purchased", { 
          userId, 
          subscriptionId: subscription.id, 
          planId,
          amount: plan.price 
        });

        res.status(201).json(ResponseUtils.success({
          subscription: {
            id: subscription.id,
            planType: subscription.plan_type,
            status: subscription.status,
            startDate: subscription.start_date,
            endDate: subscription.end_date,
            amount: subscription.amount
          },
          payment: {
            id: payment.id,
            amount: payment.amount,
            status: payment.status,
            processedAt: payment.processed_at
          }
        }, "Subscription purchased successfully"));

      } catch (error) {
        await client.query("ROLLBACK");
        throw error;
      } finally {
        client.release();
      }

    } catch (error) {
      logger.error("Purchase subscription error:", error);
      res.status(500).json(ResponseUtils.error("Failed to purchase subscription"));
    }
  }

  /**
   * Get user's active subscriptions and passes
   */
  static async getUserSubscriptions(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;

      // Get active subscriptions
      const subscriptionsQuery = `
        SELECT s.id, s.plan_type, s.status, s.start_date, s.end_date, s.amount, s.currency,
               s.created_at
        FROM subscriptions s
        WHERE s.user_id = $1 AND s.status = 'active' AND s.end_date > CURRENT_TIMESTAMP
        ORDER BY s.created_at DESC
      `;

      const subscriptionsResult = await database.query(subscriptionsQuery, [userId]);

      // Get available passes (for one-time skips)
      const passesQuery = `
        SELECT up.id, up.pass_type, up.status, up.expires_at, up.used_at,
               s.plan_type, s.amount
        FROM user_passes up
        JOIN subscriptions s ON up.subscription_id = s.id
        WHERE up.user_id = $1 AND up.status = 'active' AND up.expires_at > CURRENT_TIMESTAMP
        ORDER BY up.expires_at ASC
      `;

      const passesResult = await database.query(passesQuery, [userId]);

      const subscriptions = subscriptionsResult.rows.map((sub: any) => ({
        id: sub.id,
        planType: sub.plan_type,
        status: sub.status,
        startDate: sub.start_date,
        endDate: sub.end_date,
        amount: parseFloat(sub.amount),
        currency: sub.currency,
        createdAt: sub.created_at
      }));

      const passes = passesResult.rows.map((pass: any) => ({
        id: pass.id,
        type: pass.pass_type,
        status: pass.status,
        expiresAt: pass.expires_at,
        usedAt: pass.used_at,
        planType: pass.plan_type,
        amount: parseFloat(pass.amount)
      }));

      res.json(ResponseUtils.success({
        subscriptions,
        passes,
        hasActiveSubscription: subscriptions.length > 0,
        hasAvailablePasses: passes.length > 0
      }));

    } catch (error) {
      logger.error("Get user subscriptions error:", error);
      res.status(500).json(ResponseUtils.error("Failed to get subscriptions"));
    }
  }

  /**
   * Use a skip pass
   */
  static async useSkipPass(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const { businessId, queueId } = req.body;

      if (!businessId) {
        res.status(400).json(ResponseUtils.error("Business ID is required"));
        return;
      }

      if (!ValidationUtils.isValidUUID(businessId)) {
        res.status(400).json(ResponseUtils.error("Invalid business ID"));
        return;
      }

      const client = await database.getClient();

      try {
        await client.query("BEGIN");

        // Check if user has an available pass or active subscription
        const checkQuery = `
          SELECT 'pass' as type, up.id, up.subscription_id, s.plan_type
          FROM user_passes up
          JOIN subscriptions s ON up.subscription_id = s.id
          WHERE up.user_id = $1 AND up.status = 'active' AND up.expires_at > CURRENT_TIMESTAMP
          
          UNION ALL
          
          SELECT 'subscription' as type, s.id, s.id as subscription_id, s.plan_type
          FROM subscriptions s
          WHERE s.user_id = $1 AND s.status = 'active' AND s.end_date > CURRENT_TIMESTAMP
            AND s.plan_type IN ('monthly', 'yearly')
          
          ORDER BY type DESC
          LIMIT 1
        `;

        const availableResult = await client.query(checkQuery, [userId]);

        if (availableResult.rows.length === 0) {
          res.status(400).json(ResponseUtils.error("No active passes or subscriptions available"));
          return;
        }

        const available = availableResult.rows[0];

        // If it's a one-time pass, mark it as used
        if (available.type === 'pass') {
          await client.query(
            `UPDATE user_passes 
             SET status = 'used', used_at = CURRENT_TIMESTAMP 
             WHERE id = $1`,
            [available.id]
          );
        }

        // Create usage record
        await client.query(
          `INSERT INTO pass_usage (user_id, subscription_id, business_id, queue_id, pass_type, used_at)
           VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP)`,
          [userId, available.subscription_id, businessId, queueId || null, available.plan_type]
        );

        await client.query("COMMIT");

        logger.info("Skip pass used", { 
          userId, 
          businessId, 
          queueId,
          passType: available.plan_type 
        });

        res.json(ResponseUtils.success({
          passUsed: true,
          passType: available.plan_type,
          businessId,
          usedAt: new Date().toISOString()
        }, "Skip pass used successfully"));

      } catch (error) {
        await client.query("ROLLBACK");
        throw error;
      } finally {
        client.release();
      }

    } catch (error) {
      logger.error("Use skip pass error:", error);
      res.status(500).json(ResponseUtils.error("Failed to use skip pass"));
    }
  }

  /**
   * Get subscription usage history
   */
  static async getUsageHistory(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const { page = 1, limit = 10 } = req.query;

      const offset = (Number(page) - 1) * Number(limit);

      // Get total count
      const countResult = await database.query(
        "SELECT COUNT(*) FROM pass_usage WHERE user_id = $1",
        [userId]
      );
      const total = parseInt(countResult.rows[0].count);

      // Get usage history
      const query = `
        SELECT pu.id, pu.business_id, pu.queue_id, pu.pass_type, pu.used_at,
               b.name as business_name, b.address as business_address,
               b.category as business_category
        FROM pass_usage pu
        JOIN businesses b ON pu.business_id = b.id
        WHERE pu.user_id = $1
        ORDER BY pu.used_at DESC
        LIMIT $2 OFFSET $3
      `;

      const result = await database.query(query, [userId, limit, offset]);

      const usage = result.rows.map((item: any) => ({
        id: item.id,
        businessId: item.business_id,
        queueId: item.queue_id,
        passType: item.pass_type,
        usedAt: item.used_at,
        business: {
          name: item.business_name,
          address: item.business_address,
          category: item.business_category
        }
      }));

      res.json(ResponseUtils.paginated(usage, Number(page), Number(limit), total));

    } catch (error) {
      logger.error("Get usage history error:", error);
      res.status(500).json(ResponseUtils.error("Failed to get usage history"));
    }
  }

  /**
   * Cancel subscription
   */
  static async cancelSubscription(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const { subscriptionId, reason } = req.body;

      if (!subscriptionId) {
        res.status(400).json(ResponseUtils.error("Subscription ID is required"));
        return;
      }

      if (!ValidationUtils.isValidUUID(subscriptionId)) {
        res.status(400).json(ResponseUtils.error("Invalid subscription ID"));
        return;
      }

      // Check if subscription belongs to user
      const subscriptionResult = await database.query(
        "SELECT id, plan_type, status FROM subscriptions WHERE id = $1 AND user_id = $2",
        [subscriptionId, userId]
      );

      if (subscriptionResult.rows.length === 0) {
        res.status(404).json(ResponseUtils.error("Subscription not found"));
        return;
      }

      const subscription = subscriptionResult.rows[0];

      if (subscription.status === 'cancelled') {
        res.status(400).json(ResponseUtils.error("Subscription is already cancelled"));
        return;
      }

      // Update subscription status
      await database.query(
        `UPDATE subscriptions 
         SET status = 'cancelled', updated_at = CURRENT_TIMESTAMP 
         WHERE id = $1`,
        [subscriptionId]
      );

      // Log cancellation reason if provided
      if (reason) {
        await database.query(
          `INSERT INTO subscription_cancellations (subscription_id, user_id, reason, cancelled_at)
           VALUES ($1, $2, $3, CURRENT_TIMESTAMP)`,
          [subscriptionId, userId, reason]
        );
      }

      logger.info("Subscription cancelled", { 
        userId, 
        subscriptionId, 
        reason: reason || 'No reason provided' 
      });

      res.json(ResponseUtils.success({
        subscriptionId,
        status: 'cancelled',
        cancelledAt: new Date().toISOString()
      }, "Subscription cancelled successfully"));

    } catch (error) {
      logger.error("Cancel subscription error:", error);
      res.status(500).json(ResponseUtils.error("Failed to cancel subscription"));
    }
  }
}
