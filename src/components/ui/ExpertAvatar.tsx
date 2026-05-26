import React from 'react';
import { cn } from '../../lib/utils';
import { Expert } from '../../types';

type ExpertAvatarProps = React.ComponentPropsWithoutRef<'div'> & {
  expert: Pick<Expert, 'avatar' | 'avatarBg' | 'name'>;
  size?: number;
  imageClassName?: string;
};

export function ExpertAvatar({
  expert,
  size = 36,
  className,
  imageClassName,
  style,
  ...props
}: ExpertAvatarProps) {
  return (
    <div
      className={cn(
        'rounded-full overflow-hidden flex-shrink-0 flex items-center justify-center',
        className
      )}
      style={{ width: size, height: size, backgroundColor: expert.avatarBg, ...style }}
      title={expert.name}
      {...props}
    >
      <img
        src={expert.avatar}
        alt={expert.name}
        className={cn('w-[88%] h-[88%] object-contain', imageClassName)}
      />
    </div>
  );
}
