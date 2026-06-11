import type { Plugin } from 'vite';

export type LlmApiProvider = 'ollama' | 'lm_studio';

export type ChatContentPart =
  | { type: 'text'; text: string }
  | { type: 'image_url'; image_url: { url: string } };

export type ChatMessage = {
  role: 'system' | 'user' | 'assistant';
  content: string | ChatContentPart[];
};

export type ChatRequestBody = {
  provider?: LlmApiProvider;
  baseUrl?: string;
  model?: string;
  messages: ChatMessage[];
  maxTokens?: number;
  temperature?: number;
};

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

const DEFAULT_MAX_TOKENS = 1024;

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

function parseUrlParams(url: string): URLSearchParams {
  const idx = url.indexOf('?');
  return new URLSearchParams(idx >= 0 ? url.slice(idx + 1) : '');
}

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

function normalizeOllamaBase(baseUrl: string): string {
  return baseUrl.replace(/\/$/, '').replace(/\/v1$/, '');
}

function normalizeLmStudioBase(baseUrl: string): string {
  const trimmed = baseUrl.replace(/\/$/, '');
  return trimmed.endsWith('/v1') ? trimmed : `${trimmed}/v1`;
}

function formatFetchError(error: unknown, provider: string, baseUrl: string): string {
  const msg = error instanceof Error ? error.message : String(error);
  const cause = error instanceof Error && 'cause' in error ? String((error as { cause?: unknown }).cause) : '';
  const isConnectionError =
    msg.includes('fetch failed') ||
    msg.includes('ECONNREFUSED') ||
    cause.includes('ECONNREFUSED');

  if (isConnectionError) {
    if (provider === 'ollama') {
      return `Ollama לא זמין ב-${baseUrl}. התקינו מ-ollama.com והריצו את האפליקציה, או עברו ל-LM Studio בהגדרות → מנועי LLM.`;
    }
    return `LM Studio לא זמין ב-${baseUrl}. הפעילו Local Server ב-LM Studio וטענו מודל.`;
  }
  return msg;
}

function guessVisionSupport(modelId: string): boolean {
  const lower = modelId.toLowerCase();
  return (
    lower.includes('vl') ||
    lower.includes('vision') ||
    lower.includes('llava') ||
    lower.includes('gemma-4') ||
    lower.includes('gemma4')
  );
}

async function listOllamaModels(baseUrl: string) {
  const root = normalizeOllamaBase(baseUrl);
  const response = await fetch(`${root}/api/tags`);
  if (!response.ok) throw new Error(`Ollama returned ${response.status}`);
  const data = (await response.json()) as {
    models?: { name: string; size?: number }[];
  };
  return (data.models ?? []).map((m) => ({
    id: m.name,
    name: m.name,
    supportsVision: guessVisionSupport(m.name),
    sizeBytes: m.size,
  }));
}

async function listLmStudioModels(baseUrl: string) {
  const apiBase = normalizeLmStudioBase(baseUrl);
  const response = await fetch(`${apiBase}/models`);
  if (!response.ok) throw new Error(`LM Studio returned ${response.status}`);
  const data = (await response.json()) as {
    data?: { id: string }[];
  };
  return (data.data ?? []).map((m) => ({
    id: m.id,
    name: m.id,
    supportsVision: guessVisionSupport(m.id),
  }));
}

async function pullOllamaModel(baseUrl: string, model: string) {
  const root = normalizeOllamaBase(baseUrl);
  const response = await fetch(`${root}/api/pull`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: model, stream: false }),
  });
  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || `Ollama pull failed ${response.status}`);
  }
  return response.json();
}

async function requestOpenAiChat(
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
      reasoning_effort: 'low',
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || `Chat API returned ${response.status}`);
  }

  const data = (await response.json()) as LmChatResponse;
  const choice = data.choices?.[0];
  return { content: extractAssistantText(choice), finishReason: choice?.finish_reason };
}

