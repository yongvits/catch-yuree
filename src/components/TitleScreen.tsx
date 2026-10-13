import React, { useState, useEffect } from 'react';
import { soundManager } from '../audio/soundManager';

interface TitleScreenProps {
  onStartGame: () => void;
}

// Helper to resolve asset URLs correctly across local dev, Vite base, and GitHub Pages (e.g. /catch-yuree/)
export const resolveAssetPath = (fileName: string): string => {
  const cleanName = fileName.replace(/^\/+/, '');
  if (typeof window !== 'undefined') {
    const pathname = window.location.pathname;
    let base = '/';
    if (pathname && pathname !== '/') {
      if (pathname.endsWith('/')) {
        base = pathname;
      } else if (/\.[a-zA-Z0-9]+$/.test(pathname)) {
        base = pathname.replace(/\/[^/]*$/, '/');
      } else {
        base = `${pathname}/`;
      }
    }
    return `${base}${cleanName}`;
  }
  const viteBase = import.meta.env.BASE_URL || './';
  const cleanBase = viteBase.endsWith('/') ? viteBase : `${viteBase}/`;
  return `${cleanBase}${cleanName}`;
};

export const getAssetCandidates = (fileName: string): string[] => {
  const cleanName = fileName.replace(/^\/+/, '');
  const resolved = resolveAssetPath(cleanName);
  const candidates = [
    resolved,
    `./${cleanName}`,
    cleanName,
    `/catch-yuree/${cleanName}`,
    `/${cleanName}`,
  ];
  return Array.from(new Set(candidates));
};

