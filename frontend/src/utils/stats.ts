import type { StatsResponse } from '../types';

export function dailyAverageGrams(stats: StatsResponse): number {
  const days = (Date.parse(stats.period.to) - Date.parse(stats.period.from)) / 86_400_000 + 1;
  return stats.total.pureAlcoholGrams / days;
}
