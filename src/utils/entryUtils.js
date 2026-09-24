/**
 * エントリから「現金だけ」の金額を取り出す。
 *
 * 貯メダル欄が使われていない古いエントリは cash が未設定なので、
 * その場合は総額をそのまま現金とみなす（parseEvent の挙動と揃えている）。
 *
 * @param {Object} entry
 * @param {'investment'|'collection'} kind
 * @returns {Number} 円
 */
export const cashOf = (entry, kind) => {
  const cash = entry[`${kind}Cash`];
  if (cash === undefined || cash === null || cash === '') {
    return entry[kind] || 0;
  }
  return Number(cash) || 0;
};

/**
 * 同じ稼働を指すエントリかどうかを判定するためのキー。
 *
 * 同じ日に同じ店の複数台を打つことがあるため、機種・台番号・金額まで含めて初めて
 * 「同じ記録」とみなす。CSV の二重取込を防ぐ用途で使う。
 *
 * @param {Object} entry
 * @returns {String}
 */
export const entrySignature = (entry) => [
  entry.date || '',
  (entry.store || '').trim(),
  (entry.machine || '').trim(),
  String(entry.slotNumber ?? '').trim(),
  Number(entry.investment) || 0,
  Number(entry.collection) || 0
].join('|');

/**
 * 現金ベースの収支（実際に財布から増減した額）。
 *
 * 台移動で持ち込んだメダルは「前の台の回収」と「次の台の投資」に
 * 同額で計上されて打ち消し合うため、この値はエントリの分け方や
 * 交換率の設定に左右されない。
 *
 * @param {Array} entries
 * @returns {{ investment: Number, collection: Number, profit: Number }}
 */
export const cashTotals = (entries) => {
  let investment = 0;
  let collection = 0;
  entries.forEach(e => {
    investment += cashOf(e, 'investment');
    collection += cashOf(e, 'collection');
  });
  return { investment, collection, profit: collection - investment };
};

/**
 * 入力候補を「最近使った順 → 使用回数順」に並べて返す。
 *
 * 名前順だと候補が増えるほど目当てを探しづらくなるので、
 * 直近に打った店・機種ほど上に来るようにしている。
 *
 * @param {Array<Object>} entries
 * @param {'store'|'machine'} key
 * @param {(entry: Object) => Boolean} [filter] 対象エントリの絞り込み
 * @returns {Array<String>}
 */
export const rankByUsage = (entries, key, filter = () => true) => {
  const stats = new Map();
  for (const entry of entries) {
    const name = (entry[key] || '').trim();
    if (!name || !filter(entry)) continue;
    const s = stats.get(name) || { count: 0, last: '' };
    s.count += 1;
    if ((entry.date || '') > s.last) s.last = entry.date || '';
    stats.set(name, s);
  }
  return Array.from(stats.entries())
    .sort(([a, x], [b, y]) =>
      y.last.localeCompare(x.last) || y.count - x.count || a.localeCompare(b, 'ja'))
    .map(([name]) => name);
};
