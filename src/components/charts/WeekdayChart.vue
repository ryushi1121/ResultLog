<template>
  <div class="chart-container card mb-4">
    <h3>曜日別 平均収支</h3>
    <div class="chart-wrapper">
      <Bar :data="chartData" :options="chartOptions" v-if="weekdayStats.length > 0" />
      <div v-else class="empty-state text-muted text-center py-4">データがありません</div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { Bar } from 'vue-chartjs';
import { useTheme } from '@/composables/useTheme';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import Annotation from 'chartjs-plugin-annotation';
import { useAnalytics } from '@/composables/useAnalytics';
import { zeroLineAnnotationSingle } from '@/utils/chartUtils';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Annotation
);

const { weekdayStats } = useAnalytics();
const { theme } = useTheme();

const cc = computed(() => {
  const isLight = theme.value === 'light';
  return {
    textSub: isLight ? '#657b83' : '#839496',
    grid:    isLight ? 'rgba(101,123,131,0.12)' : 'rgba(255,255,255,0.05)'
  };
});

const chartData = computed(() => {
  return {
    labels: weekdayStats.value.map(s => s.name),
    datasets: [
      {
        label: '平均収支',
        data: weekdayStats.value.map(s => s.avgProfit),
        backgroundColor: weekdayStats.value.map(s => s.avgProfit >= 0 ? 'rgba(34, 197, 94, 0.7)' : 'rgba(239, 68, 68, 0.7)'),
        borderRadius: 4
      }
    ]
  };
});

const chartOptions = computed(() => ({
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { display: false },
    ...zeroLineAnnotationSingle
  },
  scales: {
    y: {
      grid: { color: cc.value.grid },
      ticks: { color: cc.value.textSub, callback: v => `${Math.round(v / 1000)}k` }
    },
    x: {
      grid: { display: false },
      ticks: { color: cc.value.textSub }
    }
  }
}));
</script>

<style scoped>
.chart-wrapper {
  position: relative;
  width: 100%;
  height: 300px;
  overflow: hidden;
  margin-top: 10px;
}
</style>
