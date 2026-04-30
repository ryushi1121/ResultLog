/**
 * 棒グラフ（収支）と折れ線（累積収支）の両軸のゼロ位置を揃えるための
 * min/max を計算する。
 *
 * 片方が全マイナス（累積が一度もプラスにならない）場合も、
 * もう一方の軸のゼロ分率に合わせて正方向のヘッドルームを追加する。
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

  const lMaxP = lMax === 0 ? 0 : lMax * 1.1;
  const lMinP = lMin === 0 ? 0 : lMin * 1.1;
  const rMaxP = rMax === 0 ? 0 : rMax * 1.1;
  const rMinP = rMin === 0 ? 0 : rMin * 1.1;

  // f = 下端からゼロまでの割合 (0=全プラス, 1=全マイナス, (0,1)=混合)
  const calcF = (maxP, minP) => {
    if (maxP === 0 && minP === 0) return 0.5;
    if (maxP === 0) return 1;
    if (minP === 0) return 0;
    return Math.abs(minP) / (maxP + Math.abs(minP));
  };

  const lF = calcF(lMaxP, lMinP);
  const rF = calcF(rMaxP, rMinP);

  let newLMax = lMaxP || 1;
  let newLMin = lMinP;
  let newRMax = rMaxP || 1;
  let newRMin = rMinP;

  if (lF > 0 && lF < 1 && rF > 0 && rF < 1) {
    // 両方混合: 負の割合が大きい方に合わせて min を拡張
    const targetF = Math.max(lF, rF);
    if (lF < targetF) newLMin = -(lMaxP * targetF / (1 - targetF));
    if (rF < targetF) newRMin = -(rMaxP * targetF / (1 - targetF));
  } else if (rF === 1 && lF > 0 && lF < 1) {
    // 右軸が全マイナス: 左のゼロ位置に合わせて右に正ヘッドルームを追加
    newRMax = Math.abs(rMinP) * (1 - lF) / lF;
  } else if (lF === 1 && rF > 0 && rF < 1) {
    // 左軸が全マイナス: 右のゼロ位置に合わせて左に正ヘッドルームを追加
    newLMax = Math.abs(lMinP) * (1 - rF) / rF;
  } else if (rF === 0 && lF > 0 && lF < 1) {
    // 右軸が全プラス: 左のゼロ位置に合わせて右に負ヘッドルームを追加
    newRMin = -(rMaxP * lF / (1 - lF));
  } else if (lF === 0 && rF > 0 && rF < 1) {
    // 左軸が全プラス: 右のゼロ位置に合わせて左に負ヘッドルームを追加
    newLMin = -(lMaxP * rF / (1 - rF));
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
