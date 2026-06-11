import React, { useEffect, useMemo, useState } from 'react';
import { cn } from '../../lib/utils';
import { LOGIN_CHARACTERS, pickLoginCharacterIndex } from './loginCharacters';

const ROTATE_MS = 9000;

export function LoginHeroCharacter() {
  const initialIndex = useMemo(() => pickLoginCharacterIndex(), []);
  const [index, setIndex] = useState(initialIndex);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const interval = window.setInterval(() => {
      setVisible(false);
      window.setTimeout(() => {
        setIndex((current) => {
          if (LOGIN_CHARACTERS.length <= 1) return current;
          let next = Math.floor(Math.random() * LOGIN_CHARACTERS.length);
          let guard = 0;
          while (next === current && guard < 12) {
            next = Math.floor(Math.random() * LOGIN_CHARACTERS.length);
            guard += 1;
          }
          return next;
        });
        setVisible(true);
      }, 500);
    }, ROTATE_MS);

    return () => window.clearInterval(interval);
  }, []);

  const character = LOGIN_CHARACTERS[index] ?? LOGIN_CHARACTERS[0];
  const isLarge = character.large === true;

  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center text-center w-full mx-auto',
        isLarge ? 'max-w-lg lg:max-w-xl' : 'max-w-sm lg:max-w-md'
      )}
    >
      <div
        className={cn(
          'w-full flex items-end justify-center transition-opacity duration-1000 ease-in-out',
          isLarge
            ? 'min-h-[22rem] sm:min-h-[28rem] lg:min-h-[36rem]'
            : 'min-h-[14rem] sm:min-h-[18rem] lg:min-h-[22rem]',
          visible ? 'opacity-100' : 'opacity-0'
        )}
      >
        <img
          src={character.src}
          alt=""
          className={cn(
            'w-auto max-w-full h-auto object-contain object-bottom drop-shadow-lg',
            isLarge
              ? 'max-h-[22rem] sm:max-h-[28rem] lg:max-h-[36rem]'
              : 'max-h-[14rem] sm:max-h-[18rem] lg:max-h-[22rem]'
          )}
          draggable={false}
        />
      </div>

      <div
        className={cn(
          'mt-4 px-2 transition-opacity duration-1000 ease-in-out',
          visible ? 'opacity-100' : 'opacity-0'
        )}
      >
        {character.role && (
          <p className="text-[11px] font-semibold tracking-wide text-[var(--color-podium-primary)] mb-1">
            {character.role}
          </p>
        )}
        <p
          className={cn(
            'font-bold text-[var(--color-podium-text)] leading-snug',
            isLarge ? 'text-xl sm:text-2xl max-w-sm mx-auto' : 'text-lg sm:text-xl'
          )}
        >
          {character.name}
        </p>
        <p
          className={cn(
            'mt-2 text-[var(--color-podium-text-secondary)] leading-relaxed max-w-xs mx-auto',
            isLarge ? 'text-base sm:text-lg' : 'text-sm italic'
          )}
        >
          {isLarge ? character.quote : `«${character.quote}»`}
        </p>
      </div>
    </div>
  );
}
