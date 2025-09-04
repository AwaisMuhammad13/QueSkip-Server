const axios = require('axios');

const BASE_URL = 'http://localhost:3000';

async function testApiEndpoints() {
  console.log('🧪 Testing QueSkip API Endpoints');
  console.log('=====================================\n');

  try {
    // Test 1: Health Check
    console.log('1. Testing Health Endpoint...');
    const healthResponse = await axios.get(`${BASE_URL}/health`);
    console.log('✅ Health Check:', healthResponse.data);
    console.log('');

    // Test 2: Sign Up (matching Figma design)
    console.log('2. Testing Sign Up Endpoint...');
    const signupData = {
      firstName: 'John',
      lastName: 'Doe',
      email: 'john.doe@example.com',
      password: 'Password123!',
      confirmPassword: 'Password123!'
    };
    
    const signupResponse = await axios.post(`${BASE_URL}/api/auth/register`, signupData);
    console.log('✅ Sign Up Response:', signupResponse.data);
    console.log('');

    // Test 3: Sign In (matching Figma design)
    console.log('3. Testing Sign In Endpoint...');
    const loginData = {
      email: 'john.doe@example.com',
      password: 'Password123!'
    };
    
    const loginResponse = await axios.post(`${BASE_URL}/api/auth/login`, loginData);
    console.log('✅ Sign In Response:', loginResponse.data);
    
    // Save JWT token for protected routes
    const jwtToken = loginResponse.data.token;
    console.log('🔑 JWT Token saved for protected routes');
    console.log('');

    // Test 4: Profile (Protected Route)
    if (jwtToken) {
      console.log('4. Testing Protected Profile Endpoint...');
      const profileResponse = await axios.get(`${BASE_URL}/api/auth/profile`, {
        headers: {
          'Authorization': `Bearer ${jwtToken}`
        }
      });
      console.log('✅ Profile Response:', profileResponse.data);
      console.log('');
    }

    // Test 5: Business Search
    console.log('5. Testing Business Search...');
    const businessResponse = await axios.get(`${BASE_URL}/api/business/search?lat=40.7128&lng=-74.0060&radius=5000`, {
      headers: jwtToken ? { 'Authorization': `Bearer ${jwtToken}` } : {}
    });
    console.log('✅ Business Search:', businessResponse.data);
    console.log('');

  } catch (error) {
    if (error.response) {
      console.log('❌ Error Response:', {
        status: error.response.status,
        data: error.response.data
      });
    } else {
      console.log('❌ Network Error:', error.message);
    }
  }

  console.log('🎉 API Testing Complete!');
  console.log('=====================================');
}

// Run the tests
testApiEndpoints();
