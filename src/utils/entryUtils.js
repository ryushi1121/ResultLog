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
