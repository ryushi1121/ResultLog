<template>
  <div class="chart-container card mb-4">
    <div class="section-header">
      <h3>機種別 稼働割合<span v-if="showOthers" class="others-badge">その他</span></h3>
      <div class="header-actions">
        <button v-if="showOthers" class="clear-btn" @click="showOthers = false">← 戻る</button>
        <template v-if="selectedMachine">
          <span v-if="machineTrendStats" class="win-rate-chip">
            勝率 {{ machineTrendStats.winRate.toFixed(1) }}%
          </span>
          <button class="clear-btn" @click="setSelectedMachine(selectedMachine)">
            {{ selectedMachine }} ✕
          </button>
        </template>
      </div>
    </div>
    <div class="chart-wrapper">
      <Doughnut v-if="sortedData.length > 0" :data="chartData" :options="chartOptions" />
      <div v-else class="empty-state text-muted text-center py-4">データがありません</div>
    </div>

    <Transition name="trend">
      <div v-if="selectedMachine && machineTrendData" class="trend-chart-area">
        <div class="trend-chart-title">{{ selectedMachine }} の収支推移</div>
        <div v-if="machineTrendStats" class="trend-stats">
          <span class="stat-item">勝率 <strong>{{ machineTrendStats.winRate.toFixed(1) }}%</strong></span>
          <span class="stat-item">平均投資 <strong>{{ machineTrendStats.avgInvestment.toLocaleString() }}円</strong></span>
          <span class="stat-item">平均回収 <strong>{{ machineTrendStats.avgCollection.toLocaleString() }}円</strong></span>
        </div>
        <div class="trend-chart-wrapper">
          <VueChart type="bar" :data="trendData" :options="trendOptions" />
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue';
import { Doughnut } from 'vue-chartjs';
import { Chart as VueChart } from 'vue-chartjs';
import {
  Chart as ChartJS,
  ArcElement,
  CategoryScale,
  LinearScale,
  BarElement,
  BarController,
  LineElement,
  LineController,
  PointElement,
  Tooltip,
  Legend
} from 'chart.js';
import Annotation from 'chartjs-plugin-annotation';
import { useAnalytics } from '@/composables/useAnalytics';
import { useTheme } from '@/composables/useTheme';
import { computeSyncedBounds, zeroLineAnnotation } from '@/utils/chartUtils';

ChartJS.register(ArcElement, CategoryScale, LinearScale, BarElement, BarController, LineElement, LineController, PointElement, Tooltip, Legend, Annotation);

const { machineStatsAll, selectedMachine, setSelectedMachine, machineTrendData, machineTrendStats } = useAnalytics();
const { theme } = useTheme();

const COLORS = ['#00d4ff', '#7c3aed', '#22c55e', '#f59e0b', '#ec4899', '#64748b', '#f97316', '#a855f7', '#14b8a6', '#fb7185'];

const showOthers = ref(false);

// テーマに応じたチャート用カラー
const cc = computed(() => {
  const isLight = theme.value === 'light';
  return {
    text:    isLight ? '#586e75' : '#93a1a1',
    textSub: isLight ? '#657b83' : '#839496',
    grid:    isLight ? 'rgba(101,123,131,0.12)' : 'rgba(255,255,255,0.05)'
  };
});

const sortedData = computed(() => {
  const sorted = [...machineStatsAll.value].sort((a, b) => b.count - a.count);
  if (showOthers.value) {
    return sorted.slice(5);
  }
  const top = sorted.slice(0, 5);
  if (sorted.length > 5) {
    const othersCount = sorted.slice(5).reduce((sum, s) => sum + s.count, 0);
    top.push({ name: 'その他', count: othersCount });
  }
  return top;
});

const chartData = computed(() => ({
  labels: sortedData.value.map(s => s.name.length > 10 ? s.name.substring(0, 10) + '...' : s.name),
  datasets: [
    {
      data: sortedData.value.map(s => s.count),
      backgroundColor: COLORS.slice(0, sortedData.value.length),
      borderWidth: 0,
      hoverOffset: 4
    }
  ]
}));

const chartOptions = computed(() => ({
  responsive: true,
  maintainAspectRatio: false,
  onClick: (_event, elements) => {
    if (elements.length === 0) return;
    const name = sortedData.value[elements[0].index]?.name;
    if (!name) return;
    if (name === 'その他') { showOthers.value = true; }
    else { setSelectedMachine(name); }
  },
  plugins: {
    tooltip: {
      callbacks: {
        label: (ctx) => {
          const stat = sortedData.value[ctx.dataIndex];
          if (!stat || stat.winRate === undefined) return ` ${ctx.parsed}回`;
          return ` ${stat.count}回（勝率 ${stat.winRate.toFixed(1)}%）`;
        }
      }
    },
    legend: {
      position: 'right',
      labels: { color: cc.value.text },
      onClick: (_e, legendItem) => {
        const name = sortedData.value[legendItem.index]?.name;
        if (!name) return;
        if (name === 'その他') { showOthers.value = true; }
        else { setSelectedMachine(name); }
      }
    }
  }
}));

