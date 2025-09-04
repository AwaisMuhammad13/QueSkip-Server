const { Client } = require('pg');
require('dotenv').config();

const client = new Client(process.env.DATABASE_URL);

async function verifyData() {
  try {
    await client.connect();
    console.log('🔍 VERIFYING SEEDED DATA');
    console.log('=======================\n');

    // Check users
    const users = await client.query('SELECT email, first_name, last_name, is_email_verified, referral_code FROM users LIMIT 5');
    console.log('👥 USERS:');
    users.rows.forEach((user, i) => {
      console.log(`   ${i+1}. ${user.first_name} ${user.last_name} (${user.email})`);
      console.log(`      ✅ Verified: ${user.is_email_verified} | Referral: ${user.referral_code}`);
    });

    // Check businesses with queue counts
    const businesses = await client.query(`
      SELECT b.name, b.category, b.current_queue_count, b.average_wait_time, 
             COUNT(q.id) as actual_queue_count
      FROM businesses b
      LEFT JOIN queues q ON b.id = q.business_id AND q.status = 'waiting'
      GROUP BY b.id, b.name, b.category, b.current_queue_count, b.average_wait_time
      ORDER BY b.name
    `);
    console.log('\n🏢 BUSINESSES:');
    businesses.rows.forEach((business, i) => {
      console.log(`   ${i+1}. ${business.name} (${business.category})`);
      console.log(`      📋 Queue: ${business.actual_queue_count} waiting | Avg wait: ${business.average_wait_time}min`);
    });

    // Check active queues
    const queues = await client.query(`
      SELECT u.first_name, u.last_name, b.name as business_name, q.position, q.estimated_wait_time, q.status
      FROM queues q
      JOIN users u ON q.user_id = u.id
      JOIN businesses b ON q.business_id = b.id
      WHERE q.status = 'waiting'
      ORDER BY b.name, q.position
    `);
    console.log('\n📋 ACTIVE QUEUES:');
    queues.rows.forEach((queue, i) => {
      console.log(`   ${i+1}. ${queue.first_name} ${queue.last_name} at ${queue.business_name}`);
      console.log(`      Position: #${queue.position} | Wait: ${queue.estimated_wait_time}min`);
    });

    // Check reviews
    const reviews = await client.query(`
      SELECT u.first_name, b.name as business_name, r.rating, r.comment
      FROM reviews r
      JOIN users u ON r.user_id = u.id
      JOIN businesses b ON r.business_id = b.id
      ORDER BY r.created_at DESC
      LIMIT 5
    `);
    console.log('\n⭐ RECENT REVIEWS:');
    reviews.rows.forEach((review, i) => {
      console.log(`   ${i+1}. ${review.first_name} rated ${review.business_name}: ${review.rating}/5 stars`);
      console.log(`      "${review.comment}"`);
    });

    // Check notifications
    const notifications = await client.query(`
      SELECT u.first_name, n.title, n.type, n.is_read
      FROM notifications n
      JOIN users u ON n.user_id = u.id
      ORDER BY n.created_at DESC
    `);
    console.log('\n🔔 NOTIFICATIONS:');
    notifications.rows.forEach((notif, i) => {
      const readStatus = notif.is_read ? '✅' : '🔵';
      console.log(`   ${i+1}. ${readStatus} ${notif.first_name}: ${notif.title} (${notif.type})`);
    });

    console.log('\n🎯 API ENDPOINTS TO TEST:');
    console.log('========================');
    console.log('📝 Authentication:');
    console.log('   POST /api/auth/register');
    console.log('   POST /api/auth/login');
    console.log('   GET  /api/auth/profile');
    console.log('');
    console.log('🏢 Business Discovery:');
    console.log('   GET  /api/businesses');
    console.log('   GET  /api/businesses/:id');
    console.log('');
    console.log('📋 Queue Management:');
    console.log('   POST /api/queues/join');
    console.log('   GET  /api/queues/my-queues');
    console.log('   PUT  /api/queues/:id/leave');
    console.log('');
    console.log('⭐ Reviews:');
    console.log('   GET  /api/reviews/:businessId');
    console.log('   POST /api/reviews');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.end();
  }
}

verifyData();
