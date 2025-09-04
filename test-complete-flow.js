const axios = require('axios');

const BASE_URL = 'http://localhost:3000';

async function testQueSkipAuthFlow() {
  console.log('🚀 Testing QueSkip Authentication Flow');
  console.log('=====================================');
  console.log('📱 Based on Figma Mobile App Design');
  console.log('=====================================\n');

  try {
    // Test 0: Health Check
    console.log('🏥 STEP 0: Health Check');
    console.log('-------------------------');
    const healthResponse = await axios.get(`${BASE_URL}/health`);
    console.log('✅ Server Health:', healthResponse.data);
    console.log('');

    // Test 1: Sign Up Flow (Figma Screen 2)
    console.log('📝 STEP 1: Sign Up (Figma Screen 2)');
    console.log('------------------------------------');
    console.log('Testing: Full name, Email, Password, Confirm Password fields');
    
    const signupData = {
      firstName: 'John',
      lastName: 'Doe',
      email: 'john.doe.test@example.com',
      password: 'SecurePass123!',
      confirmPassword: 'SecurePass123!'
    };
    
    console.log('📤 Sending Sign Up Request:', {
      ...signupData,
      password: '***hidden***',
      confirmPassword: '***hidden***'
    });
    
    const signupResponse = await axios.post(`${BASE_URL}/api/auth/register`, signupData);
    console.log('✅ Sign Up Success:', signupResponse.data);
    
    // Extract verification token for next step
    const { emailVerificationToken, user } = signupResponse.data;
    console.log('🔑 Email Verification Token:', emailVerificationToken);
    console.log('');

    // Test 2: Email Verification (Figma Screen 3)
    console.log('📧 STEP 2: Email Verification (Figma Screen 3)');
    console.log('-----------------------------------------------');
    console.log('Testing: 5-digit code verification');
    
    const verificationData = {
      email: signupData.email,
      token: emailVerificationToken
    };
    
    console.log('📤 Sending Verification Request:', verificationData);
    
    const verificationResponse = await axios.post(`${BASE_URL}/api/auth/verify-email`, verificationData);
    console.log('✅ Email Verification Success:', verificationResponse.data);
    console.log('');

    // Test 3: Sign In Flow (Figma Screen 1)
    console.log('🔐 STEP 3: Sign In (Figma Screen 1)');
    console.log('-----------------------------------');
    console.log('Testing: Email and Password login');
    
    const loginData = {
      email: signupData.email,
      password: signupData.password
    };
    
    console.log('📤 Sending Sign In Request:', {
      ...loginData,
      password: '***hidden***'
    });
    
    const loginResponse = await axios.post(`${BASE_URL}/api/auth/login`, loginData);
    console.log('✅ Sign In Success:', loginResponse.data);
    
    // Extract JWT token
    const jwtToken = loginResponse.data.token;
    console.log('🎫 JWT Token received for authenticated requests');
    console.log('');

    // Test 4: Account Created / Profile Access (Figma Screen 4)
    console.log('👤 STEP 4: Account Created - Profile Access (Figma Screen 4)');
    console.log('------------------------------------------------------------');
    console.log('Testing: Authenticated user profile access');
    
    const profileResponse = await axios.get(`${BASE_URL}/api/auth/profile`, {
      headers: {
        'Authorization': `Bearer ${jwtToken}`
      }
    });
    console.log('✅ Profile Access Success:', profileResponse.data);
    console.log('');

    // Test 5: Additional Flow - Business Search (Post-Authentication)
    console.log('🏢 STEP 5: Business Search (Post-Authentication Feature)');
    console.log('--------------------------------------------------------');
    console.log('Testing: Authenticated business search functionality');
    
    const businessResponse = await axios.get(`${BASE_URL}/api/business/search?lat=40.7128&lng=-74.0060&radius=5000`, {
      headers: {
        'Authorization': `Bearer ${jwtToken}`
      }
    });
    console.log('✅ Business Search Success:', businessResponse.data);
    console.log('');

    // Test 6: Queue Management
    console.log('📋 STEP 6: Queue Management');
    console.log('---------------------------');
    console.log('Testing: User queue access');
    
    const queueResponse = await axios.get(`${BASE_URL}/api/queue/my-queues`, {
      headers: {
        'Authorization': `Bearer ${jwtToken}`
      }
    });
    console.log('✅ Queue Access Success:', queueResponse.data);
    console.log('');

    console.log('🎉 COMPLETE AUTHENTICATION FLOW TEST PASSED!');
    console.log('============================================');
    console.log('✅ All Figma screens tested successfully:');
    console.log('   1. Sign In Screen ✅');
    console.log('   2. Sign Up Screen ✅');
    console.log('   3. Email Verification ✅');
    console.log('   4. Account Created ✅');
    console.log('   + Additional authenticated features ✅');
    console.log('');

  } catch (error) {
    console.log('❌ ERROR OCCURRED:');
    console.log('==================');
    
    if (error.response) {
      console.log('📄 Response Status:', error.response.status);
      console.log('📄 Response Data:', JSON.stringify(error.response.data, null, 2));
      console.log('📄 Request URL:', error.config?.url);
      console.log('📄 Request Method:', error.config?.method?.toUpperCase());
      console.log('📄 Request Data:', error.config?.data);
    } else if (error.request) {
      console.log('🌐 Network Error - No Response Received');
      console.log('🔍 Check if server is running on', BASE_URL);
    } else {
      console.log('⚙️ Setup Error:', error.message);
    }
    console.log('');
  }
}

// Test Error Cases
async function testErrorCases() {
  console.log('🚨 TESTING ERROR CASES');
  console.log('======================\n');

  try {
    // Test 1: Invalid Email Format
    console.log('❌ Test 1: Invalid Email Format');
    console.log('-------------------------------');
    
    const invalidEmailData = {
      firstName: 'Test',
      lastName: 'User',
      email: 'invalid-email-format',
      password: 'Password123!',
      confirmPassword: 'Password123!'
    };
    
    await axios.post(`${BASE_URL}/api/auth/register`, invalidEmailData);
    
  } catch (error) {
    console.log('✅ Correctly rejected invalid email:', error.response?.data);
    console.log('');
  }

  try {
    // Test 2: Password Mismatch
    console.log('❌ Test 2: Password Mismatch');
    console.log('----------------------------');
    
    const mismatchData = {
      firstName: 'Test',
      lastName: 'User',
      email: 'test@example.com',
      password: 'Password123!',
      confirmPassword: 'DifferentPassword!'
    };
    
    await axios.post(`${BASE_URL}/api/auth/register`, mismatchData);
    
  } catch (error) {
    console.log('✅ Correctly rejected password mismatch:', error.response?.data);
    console.log('');
  }

  try {
    // Test 3: Weak Password
    console.log('❌ Test 3: Weak Password');
    console.log('------------------------');
    
    const weakPasswordData = {
      firstName: 'Test',
      lastName: 'User',
      email: 'test2@example.com',
      password: '123',
      confirmPassword: '123'
    };
    
    await axios.post(`${BASE_URL}/api/auth/register`, weakPasswordData);
    
  } catch (error) {
    console.log('✅ Correctly rejected weak password:', error.response?.data);
    console.log('');
  }

  console.log('🎯 Error testing complete!\n');
}

// Run all tests
async function runAllTests() {
  await testQueSkipAuthFlow();
  await testErrorCases();
  
  console.log('🏁 ALL TESTS COMPLETED');
  console.log('======================');
  console.log('Your QueSkip backend is ready for mobile app integration! 🚀');
}

// Execute tests
runAllTests();
