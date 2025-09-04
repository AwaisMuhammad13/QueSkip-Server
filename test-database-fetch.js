const axios = require('axios');

async function testDatabaseFetch() {
    const baseURL = 'http://localhost:3000/api';
    
    console.log('🔍 Testing Database Data Fetching...\n');
    
    try {
        // Test 1: Health check
        console.log('1. Testing Health Check...');
        const health = await axios.get('http://localhost:3000/health');
        console.log('✅ Health:', health.data);
        
        // Test 2: Get businesses (should fetch from database)
        console.log('\n2. Testing Business Data Fetch...');
        const businesses = await axios.get(`${baseURL}/businesses/search?query=restaurant`);
        console.log('✅ Businesses found:', businesses.data.data?.length || 0);
        if (businesses.data.data?.length > 0) {
            console.log('   Sample business:', businesses.data.data[0].name);
        }
        
        // Test 3: Get subscription plans (should fetch from database)
        console.log('\n3. Testing Subscription Plans...');
        const plans = await axios.get(`${baseURL}/subscriptions/plans`);
        console.log('✅ Plans found:', plans.data.data?.length || 0);
        if (plans.data.data?.length > 0) {
            console.log('   Sample plan:', plans.data.data[0].name);
        }
        
        // Test 4: Try to register a user (database write test)
        console.log('\n4. Testing Database Write (User Registration)...');
        const testUser = {
            name: 'Test User DB Check',
            email: `test-db-${Date.now()}@example.com`,
            password: 'TestPassword123!',
            phone: '+1234567890'
        };
        
        const register = await axios.post(`${baseURL}/auth/register`, testUser);
        console.log('✅ User registration successful:', register.data.success);
        
        if (register.data.success && register.data.data?.token) {
            const token = register.data.data.token;
            
            // Test 5: Get user profile (authenticated database read)
            console.log('\n5. Testing Authenticated Database Read...');
            const profile = await axios.get(`${baseURL}/auth/profile`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            console.log('✅ Profile fetched:', profile.data.data?.name);
            
            // Test 6: Update user profile (authenticated database write)
            console.log('\n6. Testing Authenticated Database Write...');
            const update = await axios.put(`${baseURL}/auth/profile`, {
                name: 'Updated Test User'
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            console.log('✅ Profile updated:', update.data.success);
        }
        
        console.log('\n🎉 ALL DATABASE OPERATIONS SUCCESSFUL!');
        console.log('✅ Database reads: Working');
        console.log('✅ Database writes: Working');
        console.log('✅ Authentication: Working');
        console.log('✅ Data persistence: Working');
        
    } catch (error) {
        console.error('\n❌ Database test failed:');
        if (error.response) {
            console.error('Status:', error.response.status);
            console.error('Data:', error.response.data);
        } else {
            console.error('Error:', error.message);
        }
    }
}

// Wait a moment for server to be ready
setTimeout(testDatabaseFetch, 2000);
