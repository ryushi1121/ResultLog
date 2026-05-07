<template>
  <div class="chart-container card mb-4">
    <h3>店舗別収支 (Top 10)</h3>
    <div class="chart-wrapper">
      <Bar :data="chartData" :options="chartOptions" v-if="storeStats.length > 0" />
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

const { storeStats } = useAnalytics();
const { theme } = useTheme();

const cc = computed(() => {
  const isLight = theme.value === 'light';
  return {
    textSub: isLight ? '#657b83' : '#839496',
    grid:    isLight ? 'rgba(101,123,131,0.12)' : 'rgba(255,255,255,0.05)'
  };
});

const chartData = computed(() => {
  const data = storeStats.value.slice(0, 10);
  return {
    labels: data.map(s => s.name.length > 10 ? s.name.substring(0, 10) + '...' : s.name),
    datasets: [
      {
        label: '収支',
        data: data.map(s => s.profit),
        backgroundColor: data.map(s => s.profit >= 0 ? 'rgba(34, 197, 94, 0.7)' : 'rgba(239, 68, 68, 0.7)'),
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
