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

const { weekdayStats } = useAnalytics();

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

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { display: false }
  },
  scales: {
    y: {
      grid: { color: 'rgba(255,255,255,0.05)' },
      ticks: { color: '#8892b0' }
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
  height: 300px;
  position: relative;
  margin-top: 10px;
}
</style>
