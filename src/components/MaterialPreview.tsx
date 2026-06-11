import React, { useEffect, useState } from 'react';
import { formatByteSize, getMaterialPreviewUrl, verifyMaterialImageOnServer } from '../lib/testMaterial';
import type { TestMaterial } from '../types/material';
import { ImageLightbox } from './ImageLightbox';
import { Card } from './ui/Card';
import { Badge } from './ui/Badge';
import { cn } from '../lib/utils';

type MaterialPreviewProps = {
  material?: TestMaterial;
  /** תצוגה מקומית לפני שמירה בשרת */
  localPreviewUrl?: string | null;
  className?: string;
  compact?: boolean;
  /** ריבוע קטן בצד — ללא כותרות */
  thumbnail?: boolean;
  /** לחיצה על התמונה פותחת תצוגה מלאה */
  expandable?: boolean;
};

export function MaterialPreview({
  material,
  localPreviewUrl,
  className,
  compact = false,
  thumbnail = false,
  expandable = true,
}: MaterialPreviewProps) {
  const previewUrl = localPreviewUrl ?? getMaterialPreviewUrl(material);
  const [loadError, setLoadError] = useState(false);
  const [serverVerified, setServerVerified] = useState<boolean | null>(null);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  useEffect(() => {
    setLoadError(false);
  }, [previewUrl]);

  useEffect(() => {
    if (!material?.imageUrl) {
      setServerVerified(null);
      return;
    }

    let cancelled = false;
    verifyMaterialImageOnServer(material.imageUrl).then((exists) => {
      if (!cancelled) setServerVerified(exists);
    });
    return () => {
      cancelled = true;
    };
  }, [material?.imageUrl]);

  if (!previewUrl) return null;

  const sizeLabel = formatByteSize(material?.storedByteSize);

  if (thumbnail) {
    return (
      <>
        <button
          type="button"
          onClick={expandable ? () => setLightboxOpen(true) : undefined}
          className={cn(
            'w-14 h-14 rounded-[var(--radius-podium-sm)] overflow-hidden border border-[var(--color-podium-border)] bg-white shrink-0',
            expandable && 'cursor-zoom-in hover:ring-2 hover:ring-[var(--color-podium-primary)] transition-shadow',
            className
          )}
          title="לחצו להגדלה"
        >
          {loadError ? (
            <span className="text-[9px] text-[var(--color-podium-danger)] p-1">שגיאה</span>
          ) : (
            <img
              src={previewUrl}
              alt=""
              className="w-full h-full object-cover object-top"
              onError={() => setLoadError(true)}
            />
          )}
        </button>
        {expandable && lightboxOpen && previewUrl && (
          <ImageLightbox
            src={previewUrl}
            alt={material?.fileNames?.[0] ?? 'חומר הבדיקה'}
            onClose={() => setLightboxOpen(false)}
          />
        )}
      </>
    );
  }

  return (
    <Card
      className={cn(
        'border-[var(--color-podium-border)] bg-[var(--color-podium-surface-muted)]/40',
        className
      )}
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div>
          <p className="text-sm font-semibold text-[var(--color-podium-text)]">תצוגה מקדימה של החומר</p>
          <p className="text-xs text-[var(--color-podium-text-secondary)] mt-0.5">
            {material?.imageUrl
              ? 'התמונה נשמרה בתיקיית השרת — זה מה שהמומחים רואים'
              : material?.imageDataUrl && !localPreviewUrl
                ? 'התמונה נשמרה בענן (Firestore) — ללא Firebase Storage'
                : localPreviewUrl
                  ? 'תצוגה לפני שמירה — תישמר בעת יצירת הבדיקה'
                  : 'תמונה מהזיכרון המקומי (legacy)'}
          </p>
        </div>
        <div className="flex flex-wrap gap-1.5 justify-end">
          {material?.imageUrl && (
            <Badge variant={serverVerified ? 'success' : serverVerified === false ? 'warning' : 'default'}>
              {serverVerified ? 'נשמר בשרת' : serverVerified === false ? 'לא נמצא בשרת' : 'בודק...'}
            </Badge>
          )}
          {material?.imageDataUrl && !material?.imageUrl && (
            <Badge variant="success">נשמר בענן</Badge>
          )}
          {sizeLabel && <Badge variant="default">{sizeLabel}</Badge>}
        </div>
      </div>

      {material?.imageUrl && (
        <p className="text-xs font-mono text-[var(--color-podium-text-tertiary)] mb-2 dir-ltr text-left break-all">
          .data/uploads{material.imageUrl.replace('/uploads', '')}
        </p>
      )}

      {loadError ? (
        <div className="rounded-[var(--radius-podium-md)] border border-[var(--color-podium-danger)] bg-[var(--color-podium-danger-bg)] p-4 text-sm text-[var(--color-podium-danger)]">
          לא ניתן להציג את התמונה. ייתכן שהקובץ לא נשמר או שהשרת לא רץ (npm run dev).
        </div>
      ) : (
        <div
          className={cn(
            'rounded-[var(--radius-podium-md)] overflow-hidden border border-[var(--color-podium-border)] bg-white',
            compact ? 'max-h-48' : 'max-h-80',
            expandable && 'cursor-zoom-in group'
          )}
          onClick={expandable ? () => setLightboxOpen(true) : undefined}
          onKeyDown={
            expandable
              ? (e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    setLightboxOpen(true);
                  }
                }
              : undefined
          }
          role={expandable ? 'button' : undefined}
          tabIndex={expandable ? 0 : undefined}
          title={expandable ? 'לחצו להגדלה' : undefined}
        >
          <img
            src={previewUrl}
            alt={material?.fileNames?.[0] ?? 'תצוגה מקדימה של חומר הבדיקה'}
            className="w-full h-full object-contain object-top transition-opacity group-hover:opacity-95"
            onError={() => setLoadError(true)}
          />
        </div>
      )}

      {expandable && lightboxOpen && previewUrl && (
        <ImageLightbox
          src={previewUrl}
          alt={material?.fileNames?.[0] ?? 'חומר הבדיקה'}
          onClose={() => setLightboxOpen(false)}
        />
      )}

      {material?.fileNames?.[0] && (
        <p className="text-xs text-[var(--color-podium-text-tertiary)] mt-2">
          קובץ: {material.fileNames[0]}
        </p>
      )}
    </Card>
  );
}
