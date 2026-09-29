import { useState } from 'react';
import ManualEntry from './ManualEntry.jsx';
import { negativeItemWarning, findDuplicate, duplicateWarning } from '../validation.js';

// レシート画像のアップロードと読み取り（読み取れない場合は手入力で登録）
export default function ReceiptUpload({ receipts, onAdd }) {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  // 登録後も表示しておく警告（マイナス金額など）
  const [warning, setWarning] = useState('');
  // 重複の疑いがあり、登録するかどうかの確認待ちのレシート
  const [pending, setPending] = useState(null);
  // 手入力フォームの初期値（null のときはフォームを閉じている）
  const [manual, setManual] = useState(null);

  // 画面上のメッセージをすべて消す
  function clearMessages() {
    setError('');
    setMessage('');
    setWarning('');
    setPending(null);
  }

  // 画像が選ばれたらプレビューを表示する
  function handleSelect(e) {
    const selected = e.target.files[0];
    if (preview) URL.revokeObjectURL(preview);
    setFile(selected ?? null);
    setPreview(selected ? URL.createObjectURL(selected) : '');
    clearMessages();
    setManual(null);
  }

  // 次のレシートを選べるように入力をリセットする
  function resetInput(form) {
    if (preview) URL.revokeObjectURL(preview);
    setFile(null);
    setPreview('');
    form.reset();
  }

  // レシートを登録し、マイナス金額があれば警告を出す
  function register(data) {
    onAdd(data);
    setPending(null);
    setManual(null);
    setMessage(`${data.store || 'レシート'}から${data.items.length}件の商品を登録しました`);
    setWarning(negativeItemWarning(data.items));
  }

  // 読み取り・手入力の共通処理：重複の疑いがあれば、登録せずにユーザーの判断を待つ
  function submitReceipt(data) {
    clearMessages();
    if (findDuplicate(receipts, data)) {
      setManual(null);
      setPending(data);
    } else {
      register(data);
    }
  }

  // バックエンドに画像を送り、読み取り結果を受け取る
  async function handleSubmit(e) {
    e.preventDefault();
    if (!file) return;

    const form = e.target;
    setLoading(true);
    clearMessages();
    setManual(null);
    // 商品は読み取れなくても、店名・日付などが分かれば手入力の初期値に使う
    let partial = {};
    try {
      const formData = new FormData();
      formData.append('image', file);
      const res = await fetch('/api/receipt', { method: 'POST', body: formData });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || 'レシートの読み取りに失敗しました');
      }
      if (data.items.length === 0) {
        partial = { store: data.store, date: data.date, time: data.time };
        throw new Error('商品を読み取れませんでした');
      }

      resetInput(form);
      submitReceipt(data);
    } catch (err) {
      // 読み取れなかった場合は、画像を残したまま手入力フォームを開く
      setError(`${err.message}。下のフォームから手入力で登録できます。`);
      setManual(partial);
    } finally {
      setLoading(false);
    }
  }

  // 重複の疑いがあるレシートを登録しない
  function handleCancel() {
    setPending(null);
    setMessage('登録を取りやめました');
  }

  // 手入力をやめる
  function handleManualCancel() {
    setManual(null);
    setError('');
  }

  const duplicate = pending && findDuplicate(receipts, pending);
  const busy = loading || Boolean(pending);

  return (
    <section className="card">
      <h2>レシートを読み込む</h2>
      <form onSubmit={handleSubmit} className="upload-form">
        <input
          type="file"
          accept="image/jpeg,image/png,image/gif,image/webp"
          onChange={handleSelect}
          disabled={busy}
        />
        <button type="submit" disabled={!file || busy}>
          {loading ? '読み取り中…' : '読み取る'}
        </button>
        {!manual && (
          <button
            type="button"
            className="secondary"
            onClick={() => {
              clearMessages();
              setManual({});
            }}
            disabled={busy}
          >
            手入力で登録
          </button>
        )}
      </form>
      {preview && <img src={preview} alt="選択したレシート" className="preview" />}
      {error && <p className="error">{error}</p>}
      {message && <p className="success">{message}</p>}
      {warning && <p className="warning">⚠ {warning}</p>}

      {manual && <ManualEntry initial={manual} onSubmit={submitReceipt} onCancel={handleManualCancel} />}

      {duplicate && (
        <div className="warning-box">
          <p>⚠ {duplicateWarning(duplicate)}</p>
          {negativeItemWarning(pending.items) && <p>⚠ {negativeItemWarning(pending.items)}</p>}
          <div className="warning-actions">
            <button onClick={() => register(pending)}>それでも登録する</button>
            <button className="secondary" onClick={handleCancel}>
              登録しない
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
