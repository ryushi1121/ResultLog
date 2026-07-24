<template>
  <div class="analytics-card card mb-4">

    <!-- 日付ゾロ目日 -->
    <h3>日付ゾロ目日（11日・22日）</h3>
    <div class="zorome-day-cards">
      <div
        v-for="s in dayZoromeStats"
        :key="s.day"
        class="zorome-day-card"
        :class="{ 'zorome-day-card--selected': selectedDay === s.day, 'zorome-day-card--clickable': s.count > 0 }"
        @click="toggleDay(s)"
      >
        <div class="zd-title">{{ s.day }}日</div>
        <div class="zd-count">{{ s.count }}回</div>
        <div class="zd-row">
          <span class="zd-label">勝率</span>
          <span class="zd-value" :class="rateClass(s.winRate)">
            {{ s.count > 0 ? s.winRate.toFixed(1) + '%' : '—' }}
          </span>
        </div>
        <div class="zd-row">
          <span class="zd-label">平均収支</span>
          <span class="zd-value" :class="profitClass(s.avgProfit)">
            {{ s.count > 0 ? formatAvg(s.avgProfit) : '—' }}
          </span>
        </div>
      </div>
    </div>

    <AnalyticsBreakdownPanel
      v-if="selectedDayData"
      :title="`${selectedDayData.day}日`"
      :entries="selectedDayData.entries"
      @close="selectedDay = null"
    />

    <!-- 月日ゾロ目 -->
    <h3 class="section-title-mt">月日ゾロ目</h3>

    <!-- 全体サマリー -->
    <div class="zorome-summary">
      <div class="zs-item">
        <span class="zs-label">対象回数</span>
        <span class="zs-value">{{ monthDayTotal.count }}回</span>
      </div>
      <div class="zs-item">
        <span class="zs-label">勝率</span>
        <span class="zs-value" :class="rateClass(monthDayTotal.winRate)">
          {{ monthDayTotal.count > 0 ? monthDayTotal.winRate.toFixed(1) + '%' : '—' }}
        </span>
      </div>
      <div class="zs-item">
        <span class="zs-label">平均収支</span>
        <span class="zs-value" :class="profitClass(monthDayTotal.avgProfit)">
          {{ monthDayTotal.count > 0 ? formatAvg(monthDayTotal.avgProfit) : '—' }}
        </span>
      </div>
    </div>

    <!-- 棒グラフ（横スクロール対応） -->
    <div class="chart-scroll-wrapper">
      <div class="chart-inner">
        <Bar :data="chartData" :options="chartOptions" />
      </div>
    </div>

    <AnalyticsBreakdownPanel
      v-if="selectedMonthDayData"
      :title="selectedMonthDayData.label"
      :entries="selectedMonthDayData.entries"
      @close="selectedMonthDay = null"
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
  Tooltip,
  Legend
} from 'chart.js';
import Annotation from 'chartjs-plugin-annotation';
import { useAnalytics } from '@/composables/useAnalytics';
import { useTheme } from '@/composables/useTheme';
import { zeroLineAnnotationSingle } from '@/utils/chartUtils';
import AnalyticsBreakdownPanel from './AnalyticsBreakdownPanel.vue';

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend, Annotation);

const { dayZoromeStats, monthDayZoromeStats } = useAnalytics();
const { theme } = useTheme();

// ---- タップ内訳 ----
const selectedDay = ref(null); // '11' | '22' | null
const selectedDayData = computed(() => {
  if (!selectedDay.value) return null;
  return dayZoromeStats.value.find(s => s.day === selectedDay.value) || null;
});
const toggleDay = (s) => {
  if (!s || s.count === 0) return;
  selectedDay.value = selectedDay.value === s.day ? null : s.day;
};

const selectedMonthDay = ref(null); // key | null
const selectedMonthDayData = computed(() => {
  if (!selectedMonthDay.value) return null;
  return monthDayZoromeStats.value.find(s => s.key === selectedMonthDay.value) || null;
});
const toggleMonthDay = (s) => {
  if (!s || s.count === 0) return;
  selectedMonthDay.value = selectedMonthDay.value === s.key ? null : s.key;
};

const cc = computed(() => {
  const isLight = theme.value === 'light';
  return {
    textSub: isLight ? '#657b83' : '#839496',
    grid:    isLight ? 'rgba(101,123,131,0.12)' : 'rgba(255,255,255,0.05)'
  };
});

