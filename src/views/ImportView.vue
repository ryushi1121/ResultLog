<template>
  <div class="import-view">
    <div class="page-header">
      <h1 class="page-title">CSV取込</h1>
      <p class="page-subtitle">CSVファイルから収支データを一括登録します</p>
    </div>

    <!-- Step 1: ファイル選択 -->
    <div v-if="step === 1" class="card">
      <div
        class="drop-zone"
        :class="{ 'drop-zone--over': isDragOver }"
        @dragover.prevent="isDragOver = true"
        @dragleave="isDragOver = false"
        @drop.prevent="onDrop"
        @click="fileInputRef.click()"
      >
        <i class="fa-solid fa-file-csv drop-icon"></i>
        <p class="drop-text">CSVファイルをドラッグ&ドロップ</p>
        <p class="drop-sub">または クリックしてファイルを選択</p>
        <p class="drop-hint">UTF-8 / Shift-JIS（Excel出力）対応</p>
      </div>
      <input ref="fileInputRef" type="file" accept=".csv,text/csv" class="file-input-hidden" @change="onFileChange" />

      <div v-if="parseError" class="alert-error mt-3">{{ parseError }}</div>

      <div class="template-row mt-3">
        <a href="/csv_template.csv" download class="btn btn-secondary">
          <i class="fa-solid fa-download"></i> テンプレートをダウンロード
        </a>
        <span class="text-muted" style="font-size:0.82rem;">Excel で開いて編集できます（UTF-8 BOM付き）</span>
      </div>

      <div class="format-guide card mt-4">
        <p class="guide-title">CSVフォーマット（ヘッダー行必須）</p>
        <div class="guide-table-wrap">
          <table class="guide-table">
            <thead>
              <tr>
                <th>列名</th><th>必須</th><th>例</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="col in csvColumns" :key="col.name">
                <td><code>{{ col.name }}</code></td>
                <td>{{ col.required }}</td>
                <td class="text-muted">{{ col.example }}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p class="guide-note">※ 投資 / 回収 は合計列、または 現金＋貯メダル列の組み合わせで指定できます</p>
      </div>
    </div>

    <!-- Step 2: プレビュー -->
    <div v-else-if="step === 2" class="card">
      <div class="preview-summary">
        <div class="summary-chip summary-chip--ok">
          <i class="fa-solid fa-circle-check"></i>
          取込可能 <strong>{{ parseResult.valid.length }}件</strong>
        </div>
        <div v-if="parseResult.invalid.length > 0" class="summary-chip summary-chip--error">
          <i class="fa-solid fa-circle-exclamation"></i>
          エラー <strong>{{ parseResult.invalid.length }}件</strong>（スキップ）
        </div>
      </div>

      <div v-if="parseResult.invalid.length > 0" class="error-list mt-3">
        <p class="error-list-title">エラー行の詳細</p>
        <div v-for="row in parseResult.invalid" :key="row.rowNum" class="error-row">
          <span class="error-row-num">行 {{ row.rowNum }}</span>
          <span class="error-messages">{{ row.errors.join(' / ') }}</span>
        </div>
      </div>

      <div v-if="parseResult.valid.length === 0" class="alert-error mt-3">
        取込可能なデータが1件もありません。CSVの内容を確認してください。
      </div>

      <div v-else class="preview-table-wrap mt-3">
        <p class="preview-table-title">取込データ（先頭5件）</p>
        <table class="data-table preview-table">
          <thead>
            <tr>
              <th>日付</th><th>店舗</th><th>機種</th><th>投資</th><th>回収</th><th>収支</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in parseResult.valid.slice(0, 5)" :key="row.rowNum">
              <td>{{ row.date }}</td>
              <td>{{ row.store }}</td>
              <td>{{ row.machine || '—' }}</td>
              <td class="text-right">{{ row.investment.toLocaleString() }}円</td>
              <td class="text-right">{{ row.collection.toLocaleString() }}円</td>
              <td class="text-right" :class="(row.collection - row.investment) >= 0 ? 'text-success' : 'text-danger'">
                {{ (row.collection - row.investment) >= 0 ? '+' : '' }}{{ (row.collection - row.investment).toLocaleString() }}円
              </td>
            </tr>
          </tbody>
        </table>
        <p v-if="parseResult.valid.length > 5" class="text-muted" style="font-size:0.8rem;margin-top:6px;">
          … 他 {{ parseResult.valid.length - 5 }}件
        </p>
      </div>

      <div class="action-row mt-4">
        <button class="btn btn-secondary" @click="reset">← 戻る</button>
        <button
          class="btn btn-primary"
          :disabled="parseResult.valid.length === 0"
          @click="startImport"
        >取込開始（{{ parseResult.valid.length }}件）</button>
      </div>
    </div>

    <!-- Step 3: 進捗・結果 -->
    <div v-else-if="step === 3" class="card">
      <div v-if="!progress.done" class="importing">
        <p class="importing-title">取込中… しばらくお待ちください</p>
        <div class="progress-bar-wrap">
          <div class="progress-bar" :style="{ width: progressPct + '%' }"></div>
        </div>
        <p class="progress-label">{{ progress.current }} / {{ progress.total }} 件</p>
        <p class="progress-current text-muted">{{ progress.currentLabel }}</p>
      </div>

      <div v-else class="result">
        <div class="result-icon" :class="progress.failed > 0 ? 'result-icon--warn' : 'result-icon--ok'">
          <i :class="progress.failed > 0 ? 'fa-solid fa-triangle-exclamation' : 'fa-solid fa-circle-check'"></i>
        </div>
        <p class="result-title">取込完了</p>
        <div class="result-chips">
          <div class="result-chip result-chip--ok">成功 {{ progress.success }}件</div>
          <div v-if="progress.failed > 0" class="result-chip result-chip--error">失敗 {{ progress.failed }}件</div>
        </div>
        <div v-if="failedRows.length > 0" class="error-list mt-3">
          <p class="error-list-title">失敗した行</p>
          <div v-for="f in failedRows" :key="f.row.rowNum" class="error-row">
            <span class="error-row-num">行 {{ f.row.rowNum }} / {{ f.row.date }} {{ f.row.store }}</span>
            <span class="error-messages">{{ f.error }}</span>
          </div>
        </div>
        <div class="action-row mt-4">
          <button class="btn btn-secondary" @click="reset">新しいファイルを取込</button>
          <router-link to="/list" class="btn btn-primary">収支一覧を確認</router-link>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { readFileAsText, parseCSV } from '@/utils/csvParser';
