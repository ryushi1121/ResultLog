import test from 'node:test';
import assert from 'node:assert/strict';

import { parseEvent, formatEvent } from './calendarParser.js';

const baseEntry = {
  date: '2026-08-01',
  store: 'マルハン 新宿',
  machine: 'バジリスク絆2',
  slotNumber: '123',
  investment: 15000,
  investmentCash: 10000,
  investmentMedal: 1000,
  collection: 20000,
  collectionCash: 20000,
  collectionMedal: 0,
  startTime: '10:00',
  endTime: '18:30',
  memo: ''
};

/** formatEvent の出力を Calendar API が返す形（id 付き）にする */
const toCalendarEvent = (entry, id = 'event-id') => ({ id, ...formatEvent(entry) });

test('formatEvent → parseEvent で入力した値が復元される', () => {
  const parsed = parseEvent(toCalendarEvent(baseEntry));

  assert.equal(parsed.date, '2026-08-01');
  assert.equal(parsed.store, 'マルハン 新宿'); // 店舗名に空白が入っても収支だけを切り離す
  assert.equal(parsed.machine, 'バジリスク絆2');
  assert.equal(parsed.slotNumber, '123');
  assert.equal(parsed.investment, 15000);
  assert.equal(parsed.investmentCash, 10000);
  assert.equal(parsed.investmentMedal, 1000);
  assert.equal(parsed.collection, 20000);
  assert.equal(parsed.collectionCash, 20000);
  assert.equal(parsed.collectionMedal, 0);
  assert.equal(parsed.startTime, '10:00');
  assert.equal(parsed.endTime, '18:30');
  assert.equal(parsed.profit, 5000);
});

test('複数行のメモが改行ごと復元される', () => {
  const entry = { ...baseEntry, memo: '朝一リセット\n設定変更あり\n\n最後の行' };

  const parsed = parseEvent(toCalendarEvent(entry));

  assert.equal(parsed.memo, '朝一リセット\n設定変更あり\n\n最後の行');
});

test('メモの中に「キー：値」があっても項目として拾わない', () => {
  const entry = { ...baseEntry, memo: '投資：メモに書いた分は無視される' };

  const parsed = parseEvent(toCalendarEvent(entry));

  assert.equal(parsed.investment, 15000);
  assert.equal(parsed.memo, '投資：メモに書いた分は無視される');
});

test('稼働時間が空なら終日イベントとして往復する', () => {
  const entry = { ...baseEntry, startTime: '', endTime: '' };

  const event = toCalendarEvent(entry);
  const parsed = parseEvent(event);

  assert.equal(event.start.date, '2026-08-01');
  assert.equal(event.end.date, '2026-08-02'); // 終日イベントの end は翌日
  assert.equal(parsed.date, '2026-08-01');
  assert.equal(parsed.startTime, '');
  assert.equal(parsed.endTime, '');
});

test('旧プレフィックス【収支管理】のイベントも読める', () => {
  const event = toCalendarEvent(baseEntry);
  event.summary = event.summary.replace('【ResultLog】', '【収支管理】');

  const parsed = parseEvent(event);

  assert.equal(parsed.store, 'マルハン 新宿');
  assert.equal(parsed.investment, 15000);
});

test('貯メダル内訳を持たない古いイベントは総額をそのまま現金とみなす', () => {
  const event = {
    id: 'legacy',
    summary: '【収支管理】 ダイナム +3,000',
    description: '機種：ジャグラー\n台番号：7\n投資：10,000円\n回収：13,000円',
    start: { date: '2026-07-20' },
    end: { date: '2026-07-21' }
  };

  const parsed = parseEvent(event);

  assert.equal(parsed.investment, 10000);
  assert.equal(parsed.investmentCash, 10000);
  assert.equal(parsed.investmentMedal, 0);
  assert.equal(parsed.profit, 3000);
});

test('ResultLog 以外のカレンダー予定は無視する', () => {
  assert.equal(parseEvent({ id: 'x', summary: '歯医者 15:00' }), null);
  assert.equal(parseEvent({ id: 'y' }), null);
});

test('収支の符号でイベントの色を出し分ける', () => {
  assert.equal(formatEvent({ ...baseEntry, investment: 10000, collection: 15000 }).colorId, '9');
  assert.equal(formatEvent({ ...baseEntry, investment: 15000, collection: 10000 }).colorId, '11');
  assert.equal(formatEvent({ ...baseEntry, investment: 10000, collection: 10000 }).colorId, undefined);
});
