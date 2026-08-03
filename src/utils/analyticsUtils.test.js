import test from 'node:test';
import assert from 'node:assert/strict';

import { aggregateWeekdayStats } from './analyticsUtils.js';

test('曜日別収支は登録件数ではなく日別収支を平均する', () => {
  const stats = aggregateWeekdayStats([
    { date: '2026-07-06', dayOfWeek: '月', profit: 1000 },
    { date: '2026-07-06', dayOfWeek: '月', profit: 2000 },
    { date: '2026-07-06', dayOfWeek: '月', profit: 3000 },
    { date: '2026-07-13', dayOfWeek: '月', profit: -2000 }
  ]);

  assert.deepEqual(stats, [{
    name: '月',
    investment: 0,
    collection: 0,
    profit: 4000,
    count: 2,
    winCount: 1,
    winRate: 50,
    avgProfit: 2000
  }]);
});

test('同じ曜日でも日付が異なれば別の稼働日として数える', () => {
  const stats = aggregateWeekdayStats([
    { date: '2026-07-07', dayOfWeek: '火', investment: 5000, collection: 9000, profit: 4000 },
    { date: '2026-07-14', dayOfWeek: '火', investment: 7000, collection: 7000, profit: 0 }
  ]);

  assert.equal(stats[0].count, 2);
  assert.equal(stats[0].profit, 4000);
  assert.equal(stats[0].avgProfit, 2000);
  assert.equal(stats[0].winRate, 50);
});