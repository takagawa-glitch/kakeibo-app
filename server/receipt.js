// Claude APIを使ってレシート画像を読み取る処理
import Anthropic from '@anthropic-ai/sdk';
import { z } from 'zod';
import { zodOutputFormat } from '@anthropic-ai/sdk/helpers/zod';
import { CATEGORIES } from '../src/categories.js';

// 使用するモデル（Claude Haikuの最新版）
const MODEL = 'claude-haiku-4-5';

// APIキーは環境変数 ANTHROPIC_API_KEY（.envから読み込み）から自動で取得される
const client = new Anthropic();

// Claudeに返してもらうJSONの形（この形に沿った出力が保証される）
// ※ SDKは選択肢（enum）や整数の制約をAPIに送る際に説明文へ変換するため、
//    カテゴリと金額は文字列・数値として受け取り、下の normalizeItem で補正する
const ReceiptSchema = z.object({
  store: z.string().describe('店名。読み取れなければ空文字'),
  date: z.string().describe('購入日（YYYY-MM-DD形式）。読み取れなければ空文字'),
  time: z.string().describe('購入時刻（HH:MM形式・24時間表記）。読み取れなければ空文字'),
  items: z.array(
    z.object({
      name: z.string().describe('商品名'),
      price: z.number().describe('その商品の支払金額（円・整数）。値引きはマイナス'),
      category: z.string().describe(`商品のカテゴリ。次のいずれか: ${CATEGORIES.join('、')}`),
    }),
  ),
});

// 一覧にないカテゴリは「その他」に、金額は整数にそろえる
function normalizeItem(item) {
  return {
    name: item.name,
    price: Math.round(item.price),
    category: CATEGORIES.includes(item.category) ? item.category : 'その他',
  };
}

// 時刻を「HH:MM」にそろえる（「9:05」→「09:05」）。形式が違えば空文字にする
function normalizeTime(time) {
  const match = /^(\d{1,2}):(\d{2})/.exec(time);
  return match ? `${match[1].padStart(2, '0')}:${match[2]}` : '';
}

const PROMPT = `このレシート画像を読み取り、店名・購入日・商品ごとの名前と金額を抽出してください。

ルール:
- 金額は数量を掛けた後の、その行の支払金額（円・整数）にしてください。
- 値引き・割引の行は、マイナスの金額の項目として含め、カテゴリは値引き対象の商品（通常は直前の商品）と同じにしてください。
- 小計・合計・税額・お預り・お釣りの行は商品に含めないでください。
- 各商品を次のカテゴリのいずれかに分類してください: ${CATEGORIES.join('、')}
  - スーパー等で買った食材・飲み物・お菓子は「食費」、飲食店での食事は「外食」にしてください。
- 日付の年が省略されている場合は、今年（${new Date().getFullYear()}年）として扱ってください。
- レシートではない画像の場合は、items を空の配列にしてください。`;

/**
 * レシート画像を解析して、店名・日付・商品一覧を返す
 * @param {Buffer} imageBuffer 画像データ
 * @param {string} mediaType 画像の形式（image/jpeg など）
 */
export async function analyzeReceipt(imageBuffer, mediaType) {
  const response = await client.messages.parse({
    model: MODEL,
    max_tokens: 8000,
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'image',
            source: {
              type: 'base64',
              media_type: mediaType,
              data: imageBuffer.toString('base64'),
            },
          },
          { type: 'text', text: PROMPT },
        ],
      },
    ],
    output_config: { format: zodOutputFormat(ReceiptSchema) },
  });

  // 途中で打ち切られた・拒否された場合はエラーにする
  if (response.stop_reason === 'max_tokens') {
    throw new Error('レシートの内容が多すぎて読み取りきれませんでした');
  }
  if (response.stop_reason === 'refusal') {
    throw new Error('この画像は読み取りできませんでした');
  }
  if (!response.parsed_output) {
    throw new Error('読み取り結果の形式が正しくありませんでした');
  }

  const { store, date, time, items } = response.parsed_output;
  return { store, date, time: normalizeTime(time), items: items.map(normalizeItem) };
}
