<template>
  <div class="chart-container card mb-4">
    <h3>収支推移</h3>
    <div class="chart-wrapper">
      <Line :data="chartData" :options="chartOptions" v-if="monthlyStats.length > 0" />
      <div v-else class="empty-state text-muted text-center py-4">データがありません</div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { Line } from 'vue-chartjs';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { useAnalytics } from '@/composables/useAnalytics';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const { monthlyStats } = useAnalytics();

const chartData = computed(() => {
  return {
    labels: monthlyStats.value.map(s => s.name),
    datasets: [
      {
        label: '月間収支',
        data: monthlyStats.value.map(s => s.profit),
        borderColor: '#00d4ff',
        backgroundColor: 'rgba(0, 212, 255, 0.1)',
        tension: 0.3,
        fill: true,
        pointBackgroundColor: '#00d4ff',
      }
    ]
  };
});

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { display: false },
    tooltip: {
      callbacks: {
        label: (context) => {
          let label = context.dataset.label || '';
          if (label) {
            label += ': ';
          }
          if (context.parsed.y !== null) {
            label += new Intl.NumberFormat('ja-JP', { style: 'currency', currency: 'JPY' }).format(context.parsed.y);
          }
          return label;
        }
      }
    }
  },
  scales: {
    y: {
      grid: { color: 'rgba(255,255,255,0.05)' },
      ticks: { color: '#8892b0' }
    },
    x: {
      grid: { color: 'rgba(255,255,255,0.05)' },
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