const monthDayTotal = computed(() => {
  let count = 0, winCount = 0, profit = 0;
  monthDayZoromeStats.value.forEach(s => {
    count += s.count;
    winCount += s.winCount;
    profit += s.profit;
  });
  return {
    count,
    winRate: count > 0 ? (winCount / count) * 100 : 0,
    avgProfit: count > 0 ? profit / count : 0
  };
});

const chartData = computed(() => ({
  labels: monthDayZoromeStats.value.map(s => s.label),
  datasets: [
    {
      label: '平均収支',
      data: monthDayZoromeStats.value.map(s => s.count > 0 ? Math.round(s.avgProfit) : null),
      backgroundColor: monthDayZoromeStats.value.map(s =>
        s.avgProfit >= 0 ? 'rgba(34,197,94,0.7)' : 'rgba(239,68,68,0.7)'
      ),
      borderColor: monthDayZoromeStats.value.map(s =>
        s.avgProfit >= 0 ? '#22c55e' : '#ef4444'
      ),
      borderWidth: monthDayZoromeStats.value.map(s => selectedMonthDay.value === s.key ? 3 : 1)
    }
  ]
}));

const chartOptions = computed(() => ({
  responsive: true,
  maintainAspectRatio: false,
  interaction: { mode: 'index', intersect: false },
  onClick: (_event, elements) => {
    if (elements.length === 0) return;
    toggleMonthDay(monthDayZoromeStats.value[elements[0].index]);
  },
  plugins: {
    legend: { display: false },
    tooltip: {
      callbacks: {
        label: (ctx) => {
          if (ctx.raw === null) return 'データなし';
          const val = ctx.parsed.y;
          return `平均収支: ${val >= 0 ? '+' : ''}${val.toLocaleString()}円`;
        },
        afterBody: (items) => {
          const idx = items[0]?.dataIndex;
          if (idx === undefined) return [];
          const s = monthDayZoromeStats.value[idx];
          if (!s || s.count === 0) return [];
          return [
            `回数: ${s.count}回`,
            `勝率: ${s.winRate.toFixed(1)}%`
          ];
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
h3 {
  font-size: 1rem;
  font-weight: 600;
  color: var(--text-main);
  margin: 0 0 14px;
}
.section-title-mt {
  margin-top: 24px;
  padding-top: 20px;
  border-top: 1px solid var(--border-subtle);
}

/* 日付ゾロ目日カード */
.zorome-day-cards {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  margin-bottom: 4px;
}
.zorome-day-card {
  flex: 1;
  min-width: 130px;
  padding: 14px 16px;
  border-radius: 10px;
  background: var(--overlay-1);
  border: 1px solid rgba(var(--accent-primary-rgb), 0.2);
}
.zorome-day-card--clickable {
  cursor: pointer;
  transition: background 0.15s;
}
.zorome-day-card--clickable:hover {
  background: var(--surface-hover);
}
.zorome-day-card--selected {
  outline: 2px solid var(--accent-primary);
  outline-offset: -2px;
}
.zd-title {
  font-size: 1rem;
  font-weight: 700;
  color: var(--accent-primary);
  margin-bottom: 4px;
}
.zd-count {
  font-size: 1.4rem;
  font-weight: 700;
  color: var(--text-main);
  margin-bottom: 10px;
}
.zd-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 5px;
  font-size: 0.85rem;
}
.zd-label { color: var(--text-faded); }
.zd-value { font-weight: 600; }

/* 月日ゾロ目サマリー */
.zorome-summary {
  display: flex;
  gap: 20px;
  flex-wrap: wrap;
  padding: 12px 16px;
  border-radius: 10px;
  background: var(--overlay-1);
  border: 1px solid var(--border-subtle);
  margin-bottom: 16px;
}
.zs-item {
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.zs-label {
  font-size: 0.78rem;
  color: var(--text-faded);
}
.zs-value {
  font-size: 1rem;
  font-weight: 700;
  color: var(--text-main);
}

/* 棒グラフ横スクロール */
.chart-scroll-wrapper {
  width: 100%;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
}
.chart-inner {
  position: relative;
  height: 220px;
  min-width: 580px;
}
</style>