// "Tap to Start" wooden plank button: uses user's uploaded Image 1 (A9BC3D04-3E6A-471B-B545-EDE2038E33DF.png)
// with high-fidelity vector fallback
export const TapToStartButton: React.FC<{ onClick?: () => void; className?: string }> = ({
  onClick,
  className,
}) => {
  const [imgFailed, setImgFailed] = useState(false);
  const [attemptIndex, setAttemptIndex] = useState(0);
  const buttonCandidates = getAssetCandidates('A9BC3D04-3E6A-471B-B545-EDE2038E33DF.png');

  const handleBtnError = () => {
    if (attemptIndex < buttonCandidates.length - 1) {
      setAttemptIndex(attemptIndex + 1);
    } else {
      setImgFailed(true);
    }
  };

  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        onClick?.();
      }}
      className={`group relative cursor-pointer active:scale-95 transition-all duration-150 select-none ${className || ''}`}
      style={{ touchAction: 'manipulation' }}
      aria-label="Tap to Start"
    >
      {!imgFailed ? (
        <img
          key={buttonCandidates[attemptIndex]}
          src={buttonCandidates[attemptIndex]}
          alt="Tap to Start"
          referrerPolicy="no-referrer"
          onError={handleBtnError}
          className="w-72 sm:w-88 md:w-[440px] h-auto drop-shadow-[0_16px_36px_rgba(0,0,0,0.75)] group-hover:scale-105 group-active:scale-95 transition-transform duration-200 object-contain pointer-events-none select-none"
        />
      ) : (
        <svg
          viewBox="0 0 520 140"
          className="w-72 sm:w-88 md:w-[440px] h-auto drop-shadow-[0_16px_36px_rgba(0,0,0,0.75)] group-hover:scale-105 group-active:scale-95 transition-transform duration-200"
        >
          <defs>
            <linearGradient id="woodGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#fed7aa" />
              <stop offset="15%" stopColor="#f59e0b" />
              <stop offset="65%" stopColor="#d97706" />
              <stop offset="100%" stopColor="#b45309" />
            </linearGradient>
            <linearGradient id="leafGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#86efac" />
              <stop offset="40%" stopColor="#22c55e" />
              <stop offset="100%" stopColor="#15803d" />
            </linearGradient>
            <filter id="woodShadow" x="-10%" y="-10%" width="120%" height="120%">
              <feDropShadow dx="0" dy="5" stdDeviation="4" floodColor="#1e0c03" floodOpacity="0.75" />
            </filter>
          </defs>

          {/* Left Leaves */}
          <g id="left-leaves">
            <path
              d="M 68 62 C 45 38, 38 16, 54 10 C 72 4, 85 26, 80 58 Z"
              fill="url(#leafGrad)"
              stroke="#14532d"
              strokeWidth="3.8"
            />
            <path d="M 54 10 C 65 30, 72 45, 75 58" stroke="#bbf7d0" strokeWidth="2.5" fill="none" strokeLinecap="round" />
            <ellipse cx="60" cy="22" rx="4" ry="8" fill="#ffffff" opacity="0.65" transform="rotate(-20 60 22)" />
            <path
              d="M 65 72 C 28 64, 10 75, 14 93 C 17 110, 45 110, 75 88 Z"
              fill="url(#leafGrad)"
              stroke="#14532d"
              strokeWidth="3.8"
            />
            <path d="M 14 93 C 35 88, 55 84, 72 82" stroke="#bbf7d0" strokeWidth="2.5" fill="none" strokeLinecap="round" />
            <ellipse cx="32" cy="85" rx="5" ry="9" fill="#ffffff" opacity="0.6" transform="rotate(-65 32 85)" />
            <path
              d="M 78 86 C 55 106, 42 126, 58 133 C 75 140, 92 122, 88 92 Z"
              fill="#15803d"
              stroke="#14532d"
              strokeWidth="3.8"
            />
          </g>

          {/* Right Leaves */}
          <g id="right-leaves">
            <path
              d="M 452 62 C 475 38, 482 16, 466 10 C 448 4, 435 26, 440 58 Z"
              fill="url(#leafGrad)"
              stroke="#14532d"
              strokeWidth="3.8"
            />
            <path d="M 466 10 C 455 30, 448 45, 445 58" stroke="#bbf7d0" strokeWidth="2.5" fill="none" strokeLinecap="round" />
            <ellipse cx="460" cy="22" rx="4" ry="8" fill="#ffffff" opacity="0.65" transform="rotate(20 460 22)" />
            <path
              d="M 455 72 C 492 64, 510 75, 506 93 C 503 110, 475 110, 445 88 Z"
              fill="url(#leafGrad)"
              stroke="#14532d"
              strokeWidth="3.8"
            />
            <path d="M 506 93 C 485 88, 465 84, 448 82" stroke="#bbf7d0" strokeWidth="2.5" fill="none" strokeLinecap="round" />
            <ellipse cx="488" cy="85" rx="5" ry="9" fill="#ffffff" opacity="0.6" transform="rotate(65 488 85)" />
            <path
              d="M 442 86 C 465 106, 478 126, 462 133 C 445 140, 428 122, 432 92 Z"
              fill="#15803d"
              stroke="#14532d"
              strokeWidth="3.8"
            />
          </g>

          {/* Wooden Plank Base */}
          <g id="wooden-plank" filter="url(#woodShadow)">
            <rect
              x="68"
              y="24"
              width="384"
              height="92"
              rx="46"
              fill="#231004"
            />
            <rect
              x="72"
              y="28"
              width="376"
              height="84"
              rx="42"
              fill="url(#woodGrad)"
              stroke="#2d1405"
              strokeWidth="2.5"
            />
            <path d="M 85 54 Q 260 51 435 55" stroke="#fef08a" strokeWidth="2.5" opacity="0.6" fill="none" />
            <path d="M 80 84 Q 260 88 440 83" stroke="#78350f" strokeWidth="2.5" opacity="0.55" fill="none" />
            <path d="M 95 38 Q 260 34 425 39" stroke="#ffffff" strokeWidth="3" opacity="0.65" strokeLinecap="round" fill="none" />
            <path d="M 88 98 Q 260 102 432 96" stroke="#451a03" strokeWidth="2" opacity="0.45" fill="none" />
          </g>

          {/* Jasmine Rice Grains on Plank */}
          <ellipse
            cx="108"
            cy="78"
            rx="15"
            ry="7.5"
            fill="#ffffff"
            stroke="#271206"
            strokeWidth="3"
            transform="rotate(24 108 78)"
          />
          <path d="M 97 75 Q 108 77 119 80" stroke="#fef08a" strokeWidth="1.8" fill="none" />
          <ellipse
            cx="412"
            cy="78"
            rx="15"
            ry="7.5"
            fill="#ffffff"
            stroke="#271206"
            strokeWidth="3"
            transform="rotate(-24 412 78)"
          />
          <path d="M 401 80 Q 412 77 423 75" stroke="#fef08a" strokeWidth="1.8" fill="none" />

          {/* "Tap to Start" Text */}
          <text
            x="260"
            y="84"
            textAnchor="middle"
            fontSize="49"
            fontWeight="900"
            fontFamily="'Kanit', 'Arial Black', sans-serif"
            fill="#ffffff"
            stroke="#231004"
            strokeWidth="9"
            strokeLinejoin="round"
            paintOrder="stroke fill"
            letterSpacing="0.5"
          >
            Tap to Start
          </text>
        </svg>
      )}
    </button>
  );
};

