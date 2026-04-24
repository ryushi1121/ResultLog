# 時間帯・稼働時間別分析機能の実装

## 目的
「朝イチ開始 vs 夕方以降開始」の違いや、「稼働時間（短い・普通・長い）」による勝率の違いを分析し、時間帯や稼働時間による立ち回りの有効性を評価する。

## 前提技術
- Vue 3 (Composition API)
- Vite
- Chart.js (`vue-chartjs`)

## 対象ファイル
- `src/composables/useAnalytics.js` (既存)
- `src/components/analytics/TimeDurationAnalytics.vue` (新規)
- `src/views/AnalyticsView.vue` (既存)

## 実装要件

### 1. 時間帯および稼働時間の集計ロジック (`useAnalytics.js`)
`filteredEntries` を基に、以下の2つの軸で集計する computed プロパティを追加してください。

- **開始時間帯別**:
  - `entry.startTime` (HH:MM形式) をパースし、以下のように分類。
    - 朝（05:00〜11:59）
    - 昼（12:00〜16:59）
    - 夕方・夜（17:00〜）
    - 未設定（startTimeが無い場合）
- **稼働時間帯別**:
  - `entry.startTime` と `entry.endTime` から稼働時間（分）を算出。
  - 以下のように分類。
    - 2時間未満（短期決戦）
    - 2時間〜4時間未満
    - 4時間〜6時間未満
    - 6時間以上（腰を据えた稼働）
  - 開始・終了時間が未設定のものは除外または別枠。

各カテゴリごとに、稼働回数、勝率、平均収支を集計します。

### 2. UIコンポーネントの作成 (`TimeDurationAnalytics.vue`)
- 新規コンポーネントを作成し、2つの軸（開始時間帯、稼働時間）それぞれの集計結果を表示してください。
- **表示内容**:
  - タブやセレクトボックスで「開始時間帯」と「稼働時間」の表示を切り替えられるようにする。
  - 選択中の軸ごとの勝率または平均収支を棒グラフやドーナツグラフで表示（Chart.js）。
  - 詳細データをテーブルで表示。

### 3. ビューへの組み込み (`AnalyticsView.vue`)
- 作成した `TimeDurationAnalytics.vue` をインポートし、`<div class="analytics-grid">` 内に追加してください。
