import type { Plugin } from 'vite';
import type { TestMaterial } from './src/types/material';

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

function metaContent(html: string, property: string): string | undefined {
  const patterns = [
    new RegExp(`<meta[^>]+property=["']${property}["'][^>]+content=["']([^"']+)["']`, 'i'),
    new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+property=["']${property}["']`, 'i'),
    new RegExp(`<meta[^>]+name=["']${property}["'][^>]+content=["']([^"']+)["']`, 'i'),
  ];
  for (const re of patterns) {
    const m = html.match(re);
    if (m?.[1]) return m[1].trim();
  }
  return undefined;
}

function titleFromHtml(html: string): string | undefined {
  const m = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  return m?.[1]?.trim();
}

/** Rough visible text for UX context when og:image is missing */
function extractVisibleTextFromHtml(html: string, maxLen = 2500): string {
  const stripped = html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  return stripped.slice(0, maxLen);
}

async function fetchImageAsDataUrl(imageUrl: string, maxBytes = 400_000): Promise<string | undefined> {
  try {
    const res = await fetch(imageUrl, {
      headers: { 'User-Agent': 'UXExpertPanel/1.0 (material-capture)' },
    });
    if (!res.ok) return undefined;
    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.length > maxBytes) return undefined;
    const contentType = res.headers.get('content-type') ?? 'image/jpeg';
    if (!contentType.startsWith('image/')) return undefined;
    return `data:${contentType};base64,${buf.toString('base64')}`;
  } catch {
    return undefined;
  }
}

function resolveUrl(base: string, maybeRelative: string): string {
  try {
    return new URL(maybeRelative, base).href;
  } catch {
    return maybeRelative;
  }
}

export async function analyzeUrlForMaterial(url: string): Promise<TestMaterial> {
  const normalized = url.trim();
  const response = await fetch(normalized, {
    headers: {
      'User-Agent':
        'Mozilla/5.0 (compatible; UXExpertPanel/1.0; +https://github.com/moran4829/ux-expert-panel)',
      Accept: 'text/html,application/xhtml+xml',
    },
    redirect: 'follow',
  });

  if (!response.ok) {
    throw new Error(`לא ניתן לטעון את הדף (HTTP ${response.status})`);
  }

  const html = await response.text();
  const title = metaContent(html, 'og:title') ?? titleFromHtml(html);
  const description =
    metaContent(html, 'og:description') ?? metaContent(html, 'description') ?? undefined;
  const ogImage = metaContent(html, 'og:image');
  const imageUrl = ogImage ? resolveUrl(normalized, ogImage) : undefined;
  const imageDataUrl = imageUrl ? await fetchImageAsDataUrl(imageUrl) : undefined;

  const visibleText = extractVisibleTextFromHtml(html);
  const summaryParts = [
    `נאסף חומר מקישור חי: ${normalized}`,
    title ? `כותרת הדף: ${title}` : null,
    description ? `תיאור: ${description}` : null,
    visibleText ? `תוכן גלוי מהדף (מקוצר): ${visibleText}` : null,
    imageDataUrl
      ? 'צולמה תמונת תצוגה (og:image) מהדף — המומחים רואים אותה בניתוח.'
      : 'לא נמצאה תמונת תצוגה; הניתוח מסתמך על טקסט הדף. מומלץ להעלות צילום מסך לדיוק ויזואלי.',
  ].filter(Boolean);

  return {
    kind: 'url',
    sourceUrl: normalized,
    imageDataUrl,
    pageSummary: summaryParts.join('\n'),
  };
}

export function materialApiPlugin(): Plugin {
  return {
    name: 'material-api',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (!req.url?.startsWith('/api/material/analyze-url') || req.method !== 'POST') {
          next();
          return;
        }

        try {
          const body = (await readJsonBody(req)) as { url?: string };
          if (!body?.url?.trim()) {
            sendJson(res, 400, { ok: false, message: 'Missing url' });
            return;
          }

          const material = await analyzeUrlForMaterial(body.url);
          sendJson(res, 200, { ok: true, material });
        } catch (error) {
          sendJson(res, 500, {
            ok: false,
            message: error instanceof Error ? error.message : 'URL analysis failed',
          });
        }
      });
    },
  };
}