import { useEntries } from '@/composables/useEntries';
import { useStoreSettings } from '@/composables/useStoreSettings';

const { addEntry } = useEntries();
const { calculateYen } = useStoreSettings();

const step        = ref(1);
const isDragOver  = ref(false);
const fileInputRef = ref(null);
const parseResult  = ref({ valid: [], invalid: [], totalRows: 0 });
const parseError   = ref('');
const progress     = ref({ current: 0, total: 0, done: false, success: 0, failed: 0, currentLabel: '' });
const failedRows   = ref([]);

const progressPct = computed(() =>
  progress.value.total > 0 ? Math.round((progress.value.current / progress.value.total) * 100) : 0
);

const csvColumns = [
  { name: '日付',        required: '✓', example: '2026-04-01' },
  { name: '店舗',        required: '✓', example: 'マルハン新宿' },
  { name: '機種',        required: '',  example: 'バジリスク絆2' },
  { name: '台番号',      required: '',  example: '456' },
  { name: '投資',        required: '△', example: '10000' },
  { name: '投資_現金',   required: '',  example: '5000' },
  { name: '投資_貯メダル',required: '', example: '5000' },
  { name: '回収',        required: '△', example: '15000' },
  { name: '回収_現金',   required: '',  example: '8000' },
  { name: '回収_貯メダル',required: '', example: '7000' },
  { name: '開始時間',    required: '',  example: '10:00' },
  { name: '終了時間',    required: '',  example: '18:30' },
  { name: 'メモ',        required: '',  example: '自由記述' },
];

const processFile = async (file) => {
  parseError.value = '';
  if (!file || !file.name.toLowerCase().endsWith('.csv')) {
    parseError.value = 'CSVファイル（.csv）を選択してください。';
    return;
  }
  try {
    const text = await readFileAsText(file);
    const result = parseCSV(text, calculateYen);
    if (result.totalRows === 0) {
      parseError.value = 'CSVにデータ行が見つかりませんでした。';
      return;
    }
    parseResult.value = result;
    step.value = 2;
  } catch (e) {
    parseError.value = `ファイルの読み込みに失敗しました: ${e.message}`;
  }
};

const onFileChange = (e) => processFile(e.target.files[0]);
const onDrop = (e) => processFile(e.dataTransfer.files[0]);

const startImport = async () => {
  step.value = 3;
  const rows = parseResult.value.valid;
  progress.value = { current: 0, total: rows.length, done: false, success: 0, failed: 0, currentLabel: '' };
  failedRows.value = [];

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    progress.value.current = i + 1;
    progress.value.currentLabel = `${row.date} ${row.store}`;
    try {
      await addEntry(row);
      progress.value.success++;
    } catch (e) {
      progress.value.failed++;
      failedRows.value.push({ row, error: e.message });
    }
    // Google Calendar API レート制限対策（200ms待機）
    if (i < rows.length - 1) {
      await new Promise(r => setTimeout(r, 200));
    }
  }

  progress.value.done = true;
};

const reset = () => {
  step.value = 1;
  parseError.value = '';
  parseResult.value = { valid: [], invalid: [], totalRows: 0 };
  progress.value = { current: 0, total: 0, done: false, success: 0, failed: 0, currentLabel: '' };
  failedRows.value = [];
  if (fileInputRef.value) fileInputRef.value.value = '';
};
</script>

<style scoped>
.import-view { animation: fadeIn 0.3s ease-out; }
@keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }

