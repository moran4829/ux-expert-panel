import fs from 'fs/promises';
import path from 'path';
import type { Plugin } from 'vite';
import type { TestMaterial } from './src/types/material';

const UPLOADS_ROOT = path.join(process.cwd(), '.data', 'uploads');

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

function safeProjectId(id: string): string {
  const cleaned = id.replace(/[^a-zA-Z0-9_-]/g, '');
  if (!cleaned) throw new Error('מזהה פרויקט לא תקין');
  return cleaned;
}

function extFromMime(mime: string): string {
  if (mime.includes('png')) return 'png';
  if (mime.includes('webp')) return 'webp';
  return 'jpg';
}

function mimeFromExt(ext: string): string {
  if (ext === 'png') return 'image/png';
  if (ext === 'webp') return 'image/webp';
  return 'image/jpeg';
}

function parseDataUrl(dataUrl: string): { mime: string; buffer: Buffer } {
  const match = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
  if (!match) throw new Error('פורמט תמונה לא תקין');
  return { mime: match[1], buffer: Buffer.from(match[2], 'base64') };
}

async function ensureUploadDir(projectId: string): Promise<string> {
  const dir = path.join(UPLOADS_ROOT, safeProjectId(projectId));
  await fs.mkdir(dir, { recursive: true });
  return dir;
}

export async function saveMaterialImageToDisk(
  projectId: string,
  fileName: string,
  dataUrl: string
): Promise<{ imageUrl: string; byteSize: number }> {
  const { mime, buffer } = parseDataUrl(dataUrl);
  if (buffer.length > 6_000_000) {
    throw new Error('התמונה גדולה מדי (מקסימום ~6MB)');
  }

  const dir = await ensureUploadDir(projectId);
  const baseName =
    path.basename(fileName, path.extname(fileName)).replace(/[^a-zA-Z0-9._-]/g, '_') || 'screen';
  const filePath = path.join(dir, `${baseName}.${extFromMime(mime)}`);
  await fs.writeFile(filePath, buffer);

  const safeId = safeProjectId(projectId);
  const imageUrl = `/uploads/${safeId}/${path.basename(filePath)}`;
  return { imageUrl, byteSize: buffer.length };
}

async function materialImageExists(imageUrl: string): Promise<boolean> {
  if (!imageUrl.startsWith('/uploads/')) return false;
  const rel = imageUrl.slice('/uploads/'.length);
  if (rel.includes('..')) return false;
  const filePath = path.join(UPLOADS_ROOT, rel);
  if (!filePath.startsWith(UPLOADS_ROOT)) return false;
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
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

export async function analyzeUrlForMaterial(
  url: string,
  projectId?: string
): Promise<TestMaterial> {
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
  const remoteImageUrl = ogImage ? resolveUrl(normalized, ogImage) : undefined;
  const imageDataUrl = remoteImageUrl ? await fetchImageAsDataUrl(remoteImageUrl) : undefined;

  let storedImageUrl: string | undefined;
  let storedByteSize: number | undefined;
  if (imageDataUrl && projectId) {
    const stored = await saveMaterialImageToDisk(projectId, 'og-image.jpg', imageDataUrl);
    storedImageUrl = stored.imageUrl;
    storedByteSize = stored.byteSize;
  }

  const visibleText = extractVisibleTextFromHtml(html);
  const summaryParts = [
    `נאסף חומר מקישור חי: ${normalized}`,
    title ? `כותרת הדף: ${title}` : null,
    description ? `תיאור: ${description}` : null,
    visibleText ? `תוכן גלוי מהדף (מקוצר): ${visibleText}` : null,
    storedImageUrl
      ? `תמונת תצוגה (og:image) נשמרה בשרת — המומחים רואים אותה בניתוח.`
      : imageDataUrl
        ? 'צולמה תמונת תצוגה (og:image) מהדף — המומחים רואים אותה בניתוח.'
        : 'לא נמצאה תמונת תצוגה; הניתוח מסתמך על טקסט הדף. מומלץ להעלות צילום מסך לדיוק ויזואלי.',
  ].filter(Boolean);

  return {
    kind: 'url',
    sourceUrl: normalized,
    imageUrl: storedImageUrl,
    imageDataUrl: storedImageUrl ? undefined : imageDataUrl,
    storedByteSize,
    pageSummary: summaryParts.join('\n'),
  };
}

async function serveUploadFile(
  req: import('http').IncomingMessage,
  res: import('http').ServerResponse
): Promise<boolean> {
  const rawUrl = req.url ?? '';
  const pathname = rawUrl.split('?')[0];
  if (!pathname.startsWith('/uploads/')) return false;

  const rel = decodeURIComponent(pathname.slice('/uploads/'.length));
  if (!rel || rel.includes('..')) {
    res.statusCode = 403;
    res.end('Forbidden');
    return true;
  }

  const filePath = path.join(UPLOADS_ROOT, rel);
  if (!filePath.startsWith(UPLOADS_ROOT)) {
    res.statusCode = 403;
    res.end('Forbidden');
    return true;
  }

  try {
    const data = await fs.readFile(filePath);
    const ext = path.extname(filePath).slice(1).toLowerCase();
    res.statusCode = 200;
    res.setHeader('Content-Type', mimeFromExt(ext));
    res.setHeader('Cache-Control', 'no-cache');
    res.end(data);
    return true;
  } catch {
    res.statusCode = 404;
    res.end('Not found');
    return true;
  }
}

export function materialApiPlugin(): Plugin {
  return {
    name: 'material-api',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const url = req.url ?? '';

        if (await serveUploadFile(req, res)) return;

        if (url.startsWith('/api/material/verify') && req.method === 'GET') {
          try {
            const params = new URL(url, 'http://localhost').searchParams;
            const imageUrl = params.get('imageUrl') ?? '';
            const exists = imageUrl ? await materialImageExists(imageUrl) : false;
            sendJson(res, 200, { ok: true, exists });
          } catch (error) {
            sendJson(res, 500, {
              ok: false,
              message: error instanceof Error ? error.message : 'Verify failed',
            });
          }
          return;
        }

        if (url.startsWith('/api/material/upload') && req.method === 'POST') {
          try {
            const body = (await readJsonBody(req)) as {
              projectId?: string;
              fileName?: string;
              dataUrl?: string;
            };
            if (!body?.projectId || !body?.dataUrl) {
              sendJson(res, 400, { ok: false, message: 'Missing projectId or dataUrl' });
              return;
            }
            const result = await saveMaterialImageToDisk(
              body.projectId,
              body.fileName ?? 'screen.jpg',
              body.dataUrl
            );
            sendJson(res, 200, { ok: true, ...result });
          } catch (error) {
            sendJson(res, 500, {
              ok: false,
              message: error instanceof Error ? error.message : 'Upload failed',
            });
          }
          return;
        }

        if (url.startsWith('/api/material/analyze-url') && req.method === 'POST') {
          try {
            const body = (await readJsonBody(req)) as { url?: string; projectId?: string };
            if (!body?.url?.trim()) {
              sendJson(res, 400, { ok: false, message: 'Missing url' });
              return;
            }

            const material = await analyzeUrlForMaterial(body.url, body.projectId);
            sendJson(res, 200, { ok: true, material });
          } catch (error) {
            sendJson(res, 500, {
              ok: false,
              message: error instanceof Error ? error.message : 'URL analysis failed',
            });
          }
          return;
        }

        next();
      });
    },
  };
}
