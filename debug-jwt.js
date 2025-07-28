const axios = require('axios');
const jwt = require('jsonwebtoken');

const baseURL = 'http://localhost:4000';

async function debugJWT() {
  console.log('🔍 JWT Token Debug Tool\n');

  try {
    // Step 1: Login and get token
    console.log('1. Logging in...');
    const loginResponse = await axios.post(`${baseURL}/auth/login`, {
      username: 'john_doe',
      password: 'SecurePass@123'
    });

    const token = loginResponse.data.accessToken;
    console.log('✅ Login successful');
    console.log('Token length:', token.length);
    console.log('Token starts with:', token.substring(0, 20) + '...');
    console.log();

    // Step 2: Decode token (without verification)
    console.log('2. Decoding token...');
    try {
      const decoded = jwt.decode(token, { complete: true });
      console.log('✅ Token decoded successfully');
      console.log('Header:', decoded.header);
      console.log('Payload:', decoded.payload);
      console.log('Token expires at:', new Date(decoded.payload.exp * 1000));
      console.log('Current time:', new Date());
      console.log('Token valid for:', Math.round((decoded.payload.exp * 1000 - Date.now()) / 1000), 'seconds');
      console.log();
    } catch (decodeError) {
      console.log('❌ Token decode failed:', decodeError.message);
      return;
    }

    // Step 3: Try to use token with profile endpoint
    console.log('3. Testing token with profile endpoint...');
    try {
      const profileResponse = await axios.get(`${baseURL}/auth/profile`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      console.log('✅ Profile request successful');
      console.log('User:', profileResponse.data.username);
    } catch (profileError) {
      console.log('❌ Profile request failed:', profileError.response?.data || profileError.message);
      console.log('Status:', profileError.response?.status);
      console.log('Headers sent:', profileError.config?.headers);
    }
    console.log();

    // Step 4: Check environment variables
    console.log('4. Environment check...');
    console.log('Checking if JWT_SECRET environment variable is set...');
    
    // Make a test request to see server logs
    try {
      await axios.get(`${baseURL}/auth/profile`, {
        headers: {
          'Authorization': `Bearer invalid-token-test`
        }
      });
    } catch (testError) {
      console.log('Expected error with invalid token:', testError.response?.data?.message);
    }

    // Step 5: Try with different header formats
    console.log('\n5. Testing different header formats...');
    
    const headerFormats = [
      { name: 'Standard Bearer', header: `Bearer ${token}` },
      { name: 'No Bearer prefix', header: token },
      { name: 'Lowercase bearer', header: `bearer ${token}` }
    ];

    for (const format of headerFormats) {
      try {
        await axios.get(`${baseURL}/auth/profile`, {
          headers: {
            'Authorization': format.header
          }
        });
        console.log(`✅ ${format.name} format works`);
        break;
      } catch (error) {
        console.log(`❌ ${format.name} format failed:`, error.response?.data?.message || error.message);
      }
    }

  } catch (error) {
    console.error('💥 Debug failed:', error.response?.data || error.message);
  }
}

// Check if jsonwebtoken is available, if not install it
async function checkDependencies() {
  try {
    require('jsonwebtoken');
  } catch (error) {
    console.log('Installing jsonwebtoken...');
    const { execSync } = require('child_process');
    execSync('npm install jsonwebtoken --no-save', { stdio: 'inherit' });
  }
}

checkDependencies().then(() => debugJWT());
