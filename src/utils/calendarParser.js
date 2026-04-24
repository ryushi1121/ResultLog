import { formatDateForAPI, getDayOfWeek } from './dateUtils';

const PREFIX = '【ResultLog】 ';

/**
 * Parses a Google Calendar event into the app's internal entry model
 */
export const parseEvent = (calendarEvent) => {
  // Ensure it's a valid event for our app
  if (!calendarEvent.summary) {
    return null;
  }

  let rest;
  const oldPrefix = '【収支管理】 ';
  if (calendarEvent.summary.startsWith(PREFIX)) {
    rest = calendarEvent.summary.slice(PREFIX.length).trim();
  } else if (calendarEvent.summary.startsWith(oldPrefix)) {
    rest = calendarEvent.summary.slice(oldPrefix.length).trim();
  } else {
    return null;
  }
  // 最後のトークン（収支）を分離
  const lastSpace = rest.lastIndexOf(' ');
  const store = lastSpace > -1 ? rest.substring(0, lastSpace).trim() : rest;

  // 日付・稼働時間の取り出し
  const startDateTime = calendarEvent.start?.dateTime;
  const dateStr = startDateTime
    ? startDateTime.split('T')[0]
    : (calendarEvent.start?.date || formatDateForAPI(new Date()));
  const startTime = startDateTime ? startDateTime.substring(11, 16) : '';
  const endDateTime = calendarEvent.end?.dateTime;
  const endTime = endDateTime ? endDateTime.substring(11, 16) : '';

  const description = calendarEvent.description || '';
  const lines = description.split('\n').map(line => line.trim());
  
  const entry = {
    id: calendarEvent.id,
    date: dateStr,
    store: store,
    machine: '',
    investment: 0,
    collection: 0,
    profit: 0,
    slotNumber: '',
    startTime: startTime,
    endTime: endTime,
    memo: '',
    dayOfWeek: getDayOfWeek(dateStr)
  };

  lines.forEach(line => {
    const colonIndex = line.indexOf('：');
    if (colonIndex > -1) {
      const key = line.substring(0, colonIndex).trim();
      const value = line.substring(colonIndex + 1).trim();

      const parseAmount = (valStr) => {
        const parts = valStr.split('(');
        const total = parseInt(parts[0].replace(/[^\d-]/g, ''), 10) || 0;
        let cash = total;
        let medal = 0;
        if (parts.length > 1) {
          const detailStr = parts[1];
          const cashMatch = detailStr.match(/現金:\s*([0-9,]+)/);
          if (cashMatch) cash = parseInt(cashMatch[1].replace(/,/g, ''), 10);
          const medalMatch = detailStr.match(/貯メダル:\s*([0-9,]+)/);
          if (medalMatch) medal = parseInt(medalMatch[1].replace(/,/g, ''), 10);
        }
        return { total, cash, medal };
      };

      switch (key) {
        case '投資':
          const inv = parseAmount(value);
          entry.investment = inv.total;
          entry.investmentCash = inv.cash;
          entry.investmentMedal = inv.medal;
          break;
        case '回収':
          const col = parseAmount(value);
          entry.collection = col.total;
          entry.collectionCash = col.cash;
          entry.collectionMedal = col.medal;
          break;
        case '機種':
          entry.machine = value;
          break;
        case '台番号':
          entry.slotNumber = value;
          break;
        case 'メモ':
          entry.memo = value;
          break;
      }
    }
  });

  entry.profit = entry.collection - entry.investment;

  return entry;
};

/**
 * Formats the app's entry model into a Google Calendar event payload
 */
export const formatEvent = (entryData) => {
  const profit = (entryData.collection || 0) - (entryData.investment || 0);
  const profitSign = profit >= 0 ? `+${profit.toLocaleString()}` : `${profit.toLocaleString()}`;

  // タイトル: 【ResultLog】 [店舗名] [収支]
  const summary = `${PREFIX}${entryData.store} ${profitSign}`;

  // 説明: 機種・投資・回収・稼働時間・台番号・メモ
  const descriptionLines = [
    `機種：${entryData.machine || ''}`,
    `台番号：${entryData.slotNumber || ''}`,
    `投資：${(entryData.investment || 0).toLocaleString()}円 (現金: ${(entryData.investmentCash || 0).toLocaleString()}円, 貯メダル: ${(entryData.investmentMedal || 0).toLocaleString()}枚)`,
    `回収：${(entryData.collection || 0).toLocaleString()}円 (現金: ${(entryData.collectionCash || 0).toLocaleString()}円, 貯メダル: ${(entryData.collectionMedal || 0).toLocaleString()}枚)`,
    `稼働時間：${entryData.startTime || ''}～${entryData.endTime || ''}`
  ];

  if (entryData.memo) {
    descriptionLines.push(`メモ：${entryData.memo}`);
  }

  const dateStr = entryData.date; // YYYY-MM-DD

  // 時間指定イベントを構築（開始/終了時間が設定されている場合）
  let startObj, endObj;
  if (entryData.startTime && entryData.endTime) {
    // dateTime形式（タイムゾーンなし → ローカル時刻として扱われる）
    startObj = { dateTime: `${dateStr}T${entryData.startTime}:00`, timeZone: 'Asia/Tokyo' };
    endObj   = { dateTime: `${dateStr}T${entryData.endTime}:00`,   timeZone: 'Asia/Tokyo' };
  } else {
    // フォールバック: 終日イベント
    const startDate = new Date(dateStr);
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 1);
    startObj = { date: formatDateForAPI(startDate) };
    endObj   = { date: formatDateForAPI(endDate) };
  }

  let colorId = undefined;
  if (profit > 0) colorId = '9';  // ブルーベリー (青)
  else if (profit < 0) colorId = '11'; // トマト (赤)

  const payload = {
    summary: summary,
    location: entryData.store,          // 場所: 店舗名
    description: descriptionLines.join('\n'),
    start: startObj,
    end: endObj,
    reminders: {
      useDefault: false,
      overrides: []                     // 通知なし
    }
  };

  if (colorId) {
    payload.colorId = colorId;
  }

  return payload;
};
