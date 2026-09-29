// バックエンドサーバー（Express）
// ブラウザからはこのサーバーだけを呼び出し、APIキーはサーバー内だけで使う
import 'dotenv/config';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import express from 'express';
import multer from 'multer';
import Anthropic from '@anthropic-ai/sdk';
import { analyzeReceipt } from './receipt.js';

const PORT = process.env.PORT || 3001;

// Claude APIが受け付ける画像形式
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

// アップロードされた画像はディスクに保存せず、メモリ上だけで扱う
// Claude APIの画像サイズ上限（5MB）に合わせて制限する
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (ALLOWED_TYPES.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('JPEG・PNG・GIF・WebP形式の画像を選んでください'));
    }
  },
});

const app = express();

// レシート画像を受け取り、読み取り結果をJSONで返す
app.post('/api/receipt', (req, res) => {
  upload.single('image')(req, res, async (uploadError) => {
    if (uploadError) {
      const message =
        uploadError.code === 'LIMIT_FILE_SIZE'
          ? '画像サイズは5MB以下にしてください'
          : uploadError.message;
      return res.status(400).json({ error: message });
    }
    if (!req.file) {
      return res.status(400).json({ error: '画像が選択されていません' });
    }
    if (!process.env.ANTHROPIC_API_KEY) {
      return res.status(500).json({
        error: 'APIキーが設定されていません。.env に ANTHROPIC_API_KEY を設定してサーバーを再起動してください',
      });
    }

    try {
      const result = await analyzeReceipt(req.file.buffer, req.file.mimetype);
      res.json(result);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: toUserMessage(error) });
    }
  });
});

// エラーの種類に応じて、画面に表示する日本語メッセージを決める
function toUserMessage(error) {
  if (error instanceof Anthropic.AuthenticationError) {
    return 'APIキーが正しくありません。.env の ANTHROPIC_API_KEY を確認してください';
  }
  if (error instanceof Anthropic.RateLimitError) {
    return 'APIの利用上限に達しました。しばらく待ってから再度お試しください';
  }
  if (error instanceof Anthropic.BadRequestError) {
    return '画像を読み取れませんでした。別の画像でお試しください';
  }
  if (error instanceof Anthropic.APIError) {
    return `Claude APIでエラーが発生しました（${error.status ?? '接続エラー'}）`;
  }
  return error.message || 'レシートの読み取りに失敗しました';
}

// 本番用：ビルド済みのフロントエンド（dist）があれば配信する
const distDir = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'dist');
if (fs.existsSync(distDir)) {
  app.use(express.static(distDir));
}

app.listen(PORT, () => {
  if (!process.env.ANTHROPIC_API_KEY) {
    console.warn('⚠ ANTHROPIC_API_KEY が設定されていません。.env を作成してください');
  }
  console.log(`サーバー起動: http://localhost:${PORT}`);
});
