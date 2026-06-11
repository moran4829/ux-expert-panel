export type MaterialKind = 'url' | 'image' | 'video' | 'document' | 'unknown';

export interface TestMaterial {
  kind: MaterialKind;
  /** HTTP(S) link when kind is url */
  sourceUrl?: string;
  /** נתיב שמור בשרת הפיתוח — למשל /uploads/proj-123/screen.jpg */
  imageUrl?: string;
  /** JPEG/PNG data URL — legacy או לפני שמירה בשרת */
  imageDataUrl?: string;
  /** גודל הקובץ בשרת (בתים) */
  storedByteSize?: number;
  /** Human-readable summary: page meta, file names, capture notes */
  pageSummary?: string;
  /** Original uploaded file names */
  fileNames?: string[];
}
