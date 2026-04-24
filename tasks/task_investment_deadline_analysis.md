# 投資上限（デッドライン）分析機能の実装

## 目的
「いくら投資したら勝率・回収率がどう変わるか」を可視化し、ユーザーの損切りラインの目安となるデータを提供する。

## 前提技術
- Vue 3 (Composition API)
- Vite
- Chart.js (`vue-chartjs`)

## 対象ファイル
- `src/composables/useAnalytics.js` (既存)
- `src/components/analytics/InvestmentDeadlineAnalytics.vue` (新規)
- `src/views/AnalyticsView.vue` (既存)

## 実装要件

### 1. 投資額帯別の集計ロジック (`useAnalytics.js`)
- `filteredEntries` を投資総額（`investment`）のレンジでグループ化する computed プロパティを追加してください。
- **想定するレンジ例**:
  - 10,000円未満
  - 10,000円〜19,999円
  - 20,000円〜29,999円
  - 30,000円〜49,999円
  - 50,000円以上
- 各レンジごとに、該当する稼働回数、勝率、平均収支、回収率（総回収額 / 総投資額）を計算してください。

### 2. UIコンポーネントの作成 (`InvestmentDeadlineAnalytics.vue`)
- 新規コンポーネントを作成し、集計結果を表示してください。
- **表示内容**:
  1. 投資レンジごとの勝率を示す棒グラフ（Chart.js）。
  2. レンジごとの詳細データ（稼働数、勝率、平均収支、回収率）を表示するテーブル。
- ユーザーが一目で「どこから勝率が落ちるか」を把握できるよう、勝率が50%を割っているレンジのテキスト色を警告色にするなどの工夫を入れてください。

### 3. ビューへの組み込み (`AnalyticsView.vue`)
- 作成した `InvestmentDeadlineAnalytics.vue` をインポートし、`<div class="analytics-grid">` 内に追加してください。
