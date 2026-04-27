<template>
  <div class="analytics-card card mb-4">
    <h3>日付末尾別収支</h3>

    <!-- 日付末尾（0〜9）グラフ -->
    <div class="chart-wrapper">
      <Bar :data="chartData" :options="chartOptions" />
    </div>

    <!-- 一致・不一致 比較 -->
    <div class="match-section">
      <p class="match-label">日付末尾と台番号末尾の一致</p>
      <div class="match-cards">
        <div
          v-for="s in slotMatchStats"
          :key="s.label"
          class="match-card"
          :class="s.label === '一致' ? 'match-card--match' : 'match-card--nomatch'"
        >
          <div class="match-card-title">{{ s.label }}</div>
          <div class="match-card-count">{{ s.count }}回</div>
          <div class="match-card-row">
            <span class="mc-label">勝率</span>
            <span class="mc-value" :class="rateClass(s.winRate)">{{ s.count > 0 ? s.winRate.toFixed(1) : '—' }}{{ s.count > 0 ? '%' : '' }}</span>
          </div>
          <div class="match-card-row">
            <span class="mc-label">平均収支</span>
            <span class="mc-value" :class="profitClass(s.avgProfit)">{{ s.count > 0 ? formatAvg(s.avgProfit) : '—' }}</span>
          </div>
        </div>
        <div v-if="slotMatchStats[0].count + slotMatchStats[1].count === 0" class="no-slot-note">
          台番号が登録されているデータがありません
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { Bar } from 'vue-chartjs';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Tooltip,
  Legend
} from 'chart.js';
import { useAnalytics } from '@/composables/useAnalytics';

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

const { dateSuffixStats, slotMatchStats } = useAnalytics();

const chartData = computed(() => ({
  labels: dateSuffixStats.value.map(s => `末尾${s.suffix}`),
  datasets: [
    {
      label: '平均収支',
      data: dateSuffixStats.value.map(s => s.count > 0 ? Math.round(s.avgProfit) : 0),
      backgroundColor: dateSuffixStats.value.map(s =>
        s.avgProfit >= 0 ? 'rgba(34,197,94,0.7)' : 'rgba(239,68,68,0.7)'
      ),
      borderColor: dateSuffixStats.value.map(s =>
        s.avgProfit >= 0 ? '#22c55e' : '#ef4444'
      ),
      borderWidth: 1
    }
  ]
}));

const chartOptions = computed(() => ({
  responsive: true,
  maintainAspectRatio: false,
  interaction: { mode: 'index', intersect: false },
  plugins: {
    legend: { labels: { color: '#ccc', font: { size: 12 } } },
    tooltip: {
      callbacks: {
        label: (ctx) => {
          const val = ctx.parsed.y;
          return `平均収支: ${val >= 0 ? '+' : ''}${val.toLocaleString()}円`;
        },
        afterBody: (items) => {
          const idx = items[0]?.dataIndex;
          if (idx === undefined) return [];
          const s = dateSuffixStats.value[idx];
          return s ? [`回数: ${s.count}回`] : [];
        }
      }
    }
  },
  scales: {
    x: {
      ticks: { color: '#aaa', font: { size: 11 } },
      grid: { color: 'rgba(255,255,255,0.05)' }
    },
    y: {
      ticks: {
        color: '#aaa',
        font: { size: 11 },
        callback: v => `${v.toLocaleString()}円`
      },
      grid: { color: 'rgba(255,255,255,0.05)' }
    }
  }
}));

const formatAvg = (val) => {
  const abs = Math.round(Math.abs(val)).toLocaleString();
  return val >= 0 ? `+${abs}円` : `-${abs}円`;
};
const profitClass = (val) => val > 0 ? 'text-success' : val < 0 ? 'text-danger' : '';
const rateClass = (val) => val >= 50 ? 'text-success' : 'text-danger';
</script>

<style scoped>
.chart-wrapper {
  position: relative;
  height: 240px;
  margin-bottom: 20px;
}
.match-section {
  border-top: 1px solid rgba(255,255,255,0.07);
  padding-top: 16px;
}
.match-label {
  font-size: 0.85rem;
  color: #aaa;
  margin-bottom: 12px;
}
.match-cards {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}
.match-card {
  flex: 1;
  min-width: 140px;
  padding: 14px 16px;
  border-radius: 10px;
  background: rgba(255,255,255,0.04);
  border: 1px solid rgba(255,255,255,0.08);
}
.match-card--match {
  border-color: rgba(0,212,255,0.3);
}
.match-card-title {
  font-size: 0.9rem;
  font-weight: 600;
  margin-bottom: 4px;
  color: #ccc;
}
.match-card-count {
  font-size: 1.3rem;
  font-weight: 700;
  margin-bottom: 10px;
  color: #fff;
}
.match-card-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 5px;
  font-size: 0.85rem;
}
.mc-label { color: #888; }
.mc-value { font-weight: 600; }
.no-slot-note {
  font-size: 0.85rem;
  color: #666;
  padding: 8px 0;
}
@media (max-width: 600px) {
  .chart-wrapper { height: 200px; }
}
</style>
