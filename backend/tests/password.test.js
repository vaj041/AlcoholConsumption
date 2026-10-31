const { test } = require('node:test');
const assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');
const { createHash } = require('node:crypto');
const fs = require('node:fs');
const http = require('node:http');
const os = require('node:os');
const path = require('node:path');
const jwt = require('jsonwebtoken');
const axios = require('axios');

test('password change and reset flows', async () => {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'alcohol-password-test-'));
  const dbPath = path.join(tempDir, 'test.db');
  process.env.DATABASE_URL = `file:${dbPath.replace(/\\/g, '/')}`;
  process.env.NODE_ENV = 'production';
  process.env.JWT_SECRET = 'password-flow-test-secret';
  process.env.AUTH_RATE_LIMIT_MAX = '1000';
  process.env.MAILJET_API_KEY = 'test-key';
  process.env.MAILJET_SECRET_KEY = 'test-secret';
  process.env.MAILJET_FROM_EMAIL = 'sender@example.test';
  process.env.APP_BASE_URL = 'https://app.example.test';

  const originalPost = axios.post;
  const sent = [];
  let mailFails = false;
  axios.post = async (url, body, options) => {
    assert.equal(url, 'https://api.mailjet.com/v3.1/send');
    assert.equal(options.auth.username, 'test-key');
    if (mailFails) throw new Error('test delivery failure');
    sent.push(body.Messages[0]);
    return { data: { Messages: [{ Status: 'success' }] } };
  };

  let server;
  let prisma;
  try {
    execFileSync(process.execPath, [
      path.join('node_modules', 'prisma', 'build', 'index.js'),
      'migrate', 'deploy', '--schema', 'prisma/sqlite/schema.prisma',
    ], { cwd: path.join(__dirname, '..'), env: process.env, stdio: 'pipe' });

    prisma = require('../dist/prisma/client').prisma;
    const app = require('../dist/index').default;
    server = http.createServer(app);
    await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
    const base = `http://127.0.0.1:${server.address().port}`;

    async function request(route, options = {}) {
      const response = await fetch(`${base}${route}`, {
        method: options.method || 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(options.token ? { Authorization: `Bearer ${options.token}` } : {}),
        },
        ...(options.body ? { body: JSON.stringify(options.body) } : {}),
      });
      return { status: response.status, body: await response.json() };
    }

    const email = 'person@example.test';
    const initialPassword = 'original-password';
    const register = await request('/auth/register', { body: { email, password: initialPassword } });
    assert.equal(register.status, 201);
    const firstToken = register.body.token;
    const userId = register.body.user.id;
    const legacyToken = jwt.sign({ userId, role: 'admin', isAdmin: true }, process.env.JWT_SECRET);
    const me = (token) => request('/auth/me', { method: 'GET', token });
    assert.equal((await me(legacyToken)).status, 200);
    const adminUsers = (token) => request('/auth/admin/users', { method: 'GET', token });
    assert.equal((await adminUsers(legacyToken)).status, 200);
    await prisma.user.update({ where: { id: userId }, data: { role: 'user' } });
    assert.equal((await adminUsers(legacyToken)).status, 403);
    await prisma.user.update({ where: { id: userId }, data: { role: 'admin' } });
    const malformedVersion = jwt.sign({ userId, tokenVersion: -1 }, process.env.JWT_SECRET);
    assert.equal((await me(malformedVersion)).status, 401);

    const wrongPassword = await request('/auth/change-password', {
      token: firstToken, body: { currentPassword: 'wrong-password', newPassword: 'changed-password' },
    });
    assert.equal(wrongPassword.status, 400);
    assert.equal(wrongPassword.body.error, 'CURRENT_PASSWORD_INCORRECT');
    assert.equal((await me(firstToken)).status, 200);
    assert.equal((await request('/auth/change-password', {
      token: firstToken, body: { currentPassword: initialPassword, newPassword: 'x'.repeat(73) },
    })).status, 400);
    assert.equal((await request('/auth/change-password', {
      token: firstToken, body: { currentPassword: initialPassword, newPassword: 'ě'.repeat(37) },
    })).status, 400);

    const unknown = await request('/auth/forgot-password', { body: { email: 'unknown@example.test', language: 'cs' } });
    assert.equal(unknown.status, 202);
    assert.equal(sent.length, 0);
    const forgot = await request('/auth/forgot-password', { body: { email, language: 'cs' } });
    assert.deepEqual(forgot, unknown);
    assert.equal(sent.length, 1);
    assert.equal(sent[0].Subject, 'Obnova hesla');
    assert.equal(sent[0].To[0].Email, email);
    const link = new URL(sent[0].TextPart.match(/https:\/\/\S+/)[0]);
    assert.equal(link.origin, 'https://app.example.test');
    assert.equal(link.pathname, '/reset-password');
    const staleResetToken = new URLSearchParams(link.hash.slice(1)).get('token');
    assert.match(staleResetToken, /^[a-f0-9]{64}$/);
    const stored = await prisma.user.findUnique({ where: { id: userId } });
    assert.equal(stored.passwordResetTokenHash, createHash('sha256').update(staleResetToken).digest('hex'));
    assert.notEqual(stored.passwordResetTokenHash, staleResetToken);

    const change = await request('/auth/change-password', {
      token: firstToken, body: { currentPassword: initialPassword, newPassword: 'changed-password' },
    });
    assert.equal(change.status, 200);
    assert.equal((await me(firstToken)).status, 401);
    assert.equal((await me(legacyToken)).status, 401);
    assert.equal((await request('/auth/login', { body: { email, password: initialPassword } })).status, 401);
    const login = await request('/auth/login', { body: { email, password: 'changed-password' } });
    assert.equal(login.status, 200);
    assert.equal((await request('/auth/reset-password', {
      body: { token: staleResetToken, newPassword: 'another-password' },
    })).status, 400);

    mailFails = true;
    assert.deepEqual(await request('/auth/forgot-password', { body: { email } }), unknown);
    assert.equal((await prisma.user.findUnique({ where: { id: userId } })).passwordResetTokenHash, null);
    mailFails = false;
    const apiKey = process.env.MAILJET_API_KEY;
    delete process.env.MAILJET_API_KEY;
    assert.equal((await request('/auth/forgot-password', { body: { email } })).status, 503);
    assert.equal((await request('/auth/forgot-password', { body: { email: 'unknown@example.test' } })).status, 503);
    process.env.MAILJET_API_KEY = apiKey;
    process.env.APP_BASE_URL = 'http://localhost:5173';
    assert.equal((await request('/auth/forgot-password', { body: { email } })).status, 503);
    process.env.APP_BASE_URL = 'https://app.example.test';

    await request('/auth/forgot-password', { body: { email } });
    const resetLink = new URL(sent.at(-1).TextPart.match(/https:\/\/\S+/)[0]);
    const resetToken = new URLSearchParams(resetLink.hash.slice(1)).get('token');
    await prisma.user.update({ where: { id: userId }, data: { passwordResetExpires: new Date(Date.now() - 1000) } });
    const expired = await request('/auth/reset-password', { body: { token: resetToken, newPassword: 'reset-password' } });
    assert.equal(expired.status, 400);
    assert.equal(expired.body.error, 'INVALID_OR_EXPIRED_RESET_TOKEN');

    await request('/auth/forgot-password', { body: { email } });
    const validLink = new URL(sent.at(-1).TextPart.match(/https:\/\/\S+/)[0]);
    const validToken = new URLSearchParams(validLink.hash.slice(1)).get('token');
    const attempts = await Promise.all([
      request('/auth/reset-password', { body: { token: validToken, newPassword: 'reset-password' } }),
      request('/auth/reset-password', { body: { token: validToken, newPassword: 'reset-password' } }),
    ]);
    assert.deepEqual(attempts.map((result) => result.status).sort(), [200, 400]);
    assert.equal((await me(login.body.token)).status, 401);
    assert.equal((await request('/auth/login', { body: { email, password: 'reset-password' } })).status, 200);
  } finally {
    axios.post = originalPost;
    if (server) await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
    if (prisma) await prisma.$disconnect();
    if (fs.existsSync(dbPath)) fs.unlinkSync(dbPath);
    fs.rmdirSync(tempDir);
  }
});
