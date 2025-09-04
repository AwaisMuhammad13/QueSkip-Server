-- Additional tables for pass management and usage tracking
-- Run this after the main schema.sql

-- User passes table (for one-time skip passes)
CREATE TABLE IF NOT EXISTS user_passes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  subscription_id UUID NOT NULL REFERENCES subscriptions(id) ON DELETE CASCADE,
  pass_type VARCHAR(20) NOT NULL CHECK (pass_type IN ('skip_pass', 'priority_pass')),
  status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'used', 'expired')),
  expires_at TIMESTAMP NOT NULL,
  used_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Pass usage tracking table
CREATE TABLE IF NOT EXISTS pass_usage (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  subscription_id UUID NOT NULL REFERENCES subscriptions(id) ON DELETE CASCADE,
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  queue_id UUID REFERENCES queues(id) ON DELETE SET NULL,
  pass_type VARCHAR(20) NOT NULL,
  used_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Subscription cancellations table (for tracking cancellation reasons)
CREATE TABLE IF NOT EXISTS subscription_cancellations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  subscription_id UUID NOT NULL REFERENCES subscriptions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reason TEXT,
  cancelled_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- User preferences table (for app settings)
CREATE TABLE IF NOT EXISTS user_preferences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  notification_settings JSONB DEFAULT '{"push": true, "email": true, "queue_updates": true, "promotions": false}',
  privacy_settings JSONB DEFAULT '{"location_sharing": true, "profile_visibility": "public"}',
  app_settings JSONB DEFAULT '{"theme": "light", "language": "en", "auto_join_queue": false}',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id)
);

-- Business hours table (more structured than JSON in businesses table)
CREATE TABLE IF NOT EXISTS business_hours (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6), -- 0 = Sunday, 6 = Saturday
  open_time TIME,
  close_time TIME,
  is_closed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(business_id, day_of_week)
);

-- Queue analytics table (for business insights)
CREATE TABLE IF NOT EXISTS queue_analytics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  total_customers INTEGER DEFAULT 0,
  average_wait_time INTEGER DEFAULT 0, -- in minutes
  peak_hour INTEGER, -- hour of day (0-23)
  total_skips_used INTEGER DEFAULT 0,
  total_revenue DECIMAL(10, 2) DEFAULT 0.00,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(business_id, date)
);

-- Indexes for new tables
CREATE INDEX IF NOT EXISTS idx_user_passes_user_id ON user_passes(user_id);
CREATE INDEX IF NOT EXISTS idx_user_passes_status ON user_passes(status);
CREATE INDEX IF NOT EXISTS idx_user_passes_expires_at ON user_passes(expires_at);
CREATE INDEX IF NOT EXISTS idx_pass_usage_user_id ON pass_usage(user_id);
CREATE INDEX IF NOT EXISTS idx_pass_usage_business_id ON pass_usage(business_id);
CREATE INDEX IF NOT EXISTS idx_pass_usage_used_at ON pass_usage(used_at);
CREATE INDEX IF NOT EXISTS idx_user_preferences_user_id ON user_preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_business_hours_business_id ON business_hours(business_id);
CREATE INDEX IF NOT EXISTS idx_business_hours_day ON business_hours(day_of_week);
CREATE INDEX IF NOT EXISTS idx_queue_analytics_business_date ON queue_analytics(business_id, date);

-- Triggers for auto-updating updated_at
CREATE TRIGGER IF NOT EXISTS update_user_passes_updated_at 
  BEFORE UPDATE ON user_passes 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER IF NOT EXISTS update_user_preferences_updated_at 
  BEFORE UPDATE ON user_preferences 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER IF NOT EXISTS update_business_hours_updated_at 
  BEFORE UPDATE ON business_hours 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER IF NOT EXISTS update_queue_analytics_updated_at 
  BEFORE UPDATE ON queue_analytics 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Update users table to include more mobile app specific fields
ALTER TABLE users ADD COLUMN IF NOT EXISTS date_of_birth DATE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS gender VARCHAR(20) CHECK (gender IN ('male', 'female', 'other', 'prefer_not_to_say'));
ALTER TABLE users ADD COLUMN IF NOT EXISTS notification_token VARCHAR(500); -- For push notifications
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_location_lat DECIMAL(10, 8);
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_location_lng DECIMAL(11, 8);
ALTER TABLE users ADD COLUMN IF NOT EXISTS location_updated_at TIMESTAMP;

-- Update businesses table for mobile app features
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS website VARCHAR(255);
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS social_media JSONB; -- Instagram, Facebook, etc.
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS amenities TEXT[]; -- Array of amenities
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS price_range VARCHAR(10) CHECK (price_range IN ('$', '$$', '$$$', '$$$$'));
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS queue_enabled BOOLEAN DEFAULT TRUE;
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS skip_pass_enabled BOOLEAN DEFAULT TRUE;
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS skip_pass_price DECIMAL(8, 2) DEFAULT 15.00;

-- Update queues table for better mobile tracking
ALTER TABLE queues ADD COLUMN IF NOT EXISTS estimated_call_time TIMESTAMP; -- When user will be called
ALTER TABLE queues ADD COLUMN IF NOT EXISTS notification_sent BOOLEAN DEFAULT FALSE;
ALTER TABLE queues ADD COLUMN IF NOT EXISTS skip_pass_used BOOLEAN DEFAULT FALSE;
ALTER TABLE queues ADD COLUMN IF NOT EXISTS party_size INTEGER DEFAULT 1;

-- Add indexes for new columns
CREATE INDEX IF NOT EXISTS idx_users_notification_token ON users(notification_token);
CREATE INDEX IF NOT EXISTS idx_users_last_location ON users(last_location_lat, last_location_lng);
CREATE INDEX IF NOT EXISTS idx_businesses_queue_enabled ON businesses(queue_enabled);
CREATE INDEX IF NOT EXISTS idx_businesses_skip_pass_enabled ON businesses(skip_pass_enabled);
CREATE INDEX IF NOT EXISTS idx_queues_estimated_call_time ON queues(estimated_call_time);
CREATE INDEX IF NOT EXISTS idx_queues_skip_pass_used ON queues(skip_pass_used);
