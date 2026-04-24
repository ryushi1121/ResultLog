# 台番号と日付の関連分析機能の実装

## 目的
稼働日の「日付」と座った「台番号」の関連性（特に末尾の一致など）による勝率や収支を分析し、ユーザーの立ち回りの傾向を可視化する。

## 前提技術
- Vue 3 (Composition API)
- Vite
- Chart.js (`vue-chartjs`)

## 対象ファイル
- `src/composables/useAnalytics.js` (既存)
- `src/components/analytics/DateSlotAnalytics.vue` (新規)
- `src/views/AnalyticsView.vue` (既存)

## 実装要件

### 1. データ集計処理の追加 (`useAnalytics.js`)
`filteredEntries` を用いて、以下の切り口でデータを集計する computed プロパティを追加してください。
- **特定日ごとの集計**:
  - 日付の末尾（0〜9）ごとの稼働回数、勝率、平均収支。
  - 例：末尾5の日（5日、15日、25日）の勝率が他の日より高いか、など。
- **日付末尾と台番号末尾の一致**:
  - `entry.date` の末尾と、`entry.slotNumber` の末尾（文字列の最後の一文字）が一致している稼働と、そうでない稼働での勝率・収支の比較。

### 2. UIコンポーネントの作成 (`DateSlotAnalytics.vue`)
- 新規にコンポーネントを作成し、`useAnalytics` から取得したデータを表示してください。
- **表示内容**:
  1. 日付末尾（0〜9）ごとの勝率・収支を示す棒グラフ（Chart.js）。
  2. 「日付末尾と台番号末尾の一致・不一致」の比較を示すシンプルなサマリー（テーブルまたはカード表示）。
- スタイルは既存の `StoreAnalytics.vue` や `MachineAnalytics.vue` に合わせ、ダークテーマ（Premium Dark）のカードデザイン（`.analytics-card`等）を適用してください。

### 3. ビューへの組み込み (`AnalyticsView.vue`)
- 作成した `DateSlotAnalytics.vue` をインポートし、`<div class="analytics-grid">` 内に追加してください。

## 留意事項
- `entry.slotNumber` は任意の文字列（または空）である可能性があるため、空の場合は集計から除外、または「未設定」として扱うなどのエラーハンドリングを行ってください。
