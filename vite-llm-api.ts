import type { Plugin } from 'vite';

export type ChatContentPart =
  | { type: 'text'; text: string }
  | { type: 'image_url'; image_url: { url: string } };

export type ChatMessage = {
  role: 'system' | 'user' | 'assistant';
  content: string | ChatContentPart[];
};

type ChatRequestBody = {
  baseUrl?: string;
  model?: string;
  messages: ChatMessage[];
  maxTokens?: number;
  temperature?: number;
};

function readJsonBody(req: import('http').IncomingMessage): Promise<unknown> {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk;
    });
    req.on('end', () => {
      try {
        resolve(JSON.parse(body));
      } catch (error) {
        reject(error);
      }
    });
    req.on('error', reject);
  });
}

function sendJson(res: import('http').ServerResponse, status: number, data: unknown) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(data));
}

type LmChoice = {
  finish_reason?: string;
  message?: {
    content?: string | null;
    reasoning_content?: string | null;
  };
};

type LmChatResponse = {
  choices?: LmChoice[];
};

/** Gemma 4 / reasoning models may spend all tokens on thinking unless max_tokens is high enough. */
const DEFAULT_MAX_TOKENS = 1024;

function extractTaggedLine(text: string): string | null {
  const match = text.match(/\[(OBSERVATION|CONFLICT|RECOMMENDATION|המלצה)\][^\n]*/i);
  return match?.[0]?.trim() ?? null;
}

function extractAssistantText(choice: LmChoice | undefined): string {
  const message = choice?.message;
  const content = message?.content?.trim();
  if (content) return content;

  const reasoning = message?.reasoning_content?.trim();
  if (reasoning) {
    const tagged = extractTaggedLine(reasoning);
    if (tagged) return tagged;
  }

  return '';
}

async function requestLmStudioChat(
  baseUrl: string,
  model: string,
  body: ChatRequestBody,
  maxTokens: number
): Promise<{ content: string; finishReason?: string }> {
  const response = await fetch(`${baseUrl}/chat/completions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model,
      messages: body.messages,
      max_tokens: maxTokens,
      temperature: body.temperature ?? 0.7,
      stream: false,
      // Reduces thinking token use on Gemma 4 / reasoning models in LM Studio
      reasoning_effort: 'low',
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || `LM Studio returned ${response.status}`);
  }

  const data = (await response.json()) as LmChatResponse;
  const choice = data.choices?.[0];
  const content = extractAssistantText(choice);
  return { content, finishReason: choice?.finish_reason };
}

async function proxyLmStudioChat(body: ChatRequestBody) {
  const baseUrl = (body.baseUrl ?? process.env.LM_STUDIO_BASE_URL ?? 'http://localhost:1234/v1').replace(
    /\/$/,
    ''
  );
  const model = body.model ?? process.env.LM_STUDIO_MODEL ?? 'google/gemma-4-e4b';
  const hasVision = body.messages.some(
    (m) => Array.isArray(m.content) && m.content.some((p) => p.type === 'image_url')
  );
  const maxTokens = body.maxTokens ?? (hasVision ? 1536 : DEFAULT_MAX_TOKENS);

  let result = await requestLmStudioChat(baseUrl, model, body, maxTokens);

  if (!result.content && result.finishReason === 'length') {
    result = await requestLmStudioChat(baseUrl, model, body, Math.min(maxTokens * 2, 2048));
  }

  if (!result.content) {
    throw new Error(
      'תשובה ריקה מ-LM Studio. במודלי Gemma 4 עם "חשיבה", הגדילו Max Tokens ב-LM Studio או בחרו reasoning נמוך — האפליקציה כבר שולחת reasoning_effort=low ו-max_tokens=1024.'
    );
  }

  return { content: result.content, model };
}

export function llmApiPlugin(): Plugin {
  return {
    name: 'llm-api',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const url = req.url ?? '';

        if (url.startsWith('/api/llm/health') && req.method === 'GET') {
          try {
            const baseUrl = (process.env.LM_STUDIO_BASE_URL ?? 'http://localhost:1234/v1').replace(
              /\/$/,
              ''
            );
            const response = await fetch(`${baseUrl}/models`);
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            const data = await response.json();
            sendJson(res, 200, { ok: true, baseUrl, models: data });
          } catch (error) {
            sendJson(res, 503, {
              ok: false,
              message: error instanceof Error ? error.message : 'LM Studio unreachable',
            });
          }
          return;
        }

        if (!url.startsWith('/api/chat') || req.method !== 'POST') {
          next();
          return;
        }

        try {
          const body = (await readJsonBody(req)) as ChatRequestBody;
          if (!body?.messages?.length) {
            sendJson(res, 400, { ok: false, message: 'Missing messages' });
            return;
          }

          const result = await proxyLmStudioChat(body);
          sendJson(res, 200, { ok: true, ...result });
        } catch (error) {
          sendJson(res, 500, {
            ok: false,
            message: error instanceof Error ? error.message : 'Chat request failed',
          });
        }
      });
    },
  };
}
