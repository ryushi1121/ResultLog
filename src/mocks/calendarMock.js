/**
 * 開発用の Google カレンダー モック。
 *
 * Google アカウントにログインせずに画面を動かすための仕組み。
 * `main.js` から `import.meta.env.DEV` のときだけ動的 import しているので、
 * 本番ビルドにはこのファイルの中身は一切含まれない。
 *
 * 使い方:
 *   http://localhost:5173/?mock=1            … 有効化（以降リロードしても維持される）
 *   http://localhost:5173/?mock=1&delay=1500 … 全 API に 1.5 秒の遅延を挟む（ローディング表示の確認用）
 *   http://localhost:5173/?mock=0            … 無効化してダミーデータを破棄
 *
 * 実データは読み書きしない。登録・更新・削除は sessionStorage 上のダミーに対して行われるため、
 * リロードしても内容が残り、タブを閉じれば消える。
 */

const FLAG_KEY = 'resultlog_mock_enabled';
const DELAY_KEY = 'resultlog_mock_delay';
const EVENTS_KEY = 'resultlog_mock_events';

const PREFIX = '【ResultLog】 ';
const YEN_PER_MEDAL = 20; // 5.0枚交換（店舗別設定に依存しない固定値でダミーを作る）

const pad = (n) => String(n).padStart(2, '0');
const toDateStr = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

/** 今日から days 日前の YYYY-MM-DD */
const daysAgo = (days) => {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return toDateStr(d);
};

/**
 * ダミーのカレンダーイベントを1件作る。
 * 本物と同じ description フォーマットで書くことで calendarParser.parseEvent をそのまま通す。
 */
const makeEvent = (id, date, store, machine, slot, invCash, invMedal, colCash, colMedal, memo) => {
  const investment = invCash + invMedal * YEN_PER_MEDAL;
  const collection = colCash + colMedal * YEN_PER_MEDAL;
  const profit = collection - investment;
  const sign = profit >= 0 ? `+${profit.toLocaleString()}` : profit.toLocaleString();

  const lines = [
    `機種：${machine}`,
    `台番号：${slot}`,
    `投資：${investment.toLocaleString()}円 (現金: ${invCash.toLocaleString()}円, 貯メダル: ${invMedal.toLocaleString()}枚)`,
    `回収：${collection.toLocaleString()}円 (現金: ${colCash.toLocaleString()}円, 貯メダル: ${colMedal.toLocaleString()}枚)`,
    `稼働時間：～`
  ];
  if (memo) lines.push(`メモ：${memo}`);

  return {
    id,
    summary: `${PREFIX}${store} ${sign}`,
    location: store,
    start: { date },
    end: { date },
    description: lines.join('\n')
  };
};

/**
 * 初期ダミーデータ。
 * 現金収支とメダル込み収支が食い違うケース（貯メダルを跨いだ日・台移動した日）を
 * 意図的に含めているので、その2指標の違いを画面で確認できる。
 */
const seedEvents = () => [
  // 通常の現金勝ち
  makeEvent('mock-1', daysAgo(22), 'マルハン新宿東口店', 'バジリスク絆2天膳', '456', 10000, 0, 28000, 0, ''),
  // 出玉を換金せず貯メダルにした日 → メダル込みは勝ちだが現金は減っている
  makeEvent('mock-2', daysAgo(15), 'マルハン新宿東口店', '押忍!番長ZERO', '112', 18000, 0, 0, 1000, '出玉は貯メダルに'),
  makeEvent('mock-3', daysAgo(8), 'ベガス大久保店', 'モンキーターンV', '303', 22000, 0, 6000, 0, ''),
  // 前回の貯メダルを持ち込んで打った日
  makeEvent('mock-4', daysAgo(5), 'マルハン新宿東口店', 'バジリスク絆2天膳', '458', 5000, 600, 42000, 0, ''),
  makeEvent('mock-5', daysAgo(1), 'ベガス大久保店', 'スマスロ北斗の拳', '77', 30000, 0, 15000, 0, ''),
  // 同じ日に台移動したケース（1台目の持ち出しを2台目の投資に入れている）
  makeEvent('mock-6', daysAgo(3), 'マルハン新宿東口店', 'ゴジラ対エヴァンゲリオン', '201', 12000, 0, 0, 700, '当たらず移動'),
  makeEvent('mock-7', daysAgo(3), 'マルハン新宿東口店', 'Lパチスロ鉄拳', '215', 0, 700, 21000, 0, '移動先で回収'),
  // 先月・先々月のデータ（期間切り替えの確認用）
  makeEvent('mock-8', daysAgo(38), 'ベガス大久保店', 'スマスロ North Fist', '88', 25000, 0, 41000, 0, ''),
  makeEvent('mock-9', daysAgo(52), 'マルハン新宿東口店', '押忍!番長ZERO', '110', 16000, 0, 4000, 0, ''),
  makeEvent('mock-10', daysAgo(70), 'ダイナム練馬店', 'ヴヴヴ', '512', 8000, 0, 19000, 0, '朝から高設定っぽかった'),
];

