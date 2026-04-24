# プロジェクトコンテキスト: ResultLog (Vue 3 / Vite / PWA)

## 1. アプリケーション概要

**目的**: パチスロの収支（現金・貯メダル対応）をGoogleカレンダーをデータストアとして登録・集計・可視化するWebアプリ（PWA）。  
**対応環境**: PCブラウザ + Android端末（ホーム画面インストール）

## 2. 技術スタック

| カテゴリ | 技術 |
|---------|------|
| フレームワーク | Vite + Vue 3 (Composition API) |
| 言語 | JavaScript (TypeScriptは使用しない) |
| ルーティング | Vue Router 4 |
| グラフ | Chart.js + vue-chartjs |
| 認証 | Google Identity Services (GIS) / OAuth 2.0 |
| データストア | Google Calendar API v3 (REST直接呼び出し) |
| 日付処理 | date-fns |
| UI | カスタムCSS (ダークモード・スロット風テーマ) |

## 3. デザインシステム

**テーマ**: Premium Dark（ダークモード基調）

- **背景**: `#0f0f1a` → `#1a1a2e`（グラデーション）
- **カード**: `#16213e` + `rgba(255,255,255,0.05)` ボーダー（Glassmorphism）
- **アクセント**: `#00d4ff`（シアン）+ `#7c3aed`（紫）
- **勝ち**: `#22c55e`（グリーン）/ **負け**: `#ef4444`（レッド）
- **フォント**: Inter（数値・英字）+ Noto Sans JP（日本語）
- **レイアウト**: モバイルファースト、PC時はサイドバー展開

## 4. データモデル

Googleカレンダーのイベントとして収支データを保存する。

### イベント登録仕様

| 項目 | 形式 | 例 |
|------|------|----|
| **タイトル** | `【ResultLog】 {店舗名} {収支（+-付き）}` | `【ResultLog】 マルハン新宿 +12,500` |
| **場所** | 入力された店舗名 | `マルハン新宿` |
| **説明** | 全角コロン区切りのキー・バリュー（下記参照） | — |
| **時間** | 開始・終了時間を指定した時間指定イベント（Asia/Tokyo） | `10:00〜18:00` |
| **通知** | 登録しない（`useDefault: false`, `overrides: []`） | — |

**イベント説明欄 (description)**:
```
機種：バジリスク絆2天膳
台番号：456
投資：30,000円 (現金: 20,000円, 貯メダル: 500枚)
回収：45,000円 (現金: 45,000円, 貯メダル: 0枚)
稼働時間：10:00～18:00
メモ：AT直撃
```

> **Note**: キーと値の区切りは**全角コロン（：）**を使用する。`calendarParser.js` のパース処理もこれに対応している。

**アプリ内データモデル**:
```javascript
{
  id: 'event_id',            // GoogleカレンダーイベントID
  date: '2026-04-20',        // 日付 (YYYY-MM-DD)
  store: '店舗名',            // 店舗名
  machine: '機種名',          // 機種名
  investment: 30000,          // 投資総額（円換算）
  investmentCash: 20000,      // 投資現金（円）
  investmentMedal: 500,       // 投資貯メダル（枚）
  collection: 45000,          // 回収総額（円換算）
  collectionCash: 45000,      // 回収現金（円）
  collectionMedal: 0,         // 回収貯メダル（枚）
  profit: 15000,              // 収支（自動計算: collection - investment）
  slotNumber: '456',          // 台番号（任意）
  startTime: '10:00',        // 稼働開始時間 (HH:MM)
  endTime: '18:00',          // 稼働終了時間 (HH:MM)
  memo: 'AT直撃',             // メモ（任意）
  dayOfWeek: '月'             // 曜日（自動計算）
}
```

- `【ResultLog】` プレフィックスで通常のカレンダーイベントと区別する（旧 `【収支管理】` にも対応）
- 1日に複数稼働した場合は別イベントとして登録する
- 収支がプラスの場合はカレンダーのカラーをブルーベリー（青）、マイナスの場合はトマト（赤）に設定する

## 5. プロジェクト構成

```
src/
├── assets/styles/
│   ├── main.css          # グローバルスタイル
│   ├── variables.css     # CSS変数（カラーパレット等）
│   └── components.css    # 共通コンポーネントスタイル
├── components/
│   ├── common/           # 共通コンポーネント（AppHeader, AppSidebar等）
│   ├── dashboard/        # ダッシュボード用（SummaryCard, QuickStats等）
│   ├── entry/            # 収支登録用（EntryForm, SuggestInput）
│   ├── list/             # 一覧用（EntryTable, EntryCard, FilterPanel）
│   ├── analytics/        # 集計・分析用
│   └── charts/           # Chart.jsラッパーコンポーネント
├── composables/
│   ├── useAuth.js        # Google OAuth 2.0認証
│   ├── useCalendar.js    # Google Calendar API操作
│   ├── useEntries.js     # 収支データの状態管理
│   └── useAnalytics.js   # クライアントサイド集計ロジック
├── router/index.js       # Vue Router設定
├── utils/
│   ├── calendarParser.js # イベント ↔ データモデル変換
│   ├── dateUtils.js      # 日付ユーティリティ
│   └── formatters.js     # 数値フォーマット（通貨表示等）
└── views/                # 各ページ（Login, Dashboard, Entry, List, Analytics, Charts, Settings）
```

## 6. コーディング規約

- **命名**: `camelCase`（変数・関数）/ `PascalCase`（コンポーネント名）/ `kebab-case`（ファイル名）
- **Vue**: Composition API + `<script setup>` を使用すること
- **状態管理**: Pinia等は使わずcomposablesで管理する（シンプルに保つ）
- **API呼び出し**: `useCalendar.js` に集約し、直接 `fetch` でREST呼び出しを行う
- **エラー処理**: API呼び出しは必ず `try/catch` し、ユーザーにトーストで通知する
- **スタイル**: インラインスタイルは避け、CSSクラスまたはCSS変数を使う

## 7. 設計上の決定事項

以下は開発開始時に確認・決定した仕様です。

| 項目 | 決定内容 |
|------|---------|
| **同一日の複数稼働** | 1稼働 = 1カレンダーイベントとして別々に登録する（既に `instructions.md` §4 に記載済み） |
| **Google Cloud 設定** | OAuthクライアントID等の設定はユーザー自身が対応済み。手順書は不要 |
| **初期データ** | 既存データなし。このアプリから新規に登録を始める想定。既存カレンダーとの互換性対応は不要 |

## 8. 環境変数

| 変数名 | 用途 |
|--------|------|
| `VITE_GOOGLE_CLIENT_ID` | Google OAuth クライアントID |

- `.env` はGitにコミットしない（`.gitignore` 管理済み）
- 変数名は必ず `VITE_` プレフィックスを付けること（Viteのブラウザ公開ルール）

## 9. 開発コマンド

```bash
npm run dev      # 開発サーバー起動 (http://localhost:5173)
npm run build    # プロダクションビルド
npm run preview  # ビルド成果物のプレビュー
```