// 収支推移グラフ用データ
const trendData = computed(() => {
  const entries = machineTrendData.value;
  if (!entries || entries.length === 0) return { labels: [], datasets: [] };

  const labels = ['', ...entries.map(e => e.date.slice(5).replace('-', '/'))];
  const profits = [null, ...entries.map(e => e.profit || 0)];
  const cumulative = [0, ...entries.map(e => e.cumulativeProfit)];

  return {
    labels,
    datasets: [
      {
        type: 'bar',
        label: '収支',
        data: profits,
        backgroundColor: profits.map(v =>
          v === null ? 'transparent' : v >= 0 ? 'rgba(34,197,94,0.7)' : 'rgba(239,68,68,0.7)'
        ),
        borderColor: profits.map(v =>
          v === null ? 'transparent' : v >= 0 ? '#22c55e' : '#ef4444'
        ),
        borderWidth: 1,
        yAxisID: 'yLeft'
      },
      {
        type: 'line',
        label: '累積収支',
        data: cumulative,
        borderColor: '#00d4ff',
        backgroundColor: 'rgba(0,212,255,0.1)',
        borderWidth: 2,
        pointRadius: 2,
        tension: 0.3,
        yAxisID: 'yRight'
      }
    ]
  };
});

const trendOptions = computed(() => {
  const entries = machineTrendData.value || [];
  const profits = entries.map(e => e.profit || 0);
  const cumulative = entries.map(e => e.cumulativeProfit);
  const bounds = computeSyncedBounds(profits, cumulative);

  return {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: 'index', intersect: false },
    plugins: {
      legend: { labels: { color: cc.value.textSub, font: { size: 12 } } },
      tooltip: {
        callbacks: {
          title: (items) => {
            const idx = items[0]?.dataIndex;
            if (!idx || idx < 1) return '';
            const e = entries[idx - 1];
            return e ? e.date : '';
          },
          label: (ctx) => {
            const val = ctx.parsed.y;
            if (val === null) return null;
            return `${ctx.dataset.label}: ${val >= 0 ? '+' : ''}${val.toLocaleString()}円`;
          }
        }
      },
      ...zeroLineAnnotation
    },
    scales: {
      x: {
        ticks: { color: cc.value.textSub, font: { size: 11 } },
        grid: { color: cc.value.grid }
      },
      yLeft: {
        type: 'linear',
        position: 'left',
        min: bounds?.left.min,
        max: bounds?.left.max,
        ticks: { color: cc.value.textSub, font: { size: 11 }, callback: v => `${Math.round(v / 1000)}k` },
        grid: { color: cc.value.grid }
      },
      yRight: {
        type: 'linear',
        position: 'right',
        min: bounds?.right.min,
        max: bounds?.right.max,
        ticks: { color: '#00d4ff', font: { size: 11 }, callback: v => `${Math.round(v / 1000)}k` },
        grid: { drawOnChartArea: false }
      }
    }
  };
});
</script>

<style scoped>
.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}
.section-header h3 {
  margin: 0;
  display: flex;
  align-items: center;
  gap: 8px;
}
.others-badge {
  font-size: 0.72rem;
  font-weight: 500;
  background: rgba(0, 212, 255, 0.12);
  color: #00d4ff;
  border: 1px solid rgba(0, 212, 255, 0.3);
  border-radius: 99px;
  padding: 1px 8px;
}
.header-actions {
  display: flex;
  gap: 6px;
}
.clear-btn {
  font-size: 0.8rem;
  padding: 3px 10px;
  border-radius: 12px;
  border: 1px solid rgba(0, 212, 255, 0.5);
  background: rgba(0, 212, 255, 0.1);
  color: #00d4ff;
  cursor: pointer;
  white-space: nowrap;
}
.clear-btn:hover {
  background: rgba(0, 212, 255, 0.2);
}
.win-rate-chip {
  font-size: 0.8rem;
  padding: 3px 10px;
  border-radius: 12px;
  background: rgba(34, 197, 94, 0.12);
  color: #22c55e;
  border: 1px solid rgba(34, 197, 94, 0.3);
  white-space: nowrap;
}
.chart-wrapper {
  position: relative;
  width: 100%;
  height: 300px;
  overflow: hidden;
  margin-top: 10px;
}
.trend-chart-area {
  margin-top: 16px;
  border-top: 1px solid var(--border-subtle);
  padding-top: 12px;
}
.trend-chart-title {
  font-size: 0.9rem;
  color: var(--text-sub);
  margin-bottom: 8px;
}
.trend-stats {
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
  margin-bottom: 10px;
}
.stat-item {
  font-size: 0.8rem;
  color: var(--text-sub);
}
.stat-item strong {
  color: var(--text-main);
  margin-left: 4px;
}
.trend-chart-wrapper {
  position: relative;
  width: 100%;
  height: 260px;
  overflow: hidden;
}
@media (max-width: 600px) {
  .trend-chart-wrapper {
    height: 200px;
  }
}
.trend-enter-active {
  transition: opacity 0.3s ease, transform 0.3s ease;
}
.trend-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}
.trend-enter-from,
.trend-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}
</style>
