const assert = require('node:assert/strict');
const http = require('node:http');
const Module = require('node:module');
const test = require('node:test');
const express = require('express');

test('statistics sum drink quantities rather than counting records', async () => {
  let entries = [];
  const prisma = { entry: { findMany: async () => entries } };
  const originalLoad = Module._load;
  let router;
  try {
    Module._load = function (request, parent, isMain) {
      if (request === '../prisma/client') return { prisma };
      if (request === '../middleware/auth') {
        return { authenticate: (_req, _res, next) => next() };
      }
      return originalLoad.call(this, request, parent, isMain);
    };
    router = require('../dist/routes/stats').default;
  } finally {
    Module._load = originalLoad;
  }

  const app = express();
  app.use('/stats', router);
  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  try {
    const url = `http://127.0.0.1:${server.address().port}/stats?from=2026-11-23&to=2026-11-29`;
    const getStats = async () => {
      const response = await fetch(url);
      assert.equal(response.status, 200);
      return response.json();
    };

    assert.equal((await getStats()).total.entries, 0);
    entries = [
      { date: new Date('2026-11-27'), quantity: 3, drink: { volumeMl: 500, alcoholPct: 4 } },
      { date: new Date('2026-11-28'), quantity: 2, drink: { volumeMl: 500, alcoholPct: 4 } },
    ];
    const stats = await getStats();
    assert.equal(stats.total.entries, 5);
    assert.deepEqual(stats.daily.map((day) => day.entries), [3, 2]);
    assert.equal(stats.total.pureAlcoholMl, 100);
    assert.equal(stats.total.pureAlcoholGrams, 78.9);
  } finally {
    await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
  }
});
