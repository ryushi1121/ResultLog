<template>
  <div class="chart-container card mb-4">
    <h3>機種別 稼働割合</h3>
    <div class="chart-wrapper">
      <Doughnut :data="chartData" :options="chartOptions" v-if="machineStats.length > 0" />
      <div v-else class="empty-state text-muted text-center py-4">データがありません</div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { Doughnut } from 'vue-chartjs';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend
} from 'chart.js';
import { useAnalytics } from '@/composables/useAnalytics';

ChartJS.register(ArcElement, Tooltip, Legend);

const { machineStats } = useAnalytics();

const chartData = computed(() => {
  const sorted = [...machineStats.value].sort((a, b) => b.count - a.count);
  const data = sorted.slice(0, 5);
  if (sorted.length > 5) {
    const othersCount = sorted.slice(5).reduce((sum, s) => sum + s.count, 0);
    data.push({ name: 'その他', count: othersCount });
  }

  const colors = [
    '#00d4ff',
    '#7c3aed',
    '#22c55e',
    '#f59e0b',
    '#ec4899',
    '#64748b'
  ];

  return {
    labels: data.map(s => s.name.length > 10 ? s.name.substring(0, 10) + '...' : s.name),
    datasets: [
      {
        data: data.map(s => s.count),
        backgroundColor: colors.slice(0, data.length),
        borderWidth: 0,
        hoverOffset: 4
      }
    ]
  };
});

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'right',
      labels: { color: '#e2e8f0' }
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
