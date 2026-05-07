/**
 * 棒グラフ（収支）と折れ線（累積収支）の両軸のゼロ位置を揃える。
 * 棒グラフの見た目を守るため、左軸（棒）は自然な範囲のまま固定し、
 * 右軸（折れ線）側だけをゼロ位置に合わせて拡張する。
 */
export function computeSyncedBounds(vals1, vals2) {
  if (!vals1 || !vals2 || !Array.isArray(vals1) || !Array.isArray(vals2)) return null;

  const v1 = vals1.filter(v => v != null);
  const v2 = vals2.filter(v => v != null);
  if (!v1.length || !v2.length) return null;

  const lMax = Math.max(0, ...v1);
  const lMin = Math.min(0, ...v1);
  const rMax = Math.max(0, ...v2);
  const rMin = Math.min(0, ...v2);

  // 左軸（棒グラフ）は自然な範囲を維持
  const lMaxP = lMax === 0 ? 0 : lMax * 1.1;
  const lMinP = lMin === 0 ? 0 : lMin * 1.1;
  const rMaxP = rMax === 0 ? 0 : rMax * 1.1;
  const rMinP = rMin === 0 ? 0 : rMin * 1.1;

  const newLMax = lMaxP || 1;
  const newLMin = lMinP;

  // 左軸のゼロ分率: 下端からゼロまでの比率
  const lRange = newLMax + Math.abs(newLMin);
  const lF = lRange === 0 ? 0.5 : Math.abs(newLMin) / lRange;

  // 右軸を左軸のゼロ位置に合わせてヘッドルームを追加（データは絶対クリップしない）
  let newRMax = rMaxP || 1;
  let newRMin = rMinP;

  if (lF > 0 && lF < 1) {
    const neededRMax = Math.abs(newRMin) * (1 - lF) / lF;
    const neededRMin = -(newRMax * lF / (1 - lF));
    newRMax = Math.max(newRMax, neededRMax);
    newRMin = Math.min(newRMin, neededRMin);
  }

  return {
    left:  { max: newLMax, min: newLMin },
    right: { max: newRMax, min: newRMin }
  };
}

/** アノテーション: 累積収支軸（yRight）のゼロ基準線 */
export const zeroLineAnnotation = {
  annotation: {
    annotations: {
      zeroLine: {
        type: 'line',
        scaleID: 'yRight',
        value: 0,
        borderColor: 'rgba(0, 212, 255, 0.45)',
        borderWidth: 1,
        borderDash: [4, 4]
      }
    }
  }
};

/** アノテーション: 単軸グラフのゼロ基準線 */
export const zeroLineAnnotationSingle = {
  annotation: {
    annotations: {
      zeroLine: {
        type: 'line',
        scaleID: 'y',
        value: 0,
        borderColor: 'rgba(255, 255, 255, 0.2)',
        borderWidth: 1,
        borderDash: [4, 4]
      }
    }
  }
};
