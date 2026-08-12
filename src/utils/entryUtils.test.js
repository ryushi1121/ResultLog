import test from 'node:test';
import assert from 'node:assert/strict';

import { cashOf, cashTotals, entrySignature } from './entryUtils.js';

test('貯メダル欄がない古いエントリは総額を現金とみなす', () => {
  assert.equal(cashOf({ investment: 12000 }, 'investment'), 12000);
  assert.equal(cashOf({ investment: 12000, investmentCash: 8000 }, 'investment'), 8000);
  assert.equal(cashOf({ investment: 12000, investmentCash: 0 }, 'investment'), 0);
});

test('現金収支は台移動で持ち込んだメダル分に影響されない', () => {
  // 1台目で 5,000円investして 300枚回収 → 2台目にそのまま持ち込む
  const split = cashTotals([
    { investment: 5000, investmentCash: 5000, investmentMedal: 0, collection: 6000, collectionCash: 0, collectionMedal: 300 },
    { investment: 6000, investmentCash: 0, investmentMedal: 300, collection: 9000, collectionCash: 9000, collectionMedal: 0 }
  ]);

  // 同じ稼働を1エントリにまとめた場合
  const merged = cashTotals([
    { investment: 5000, investmentCash: 5000, investmentMedal: 0, collection: 9000, collectionCash: 9000, collectionMedal: 0 }
  ]);

  assert.equal(split.profit, 4000);
  assert.equal(split.profit, merged.profit);
});

test('同じ内容のエントリは同じ署名になる', () => {
  const a = { date: '2026-08-01', store: 'マルハン', machine: 'バジリスク', slotNumber: '123', investment: 10000, collection: 15000 };
  const b = { ...a, store: 'マルハン ', slotNumber: 123 };  // 空白と型のゆれは吸収する

  assert.equal(entrySignature(a), entrySignature(b));
});

test('台番号や金額が違えば別の記録として扱う', () => {
  const base = { date: '2026-08-01', store: 'マルハン', machine: 'バジリスク', slotNumber: '123', investment: 10000, collection: 15000 };

  assert.notEqual(entrySignature(base), entrySignature({ ...base, slotNumber: '124' }));
  assert.notEqual(entrySignature(base), entrySignature({ ...base, investment: 12000 }));
  assert.notEqual(entrySignature(base), entrySignature({ ...base, date: '2026-08-02' }));
});
