const WEEK_ORDER = { '月': 1, '火': 2, '水': 3, '木': 4, '金': 5, '土': 6, '日': 7 };

/**
 * 曜日別成績を日単位で集計する。
 * 同じ日に複数台を登録しても、勝敗と平均が登録件数に左右されないよう先に日次合算する。
 *
 * @param {Array} entries
 * @returns {Array}
 */
export const aggregateWeekdayStats = (entries) => {
  const dailyGroups = {};

  entries.forEach(entry => {
    if (!entry.date || !entry.dayOfWeek) return;
    if (!dailyGroups[entry.date]) {
      dailyGroups[entry.date] = {
        dayOfWeek: entry.dayOfWeek,
        investment: 0,
        collection: 0,
        profit: 0
      };
    }
    dailyGroups[entry.date].investment += entry.investment || 0;
    dailyGroups[entry.date].collection += entry.collection || 0;
    dailyGroups[entry.date].profit += entry.profit || 0;
  });

  const weekdayGroups = {};
  Object.values(dailyGroups).forEach(day => {
    const key = day.dayOfWeek;
    if (!weekdayGroups[key]) {
      weekdayGroups[key] = {
        name: key,
        investment: 0,
        collection: 0,
        profit: 0,
        count: 0,
        winCount: 0
      };
    }
    weekdayGroups[key].investment += day.investment;
    weekdayGroups[key].collection += day.collection;
    weekdayGroups[key].profit += day.profit;
    weekdayGroups[key].count++;
    if (day.profit > 0) weekdayGroups[key].winCount++;
  });

  return Object.values(weekdayGroups)
    .map(group => ({
      ...group,
      winRate: group.count > 0 ? (group.winCount / group.count) * 100 : 0,
      avgProfit: group.count > 0 ? group.profit / group.count : 0
    }))
    .sort((a, b) => (WEEK_ORDER[a.name] || 99) - (WEEK_ORDER[b.name] || 99));
};