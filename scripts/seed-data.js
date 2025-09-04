const { Client } = require('pg');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const client = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL?.includes('railway') ? { rejectUnauthorized: false } : false
});

// Sample data for seeding
const sampleUsers = [
  {
    email: 'alice.johnson@email.com',
    password: 'Password123!',
    first_name: 'Alice',
    last_name: 'Johnson',
    phone_number: '+1-555-0101',
    is_email_verified: true,
    profile_image: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face',
    referral_code: 'ALICE2024'
  },
  {
    email: 'bob.smith@email.com',
    password: 'Password123!',
    first_name: 'Bob',
    last_name: 'Smith',
    phone_number: '+1-555-0102',
    is_email_verified: true,
    profile_image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
    referral_code: 'BOB2024'
  },
  {
    email: 'carol.white@email.com',
    password: 'Password123!',
    first_name: 'Carol',
    last_name: 'White',
    phone_number: '+1-555-0103',
    is_email_verified: true,
    profile_image: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face',
    referral_code: 'CAROL2024'
  },
  {
    email: 'david.brown@email.com',
    password: 'Password123!',
    first_name: 'David',
    last_name: 'Brown',
    phone_number: '+1-555-0104',
    is_email_verified: false,
    profile_image: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
    referral_code: 'DAVID2024'
  },
  {
    email: 'emma.davis@email.com',
    password: 'Password123!',
    first_name: 'Emma',
    last_name: 'Davis',
    phone_number: '+1-555-0105',
    is_email_verified: true,
    profile_image: 'https://images.unsplash.com/photo-1544725176-7c40e5a71c5e?w=150&h=150&fit=crop&crop=face',
    referral_code: 'EMMA2024'
  }
];

const sampleBusinesses = [
  {
    name: 'Downtown Coffee House',
    email: 'manager@downtowncoffee.com',
    password: 'Business123!',
    description: 'Artisan coffee and fresh pastries in the heart of downtown. Experience the perfect blend of quality coffee and cozy atmosphere.',
    address: '123 Main Street, Downtown, CA 90210',
    latitude: 34.0522,
    longitude: -118.2437,
    phone_number: '+1-555-2001',
    category: 'cafe',
    images: [
      'https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1559496417-e7f25cb247f3?w=800&h=600&fit=crop'
    ],
    average_wait_time: 8,
    current_queue_count: 3,
    max_queue_capacity: 25,
    is_verified: true,
    operating_hours: {
      monday: { open: '06:00', close: '20:00', closed: false },
      tuesday: { open: '06:00', close: '20:00', closed: false },
      wednesday: { open: '06:00', close: '20:00', closed: false },
      thursday: { open: '06:00', close: '20:00', closed: false },
      friday: { open: '06:00', close: '21:00', closed: false },
      saturday: { open: '07:00', close: '21:00', closed: false },
      sunday: { open: '08:00', close: '19:00', closed: false }
    }
  },
  {
    name: 'Bella Vista Restaurant',
    email: 'info@bellavista.com',
    password: 'Business123!',
    description: 'Fine dining with authentic Italian cuisine. Fresh ingredients, traditional recipes, and an extensive wine selection.',
    address: '456 Oak Avenue, Uptown, CA 90211',
    latitude: 34.0622,
    longitude: -118.2537,
    phone_number: '+1-555-2002',
    category: 'restaurant',
    images: [
      'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=800&h=600&fit=crop'
    ],
    average_wait_time: 25,
    current_queue_count: 8,
    max_queue_capacity: 50,
    is_verified: true,
    operating_hours: {
      monday: { open: '11:00', close: '22:00', closed: false },
      tuesday: { open: '11:00', close: '22:00', closed: false },
      wednesday: { open: '11:00', close: '22:00', closed: false },
      thursday: { open: '11:00', close: '22:00', closed: false },
      friday: { open: '11:00', close: '23:00', closed: false },
      saturday: { open: '11:00', close: '23:00', closed: false },
      sunday: { open: '12:00', close: '21:00', closed: false }
    }
  },
  {
    name: 'City Medical Center',
    email: 'appointments@citymedical.com',
    password: 'Business123!',
    description: 'Comprehensive healthcare services with experienced doctors and modern facilities. Walk-ins welcome.',
    address: '789 Health Drive, Medical District, CA 90212',
    latitude: 34.0722,
    longitude: -118.2637,
    phone_number: '+1-555-2003',
    category: 'healthcare',
    images: [
      'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1551601651-2a8555f1a136?w=800&h=600&fit=crop'
    ],
    average_wait_time: 45,
    current_queue_count: 12,
    max_queue_capacity: 30,
    is_verified: true,
    operating_hours: {
      monday: { open: '08:00', close: '18:00', closed: false },
      tuesday: { open: '08:00', close: '18:00', closed: false },
      wednesday: { open: '08:00', close: '18:00', closed: false },
      thursday: { open: '08:00', close: '18:00', closed: false },
      friday: { open: '08:00', close: '17:00', closed: false },
      saturday: { open: '09:00', close: '15:00', closed: false },
      sunday: { open: '10:00', close: '14:00', closed: false }
    }
  },
  {
    name: 'Fashion Forward Boutique',
    email: 'hello@fashionforward.com',
    password: 'Business123!',
    description: 'Trendy clothing and accessories for the modern fashionista. Personal styling services available.',
    address: '321 Style Street, Fashion District, CA 90213',
    latitude: 34.0822,
    longitude: -118.2737,
    phone_number: '+1-555-2004',
    category: 'retail',
    images: [
      'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1445205170230-053b83016050?w=800&h=600&fit=crop'
    ],
    average_wait_time: 15,
    current_queue_count: 5,
    max_queue_capacity: 20,
    is_verified: true,
    operating_hours: {
      monday: { open: '10:00', close: '20:00', closed: false },
      tuesday: { open: '10:00', close: '20:00', closed: false },
      wednesday: { open: '10:00', close: '20:00', closed: false },
      thursday: { open: '10:00', close: '20:00', closed: false },
      friday: { open: '10:00', close: '21:00', closed: false },
      saturday: { open: '10:00', close: '21:00', closed: false },
      sunday: { open: '12:00', close: '18:00', closed: false }
    }
  },
  {
    name: 'Grand Plaza Hotel',
    email: 'reception@grandplaza.com',
    password: 'Business123!',
    description: 'Luxury accommodations in the heart of the city. Concierge services, spa, and fine dining available.',
    address: '555 Grand Boulevard, Hotel District, CA 90214',
    latitude: 34.0922,
    longitude: -118.2837,
    phone_number: '+1-555-2005',
    category: 'hotel',
    images: [
      'https://images.unsplash.com/photo-1564501049412-61c2a3083791?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=800&h=600&fit=crop'
    ],
    average_wait_time: 12,
    current_queue_count: 2,
    max_queue_capacity: 15,
    is_verified: true,
    operating_hours: {
      monday: { open: '00:00', close: '23:59', closed: false },
      tuesday: { open: '00:00', close: '23:59', closed: false },
      wednesday: { open: '00:00', close: '23:59', closed: false },
      thursday: { open: '00:00', close: '23:59', closed: false },
      friday: { open: '00:00', close: '23:59', closed: false },
      saturday: { open: '00:00', close: '23:59', closed: false },
      sunday: { open: '00:00', close: '23:59', closed: false }
    }
  }
];

