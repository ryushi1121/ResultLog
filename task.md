# パチスロ収支管理アプリ タスク一覧

## Phase 1: プロジェクト初期化・認証 ✅
- [x] Vite + Vue 3 プロジェクト作成
- [x] 依存パッケージインストール (vue-router, chart.js, vue-chartjs, date-fns)
- [x] CSS設計（変数、グローバルスタイル、ダークテーマ）
- [x] Vue Router設定（全ページのルート定義）
- [x] App.vue レイアウト（ヘッダー、サイドバー、メインエリア）
- [x] Google OAuth認証 composable (useAuth.js)
- [x] ログイン画面 (LoginView.vue)

## Phase 2: データ層・登録機能 ✅
- [x] カレンダーイベントパーサー (calendarParser.js)
- [x] 日付ユーティリティ (dateUtils.js)
- [x] フォーマッター (formatters.js)
- [x] カレンダーAPI composable (useCalendar.js)
- [x] 収支データ管理 composable (useEntries.js)
- [x] サジェスト入力コンポーネント (SuggestInput.vue)
- [x] 収支登録フォーム (EntryForm.vue)
- [x] 収支登録画面 (EntryView.vue)

## Phase 3: 一覧・ダッシュボード ✅
- [x] サマリーカード (SummaryCard.vue)
- [x] 直近履歴 (RecentHistory.vue)
- [x] クイック統計 (QuickStats.vue)
- [x] ダッシュボード画面 (DashboardView.vue)
- [x] 一覧テーブル (EntryTable.vue)
- [x] フィルタパネル (FilterPanel.vue)
- [x] 収支一覧画面 (ListView.vue)
- [x] 編集・削除機能

## Phase 4: 集計・グラフ
- [x] 集計ロジック composable (useAnalytics.js)
- [x] 期間選択 (PeriodSelector.vue)
- [x] 店舗別集計 (StoreAnalytics.vue)
- [x] 機種別集計 (MachineAnalytics.vue)
- [x] 曜日別集計 (WeekdayAnalytics.vue)
- [x] 集計・分析画面 (AnalyticsView.vue)
- [x] 収支推移グラフ (TrendChart.vue)
- [x] 店舗別チャート (StoreChart.vue)
- [x] 機種別チャート (MachineChart.vue)
- [x] 曜日別チャート (WeekdayChart.vue)
- [x] グラフ表示画面 (ChartsView.vue)

## Phase 5: PWA・設定・仕上げ
- [x] 設定画面 (SettingsView.vue)
- [x] PWA設定（マニフェスト、アイコン、Service Worker）
- [x] Firebase Hosting 設定ファイル
- [x] レスポンシブ調整
- [x] 動作確認
