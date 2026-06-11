// api/chat.ts — Vercel Serverless Function
// מחליף את vite-llm-api.ts לפרודקשן

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenerativeAI, Part } from '@google/generative-ai';

type ChatContentPart =
  | { type: 'text'; text: string }
  | { type: 'image_url'; image_url: { url: string } };

type ChatMessage = {
  role: 'system' | 'user' | 'assistant';
  content: string | ChatContentPart[];
};

type ChatRequestBody = {
  provider?: string;
  baseUrl?: string;
  model?: string;
  messages: ChatMessage[];
  maxTokens?: number;
  temperature?: number;
};

// ממיר מבנה OpenAI-style ל-Gemini
function convertMessagesToGemini(messages: ChatMessage[]) {
  const systemParts: string[] = [];
  const history: { role: 'user' | 'model'; parts: Part[] }[] = [];
  let lastUserParts: Part[] | null = null;

  for (const msg of messages) {
    if (msg.role === 'system') {
      const text = typeof msg.content === 'string' ? msg.content : '';
      systemParts.push(text);
      continue;
    }

    const parts: Part[] = [];

    if (typeof msg.content === 'string') {
      parts.push({ text: msg.content });
    } else {
      for (const part of msg.content) {
        if (part.type === 'text') {
          parts.push({ text: part.text });
        } else if (part.type === 'image_url') {
          const url = part.image_url.url;
          // base64 data URL
          if (url.startsWith('data:')) {
            const [meta, data] = url.split(',');
            const mimeType = meta.split(':')[1].split(';')[0] as
              | 'image/jpeg'
              | 'image/png'
              | 'image/webp'
              | 'image/gif';
            parts.push({ inlineData: { mimeType, data } });
          } else {
            // URL חיצוני — שולחים כטקסט (Gemini לא תומך ב-URL ישיר)
            parts.push({ text: `[Image URL: ${url}]` });
          }
        }
      }
    }

    if (msg.role === 'user') {
      lastUserParts = parts;
      history.push({ role: 'user', parts });
    } else if (msg.role === 'assistant') {
      history.push({ role: 'model', parts });
      lastUserParts = null;
    }
  }

  // ה-turn האחרון של ה-user נשלח נפרד כ-prompt
  const lastUser = lastUserParts ?? [{ text: '' }];
  const chatHistory = history.slice(0, -1); // בלי הודעה אחרונה

  return {
    systemInstruction: systemParts.join('\n\n') || undefined,
    history: chatHistory,
    lastUserParts: lastUser,
  };
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, message: 'Method not allowed' });
  }

  const body = req.body as ChatRequestBody;

  if (!body?.messages?.length) {
    return res.status(400).json({ ok: false, message: 'Missing messages' });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ ok: false, message: 'GEMINI_API_KEY לא מוגדר ב-Vercel' });
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);

    // בחירת מודל: flash לטקסט, flash עם vision לתמונות
    const hasVision = body.messages.some(
      (m) =>
        Array.isArray(m.content) &&
        m.content.some((p) => p.type === 'image_url')
    );

    // gemini-2.0-flash תומך בטקסט + vision, context window ענק, זול מאוד
    const modelName = body.model?.startsWith('gemini')
      ? body.model
      : 'gemini-2.0-flash';

    const { systemInstruction, history, lastUserParts } =
      convertMessagesToGemini(body.messages);

    const model = genAI.getGenerativeModel({
      model: modelName,
      systemInstruction: systemInstruction
        ? { role: 'system', parts: [{ text: systemInstruction }] }
        : undefined,
      generationConfig: {
        maxOutputTokens: body.maxTokens ?? (hasVision ? 2048 : 1024),
        temperature: body.temperature ?? 0.55,
      },
    });

    const chat = model.startChat({ history });
    const result = await chat.sendMessage(lastUserParts);
    const content = result.response.text().trim();

    if (!content) {
      return res.status(500).json({
        ok: false,
        message: 'תשובה ריקה מ-Gemini. נסו שוב.',
      });
    }

    return res.status(200).json({
      ok: true,
      content,
      model: modelName,
      provider: 'gemini',
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'שגיאה לא ידועה';
    return res.status(500).json({ ok: false, message });
  }
}
