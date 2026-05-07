<template>
  <div class="analytics-card card mb-4">
    <div class="section-header">
      <h3>機種別集計</h3>
      <button v-if="selectedMachine" class="clear-btn" @click="setSelectedMachine(selectedMachine)">
        {{ selectedMachine }} ✕
      </button>
    </div>
    <div class="table-container">
      <table class="data-table">
        <thead>
          <tr>
            <th>機種名</th>
            <th class="text-right">回数</th>
            <th class="text-right">勝率</th>
            <th class="text-right">収支</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="stat in machineStats"
            :key="stat.name"
            class="clickable-row"
            :class="{ 'row-selected': selectedMachine === stat.name }"
            @click="setSelectedMachine(stat.name)"
          >
            <td>{{ stat.name }}</td>
            <td class="text-right">{{ stat.count }}</td>
            <td class="text-right">{{ stat.winRate.toFixed(1) }}%</td>
            <td class="text-right font-weight-bold" :class="getProfitClass(stat.profit)">
              {{ formatCurrency(stat.profit) }}
            </td>
          </tr>
          <tr v-if="machineStats.length === 0">
            <td colspan="4" class="text-center text-muted">データがありません</td>
          </tr>
        </tbody>
      </table>
    </div>

    <Transition name="trend">
      <div v-if="selectedMachine && machineTrendData" class="trend-chart-area">
        <div class="trend-chart-title">{{ selectedMachine }} の収支推移</div>
        <div v-if="machineTrendStats" class="trend-stats">
          <span class="stat-item">勝率 <strong>{{ machineTrendStats.winRate.toFixed(1) }}%</strong></span>
          <span class="stat-item">平均投資 <strong>{{ machineTrendStats.avgInvestment.toLocaleString() }}円</strong></span>
          <span class="stat-item">平均回収 <strong>{{ machineTrendStats.avgCollection.toLocaleString() }}円</strong></span>
        </div>
        <div class="chart-wrapper">
          <VueChart type="bar" :data="chartData" :options="chartOptions" />
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { Chart as VueChart } from 'vue-chartjs';
import {
  Chart as ChartJS,
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
import { useAnalytics } from '@/composables/useAnalytics';
import { formatCurrency } from '@/utils/formatters';

ChartJS.register(CategoryScale, LinearScale, BarElement, BarController, LineElement, LineController, PointElement, Tooltip, Legend);

const { machineStats, selectedMachine, setSelectedMachine, machineTrendData, machineTrendStats } = useAnalytics();

const getProfitClass = (val) => {
  if (val > 0) return 'text-success';
  if (val < 0) return 'text-danger';
  return '';
};

const chartData = computed(() => {
  const entries = machineTrendData.value;
  if (!entries || entries.length === 0) return { labels: [], datasets: [] };

  const labels = ['', ...entries.map(e => `第${e.sessionNo}回`)];
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

const chartOptions = computed(() => {
  const entries = machineTrendData.value || [];
  return {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: 'index', intersect: false },
    plugins: {
      legend: {
        labels: { color: '#ccc', font: { size: 12 } }
      },
      tooltip: {
        callbacks: {
          title: (items) => {
            const idx = items[0]?.dataIndex;
            if (!idx || idx < 1) return '';
            const e = entries[idx - 1];
            return e ? `${e.date}（第${e.sessionNo}回）` : '';
          },
          label: (ctx) => {
            const val = ctx.parsed.y;
            if (val === null) return null;
            return `${ctx.dataset.label}: ${val >= 0 ? '+' : ''}${val.toLocaleString()}円`;
          }
        }
      }
    },
    scales: {
      x: {
        ticks: { color: '#aaa', font: { size: 11 } },
        grid: { color: 'rgba(255,255,255,0.05)' }
      },
      yLeft: {
        type: 'linear',
        position: 'left',
        ticks: {
          color: '#aaa',
          font: { size: 11 },
          callback: v => `${v / 1000}k`
        },
        grid: { color: 'rgba(255,255,255,0.05)' }
      },
      yRight: {
        type: 'linear',
        position: 'right',
        ticks: {
          color: '#00d4ff',
          font: { size: 11 },
          callback: v => `${v / 1000}k`
        },
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
.clickable-row {
  cursor: pointer;
  transition: background 0.15s;
}
.clickable-row:hover {
  background: var(--surface-hover);
}
.row-selected {
  background: rgba(0, 212, 255, 0.1) !important;
  border-left: 3px solid #00d4ff;
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
.chart-wrapper {
  position: relative;
  width: 100%;
  height: 260px;
  overflow: hidden;
}
@media (max-width: 600px) {
  .chart-wrapper {
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
