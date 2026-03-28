const axios = require('axios');

const BASE_URL = process.env.API_BASE_URL || 'http://localhost:3001';

const client = axios.create({
  baseURL: BASE_URL,
  validateStatus: () => true,
});

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function uniqueEmail(prefix) {
  return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 10000)}@example.com`;
}

async function registerUser(email, password) {
  return client.post('/auth/register', { email, password });
}

async function loginUser(email, password) {
  return client.post('/auth/login', { email, password });
}

async function getCurrentUser(token) {
  return client.get('/auth/me', {
    headers: { Authorization: `Bearer ${token}` },
  });
}

async function findAdminToken() {
  const knownAdminCandidates = [
    { email: 'test@example.com', password: 'password123' },
    { email: 'user4@test.cz', password: 'heslo123' },
  ];

  for (const candidate of knownAdminCandidates) {
    const loginResponse = await loginUser(candidate.email, candidate.password);
    if (loginResponse.status !== 200) {
      continue;
    }

    const token = loginResponse.data?.token;
    if (!token) {
      continue;
    }

    const meResponse = await getCurrentUser(token);
    if (meResponse.status === 200 && meResponse.data?.role === 'admin') {
      return token;
    }
  }

  return null;
}

async function run() {
  try {
    console.log(`Testing API at ${BASE_URL}`);

    console.log('\n1) Health check');
    const health = await client.get('/health');
    assert(health.status === 200, `Expected 200, got ${health.status}`);
    console.log('✅ /health ok');

    console.log('\n2) Auth flow (register + login + me)');
    const nonAdminEmail = uniqueEmail('smoke-user');
    const nonAdminPassword = 'password123';
    const registerNonAdmin = await registerUser(nonAdminEmail, nonAdminPassword);
    assert(registerNonAdmin.status === 201, `Expected 201, got ${registerNonAdmin.status}`);
    assert(registerNonAdmin.data?.user?.role === 'user' || registerNonAdmin.data?.user?.role === 'admin', 'Missing role in register response');

    const loginNonAdmin = await loginUser(nonAdminEmail, nonAdminPassword);
    assert(loginNonAdmin.status === 200, `Expected 200, got ${loginNonAdmin.status}`);
    const nonAdminToken = loginNonAdmin.data?.token;
    assert(nonAdminToken, 'Missing token after login');

    const me = await getCurrentUser(nonAdminToken);
    assert(me.status === 200, `Expected 200, got ${me.status}`);
    assert(me.data?.email === nonAdminEmail, 'Current user email mismatch');
    console.log('✅ auth endpoints ok');

    console.log('\n3) Role guard (403 for non-admin)');
    const nonAdminUsersList = await client.get('/auth/admin/users', {
      headers: { Authorization: `Bearer ${nonAdminToken}` },
    });
    assert(nonAdminUsersList.status === 403, `Expected 403, got ${nonAdminUsersList.status}`);

    const forbiddenUpsert = await client.post(
      '/translations/bulk-upsert',
      {
        lang: 'cs',
        items: [{ code: 'smoke.test.forbidden', text: 'forbidden text' }],
      },
      {
        headers: { Authorization: `Bearer ${nonAdminToken}` },
      }
    );
    assert(forbiddenUpsert.status === 403, `Expected 403, got ${forbiddenUpsert.status}`);
    console.log('✅ role guard returns 403');

    console.log('\n4) Translation upsert (admin)');
    const adminToken = await findAdminToken();
    assert(adminToken, 'No admin credentials available for smoke test. Ensure at least one known admin account exists.');

    const adminUsersList = await client.get('/auth/admin/users', {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert(adminUsersList.status === 200, `Expected 200, got ${adminUsersList.status}`);

    const code = `smoke.test.${Date.now()}`;
    const upsert = await client.post(
      '/translations/bulk-upsert',
      {
        lang: 'cs',
        items: [{ code, text: 'Ahoj test', description: 'smoke test term' }],
      },
      {
        headers: { Authorization: `Bearer ${adminToken}` },
      }
    );
    assert(upsert.status === 200, `Expected 200, got ${upsert.status}`);
    assert(upsert.data?.upserted === 1, `Expected upserted=1, got ${upsert.data?.upserted}`);

    const terms = await client.get('/translations/admin/terms?lang=cs', {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert(terms.status === 200, `Expected 200, got ${terms.status}`);
    assert(Array.isArray(terms.data?.terms), 'Terms response must contain terms array');

    const publicTranslations = await client.get('/translations?lang=cs');
    assert(publicTranslations.status === 200, `Expected 200, got ${publicTranslations.status}`);
    assert(publicTranslations.data?.translations?.[code] === 'Ahoj test', 'Public translation does not contain upserted value');
    console.log('✅ translation upsert verified');

    console.log('\n✅ Smoke tests passed');
  } catch (error) {
    console.error('\n❌ Smoke test failed');
    console.error(error.message || error);
    process.exit(1);
  }
}

run();
