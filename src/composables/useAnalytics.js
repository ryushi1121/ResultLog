import { ref, computed } from 'vue';
import { useEntries } from './useEntries';

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
        return entry.date && entry.date.startsWith(periodValue.value);
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
    let winCount = 0;
    let maxWin = 0;
    let maxLoss = 0;

    drilldownEntries.value.forEach(e => {
      totalInvestment += e.investment || 0;
      totalCollection += e.collection || 0;
      totalProfit += e.profit || 0;
      if (e.profit > 0) winCount++;
      if (e.profit > maxWin) maxWin = e.profit;
      if (e.profit < maxLoss) maxLoss = e.profit;
    });

    const count = drilldownEntries.value.length;
    const winRate = count > 0 ? (winCount / count) * 100 : 0;

    return { count, totalInvestment, totalCollection, totalProfit, winRate, maxWin, maxLoss };
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

  // Store stats（StoreChart 用・全店舗比較なのでストア選択は非適用）
  const storeStats = computed(() => _groupAndAggregate(e => e.store, filteredEntries.value));

  // 機種集計は drilldownEntries ベース（選択店舗でフィルタ済み）
  const machineStats = computed(() => _groupAndAggregate(e => e.machine, drilldownEntries.value));

  const weekdayStats = computed(() => {
    const stats = _groupAndAggregate(e => e.dayOfWeek, drilldownEntries.value);
    const weekOrder = { '月': 1, '火': 2, '水': 3, '木': 4, '金': 5, '土': 6, '日': 7 };
    return stats.sort((a, b) => (weekOrder[a.name] || 99) - (weekOrder[b.name] || 99));
  });

  // 日付末尾（0〜9）ごとの集計（drilldownEntries ベース）
  const dateSuffixStats = computed(() => {
    const groups = {};
    for (let i = 0; i <= 9; i++) {
      groups[String(i)] = { suffix: String(i), count: 0, winCount: 0, profit: 0 };
    }
    drilldownEntries.value.forEach(e => {
      if (!e.date) return;
      const suffix = e.date.slice(-1);
      if (groups[suffix]) {
        groups[suffix].count++;
        groups[suffix].profit += e.profit || 0;
        if (e.profit > 0) groups[suffix].winCount++;
      }
    });
    return Object.values(groups).map(g => ({
      ...g,
      winRate: g.count > 0 ? (g.winCount / g.count) * 100 : 0,
      avgProfit: g.count > 0 ? g.profit / g.count : 0
    }));
  });

  // 日付末尾と台番号末尾の一致・不一致の比較（drilldownEntries ベース）
  const slotMatchStats = computed(() => {
    const match =   { label: '一致', count: 0, winCount: 0, profit: 0 };
    const noMatch = { label: '不一致', count: 0, winCount: 0, profit: 0 };
    drilldownEntries.value.forEach(e => {
      if (!e.date || !e.slotNumber) return;
      const slotSuffix = String(e.slotNumber).trim().slice(-1);
      if (!slotSuffix) return;
      const group = e.date.slice(-1) === slotSuffix ? match : noMatch;
      group.count++;
      group.profit += e.profit || 0;
      if (e.profit > 0) group.winCount++;
    });
    return [match, noMatch].map(g => ({
      ...g,
      winRate: g.count > 0 ? (g.winCount / g.count) * 100 : 0,
      avgProfit: g.count > 0 ? g.profit / g.count : 0
    }));
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
      const year = periodValue.value;
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
    summaryStats,
    storeStats,
    machineStats,
    weekdayStats,
    monthlyStats,
    trendChartData,
    dateSuffixStats,
    slotMatchStats,
    setSelectedStore,
    setSelectedMachine
  };
};
