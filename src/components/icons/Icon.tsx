import React, { useMemo } from 'react';
import { cn } from '../../lib/utils';

export type IconProps = Omit<React.ComponentPropsWithoutRef<'span'>, 'children'> & {
  size?: number;
  svg: string;
};

function normalizeSvg(svg: string, size: number, className?: string) {
  return svg
    .replace(/#25252D/gi, 'currentColor')
    .replace(/width="24"/, `width="${size}"`)
    .replace(/height="24"/, `height="${size}"`)
    .replace(
      /<svg/,
      `<svg aria-hidden="true" class="${cn('inline-block shrink-0', className)}"`
    );
}

export function VuesaxIcon({ svg, size = 20, className, ...props }: IconProps) {
  const html = useMemo(() => normalizeSvg(svg, size, className), [svg, size, className]);

  return <span className="inline-flex" dangerouslySetInnerHTML={{ __html: html }} {...props} />;
}