/* Drop zone */
.drop-zone {
  border: 2px dashed rgba(0, 212, 255, 0.3);
  border-radius: 12px;
  padding: 48px 24px;
  text-align: center;
  cursor: pointer;
  transition: all 0.2s ease;
}
.drop-zone:hover, .drop-zone--over {
  border-color: var(--accent-primary);
  background: rgba(0, 212, 255, 0.04);
}
.drop-icon { font-size: 3rem; color: var(--accent-primary); margin-bottom: 16px; }
.drop-text { font-size: 1rem; font-weight: 600; color: #e8e8f0; margin-bottom: 6px; }
.drop-sub { font-size: 0.85rem; color: #8b8fa3; margin-bottom: 6px; }
.drop-hint { font-size: 0.78rem; color: #5a5e72; }
.file-input-hidden { display: none; }

/* Format guide */
.format-guide { background: rgba(255,255,255,0.02); padding: 16px 20px; }
.guide-title { font-size: 0.85rem; color: #aaa; margin-bottom: 12px; font-weight: 600; }
.guide-table-wrap { overflow-x: auto; }
.guide-table { width: 100%; border-collapse: collapse; font-size: 0.82rem; }
.guide-table th { color: #888; font-weight: 500; padding: 4px 10px; border-bottom: 1px solid rgba(255,255,255,0.06); white-space: nowrap; }
.guide-table td { padding: 4px 10px; border-bottom: 1px solid rgba(255,255,255,0.04); }
.guide-table code { color: var(--accent-primary); font-size: 0.82rem; }
.guide-note { font-size: 0.78rem; color: #666; margin-top: 10px; }

/* Preview summary */
.preview-summary { display: flex; gap: 12px; flex-wrap: wrap; }
.summary-chip { display: flex; align-items: center; gap: 8px; padding: 10px 16px; border-radius: 8px; font-size: 0.9rem; }
.summary-chip--ok    { background: rgba(34,197,94,0.1);   color: #22c55e; border: 1px solid rgba(34,197,94,0.2); }
.summary-chip--error { background: rgba(239,68,68,0.1);   color: #ef4444; border: 1px solid rgba(239,68,68,0.2); }

/* Error list */
.error-list { border: 1px solid rgba(239,68,68,0.2); border-radius: 8px; padding: 12px 16px; }
.error-list-title { font-size: 0.82rem; color: #ef4444; margin-bottom: 8px; font-weight: 600; }
.error-row { display: flex; gap: 12px; font-size: 0.82rem; padding: 4px 0; border-bottom: 1px solid rgba(255,255,255,0.04); flex-wrap: wrap; }
.error-row:last-child { border-bottom: none; }
.error-row-num { color: #888; white-space: nowrap; }
.error-messages { color: #ef4444; }

/* Preview table */
.preview-table-title { font-size: 0.82rem; color: #aaa; margin-bottom: 8px; }
.preview-table { font-size: 0.85rem; }
.text-right { text-align: right; }

/* Actions */
.action-row { display: flex; gap: 12px; justify-content: flex-end; flex-wrap: wrap; }

/* Alert */
.alert-error { background: rgba(239,68,68,0.1); border: 1px solid rgba(239,68,68,0.2); border-radius: 8px; padding: 12px 16px; color: #ef4444; font-size: 0.9rem; }

/* Importing */
.importing { text-align: center; padding: 20px 0; }
.importing-title { font-size: 1rem; color: #e8e8f0; margin-bottom: 20px; }
.progress-bar-wrap { background: rgba(255,255,255,0.06); border-radius: 100px; height: 10px; overflow: hidden; margin: 0 auto 12px; max-width: 480px; }
.progress-bar { height: 100%; background: linear-gradient(90deg, #00d4ff, #7c3aed); border-radius: 100px; transition: width 0.3s ease; }
.progress-label { font-size: 1.1rem; font-weight: 700; color: #e8e8f0; margin-bottom: 6px; }
.progress-current { font-size: 0.85rem; }

/* Result */
.result { text-align: center; padding: 20px 0; }
.result-icon { font-size: 3.5rem; margin-bottom: 12px; }
.result-icon--ok   { color: #22c55e; }
.result-icon--warn { color: #f59e0b; }
.result-title { font-size: 1.3rem; font-weight: 700; color: #e8e8f0; margin-bottom: 16px; }
.result-chips { display: flex; gap: 12px; justify-content: center; flex-wrap: wrap; }
.result-chip { padding: 8px 20px; border-radius: 100px; font-size: 0.9rem; font-weight: 600; }
.result-chip--ok    { background: rgba(34,197,94,0.15);  color: #22c55e; border: 1px solid rgba(34,197,94,0.3); }
.result-chip--error { background: rgba(239,68,68,0.15);  color: #ef4444; border: 1px solid rgba(239,68,68,0.3); }

.template-row { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; }
.mt-3 { margin-top: 12px; }
.mt-4 { margin-top: 20px; }
</style>
