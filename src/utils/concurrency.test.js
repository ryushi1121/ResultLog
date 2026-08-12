import test from 'node:test';
import assert from 'node:assert/strict';

import { mapWithConcurrency } from './concurrency.js';

test('結果は入力と同じ順序で返る', async () => {
  const items = [1, 2, 3, 4, 5];

  const results = await mapWithConcurrency(items, async (n) => {
    // 後ろの要素ほど早く終わらせて、完了順に並ばないことを確かめる
    await new Promise(r => setTimeout(r, (6 - n) * 5));
    return n * 10;
  }, 3);

  assert.deepEqual(results, [10, 20, 30, 40, 50]);
});

test('同時に走る数が上限を超えない', async () => {
  let running = 0;
  let maxRunning = 0;

  await mapWithConcurrency(Array.from({ length: 20 }, (_, i) => i), async () => {
    running++;
    maxRunning = Math.max(maxRunning, running);
    await new Promise(r => setTimeout(r, 5));
    running--;
  }, 3);

  assert.equal(maxRunning, 3);
});

test('件数が上限より少なくても全件処理する', async () => {
  const results = await mapWithConcurrency([1, 2], async (n) => n + 1, 5);
  assert.deepEqual(results, [2, 3]);
});

test('空配列を渡しても止まらない', async () => {
  const results = await mapWithConcurrency([], async (n) => n, 3);
  assert.deepEqual(results, []);
});
