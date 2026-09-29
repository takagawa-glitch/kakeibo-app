import { useState } from 'react';
import { CATEGORIES } from '../categories.js';
import { formatYen } from '../summary.js';

// 空の商品行を作る
function emptyRow() {
  return { id: crypto.randomUUID(), name: '', price: '', category: CATEGORIES[0] };
}

// 今日の日付（YYYY-MM-DD）
function today() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

// 入力内容をチェックし、エラーメッセージの一覧を返す（問題なければ空配列）
function validate(date, rows) {
  const errors = [];
  if (!date) errors.push('日付を入力してください');

  // 商品名・金額のどちらも空の行は、入力されていないものとして無視する
  const filled = rows.filter((r) => r.name.trim() || r.price !== '');
  if (filled.length === 0) errors.push('商品を1件以上入力してください');

  filled.forEach((row, index) => {
    const label = `${index + 1}行目`;
    if (!row.name.trim()) errors.push(`${label}：商品名を入力してください`);
    const price = Number(row.price);
    if (row.price === '' || !Number.isInteger(price)) {
      errors.push(`${label}：金額を整数（円）で入力してください`);
    } else if (price === 0) {
      errors.push(`${label}：金額に0円は入力できません`);
    }
  });
  return errors;
}

// レシートを手入力で登録するフォーム
// initial … 読み取りで分かった店名・日付・時刻（あれば初期値に使う）
export default function ManualEntry({ initial = {}, onSubmit, onCancel }) {
  const [store, setStore] = useState(initial.store ?? '');
  const [date, setDate] = useState(initial.date || today());
  const [time, setTime] = useState(initial.time ?? '');
  const [rows, setRows] = useState([emptyRow()]);
  const [errors, setErrors] = useState([]);

  // 指定した行の項目を書き換える
  function updateRow(id, field, value) {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, [field]: value } : r)));
  }

  function removeRow(id) {
    setRows((prev) => (prev.length > 1 ? prev.filter((r) => r.id !== id) : [emptyRow()]));
  }

  // 入力中の合計金額（整数として読める金額だけを足す）
  const total = rows.reduce((sum, r) => {
    const price = Number(r.price);
    return r.price !== '' && Number.isInteger(price) ? sum + price : sum;
  }, 0);

  function handleSubmit(e) {
    e.preventDefault();
    const found = validate(date, rows);
    setErrors(found);
    if (found.length > 0) return;

    // 読み取り結果と同じ形にそろえて渡す
    onSubmit({
      store: store.trim(),
      date,
      time,
      items: rows
        .filter((r) => r.name.trim() || r.price !== '')
        .map((r) => ({ name: r.name.trim(), price: Number(r.price), category: r.category })),
    });
  }

  return (
    <form className="manual-entry" onSubmit={handleSubmit} noValidate>
      <h3>手入力で登録</h3>

      <div className="manual-fields">
        <label>
          店名
          <input type="text" value={store} onChange={(e) => setStore(e.target.value)} placeholder="例：スーパー〇〇" />
        </label>
        <label>
          日付 <span className="required">必須</span>
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </label>
        <label>
          時刻
          <input type="time" value={time} onChange={(e) => setTime(e.target.value)} />
        </label>
      </div>

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>商品名</th>
              <th>金額（円）</th>
              <th>カテゴリ</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id}>
                <td>
                  <input
                    type="text"
                    value={row.name}
                    onChange={(e) => updateRow(row.id, 'name', e.target.value)}
                    aria-label="商品名"
                  />
                </td>
                <td>
                  <input
                    type="number"
                    step="1"
                    className="price-input"
                    value={row.price}
                    onChange={(e) => updateRow(row.id, 'price', e.target.value)}
                    aria-label="金額"
                  />
                </td>
                <td>
                  <select value={row.category} onChange={(e) => updateRow(row.id, 'category', e.target.value)}>
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </td>
                <td>
                  <button type="button" className="link-button" onClick={() => removeRow(row.id)}>
                    削除
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="manual-footer">
        <button type="button" className="secondary" onClick={() => setRows((prev) => [...prev, emptyRow()])}>
          ＋ 商品を追加
        </button>
        <span>
          合計 <strong>{formatYen(total)}</strong>
        </span>
      </div>

      {errors.length > 0 && (
        <ul className="error">
          {errors.map((message) => (
            <li key={message}>{message}</li>
          ))}
        </ul>
      )}

      <div className="warning-actions">
        <button type="submit">登録する</button>
        <button type="button" className="secondary" onClick={onCancel}>
          キャンセル
        </button>
      </div>
    </form>
  );
}
