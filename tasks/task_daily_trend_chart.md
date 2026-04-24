# 月別表示時の日別収支グラフの実装

## 目的
期間選択で特定の「月」が選ばれているとき、横軸を1日〜月末日とした棒グラフ（日々の収支）および折れ線グラフ（月間累積収支）を表示し、月間の収支推移を一目で把握できるようにする。

## 前提技術
- Vue 3 (Composition API)
- Vite
- Chart.js (`vue-chartjs`)

## 対象ファイル
- `src/views/AnalyticsView.vue` (既存)
- `src/components/analytics/DailyTrendChart.vue` (新規)
- `src/composables/useAnalytics.js` (既存)

## 実装要件

### 1. 日別集計ロジックの追加 (`useAnalytics.js`)
- 選択された月（`periodType === 'month'` 時の `periodValue`）の、1日から月末日までのすべての日付を網羅した配列を生成するロジックを追加してください。
- 各日付に対して、その日の収支（`dailyProfit`）と、月初からの累積収支（`cumulativeProfit`）を算出してください。稼働がない日は収支0として扱います。

### 2. UIコンポーネントの作成 (`DailyTrendChart.vue`)
- `vue-chartjs` の複合グラフ（Bar + Line）を使用してグラフを描画する新規コンポーネントを作成してください。
- **グラフ仕様**:
  - **X軸**: 日付（1〜31）
  - **Y軸（左・棒グラフ）**: その日の収支（プラスなら緑系、マイナスなら赤系）
  - **Y軸（右・折れ線）**: 累積収支（アクセントカラー）

### 3. ビューへの組み込み (`AnalyticsView.vue`)
- `useAnalytics` から `periodType` を取得し、値が `'month'` の場合のみ `DailyTrendChart` を表示するように `v-if` で制御してください。
- 表示位置は `PeriodSelector` の直下（他の各種Analyticsの上）が推奨です。

## 留意事項
- `periodValue` は 'YYYY-MM' の形式です。月の最終日（28, 29, 30, 31）を動的に計算してX軸のラベルを生成してください。
- Responsive対応を行い、モバイル端末でもグラフが崩れずに表示されるようにしてください。
