export type MaterialKind = 'url' | 'image' | 'video' | 'document' | 'unknown';

export interface TestMaterial {
  kind: MaterialKind;
  /** HTTP(S) link when kind is url */
  sourceUrl?: string;
  /** JPEG/PNG data URL for vision models (image, video frame, or og:image from URL) */
  imageDataUrl?: string;
  /** Human-readable summary: page meta, file names, capture notes */
  pageSummary?: string;
  /** Original uploaded file names */
  fileNames?: string[];
}