const loadEvents = () => {
  try {
    const raw = sessionStorage.getItem(EVENTS_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    // 壊れていたら作り直す
  }
  const seeded = seedEvents();
  sessionStorage.setItem(EVENTS_KEY, JSON.stringify(seeded));
  return seeded;
};

const saveEvents = (events) => sessionStorage.setItem(EVENTS_KEY, JSON.stringify(events));

const json = (body, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

/** 画面がモックデータであることを一目で分かるようにする */
const showBadge = () => {
  if (document.getElementById('mock-badge')) return;
  const badge = document.createElement('div');
  badge.id = 'mock-badge';
  badge.textContent = 'MOCK DATA';
  badge.title = 'Googleカレンダーのモックが有効です。?mock=0 で解除できます';
  badge.style.cssText = [
    'position:fixed', 'left:8px', 'bottom:8px', 'z-index:99999',
    'padding:4px 10px', 'border-radius:10px',
    'background:#b58900', 'color:#fff',
    'font:600 11px/1.4 system-ui,sans-serif', 'letter-spacing:.06em',
    'opacity:.85', 'pointer-events:none', 'user-select:none'
  ].join(';');
  document.body.appendChild(badge);
};

/** 実際のログインを経ずに認証済みの状態を作る */
const fakeSignIn = () => {
  localStorage.setItem('google_access_token', 'mock-access-token');
  localStorage.setItem('google_token_expires_at', String(Date.now() + 12 * 60 * 60 * 1000));
  localStorage.setItem('google_user', JSON.stringify({
    name: 'モック ユーザー', email: 'mock@example.com', picture: ''
  }));
  localStorage.setItem('google_user_email', 'mock@example.com');
};

const clearMockState = () => {
  sessionStorage.removeItem(FLAG_KEY);
  sessionStorage.removeItem(DELAY_KEY);
  sessionStorage.removeItem(EVENTS_KEY);
  ['google_access_token', 'google_token_expires_at', 'google_user', 'google_user_email']
    .forEach(k => localStorage.removeItem(k));
};

const installFetchMock = (delayMs) => {
  const realFetch = window.fetch.bind(window);
  const wait = () => (delayMs > 0 ? new Promise(r => setTimeout(r, delayMs)) : Promise.resolve());

  window.fetch = async (input, options = {}) => {
    const url = typeof input === 'string' ? input : input?.url ?? String(input);
    const method = (options.method || 'GET').toUpperCase();

    if (url.includes('oauth2/v3/userinfo')) {
      await wait();
      return json({ name: 'モック ユーザー', email: 'mock@example.com', picture: '' });
    }

    if (!url.includes('googleapis.com/calendar')) {
      return realFetch(input, options);
    }

    await wait();
    const events = loadEvents();
    // .../events または .../events/{eventId}
    const idMatch = url.match(/\/events\/([^?]+)/);
    const eventId = idMatch ? decodeURIComponent(idMatch[1]) : null;

    if (method === 'GET') {
      const params = new URLSearchParams(url.split('?')[1] || '');
      const q = params.get('q');
      const timeMin = params.get('timeMin');
      const timeMax = params.get('timeMax');

      const items = events.filter(e => {
        if (q && !e.summary.includes(q)) return false;
        const date = e.start?.date || e.start?.dateTime?.split('T')[0];
        if (timeMin && date < timeMin.split('T')[0]) return false;
        if (timeMax && date > timeMax.split('T')[0]) return false;
        return true;
      });
      // 本物と違いページングはしない（nextPageToken を返さないので1ページで完結する）
      return json({ items });
    }

    if (method === 'POST') {
      const created = { ...JSON.parse(options.body || '{}'), id: `mock-${Date.now()}` };
      saveEvents([...events, created]);
      return json(created);
    }

    if (method === 'PUT' && eventId) {
      const updated = { ...JSON.parse(options.body || '{}'), id: eventId };
      saveEvents(events.map(e => (e.id === eventId ? updated : e)));
      return json(updated);
    }

    if (method === 'DELETE' && eventId) {
      saveEvents(events.filter(e => e.id !== eventId));
      return new Response(null, { status: 204 });
    }

    return json({ error: { message: `モック未対応のリクエスト: ${method} ${url}` } }, 400);
  };
};

/**
 * URL の ?mock= を見てモックの有効・無効を切り替え、有効なら fetch を差し替える。
 * 一度有効にすると sessionStorage に記録されるので、リロードや画面遷移をしても維持される。
 */
export const setupCalendarMock = () => {
  const params = new URLSearchParams(window.location.search);
  const flag = params.get('mock');

  if (flag === '0') {
    clearMockState();
    console.info('[mock] Googleカレンダーのモックを解除しました');
    return false;
  }

  if (flag === '1') {
    sessionStorage.setItem(FLAG_KEY, '1');
    sessionStorage.setItem(DELAY_KEY, params.get('delay') || '0');
  }

  if (sessionStorage.getItem(FLAG_KEY) !== '1') return false;

  const delayMs = Number(sessionStorage.getItem(DELAY_KEY)) || 0;
  fakeSignIn();
  installFetchMock(delayMs);

  if (document.body) showBadge();
  else window.addEventListener('DOMContentLoaded', showBadge, { once: true });

  console.info(
    `[mock] Googleカレンダーのモックが有効です（遅延 ${delayMs}ms / ダミー ${loadEvents().length}件）。` +
    ' 解除するには ?mock=0 を付けてアクセスしてください'
  );
  return true;
};
