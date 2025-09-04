-- Check if user_passes table exists, if not create it
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'user_passes') THEN
        CREATE TABLE user_passes (
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
    END IF;
END $$;

-- Check if pass_usage table exists, if not create it
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'pass_usage') THEN
        CREATE TABLE pass_usage (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          subscription_id UUID NOT NULL REFERENCES subscriptions(id) ON DELETE CASCADE,
          business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
          queue_id UUID REFERENCES queues(id) ON DELETE SET NULL,
          pass_type VARCHAR(20) NOT NULL,
          used_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
    END IF;
END $$;

-- Check if user_preferences table exists, if not create it
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'user_preferences') THEN
        CREATE TABLE user_preferences (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          notification_settings JSONB DEFAULT '{"push": true, "email": true, "queue_updates": true, "promotions": false}',
          privacy_settings JSONB DEFAULT '{"location_sharing": true, "profile_visibility": "public"}',
          app_settings JSONB DEFAULT '{"theme": "light", "language": "en", "auto_join_queue": false}',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          UNIQUE(user_id)
        );
    END IF;
END $$;

-- Add new columns to existing tables if they don't exist
DO $$ 
BEGIN
    -- Add notification_token to users if it doesn't exist
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'notification_token') THEN
        ALTER TABLE users ADD COLUMN notification_token VARCHAR(500);
    END IF;
    
    -- Add location tracking to users
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'last_location_lat') THEN
        ALTER TABLE users ADD COLUMN last_location_lat DECIMAL(10, 8);
    END IF;
    
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'last_location_lng') THEN
        ALTER TABLE users ADD COLUMN last_location_lng DECIMAL(11, 8);
    END IF;
    
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'location_updated_at') THEN
        ALTER TABLE users ADD COLUMN location_updated_at TIMESTAMP;
    END IF;
    
    -- Add skip pass features to businesses
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'businesses' AND column_name = 'skip_pass_enabled') THEN
        ALTER TABLE businesses ADD COLUMN skip_pass_enabled BOOLEAN DEFAULT TRUE;
    END IF;
    
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'businesses' AND column_name = 'skip_pass_price') THEN
        ALTER TABLE businesses ADD COLUMN skip_pass_price DECIMAL(8, 2) DEFAULT 15.00;
    END IF;
    
    -- Add party size to queues
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'queues' AND column_name = 'party_size') THEN
        ALTER TABLE queues ADD COLUMN party_size INTEGER DEFAULT 1;
    END IF;
    
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'queues' AND column_name = 'skip_pass_used') THEN
        ALTER TABLE queues ADD COLUMN skip_pass_used BOOLEAN DEFAULT FALSE;
    END IF;
END $$;
