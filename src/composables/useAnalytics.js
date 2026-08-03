import { ref, computed } from 'vue';
import { useEntries } from './useEntries';
import { cashOf } from '../utils/entryUtils';
import { aggregateWeekdayStats } from '../utils/analyticsUtils';

// Shared state so it persists across components
const periodType = ref('month');
const periodValue = ref(new Date().toISOString().substring(0, 7));
const selectedStore = ref('');
const selectedMachine = ref(null);

export const useAnalytics = () => {
  const { entries } = useEntries();

  // Period filter only
  const filteredEntries = computed(() => {
    if (periodType.value === 'all') return entries.value;

    return entries.value.filter(entry => {
      if (periodType.value === 'month') {
        return entry.date && entry.date.startsWith(periodValue.value);
      }
      if (periodType.value === 'year') {
        return entry.date && entry.date.startsWith(periodValue.value.substring(0, 4));
      }
      return true;
    });
  });

  // Period + store + machine filter (used for graph and summary)
  const drilldownEntries = computed(() => {
    let result = filteredEntries.value;
    if (selectedStore.value !== '') result = result.filter(e => e.store === selectedStore.value);
    if (selectedMachine.value) result = result.filter(e => e.machine === selectedMachine.value);
    return result;
  });

  const summaryStats = computed(() => {
    let totalInvestment = 0;
    let totalCollection = 0;
    let totalProfit = 0;
    let cashInvestment = 0;
    let cashCollection = 0;
    let winCount = 0;
    let maxWin = 0;
    let maxLoss = 0;

    drilldownEntries.value.forEach(e => {
      totalInvestment += e.investment || 0;
      totalCollection += e.collection || 0;
      totalProfit += e.profit || 0;
      // 現金だけを集計する。台移動で持ち込んだメダルは投資・回収の両方に
      // 同額で乗って打ち消し合うため、エントリの切り方に影響されない
      cashInvestment += cashOf(e, 'investment');
      cashCollection += cashOf(e, 'collection');
      if (e.profit > 0) winCount++;
      if (e.profit > maxWin) maxWin = e.profit;
      if (e.profit < maxLoss) maxLoss = e.profit;
    });

    const count = drilldownEntries.value.length;
    const winRate = count > 0 ? (winCount / count) * 100 : 0;

    return {
      count,
      totalInvestment,
      totalCollection,
      totalProfit,
      cashInvestment,
      cashCollection,
      cashProfit: cashCollection - cashInvestment,
      winRate,
      maxWin,
      maxLoss
    };
  });

  const _groupAndAggregate = (keySelector, baseEntries) => {
    const groups = {};
    baseEntries.forEach(e => {
      const key = keySelector(e);
      if (!key) return;
      if (!groups[key]) {
        groups[key] = { name: key, investment: 0, collection: 0, profit: 0, count: 0, winCount: 0 };
      }
      groups[key].investment += e.investment || 0;
      groups[key].collection += e.collection || 0;
      groups[key].profit += e.profit || 0;
      groups[key].count++;
      if (e.profit > 0) groups[key].winCount++;
    });

    return Object.values(groups).map(g => ({
      ...g,
      winRate: g.count > 0 ? (g.winCount / g.count) * 100 : 0,
      avgProfit: g.count > 0 ? g.profit / g.count : 0
    })).sort((a, b) => b.profit - a.profit);
  };

  // 期間内の店舗一覧（ドロップダウン用）
  const availableStores = computed(() => {
    const stores = new Set();
    filteredEntries.value.forEach(e => { if (e.store) stores.add(e.store); });
    return Array.from(stores).sort();
  });

  // 期間・店舗内の機種一覧（ドロップダウン用）
  const availableMachines = computed(() => {
    let base = filteredEntries.value;
    if (selectedStore.value !== '') base = base.filter(e => e.store === selectedStore.value);
    const machines = new Set();
    base.forEach(e => { if (e.machine) machines.add(e.machine); });
    return Array.from(machines).sort();
  });

  // Store stats（StoreChart 用・全店舗比較なのでストア選択は非適用、機種選択は適用）
  const storeStats = computed(() => {
    let base = filteredEntries.value;
    if (selectedMachine.value) base = base.filter(e => e.machine === selectedMachine.value);
    return _groupAndAggregate(e => e.store, base);
  });

  // 機種集計は drilldownEntries ベース（選択店舗でフィルタ済み）
  const machineStats = computed(() => _groupAndAggregate(e => e.machine, drilldownEntries.value));

  // 円グラフ用：機種フィルターを除外（期間・店舗のみ適用）
  const machineStatsAll = computed(() => {
    let base = filteredEntries.value;
    if (selectedStore.value !== '') base = base.filter(e => e.store === selectedStore.value);
    return _groupAndAggregate(e => e.machine, base);
  });

  const weekdayStats = computed(() => aggregateWeekdayStats(drilldownEntries.value));

  // 日付末尾（0〜9）ごとの集計（drilldownEntries ベース）
  const dateSuffixStats = computed(() => {
    const groups = {};
    for (let i = 0; i <= 9; i++) {
      groups[String(i)] = { suffix: String(i), count: 0, winCount: 0, profit: 0, entries: [] };
    }
    drilldownEntries.value.forEach(e => {
      if (!e.date) return;
      const suffix = e.date.slice(-1);
      if (groups[suffix]) {
        groups[suffix].count++;
        groups[suffix].profit += e.profit || 0;
        if (e.profit > 0) groups[suffix].winCount++;
        groups[suffix].entries.push(e);
      }
    });
    return Object.values(groups).map(g => ({
      ...g,
      winRate: g.count > 0 ? (g.winCount / g.count) * 100 : 0,
      avgProfit: g.count > 0 ? g.profit / g.count : 0
    }));
  });

  // 日付ゾロ目日（11日・22日）
  const dayZoromeStats = computed(() => {
    const targets = ['11', '22'];
    const groups = {};
    targets.forEach(d => { groups[d] = { day: d, count: 0, winCount: 0, profit: 0, entries: [] }; });
    drilldownEntries.value.forEach(e => {
      if (!e.date) return;
      const day = e.date.slice(-2);
      if (groups[day]) {
        groups[day].count++;
        groups[day].profit += e.profit || 0;
        if (e.profit > 0) groups[day].winCount++;
        groups[day].entries.push(e);
      }
    });
    return targets.map(d => ({
      ...groups[d],
      winRate: groups[d].count > 0 ? (groups[d].winCount / groups[d].count) * 100 : 0,
      avgProfit: groups[d].count > 0 ? groups[d].profit / groups[d].count : 0
    }));
  });

  // 月日ゾロ目（12/12除く）: 月==日 + 全桁同一（1/11,2/22）
  const MONTH_DAY_ZOROME = [
    { key: '01-01', label: '1/1' },
    { key: '01-11', label: '1/11' },
    { key: '02-02', label: '2/2' },
    { key: '02-22', label: '2/22' },
    { key: '03-03', label: '3/3' },
    { key: '04-04', label: '4/4' },
    { key: '05-05', label: '5/5' },
    { key: '06-06', label: '6/6' },
    { key: '07-07', label: '7/7' },
    { key: '08-08', label: '8/8' },
    { key: '09-09', label: '9/9' },
    { key: '10-10', label: '10/10' },
    { key: '11-11', label: '11/11' },
  ];

  const monthDayZoromeStats = computed(() => {
    const groups = {};
    MONTH_DAY_ZOROME.forEach(({ key, label }) => {
      groups[key] = { key, label, count: 0, winCount: 0, profit: 0, entries: [] };
    });
    drilldownEntries.value.forEach(e => {
      if (!e.date) return;
      const md = e.date.substring(5); // MM-DD
      if (groups[md]) {
        groups[md].count++;
        groups[md].profit += e.profit || 0;
        if (e.profit > 0) groups[md].winCount++;
        groups[md].entries.push(e);
      }
    });
    return MONTH_DAY_ZOROME.map(({ key }) => ({
      ...groups[key],
      winRate: groups[key].count > 0 ? (groups[key].winCount / groups[key].count) * 100 : 0,
      avgProfit: groups[key].count > 0 ? groups[key].profit / groups[key].count : 0
    }));
  });

  // 日付末尾と台番号末尾の一致・不一致の比較（drilldownEntries ベース）
  const slotMatchStats = computed(() => {
    const match =   { label: '一致', count: 0, winCount: 0, profit: 0, entries: [] };
    const noMatch = { label: '不一致', count: 0, winCount: 0, profit: 0, entries: [] };
    drilldownEntries.value.forEach(e => {
      if (!e.date || !e.slotNumber) return;
      const slotSuffix = String(e.slotNumber).trim().slice(-1);
      if (!slotSuffix) return;
      const group = e.date.slice(-1) === slotSuffix ? match : noMatch;
      group.count++;
      group.profit += e.profit || 0;
      if (e.profit > 0) group.winCount++;
      group.entries.push(e);
    });
    return [match, noMatch].map(g => ({
      ...g,
      winRate: g.count > 0 ? (g.winCount / g.count) * 100 : 0,
      avgProfit: g.count > 0 ? g.profit / g.count : 0
    }));
  });

  const machineTrendData = computed(() => {
    if (!selectedMachine.value) return null;

    const sorted = [...drilldownEntries.value]
      .sort((a, b) => (a.date || '').localeCompare(b.date || ''));

    if (sorted.length === 0) return null;

    let cum = 0;
    return sorted.map((e, i) => {
      cum += e.profit || 0;
      return { ...e, sessionNo: i + 1, cumulativeProfit: cum };
    });
  });

  const machineTrendStats = computed(() => {
    const entries = machineTrendData.value;
    if (!entries || entries.length === 0) return null;
    const count = entries.length;
    const winCount = entries.filter(e => e.profit > 0).length;
    const totalInv = entries.reduce((sum, e) => sum + (e.investment || 0), 0);
    const totalCol = entries.reduce((sum, e) => sum + (e.collection || 0), 0);
    return {
      winRate: (winCount / count) * 100,
      avgInvestment: Math.round(totalInv / count),
      avgCollection: Math.round(totalCol / count),
    };
  });

  const monthlyStats = computed(() => {
    const stats = _groupAndAggregate(e => e.date ? e.date.substring(0, 7) : '', drilldownEntries.value);
    return stats.filter(s => s.name).sort((a, b) => a.name.localeCompare(b.name));
  });

  const trendChartData = computed(() => {
    const buildSeries = (keys, mapProfit) => {
      const labels = [''];
      const profits = [null];
      const cumulative = [0];
      let cum = 0;
      keys.forEach(key => {
        const profit = mapProfit(key);
        cum += profit;
        labels.push(key);
        profits.push(profit);
        cumulative.push(cum);
      });
      return { labels, profits, cumulative };
    };

    const selectionSuffix = selectedStore.value !== ''
      ? `（${selectedStore.value}）`
      : selectedMachine.value
        ? `（${selectedMachine.value}）`
        : '';

    if (periodType.value === 'month' && periodValue.value) {
      const [year, month] = periodValue.value.split('-').map(Number);
      const daysInMonth = new Date(year, month, 0).getDate();
      const dailyMap = {};
      for (let d = 1; d <= daysInMonth; d++) {
        dailyMap[`${periodValue.value}-${String(d).padStart(2, '0')}`] = 0;
      }
      drilldownEntries.value.forEach(e => {
        if (e.date && dailyMap[e.date] !== undefined) dailyMap[e.date] += e.profit || 0;
      });
      const keys = Array.from({ length: daysInMonth }, (_, i) => {
        const d = i + 1;
        return { label: `${d}日`, dateKey: `${periodValue.value}-${String(d).padStart(2, '0')}` };
      });
      const labels = ['', ...keys.map(k => k.label)];
      const profits = [null, ...keys.map(k => dailyMap[k.dateKey])];
      const cumulative = [0];
      let cum = 0;
      keys.forEach(k => { cum += dailyMap[k.dateKey]; cumulative.push(cum); });
      return { labels, profits, cumulative, title: `日別収支推移（${periodValue.value}）${selectionSuffix}` };
    }

    if (periodType.value === 'year' && periodValue.value) {
      const year = periodValue.value.substring(0, 4);
      const monthlyMap = {};
      for (let m = 1; m <= 12; m++) monthlyMap[String(m).padStart(2, '0')] = 0;
      drilldownEntries.value.forEach(e => {
        if (e.date) {
          const m = e.date.substring(5, 7);
          if (monthlyMap[m] !== undefined) monthlyMap[m] += e.profit || 0;
        }
      });
      const monthKeys = Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, '0'));
      const result = buildSeries(monthKeys, m => monthlyMap[m]);
      result.labels = result.labels.map((l, i) => i === 0 ? '' : `${parseInt(l)}月`);
      result.title = `月別収支推移（${year}年）${selectionSuffix}`;
      return result;
    }

    // 全期間: yearly
    const yearSet = new Set();
    drilldownEntries.value.forEach(e => { if (e.date) yearSet.add(e.date.substring(0, 4)); });
    const years = Array.from(yearSet).sort();
    if (years.length === 0) return null;
    const yearlyMap = {};
    years.forEach(y => yearlyMap[y] = 0);
    drilldownEntries.value.forEach(e => {
      if (e.date) {
        const y = e.date.substring(0, 4);
        if (yearlyMap[y] !== undefined) yearlyMap[y] += e.profit || 0;
      }
    });
    const result = buildSeries(years, y => yearlyMap[y]);
    result.labels = result.labels.map((l, i) => i === 0 ? '' : `${l}年`);
    result.title = `年別収支推移（全期間）${selectionSuffix}`;
    return result;
  });

  const setSelectedStore = (name) => {
    selectedStore.value = selectedStore.value === name ? null : name;
  };
  const setSelectedMachine = (name) => {
    selectedMachine.value = selectedMachine.value === name ? null : name;
  };

  return {
    periodType,
    periodValue,
    selectedStore,
    selectedMachine,
    filteredEntries,
    drilldownEntries,
    availableStores,
    availableMachines,
    summaryStats,
    storeStats,
    machineStats,
    machineStatsAll,
    weekdayStats,
    machineTrendData,
    machineTrendStats,
    monthlyStats,
    trendChartData,
    dateSuffixStats,
    slotMatchStats,
    dayZoromeStats,
    monthDayZoromeStats,
    setSelectedStore,
    setSelectedMachine
  };
};
