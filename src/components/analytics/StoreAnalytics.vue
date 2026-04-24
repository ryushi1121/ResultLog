<template>
  <div class="analytics-card card mb-4">
    <h3>店舗別集計</h3>
    <div class="table-container">
      <table class="data-table">
        <thead>
          <tr>
            <th>店舗名</th>
            <th class="text-right">回数</th>
            <th class="text-right">勝率</th>
            <th class="text-right">収支</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="stat in storeStats" :key="stat.name">
            <td>{{ stat.name }}</td>
            <td class="text-right">{{ stat.count }}</td>
            <td class="text-right">{{ stat.winRate.toFixed(1) }}%</td>
            <td class="text-right font-weight-bold" :class="getProfitClass(stat.profit)">
              {{ formatCurrency(stat.profit) }}
            </td>
          </tr>
          <tr v-if="storeStats.length === 0">
            <td colspan="4" class="text-center text-muted">データがありません</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup>
import { useAnalytics } from '@/composables/useAnalytics';
import { formatCurrency } from '@/utils/formatters';

const { storeStats } = useAnalytics();

const getProfitClass = (val) => {
  if (val > 0) return 'text-success';
  if (val < 0) return 'text-danger';
  return '';
};
</script>
