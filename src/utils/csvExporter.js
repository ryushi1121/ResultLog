const HEADERS = [
  { label: '日付',          key: 'date' },
  { label: '店舗',          key: 'store' },
  { label: '機種',          key: 'machine' },
  { label: '台番号',        key: 'slotNumber' },
  { label: '投資',          key: 'investment' },
  { label: '投資_現金',     key: 'investmentCash' },
  { label: '投資_貯メダル', key: 'investmentMedal' },
  { label: '回収',          key: 'collection' },
  { label: '回収_現金',     key: 'collectionCash' },
  { label: '回収_貯メダル', key: 'collectionMedal' },
  { label: '開始時間',      key: 'startTime' },
  { label: '終了時間',      key: 'endTime' },
  { label: 'メモ',          key: 'memo' },
];

const escapeField = (val) => {
  const s = val == null ? '' : String(val);
  return s.includes(',') || s.includes('"') || s.includes('\n')
    ? `"${s.replace(/"/g, '""')}"`
    : s;
};

export const exportCSV = (entries, filename = 'resultlog.csv') => {
  const lines = [
    HEADERS.map(h => h.label).join(','),
    ...entries.map(e => HEADERS.map(h => escapeField(e[h.key])).join(',')),
  ];
  // BOM付きUTF-8（Excelで文字化けしないように）
  const blob = new Blob(['﻿' + lines.join('\r\n')], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
};
