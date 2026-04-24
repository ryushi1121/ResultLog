import { ref, computed } from 'vue';
import { useEntries } from './useEntries';

// Shared state so it persists across components
const periodType = ref('all');
const periodValue = ref(null);

export const useAnalytics = () => {
  const { entries } = useEntries();

  // Filtered entries based on period
  const filteredEntries = computed(() => {
    if (periodType.value === 'all') return entries.value;
    
    return entries.value.filter(entry => {
      if (periodType.value === 'month') {
        return entry.date && entry.date.startsWith(periodValue.value); // YYYY-MM
      }
      if (periodType.value === 'year') {
        return entry.date && entry.date.startsWith(periodValue.value); // YYYY
      }
      return true;
    });
  });

  const summaryStats = computed(() => {
    let totalInvestment = 0;
    let totalCollection = 0;
    let totalProfit = 0;
    let winCount = 0;
    let maxWin = 0;
    let maxLoss = 0;

    filteredEntries.value.forEach(e => {
      totalInvestment += e.investment || 0;
      totalCollection += e.collection || 0;
      totalProfit += e.profit || 0;
      if (e.profit > 0) winCount++;
      if (e.profit > maxWin) maxWin = e.profit;
      if (e.profit < maxLoss) maxLoss = e.profit;
    });

    const count = filteredEntries.value.length;
    const winRate = count > 0 ? (winCount / count) * 100 : 0;

    return {
      count,
      totalInvestment,
      totalCollection,
      totalProfit,
      winRate,
      maxWin,
      maxLoss
    };
  });

  const _groupAndAggregate = (keySelector) => {
    const groups = {};
    filteredEntries.value.forEach(e => {
      const key = keySelector(e);
      if (!key) return;
      if (!groups[key]) {
        groups[key] = {
          name: key,
          investment: 0,
          collection: 0,
          profit: 0,
          count: 0,
          winCount: 0
        };
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

  const storeStats = computed(() => _groupAndAggregate(e => e.store));
  const machineStats = computed(() => _groupAndAggregate(e => e.machine));
  const weekdayStats = computed(() => {
    const stats = _groupAndAggregate(e => e.dayOfWeek);
    // Sort by day of week order
    const weekOrder = { '月': 1, '火': 2, '水': 3, '木': 4, '金': 5, '土': 6, '日': 7 };
    return stats.sort((a, b) => (weekOrder[a.name] || 99) - (weekOrder[b.name] || 99));
  });

  const monthlyStats = computed(() => {
    const stats = _groupAndAggregate(e => e.date ? e.date.substring(0, 7) : '');
    return stats.filter(s => s.name).sort((a, b) => a.name.localeCompare(b.name));
  });

  return {
    periodType,
    periodValue,
    filteredEntries,
    summaryStats,
    storeStats,
    machineStats,
    weekdayStats,
    monthlyStats
  };
};
