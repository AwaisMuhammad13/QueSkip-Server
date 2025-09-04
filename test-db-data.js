const axios = require('axios');

async function testDatabaseQueries() {
    console.log('🔍 Testing Direct Database Queries...\n');
    
    require('dotenv').config();
    const { Pool } = require('pg');
    
    const pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false }
    });
    
    try {
        // Test 1: Check if businesses table has data
        console.log('1. Testing Businesses Table...');
        const businessResult = await pool.query('SELECT COUNT(*) as count FROM businesses');
        console.log('✅ Businesses in database:', businessResult.rows[0].count);
        
        if (businessResult.rows.length > 0) {
            const sampleBiz = await pool.query('SELECT name, category, city FROM businesses LIMIT 3');
            console.log('   Sample businesses:');
            sampleBiz.rows.forEach(biz => console.log(`   - ${biz.name} (${biz.category}) in ${biz.city}`));
        }
        
        // Test 2: Check if users table exists and has data
        console.log('\n2. Testing Users Table...');
        const userResult = await pool.query('SELECT COUNT(*) as count FROM users');
        console.log('✅ Users in database:', userResult.rows[0].count);
        
        // Test 3: Check subscription plans
        console.log('\n3. Testing Subscription Plans...');
        const plansResult = await pool.query('SELECT COUNT(*) as count FROM subscriptions');
        console.log('✅ Subscription plans in database:', plansResult.rows[0].count);
        
        if (plansResult.rows[0].count > 0) {
            const plans = await pool.query('SELECT name, price FROM subscriptions LIMIT 3');
            console.log('   Available plans:');
            plans.rows.forEach(plan => console.log(`   - ${plan.name}: $${plan.price}`));
        }
        
        // Test 4: Check queues
        console.log('\n4. Testing Queues Table...');
        const queueResult = await pool.query('SELECT COUNT(*) as count FROM queues');
        console.log('✅ Queue entries in database:', queueResult.rows[0].count);
        
        // Test 5: Check reviews
        console.log('\n5. Testing Reviews Table...');
        const reviewResult = await pool.query('SELECT COUNT(*) as count FROM reviews');
        console.log('✅ Reviews in database:', reviewResult.rows[0].count);
        
        console.log('\n🎉 DATABASE DATA VERIFICATION COMPLETE!');
        console.log('\n📊 SUMMARY:');
        console.log(`✅ Businesses: ${businessResult.rows[0].count}`);
        console.log(`✅ Users: ${userResult.rows[0].count}`);
        console.log(`✅ Subscription Plans: ${plansResult.rows[0].count}`);
        console.log(`✅ Queues: ${queueResult.rows[0].count}`);
        console.log(`✅ Reviews: ${reviewResult.rows[0].count}`);
        
        if (parseInt(businessResult.rows[0].count) > 0 && 
            parseInt(plansResult.rows[0].count) > 0) {
            console.log('\n✅ ALL DATA IS BEING FETCHED FROM DATABASE SUCCESSFULLY!');
        } else {
            console.log('\n⚠️  Some tables may be empty - this is normal for a new setup');
        }
        
    } catch (error) {
        console.error('\n❌ Database query test failed:', error.message);
    } finally {
        await pool.end();
    }
}

testDatabaseQueries();
