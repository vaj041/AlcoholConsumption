import assert from 'node:assert/strict';
import test from 'node:test';
import { dailyAverageGrams } from '../src/utils/stats.ts';

const stats = (from, to, total, daily = []) => ({
  period: { from, to },
  total: { pureAlcoholGrams: total, pureAlcoholMl: 0, entries: daily.length, drinksConsumed: 0 },
  daily,
});

test('includes days without entries in the daily average', () => {
  const beerGrams = 500 * 0.05 * 0.789;
  const result = dailyAverageGrams(stats('2026-11-23', '2026-11-29', 7 * beerGrams, [
    { date: '2026-11-27', grams: 4 * beerGrams, ml: 100, entries: 4 },
    { date: '2026-11-28', grams: 3 * beerGrams, ml: 75, entries: 3 },
  ]));
  assert.ok(Math.abs(result / beerGrams - 1) < 1e-10);
});

test('handles empty and single-day periods', () => {
  assert.equal(dailyAverageGrams(stats('2026-11-23', '2026-11-29', 0)), 0);
  assert.equal(dailyAverageGrams(stats('2026-11-23', '2026-11-23', 20)), 20);
});

test('counts calendar days across leap days and daylight saving changes', () => {
  assert.equal(dailyAverageGrams(stats('2024-02-28', '2024-03-01', 30)), 10);
  assert.equal(dailyAverageGrams(stats('2026-03-28', '2026-03-30', 30)), 10);
});
