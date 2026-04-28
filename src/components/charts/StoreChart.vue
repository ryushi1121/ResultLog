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
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import { useAnalytics } from '@/composables/useAnalytics';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const { storeStats } = useAnalytics();

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

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { display: false }
  },
  scales: {
    y: {
      grid: { color: 'rgba(255,255,255,0.05)' },
      ticks: { color: '#8892b0', callback: v => `${v / 1000}k` }
    },
    x: {
      grid: { display: false },
      ticks: { color: '#8892b0' }
    }
  }
};
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
