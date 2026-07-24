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
          :class="[
            s.label === '一致' ? 'match-card--match' : 'match-card--nomatch',
            { 'match-card--selected': isSelectedMatch(s.label), 'match-card--clickable': s.count > 0 }
          ]"
          @click="toggleMatch(s)"
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

    <AnalyticsBreakdownPanel
      v-if="selectedData"
      :title="selectedData.title"
      :entries="selectedData.entries"
      @close="selected = null"
    />
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
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
import Annotation from 'chartjs-plugin-annotation';
import { useAnalytics } from '@/composables/useAnalytics';
import { useTheme } from '@/composables/useTheme';
import { zeroLineAnnotationSingle } from '@/utils/chartUtils';
import AnalyticsBreakdownPanel from './AnalyticsBreakdownPanel.vue';

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend, Annotation);

const { dateSuffixStats, slotMatchStats } = useAnalytics();
const { theme } = useTheme();

// ---- タップ内訳（末尾グラフ・一致不一致カードで1つだけ開く） ----
const selected = ref(null); // { type: 'suffix'|'match', key: string }

const selectedData = computed(() => {
  if (!selected.value) return null;
  if (selected.value.type === 'suffix') {
    const s = dateSuffixStats.value.find(x => x.suffix === selected.value.key);
    return s ? { title: `末尾${s.suffix}`, entries: s.entries } : null;
  }
  const s = slotMatchStats.value.find(x => x.label === selected.value.key);
  return s ? { title: s.label, entries: s.entries } : null;
});

const isSelectedSuffix = (suffix) => selected.value?.type === 'suffix' && selected.value.key === suffix;
const isSelectedMatch = (label) => selected.value?.type === 'match' && selected.value.key === label;

const toggleSuffix = (s) => {
  if (!s || s.count === 0) return;
  selected.value = isSelectedSuffix(s.suffix) ? null : { type: 'suffix', key: s.suffix };
};
const toggleMatch = (s) => {
  if (!s || s.count === 0) return;
  selected.value = isSelectedMatch(s.label) ? null : { type: 'match', key: s.label };
};

const cc = computed(() => {
  const isLight = theme.value === 'light';
  return {
    textSub: isLight ? '#657b83' : '#839496',
    grid:    isLight ? 'rgba(101,123,131,0.12)' : 'rgba(255,255,255,0.05)'
  };
});

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
      borderWidth: dateSuffixStats.value.map(s => isSelectedSuffix(s.suffix) ? 3 : 1)
    }
  ]
}));

const chartOptions = computed(() => ({
  responsive: true,
  maintainAspectRatio: false,
  interaction: { mode: 'index', intersect: false },
  onClick: (_event, elements) => {
    if (elements.length === 0) return;
    toggleSuffix(dateSuffixStats.value[elements[0].index]);
  },
  plugins: {
    legend: { labels: { color: cc.value.textSub, font: { size: 12 } } },
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
    },
    ...zeroLineAnnotationSingle
  },
  scales: {
    x: {
      ticks: { color: cc.value.textSub, font: { size: 11 } },
      grid: { color: cc.value.grid }
    },
    y: {
      ticks: {
        color: cc.value.textSub,
        font: { size: 11 },
        callback: v => `${Math.round(v / 1000)}k`
      },
      grid: { color: cc.value.grid }
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
  width: 100%;
  height: 240px;
  overflow: hidden;
  margin-bottom: 20px;
}
.match-section {
  border-top: 1px solid var(--border-subtle);
  padding-top: 16px;
}
.match-label {
  font-size: 0.85rem;
  color: var(--text-sub);
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
  background: var(--overlay-1);
  border: 1px solid var(--border-subtle);
}
.match-card--match {
  border-color: rgba(var(--accent-primary-rgb), 0.3);
}
.match-card--clickable {
  cursor: pointer;
  transition: background 0.15s;
}
.match-card--clickable:hover {
  background: var(--surface-hover);
}
.match-card--selected {
  outline: 2px solid var(--accent-primary);
  outline-offset: -2px;
}
.match-card-title {
  font-size: 0.9rem;
  font-weight: 600;
  margin-bottom: 4px;
  color: var(--text-main);
}
.match-card-count {
  font-size: 1.3rem;
  font-weight: 700;
  margin-bottom: 10px;
  color: var(--text-main);
}
.match-card-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 5px;
  font-size: 0.85rem;
}
.mc-label { color: var(--text-faded); }
.mc-value { font-weight: 600; }
.no-slot-note {
  font-size: 0.85rem;
  color: var(--text-faded);
  padding: 8px 0;
}
@media (max-width: 600px) {
  .chart-wrapper { height: 200px; }
}
</style>
