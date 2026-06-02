import { MaterialKind, TestMaterial } from '../types/material';
import { compressAvatarImage } from './expertSkill';

const IMAGE_TYPES = /^image\//;
const VIDEO_TYPES = /^video\//;

export function isHttpUrl(value: string): boolean {
  try {
    const u = new URL(value.trim());
    return u.protocol === 'http:' || u.protocol === 'https:';
  } catch {
    return false;
  }
}

export async function fileToCompressedDataUrl(file: File, maxSize = 1024): Promise<string> {
  if (!IMAGE_TYPES.test(file.type)) {
    throw new Error('Not an image');
  }
  return compressAvatarImage(file, maxSize);
}

export async function videoFileToFrameDataUrl(file: File, maxSize = 1024): Promise<string> {
  const objectUrl = URL.createObjectURL(file);
  try {
    const video = document.createElement('video');
    video.muted = true;
    video.playsInline = true;
    video.preload = 'metadata';
    video.src = objectUrl;

    await new Promise<void>((resolve, reject) => {
      video.onloadeddata = () => resolve();
      video.onerror = () => reject(new Error('לא ניתן לטעון את הסרטון'));
      setTimeout(() => reject(new Error('טעינת סרטון נכשלה (timeout)')), 15000);
    });

    video.currentTime = Math.min(1, video.duration * 0.1 || 0);

    await new Promise<void>((resolve) => {
      video.onseeked = () => resolve();
      setTimeout(resolve, 500);
    });

    const canvas = document.createElement('canvas');
    const scale = Math.min(1, maxSize / Math.max(video.videoWidth, video.videoHeight));
    canvas.width = Math.round(video.videoWidth * scale) || maxSize;
    canvas.height = Math.round(video.videoHeight * scale) || maxSize;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas not supported');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL('image/jpeg', 0.82);
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

export async function buildMaterialFromFiles(files: File[]): Promise<TestMaterial> {
  const fileNames = files.map((f) => f.name);
  const first = files[0];

  if (!first) {
    return { kind: 'unknown', fileNames, pageSummary: 'לא הועלו קבצים' };
  }

  if (IMAGE_TYPES.test(first.type)) {
    const imageDataUrl = await fileToCompressedDataUrl(first);
    return {
      kind: 'image',
      imageDataUrl,
      fileNames,
      pageSummary: `תמונת עיצוב/מסך שהועלתה: ${fileNames.join(', ')}. המומחים רואים את התמונה בניתוח.`,
    };
  }

  if (VIDEO_TYPES.test(first.type)) {
    const imageDataUrl = await videoFileToFrameDataUrl(first);
    return {
      kind: 'video',
      imageDataUrl,
      fileNames,
      pageSummary: `סרטון שהועלה: ${fileNames.join(', ')}. הניתוח מבוסס על פריים מייצג מהווידאו.`,
    };
  }

  return {
    kind: 'document',
    fileNames,
    pageSummary: `קובץ שהועלה: ${fileNames.join(', ')}. (סוג: ${first.type || 'לא ידוע'}) — אין תצוגה חזותית; הניתוח מסתמך על הקשר הטקסטואלי.`,
  };
}

export async function analyzeUrlMaterial(url: string): Promise<TestMaterial> {
  const response = await fetch('/api/material/analyze-url', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url: url.trim() }),
  });

  const data = (await response.json()) as {
    ok?: boolean;
    material?: TestMaterial;
    message?: string;
  };

  if (!response.ok || !data.ok || !data.material) {
    throw new Error(data.message ?? 'לא ניתן לנתח את הקישור');
  }

  return data.material;
}

export async function resolveTestMaterial(
  testType: string,
  urlInput: string,
  uploadedFiles: File[]
): Promise<TestMaterial> {
  if (uploadedFiles.length > 0) {
    return buildMaterialFromFiles(uploadedFiles);
  }

  const trimmed = urlInput.trim();
  if (isHttpUrl(trimmed)) {
    return analyzeUrlMaterial(trimmed);
  }

  const kind: MaterialKind =
    testType === 'static_design' ? 'image' : testType === 'prototype' ? 'url' : 'unknown';

  return {
    kind,
    pageSummary: trimmed
      ? `חומר שהוזן: ${trimmed}`
      : 'לא הוזן קישור או קובץ — הניתוח מבוסס על ההקשר הטקסטואלי בלבד.',
  };
}

export function hasAnalyzableMaterial(project: {
  material?: TestMaterial;
  url?: string;
}): boolean {
  const m = project.material;
  if (m?.imageDataUrl || m?.sourceUrl) return true;
  if (m?.fileNames?.length) return true;
  if (project.url && isHttpUrl(project.url)) return true;
  return false;
}

export function deriveProjectName(
  material: TestMaterial,
  urlInput: string,
  fallback = 'בדיקת UX'
): string {
  if (material.sourceUrl) {
    try {
      const host = new URL(material.sourceUrl).hostname.replace(/^www\./, '');
      return `בדיקה: ${host}`;
    } catch {
      return `בדיקה: ${material.sourceUrl.slice(0, 40)}`;
    }
  }
  if (material.fileNames?.[0]) {
    const base = material.fileNames[0].replace(/\.[^.]+$/, '');
    return `בדיקה: ${base}`;
  }
  if (isHttpUrl(urlInput)) {
    try {
      return `בדיקה: ${new URL(urlInput).hostname}`;
    } catch {
      /* ignore */
    }
  }
  return fallback;
}

export function materialContextLines(material: TestMaterial | undefined, fallbackUrl?: string): string[] {
  if (!material) {
    return fallbackUrl ? [`כתובת/חומר (טקסט בלבד): ${fallbackUrl}`] : [];
  }

  const lines = [`סוג חומר לבדיקה: ${material.kind}`];
  if (material.sourceUrl) lines.push(`קישור: ${material.sourceUrl}`);
  else if (fallbackUrl && isHttpUrl(fallbackUrl)) lines.push(`קישור: ${fallbackUrl}`);
  if (material.pageSummary) lines.push(`תיאור החומר: ${material.pageSummary}`);
  if (material.fileNames?.length) lines.push(`קבצים: ${material.fileNames.join(', ')}`);
  if (material.imageDataUrl) {
    lines.push('תמונת המוצר/מסך מצורפת למודל — כל מומחה חייב להתייחס למה שנראה בתמונה.');
  }
  return lines;
}

export function wizardHasMaterialInput(urlInput: string, files: File[]): boolean {
  return files.length > 0 || isHttpUrl(urlInput.trim());
}