export const TitleScreen: React.FC<TitleScreenProps> = ({ onStartGame }) => {
  const [isPortrait, setIsPortrait] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return window.innerHeight > window.innerWidth;
    }
    return false;
  });

  useEffect(() => {
    const handleResize = () => {
      setIsPortrait(window.innerHeight > window.innerWidth);
    };
    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
    };
  }, []);

  const handleStart = () => {
    soundManager.playHerbPick();
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      try {
        navigator.vibrate(35);
      } catch {
        // ignore
      }
    }
    onStartGame();
  };

  const portraitCandidates = getAssetCandidates('TitleBG_portrait.png');
  const landscapeCandidates = getAssetCandidates('TitleBG.png');

  const [portraitIdx, setPortraitIdx] = useState(0);
  const [landscapeIdx, setLandscapeIdx] = useState(0);

  const handleImageError = () => {
    if (isPortrait) {
      if (portraitIdx < portraitCandidates.length - 1) {
        setPortraitIdx((prev) => prev + 1);
      }
    } else {
      if (landscapeIdx < landscapeCandidates.length - 1) {
        setLandscapeIdx((prev) => prev + 1);
      }
    }
  };

  const currentPortraitSrc = portraitCandidates[portraitIdx];
  const currentLandscapeSrc = landscapeCandidates[landscapeIdx];

  return (
    <div
      onClick={handleStart}
      className="fixed inset-0 z-40 w-screen h-screen w-dvw h-dvh overflow-hidden flex items-center justify-center cursor-pointer select-none font-['Kanit',sans-serif] bg-[#f8edd2]"
    >
      {/* Title Background:
          - แนวนอน (Landscape): TitleBG.png เต็มหน้าจอ (Full screen)
          - แนวตั้ง (Portrait): TitleBG_portrait.png เต็มหน้าจอ (Full screen) */}
      <div className="absolute inset-0 w-full h-full pointer-events-none overflow-hidden select-none">
        <picture className="w-full h-full block">
          {/* Portrait orientation: TitleBG_portrait.png */}
          <source
            media="(orientation: portrait)"
            srcSet={currentPortraitSrc}
          />
          {/* Landscape orientation: TitleBG.png */}
          <source
            media="(orientation: landscape)"
            srcSet={currentLandscapeSrc}
          />
          <img
            key={`${isPortrait ? 'portrait' : 'landscape'}-${isPortrait ? portraitIdx : landscapeIdx}`}
            src={isPortrait ? currentPortraitSrc : currentLandscapeSrc}
            alt="Squash Yuree! Rice Weevil Smasher"
            referrerPolicy="no-referrer"
            onError={handleImageError}
            className="w-full h-full object-cover object-center pointer-events-none select-none block"
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              objectPosition: 'center center',
            }}
          />
        </picture>
      </div>

      {/* Center Button: "Tap to Start" Wooden Button */}
      <div className="relative z-30 flex items-center justify-center pointer-events-auto p-4">
        <TapToStartButton onClick={handleStart} className="animate-pulse drop-shadow-[0_20px_40px_rgba(0,0,0,0.85)]" />
      </div>
    </div>
  );
};
