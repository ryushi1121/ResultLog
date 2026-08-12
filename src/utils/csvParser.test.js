import test from 'node:test';
import assert from 'node:assert/strict';

import { parseCSV } from './csvParser.js';

const HEADER = '日付,店舗,機種,台番号,投資,回収,メモ';

test('引用符で囲まれたメモの改行をレコードの区切りにしない', () => {
  const csv = [
    HEADER,
    '2026-08-01,マルハン,バジリスク,123,10000,15000,"1行目',
    '2行目"',
    '2026-08-02,ダイナム,ジャグラー,456,5000,3000,通常メモ'
  ].join('\r\n');

  const { valid, invalid, totalRows } = parseCSV(csv);

  assert.equal(invalid.length, 0);
  assert.equal(totalRows, 2);
  assert.equal(valid.length, 2);
  assert.equal(valid[0].memo, '1行目\n2行目');
  assert.equal(valid[1].memo, '通常メモ');
});

test('エラー行の行番号はメモの改行ぶんを含めた物理行を指す', () => {
  const csv = [
    HEADER,
    '2026-08-01,マルハン,バジリスク,123,10000,15000,"1行目',
    '2行目"',
    '日付なし,ダイナム,ジャグラー,456,5000,3000,'
  ].join('\n');

  const { invalid } = parseCSV(csv);

  assert.equal(invalid.length, 1);
  assert.equal(invalid[0].rowNum, 4);
});

test('エスケープされた二重引用符とカンマを含むフィールドを復元する', () => {
  const csv = `${HEADER}\n2026-08-01,"マルハン, 新宿",バジリスク,123,10000,15000,"""設定6"" 濃厚"`;

  const { valid } = parseCSV(csv);

  assert.equal(valid[0].store, 'マルハン, 新宿');
  assert.equal(valid[0].memo, '"設定6" 濃厚');
});

test('BOM 付き・空行混じりでも取り込める', () => {
  const csv = `﻿${HEADER}\n\n2026-08-01,マルハン,バジリスク,123,10000,15000,\n\n`;

  const { valid, totalRows } = parseCSV(csv);

  assert.equal(totalRows, 1);
  assert.equal(valid.length, 1);
  assert.equal(valid[0].date, '2026-08-01');
});

test('店舗が空欄の行は区切り行として無視する', () => {
  const csv = `${HEADER}\n2026-08-01,,,,,,\n2026-08-01,マルハン,バジリスク,123,10000,15000,`;

  const { valid, invalid } = parseCSV(csv);

  assert.equal(valid.length, 1);
  assert.equal(invalid.length, 0);
});
