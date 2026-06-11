import React from 'react';

export function LoginLandscapeBackground() {
  return (
    <div className="login-scene pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      <div className="login-sky" />
      <div className="login-sun-glow" />
      <div className="login-sun" />

      <svg className="login-hills" viewBox="0 0 1440 320" preserveAspectRatio="none" aria-hidden>
        <path
          className="login-hill login-hill-back"
          d="M0,180 C240,120 480,220 720,160 C960,100 1200,200 1440,140 L1440,320 L0,320 Z"
        />
        <path
          className="login-hill login-hill-mid"
          d="M0,220 C320,170 520,260 840,210 C1080,180 1260,250 1440,220 L1440,320 L0,320 Z"
        />
        <path
          className="login-hill login-hill-front"
          d="M0,260 C360,230 620,290 980,250 C1180,230 1320,270 1440,260 L1440,320 L0,320 Z"
        />
      </svg>

      <div className="login-trees">
        <svg viewBox="0 0 120 140" className="login-tree login-tree-1" aria-hidden>
          <ellipse cx="60" cy="118" rx="34" ry="8" fill="rgba(0,0,0,0.06)" />
          <rect x="54" y="78" width="12" height="42" rx="4" fill="#6B5344" />
          <circle cx="60" cy="58" r="34" fill="#5FA86E" />
          <circle cx="42" cy="68" r="22" fill="#6BB87A" />
          <circle cx="78" cy="66" r="20" fill="#4F9960" />
        </svg>
        <svg viewBox="0 0 120 140" className="login-tree login-tree-2" aria-hidden>
          <ellipse cx="60" cy="118" rx="30" ry="7" fill="rgba(0,0,0,0.05)" />
          <rect x="55" y="82" width="10" height="36" rx="3" fill="#7A6048" />
          <circle cx="60" cy="62" r="30" fill="#68B878" />
          <circle cx="44" cy="72" r="18" fill="#78C888" />
        </svg>
        <svg viewBox="0 0 120 140" className="login-tree login-tree-3" aria-hidden>
          <ellipse cx="60" cy="118" rx="28" ry="6" fill="rgba(0,0,0,0.05)" />
          <rect x="56" y="86" width="8" height="32" rx="2" fill="#6B5344" />
          <circle cx="60" cy="66" r="26" fill="#5FA86E" />
        </svg>
      </div>

      <div className="login-sea">
        <div className="login-wave login-wave-1" />
        <div className="login-wave login-wave-2" />
        <div className="login-wave login-wave-3" />
      </div>

      <div className="login-birds">
        <svg viewBox="0 0 24 12" className="login-bird login-bird-1" aria-hidden>
          <path
            d="M2 8 C6 4, 8 4, 12 8 C16 4, 18 4, 22 8"
            fill="none"
            stroke="rgba(80,70,90,0.35)"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </svg>
        <svg viewBox="0 0 24 12" className="login-bird login-bird-2" aria-hidden>
          <path
            d="M2 7 C6 3, 8 3, 12 7 C16 3, 18 3, 22 7"
            fill="none"
            stroke="rgba(80,70,90,0.28)"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </svg>
        <svg viewBox="0 0 24 12" className="login-bird login-bird-3" aria-hidden>
          <path
            d="M2 6 C6 2, 8 2, 12 6 C16 2, 18 2, 22 6"
            fill="none"
            stroke="rgba(80,70,90,0.22)"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </svg>
      </div>

      <div className="login-scene-shimmer" />
      <div className="login-scene-frost" />
    </div>
  );
}