async function requestOllamaChat(
  baseUrl: string,
  model: string,
  body: ChatRequestBody,
  maxTokens: number
): Promise<{ content: string; finishReason?: string }> {
  const root = normalizeOllamaBase(baseUrl);
  const response = await fetch(`${root}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model,
      messages: body.messages,
      stream: false,
      options: {
        temperature: body.temperature ?? 0.7,
        num_predict: maxTokens,
      },
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || `Ollama returned ${response.status}`);
  }

  const data = (await response.json()) as {
    message?: { content?: string };
    done_reason?: string;
  };
  return {
    content: data.message?.content?.trim() ?? '',
    finishReason: data.done_reason,
  };
}

async function proxyChat(body: ChatRequestBody) {
  const provider = body.provider ?? 'lm_studio';
  const defaultOllama = process.env.OLLAMA_BASE_URL ?? 'http://localhost:11434';
  const defaultLm = process.env.LM_STUDIO_BASE_URL ?? 'http://localhost:1234/v1';

  const baseUrl =
    provider === 'ollama'
      ? normalizeOllamaBase(body.baseUrl ?? defaultOllama)
      : normalizeLmStudioBase(body.baseUrl ?? defaultLm);

  const model =
    body.model ??
    (provider === 'ollama'
      ? (process.env.OLLAMA_MODEL ?? 'qwen3:14b')
      : (process.env.LM_STUDIO_MODEL ?? 'google/gemma-4-e4b'));

  const hasVision = body.messages.some(
    (m) => Array.isArray(m.content) && m.content.some((p) => p.type === 'image_url')
  );
  const maxTokens = body.maxTokens ?? (hasVision ? 2048 : DEFAULT_MAX_TOKENS);

  const chatFn = provider === 'ollama' ? requestOllamaChat : requestOpenAiChat;
  const apiBase = provider === 'ollama' ? baseUrl : baseUrl;

  let result = await chatFn(apiBase, model, body, maxTokens);

  if (!result.content && result.finishReason === 'length') {
    result = await chatFn(apiBase, model, body, Math.min(maxTokens * 2, 4096));
  }

  if (!result.content) {
    throw new Error(
      provider === 'ollama'
        ? 'תשובה ריקה מ-Ollama. ודאו שהמודל מותקן (ollama pull) ושהשרת רץ.'
        : 'תשובה ריקה מ-LM Studio. הגדילו Max Tokens או בחרו מודל אחר.'
    );
  }

  return { content: result.content, model, provider };
}

export function llmApiPlugin(): Plugin {
  return {
    name: 'llm-api',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const url = req.url ?? '';

        if (url.startsWith('/api/llm/models') && req.method === 'GET') {
          try {
            const params = parseUrlParams(url);
            const provider = (params.get('provider') ?? 'ollama') as LlmApiProvider;
            const baseUrl = params.get('baseUrl') ?? undefined;
            const models =
              provider === 'ollama'
                ? await listOllamaModels(baseUrl ?? process.env.OLLAMA_BASE_URL ?? 'http://localhost:11434')
                : await listLmStudioModels(
                    baseUrl ?? process.env.LM_STUDIO_BASE_URL ?? 'http://localhost:1234/v1'
                  );
            sendJson(res, 200, { ok: true, provider, models });
          } catch (error) {
            const provider = parseUrlParams(url).get('provider') ?? 'ollama';
            const baseUrl = parseUrlParams(url).get('baseUrl') ?? 'http://localhost:11434';
            sendJson(res, 503, {
              ok: false,
              message: formatFetchError(error, provider, baseUrl),
            });
          }
          return;
        }

        if (url.startsWith('/api/llm/health') && req.method === 'GET') {
          try {
            const params = parseUrlParams(url);
            const provider = (params.get('provider') ?? 'lm_studio') as LlmApiProvider;
            const baseUrl = params.get('baseUrl') ?? undefined;

            if (provider === 'ollama') {
              const models = await listOllamaModels(
                baseUrl ?? process.env.OLLAMA_BASE_URL ?? 'http://localhost:11434'
              );
              sendJson(res, 200, { ok: true, provider: 'ollama', modelCount: models.length });
            } else {
              const apiBase = normalizeLmStudioBase(
                baseUrl ?? process.env.LM_STUDIO_BASE_URL ?? 'http://localhost:1234/v1'
              );
              const response = await fetch(`${apiBase}/models`);
              if (!response.ok) throw new Error(`HTTP ${response.status}`);
              const data = await response.json();
              sendJson(res, 200, { ok: true, provider: 'lm_studio', models: data });
            }
          } catch (error) {
            const params = parseUrlParams(url);
            const provider = params.get('provider') ?? 'lm_studio';
            const baseUrl =
              params.get('baseUrl') ??
              (provider === 'ollama' ? 'http://localhost:11434' : 'http://localhost:1234/v1');
            sendJson(res, 503, {
              ok: false,
              message: formatFetchError(error, provider, baseUrl),
            });
          }
          return;
        }

        if (url.startsWith('/api/llm/pull') && req.method === 'POST') {
          let pullBaseUrl = process.env.OLLAMA_BASE_URL ?? 'http://localhost:11434';
          try {
            const body = (await readJsonBody(req)) as { baseUrl?: string; model?: string };
            if (!body?.model) {
              sendJson(res, 400, { ok: false, message: 'Missing model' });
              return;
            }
            pullBaseUrl = body.baseUrl ?? pullBaseUrl;
            const result = await pullOllamaModel(pullBaseUrl, body.model);
            sendJson(res, 200, { ok: true, result });
          } catch (error) {
            sendJson(res, 500, {
              ok: false,
              message: formatFetchError(error, 'ollama', pullBaseUrl),
            });
          }
          return;
        }

        if (!url.startsWith('/api/chat') || req.method !== 'POST') {
          next();
          return;
        }

        let chatBody: ChatRequestBody | undefined;
        try {
          chatBody = (await readJsonBody(req)) as ChatRequestBody;
          if (!chatBody?.messages?.length) {
            sendJson(res, 400, { ok: false, message: 'Missing messages' });
            return;
          }

          const result = await proxyChat(chatBody);
          sendJson(res, 200, { ok: true, ...result });
        } catch (error) {
          const provider = chatBody?.provider ?? 'lm_studio';
          const baseUrl =
            chatBody?.baseUrl ??
            (provider === 'ollama' ? 'http://localhost:11434' : 'http://localhost:1234/v1');
          sendJson(res, 500, {
            ok: false,
            message: formatFetchError(error, provider, baseUrl),
          });
        }
      });
    },
  };
}