async function hashPasswords(items) {
  const saltRounds = 12;
  for (let item of items) {
    item.password = await bcrypt.hash(item.password, saltRounds);
  }
  return items;
}

async function seedDatabase() {
  try {
    await client.connect();
    console.log('🔌 Connected to PostgreSQL database');

    // Hash passwords
    console.log('🔐 Hashing passwords...');
    const hashedUsers = await hashPasswords([...sampleUsers]);
    const hashedBusinesses = await hashPasswords([...sampleBusinesses]);

    // Clear existing data (in order to respect foreign key constraints)
    console.log('🧹 Clearing existing data...');
    await client.query('DELETE FROM notifications');
    await client.query('DELETE FROM messages');
    await client.query('DELETE FROM conversations');
    await client.query('DELETE FROM payments');
    await client.query('DELETE FROM subscriptions');
    await client.query('DELETE FROM reviews');
    await client.query('DELETE FROM referrals');
    await client.query('DELETE FROM queues');
    await client.query('DELETE FROM businesses');
    await client.query('DELETE FROM users');

    // Insert users
    console.log('👥 Seeding users...');
    const userIds = [];
    for (let user of hashedUsers) {
      const result = await client.query(`
        INSERT INTO users (email, password_hash, first_name, last_name, phone_number, is_email_verified, profile_image, referral_code)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING id
      `, [user.email, user.password, user.first_name, user.last_name, user.phone_number, user.is_email_verified, user.profile_image, user.referral_code]);
      userIds.push(result.rows[0].id);
    }
    console.log(`✅ Created ${userIds.length} users`);

    // Insert businesses
    console.log('🏢 Seeding businesses...');
    const businessIds = [];
    for (let business of hashedBusinesses) {
      const result = await client.query(`
        INSERT INTO businesses (name, email, password, description, address, latitude, longitude, 
                               phone_number, category, images, average_wait_time, current_queue_count, 
                               max_queue_capacity, is_verified, operating_hours)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
        RETURNING id
      `, [
        business.name, business.email, business.password, business.description, business.address,
        business.latitude, business.longitude, business.phone_number, business.category,
        business.images, business.average_wait_time, business.current_queue_count,
        business.max_queue_capacity, business.is_verified, JSON.stringify(business.operating_hours)
      ]);
      businessIds.push(result.rows[0].id);
    }
    console.log(`✅ Created ${businessIds.length} businesses`);

    // Insert queues (some active queues)
    console.log('📋 Seeding queues...');
    const queueData = [
      { businessId: businessIds[0], userId: userIds[0], position: 1, estimatedWaitTime: 5, status: 'waiting' },
      { businessId: businessIds[0], userId: userIds[1], position: 2, estimatedWaitTime: 10, status: 'waiting' },
      { businessId: businessIds[0], userId: userIds[2], position: 3, estimatedWaitTime: 15, status: 'waiting' },
      
      { businessId: businessIds[1], userId: userIds[0], position: 1, estimatedWaitTime: 15, status: 'waiting' },
      { businessId: businessIds[1], userId: userIds[3], position: 2, estimatedWaitTime: 30, status: 'waiting' },
      { businessId: businessIds[1], userId: userIds[4], position: 3, estimatedWaitTime: 45, status: 'waiting' },
      { businessId: businessIds[1], userId: userIds[1], position: 4, estimatedWaitTime: 60, status: 'waiting' },
      
      { businessId: businessIds[2], userId: userIds[2], position: 1, estimatedWaitTime: 30, status: 'waiting' },
      { businessId: businessIds[2], userId: userIds[3], position: 2, estimatedWaitTime: 60, status: 'waiting' },
      
      // Some completed queues for history
      { businessId: businessIds[0], userId: userIds[3], position: 0, estimatedWaitTime: 0, status: 'completed' },
      { businessId: businessIds[1], userId: userIds[2], position: 0, estimatedWaitTime: 0, status: 'completed' }
    ];

    for (let queue of queueData) {
      await client.query(`
        INSERT INTO queues (business_id, user_id, position, estimated_wait_time, status, 
                           joined_at, completed_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
      `, [
        queue.businessId, queue.userId, queue.position, queue.estimatedWaitTime, queue.status,
        new Date(Date.now() - Math.random() * 3600000), // Random time in last hour
        queue.status === 'completed' ? new Date() : null
      ]);
    }
    console.log(`✅ Created ${queueData.length} queue entries`);

    // Insert reviews
    console.log('⭐ Seeding reviews...');
    const reviewData = [
      { userId: userIds[0], businessId: businessIds[0], rating: 5, comment: 'Amazing coffee and great service! The atmosphere is perfect for working.' },
      { userId: userIds[1], businessId: businessIds[0], rating: 4, comment: 'Good coffee, but can get crowded during peak hours.' },
      { userId: userIds[2], businessId: businessIds[1], rating: 5, comment: 'Excellent Italian food! The pasta was perfectly cooked and the wine selection is outstanding.' },
      { userId: userIds[3], businessId: businessIds[1], rating: 4, comment: 'Great food but the wait was longer than expected.' },
      { userId: userIds[0], businessId: businessIds[2], rating: 5, comment: 'Professional staff and clean facilities. Very organized queue system.' },
      { userId: userIds[4], businessId: businessIds[3], rating: 4, comment: 'Nice selection of trendy clothes. Staff was helpful with styling advice.' },
      { userId: userIds[1], businessId: businessIds[4], rating: 5, comment: 'Luxurious hotel with excellent service. The concierge was very helpful.' }
    ];

    for (let review of reviewData) {
      await client.query(`
        INSERT INTO reviews (user_id, business_id, rating, comment, is_verified)
        VALUES ($1, $2, $3, $4, $5)
      `, [review.userId, review.businessId, review.rating, review.comment, true]);
    }
    console.log(`✅ Created ${reviewData.length} reviews`);

    // Insert referrals
    console.log('🎯 Seeding referrals...');
    const referralData = [
      { referrerId: userIds[0], refereeId: userIds[1], status: 'completed', rewardAmount: 5.00, rewardPaid: true },
      { referrerId: userIds[1], refereeId: userIds[2], status: 'completed', rewardAmount: 5.00, rewardPaid: true },
      { referrerId: userIds[0], refereeId: null, status: 'pending', rewardAmount: 5.00, rewardPaid: false }
    ];

    for (let referral of referralData) {
      await client.query(`
        INSERT INTO referrals (referrer_id, referee_id, status, reward_amount, reward_paid)
        VALUES ($1, $2, $3, $4, $5)
      `, [referral.referrerId, referral.refereeId, referral.status, referral.rewardAmount, referral.rewardPaid]);
    }
    console.log(`✅ Created ${referralData.length} referrals`);

    // Insert subscriptions
    console.log('💳 Seeding subscriptions...');
    const subscriptionData = [
      { 
        userId: userIds[0], 
        planType: 'monthly', 
        status: 'active', 
        startDate: new Date(), 
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), 
        amount: 9.99 
      },
      { 
        userId: userIds[1], 
        planType: 'yearly', 
        status: 'active', 
        startDate: new Date(), 
        endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), 
        amount: 99.99 
      }
    ];

    const subscriptionIds = [];
    for (let subscription of subscriptionData) {
      const result = await client.query(`
        INSERT INTO subscriptions (user_id, plan_type, status, start_date, end_date, amount)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING id
      `, [subscription.userId, subscription.planType, subscription.status, subscription.startDate, subscription.endDate, subscription.amount]);
      subscriptionIds.push(result.rows[0].id);
    }
    console.log(`✅ Created ${subscriptionData.length} subscriptions`);

    // Insert payments
    console.log('💰 Seeding payments...');
    const paymentData = [
      { 
        userId: userIds[0], 
        subscriptionId: subscriptionIds[0], 
        amount: 9.99, 
        paymentMethod: 'credit_card', 
        status: 'completed',
        processedAt: new Date()
      },
      { 
        userId: userIds[1], 
        subscriptionId: subscriptionIds[1], 
        amount: 99.99, 
        paymentMethod: 'paypal', 
        status: 'completed',
        processedAt: new Date()
      }
    ];

    for (let payment of paymentData) {
      await client.query(`
        INSERT INTO payments (user_id, subscription_id, amount, payment_method, status, processed_at)
        VALUES ($1, $2, $3, $4, $5, $6)
      `, [payment.userId, payment.subscriptionId, payment.amount, payment.paymentMethod, payment.status, payment.processedAt]);
    }
    console.log(`✅ Created ${paymentData.length} payments`);

    // Insert notifications
    console.log('🔔 Seeding notifications...');
    const notificationData = [
      { 
        userId: userIds[0], 
        title: 'Queue Update', 
        body: 'You are now #2 in line at Downtown Coffee House', 
        type: 'queue_update',
        data: { businessId: businessIds[0], position: 2 }
      },
      { 
        userId: userIds[1], 
        title: 'Your Turn!', 
        body: 'Your table is ready at Bella Vista Restaurant', 
        type: 'queue_ready',
        data: { businessId: businessIds[1] }
      },
      { 
        userId: userIds[0], 
        title: 'Subscription Reminder', 
        body: 'Your monthly subscription will renew in 3 days', 
        type: 'subscription_reminder',
        data: { renewDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000) }
      },
      { 
        userId: userIds[2], 
        title: 'Welcome to QueSkip!', 
        body: 'Thanks for joining QueSkip. Start exploring nearby businesses.', 
        type: 'system',
        data: {}
      }
    ];

    for (let notification of notificationData) {
      await client.query(`
        INSERT INTO notifications (user_id, title, body, type, data)
        VALUES ($1, $2, $3, $4, $5)
      `, [notification.userId, notification.title, notification.body, notification.type, JSON.stringify(notification.data)]);
    }
    console.log(`✅ Created ${notificationData.length} notifications`);

    // Summary
    console.log('\n🎉 DATABASE SEEDING COMPLETE!');
    console.log('=====================================');
    console.log(`👥 Users: ${userIds.length}`);
    console.log(`🏢 Businesses: ${businessIds.length}`);
    console.log(`📋 Queue Entries: ${queueData.length}`);
    console.log(`⭐ Reviews: ${reviewData.length}`);
    console.log(`🎯 Referrals: ${referralData.length}`);
    console.log(`💳 Subscriptions: ${subscriptionData.length}`);
    console.log(`💰 Payments: ${paymentData.length}`);
    console.log(`🔔 Notifications: ${notificationData.length}`);
    
    console.log('\n📱 SAMPLE LOGIN CREDENTIALS FOR MOBILE DEV:');
    console.log('==========================================');
    console.log('👤 Users (Password: Password123! for all):');
    hashedUsers.forEach((user, index) => {
      console.log(`   ${index + 1}. ${user.email} - ${user.first_name} ${user.last_name}`);
    });
    
    console.log('\n🏢 Businesses (Password: Business123! for all):');
    hashedBusinesses.forEach((business, index) => {
      console.log(`   ${index + 1}. ${business.email} - ${business.name}`);
    });

    console.log('\n🚀 Ready for mobile app integration!');

  } catch (error) {
    console.error('❌ Error seeding database:', error);
  } finally {
    await client.end();
    console.log('🔌 Database connection closed');
  }
}

// Run the seeding
seedDatabase();
