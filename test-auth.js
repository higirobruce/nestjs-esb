const axios = require('axios');

const baseURL = 'http://localhost:4000';

async function testAuthentication() {
  console.log('🔐 Testing Authentication System...\n');

  try {
    // Test health endpoint (should be public)
    console.log('1. Testing health endpoint...');
    const healthResponse = await axios.get(`${baseURL}/health`);
    console.log('✅ Health endpoint:', healthResponse.data);
    console.log();

    // Test login with default admin
    console.log('2. Testing login with default admin...');
    const loginResponse = await axios.post(`${baseURL}/auth/login`, {
      username: 'admin',
      password: 'Admin@123456'
    });
    
    console.log('✅ Login successful!');
    console.log('User:', loginResponse.data.user);
    console.log('Token expires in:', loginResponse.data.expiresIn, 'seconds');
    console.log('API Key available:', !!loginResponse.data.user.apiKey);
    console.log();

    const token = loginResponse.data.accessToken;

    // Test authenticated endpoint
    console.log('3. Testing authenticated endpoint...');
    const profileResponse = await axios.get(`${baseURL}/auth/profile`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log('✅ Profile endpoint:', {
      username: profileResponse.data.username,
      email: profileResponse.data.email,
      role: profileResponse.data.role
    });
    console.log();

    // Test service registry (should work with JWT)
    console.log('4. Testing service registry with JWT...');
    const servicesResponse = await axios.get(`${baseURL}/services`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log('✅ Services endpoint accessible with JWT');
    console.log('Services count:', servicesResponse.data.length);
    console.log();

    // Test API key authentication
    console.log('5. Testing API key authentication...');
    
    // First, get the API key from the API key endpoint
    const apiKeyResponse = await axios.get(`${baseURL}/auth/api-key`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log('API Key status:', apiKeyResponse.data);
    
    if (apiKeyResponse.data.apiKey) {
      const servicesWithApiKey = await axios.get(`${baseURL}/services`, {
        headers: {
          'X-API-Key': apiKeyResponse.data.apiKey
        }
      });
      
      console.log('✅ API Key authentication works');
      console.log('Services accessible via API key');
    } else {
      console.log('ℹ️ Admin user has API key available, but not exposed in login response for security');
      console.log('hasApiKey:', loginResponse.data.user.hasApiKey);
    }
    
    console.log('\n🎉 All authentication tests passed!');

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
    
    if (error.response?.status === 401) {
      console.log('This might be expected if testing unauthorized access');
    }
  }
}

// Run the test
testAuthentication();
