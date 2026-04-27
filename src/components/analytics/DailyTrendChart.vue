<template>
  <div v-if="trendChartData" class="analytics-card card mb-4">
    <h3>{{ trendChartData.title }}</h3>
    <div class="chart-wrapper">
      <Bar :data="chartData" :options="chartOptions" />
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

ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, Tooltip, Legend);

const { trendChartData } = useAnalytics();

const chartData = computed(() => {
  const data = trendChartData.value;
  if (!data) return { labels: [], datasets: [] };

  return {
    labels: data.labels,
    datasets: [
      {
        type: 'bar',
        label: '収支',
        data: data.profits,
        backgroundColor: data.profits.map(v =>
          v === null ? 'transparent' : v >= 0 ? 'rgba(34,197,94,0.7)' : 'rgba(239,68,68,0.7)'
        ),
        borderColor: data.profits.map(v =>
          v === null ? 'transparent' : v >= 0 ? '#22c55e' : '#ef4444'
        ),
        borderWidth: 1,
        yAxisID: 'yLeft'
      },
      {
        type: 'line',
        label: '累積収支',
        data: data.cumulative,
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

const chartOptions = computed(() => ({
  responsive: true,
  maintainAspectRatio: false,
  interaction: { mode: 'index', intersect: false },
  plugins: {
    legend: {
      labels: { color: '#ccc', font: { size: 12 } }
    },
    tooltip: {
      callbacks: {
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
        callback: v => `${v.toLocaleString()}円`
      },
      grid: { color: 'rgba(255,255,255,0.05)' }
    },
    yRight: {
      type: 'linear',
      position: 'right',
      ticks: {
        color: '#00d4ff',
        font: { size: 11 },
        callback: v => `${v.toLocaleString()}円`
      },
      grid: { drawOnChartArea: false }
    }
  }
}));
</script>

<style scoped>
.chart-wrapper {
  position: relative;
  height: 280px;
}
@media (max-width: 600px) {
  .chart-wrapper {
    height: 220px;
  }
}
</style>
