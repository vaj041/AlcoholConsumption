const axios = require('axios');

async function testAPI() {
  const BASE_URL = 'http://localhost:3001';

  try {
    // 1. Health check
    console.log('1. Testing /health...');
    const health = await axios.get(`${BASE_URL}/health`);
    console.log('✅ Health:', health.data);

    // 2. Register user
    console.log('\n2. Testing /auth/register...');
    const register = await axios.post(`${BASE_URL}/auth/register`, {
      email: 'test@example.com',
      password: 'password123'
    });
    console.log('✅ Register:', { token: register.data.token.substring(0, 20) + '...', user: register.data.user });
    const token = register.data.token;

    // 3. Login
    console.log('\n3. Testing /auth/login...');
    const login = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'test@example.com',
      password: 'password123'
    });
    console.log('✅ Login:', { token: login.data.token.substring(0, 20) + '...' });

    // 4. Get current user
    console.log('\n4. Testing /auth/me...');
    const me = await axios.get(`${BASE_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('✅ Current user:', me.data);

    // 5. Create drink
    console.log('\n5. Testing POST /drinks...');
    const drink = await axios.post(`${BASE_URL}/drinks`, {
      name: 'Pivo 10°',
      volumeMl: 500,
      alcoholPct: 4.0
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('✅ Created drink:', drink.data);

    // 6. Get all drinks
    console.log('\n6. Testing GET /drinks...');
    const drinks = await axios.get(`${BASE_URL}/drinks`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('✅ Drinks:', drinks.data);

    // 7. Create entry
    console.log('\n7. Testing POST /entries...');
    const entry = await axios.post(`${BASE_URL}/entries`, {
      date: new Date().toISOString(),
      quantity: 2,
      drinkId: drink.data.id
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('✅ Created entry:', entry.data);

    // 8. Get stats
    console.log('\n8. Testing GET /stats...');
    const today = new Date().toISOString().split('T')[0];
    const stats = await axios.get(`${BASE_URL}/stats?from=${today}&to=${today}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('✅ Stats:', stats.data);

    console.log('\n✅ All tests passed!');
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
    process.exit(1);
  }
}

testAPI();
