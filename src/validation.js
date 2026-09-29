// 読み取ったレシートの検証
import { formatYen } from './summary.js';

// レシートの合計金額（商品金額の合計）
export function receiptTotal(receipt) {
  return receipt.items.reduce((sum, item) => sum + item.price, 0);
}

// 金額がマイナスの商品について、警告メッセージを作る（該当なしは空文字）
export function negativeItemWarning(items) {
  const negatives = items.filter((item) => item.price < 0);
  if (negatives.length === 0) return '';
  const list = negatives.map((item) => `${item.name}（${formatYen(item.price)}）`).join('、');
  return `金額がマイナスの項目があります：${list}。値引き以外の場合は読み取りの誤りの可能性があるため、レシートと照らし合わせてください。`;
}

// 同じ日時・同じ合計金額のレシートが既に登録されていれば、そのレシートを返す（なければ null）
// ・日付が読み取れていないレシートは判定できないため対象外
// ・時刻はどちらかが不明な場合、日付と合計金額だけで判定する
export function findDuplicate(receipts, candidate) {
  if (!candidate.date) return null;
  const total = receiptTotal(candidate);
  return (
    receipts.find(
      (r) =>
        r.date === candidate.date &&
        (!r.time || !candidate.time || r.time === candidate.time) &&
        receiptTotal(r) === total,
    ) ?? null
  );
}

// 重複しているレシートについて、警告メッセージを作る
export function duplicateWarning(existing) {
  const when = [existing.date, existing.time].filter(Boolean).join(' ');
  return `同じ日時・合計金額のレシートが既に登録されています（${when}　${existing.store || '店名不明'}　合計 ${formatYen(receiptTotal(existing))}）。同じレシートを二重に登録していないか確認してください。`;
}
