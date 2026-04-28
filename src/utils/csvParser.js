export const readFileAsText = async (file) => {
  const buffer = await file.arrayBuffer();
  const uint8 = new Uint8Array(buffer);

  // UTF-8 BOM (EF BB BF)
  if (uint8[0] === 0xEF && uint8[1] === 0xBB && uint8[2] === 0xBF) {
    return new TextDecoder('utf-8').decode(buffer);
  }

  // Try strict UTF-8; fall back to Shift-JIS (Excel default on Japanese Windows)
  try {
    return new TextDecoder('utf-8', { fatal: true }).decode(buffer);
  } catch {
    return new TextDecoder('shift-jis').decode(buffer);
  }
};

const parseCSVLine = (line) => {
  const fields = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') { current += '"'; i++; }
      else inQuotes = !inQuotes;
    } else if (ch === ',' && !inQuotes) {
      fields.push(current); current = '';
    } else {
      current += ch;
    }
  }
  fields.push(current);
  return fields;
};

const normDate = (raw) => {
  if (!raw) return null;
  const s = raw.replace(/\//g, '-').trim();
  const m = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (!m) return null;
  return `${m[1]}-${m[2].padStart(2, '0')}-${m[3].padStart(2, '0')}`;
};

const normTime = (raw) => {
  if (!raw) return '';
  const m = raw.trim().match(/^(\d{1,2}):(\d{2})$/);
  return m ? `${m[1].padStart(2, '0')}:${m[2]}` : '';
};

const parseNum = (raw) => {
  if (raw === undefined || raw === null || raw.trim() === '') return null;
  const n = parseInt(raw.replace(/[^\d-]/g, ''), 10);
  return isNaN(n) ? null : n;
};

const ALIASES = {
  date:            ['日付', '日付け', '日時'],
  store:           ['店舗', '店舗名'],
  machine:         ['機種', '機種名'],
  slotNumber:      ['台番号', '台番'],
  investment:      ['投資', '投資額', '投資合計'],
  investmentCash:  ['投資_現金', '投資現金', '投資（現金）'],
  investmentMedal: ['投資_貯メダル', '投資貯メダル', '投資_メダル', '投資（貯メダル）'],
  collection:      ['回収', '回収額', '回収合計'],
  collectionCash:  ['回収_現金', '回収現金', '回収（現金）'],
  collectionMedal: ['回収_貯メダル', '回収貯メダル', '回収_メダル', '回収（貯メダル）'],
  startTime:       ['開始時間', '開始', '開始時刻'],
  endTime:         ['終了時間', '終了', '終了時刻'],
  memo:            ['メモ', '備考'],
};

export const parseCSV = (text, calcYen = (_, n) => n) => {
  const content = text.replace(/^﻿/, '');
  const lines = content.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n').filter(l => l.trim());

  if (lines.length < 2) return { valid: [], invalid: [], totalRows: 0 };

  const headers = parseCSVLine(lines[0]).map(h => h.trim());

  const colIdx = {};
  for (const [field, aliases] of Object.entries(ALIASES)) {
    for (const alias of aliases) {
      const idx = headers.indexOf(alias);
      if (idx !== -1) { colIdx[field] = idx; break; }
    }
  }

  const valid = [];
  const invalid = [];

  for (let i = 1; i < lines.length; i++) {
    const cells = parseCSVLine(lines[i]);
    const rowNum = i + 1;
    const errors = [];
    const get = (f) => colIdx[f] !== undefined ? (cells[colIdx[f]] || '').trim() : '';

    // Date
    const date = normDate(get('date'));
    if (!date) errors.push('日付が無効（YYYY-MM-DD 形式）');

    // Store（店舗が空欄の行は日付だけの区切り行とみなして無視）
    const store = get('store');
    if (!store) continue;

    // Investment
    let investment      = parseNum(get('investment'));
    let investmentCash  = parseNum(get('investmentCash'));
    let investmentMedal = parseNum(get('investmentMedal'));

    const hasInvCol = colIdx.investment !== undefined || colIdx.investmentCash !== undefined || colIdx.investmentMedal !== undefined;
    if (!hasInvCol) {
      errors.push('投資列（投資 / 投資_現金 / 投資_貯メダル）が見つからない');
    } else if (colIdx.investment !== undefined && get('investment') !== '' && investment === null) {
      errors.push('投資が数値でない');
    }

    // Collection
    let collection      = parseNum(get('collection'));
    let collectionCash  = parseNum(get('collectionCash'));
    let collectionMedal = parseNum(get('collectionMedal'));

    const hasColCol = colIdx.collection !== undefined || colIdx.collectionCash !== undefined || colIdx.collectionMedal !== undefined;
    if (!hasColCol) {
      errors.push('回収列（回収 / 回収_現金 / 回収_貯メダル）が見つからない');
    } else if (colIdx.collection !== undefined && get('collection') !== '' && collection === null) {
      errors.push('回収が数値でない');
    }

    if (errors.length > 0) { invalid.push({ rowNum, errors, raw: lines[i] }); continue; }

    // Fill defaults（メダルは枚→円換算してから合計に反映）
    const invMedalYen = calcYen(store, investmentMedal || 0);
    const colMedalYen = calcYen(store, collectionMedal || 0);
    if (investment === null) investment = (investmentCash || 0) + invMedalYen;
    if (investmentCash  === null) investmentCash  = investment - invMedalYen;
    if (investmentMedal === null) investmentMedal = 0;

    if (collection === null) collection = (collectionCash || 0) + colMedalYen;
    if (collectionCash  === null) collectionCash  = collection - colMedalYen;
    if (collectionMedal === null) collectionMedal = 0;

    valid.push({
      rowNum,
      date,
      store,
      machine:         get('machine'),
      slotNumber:      get('slotNumber'),
      investment,      investmentCash,  investmentMedal,
      collection,      collectionCash,  collectionMedal,
      startTime:       normTime(get('startTime')),
      endTime:         normTime(get('endTime')),
      memo:            get('memo'),
    });
  }

  return { valid, invalid, totalRows: lines.length - 1 };
};
