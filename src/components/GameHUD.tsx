import React from 'react';
import { Volume2, VolumeX, RotateCcw, BookOpen, Settings, Languages, Palette } from 'lucide-react';
import { TranslationStrings, Language } from '../i18n/translations';

interface GameHUDProps {
  remainingCount: number;
  totalCount: number;
  elapsedTime: number;
  combo: number;
  isMuted: boolean;
  language: Language;
  t: TranslationStrings;
  onRestart: () => void;
  onToggleMute: () => void;
  onToggleLanguage: () => void;
  onOpenSettings: () => void;
  onOpenKnowledge: () => void;
  onOpenSprite: () => void;
}

export const GameHUD: React.FC<GameHUDProps> = ({
  remainingCount,
  totalCount,
  elapsedTime,
  combo,
  isMuted,
  language,
  t,
  onRestart,
  onToggleMute,
  onToggleLanguage,
  onOpenSettings,
  onOpenKnowledge,
  onOpenSprite,
}) => {
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 10);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${ms}`;
  };

  const progressPercent = Math.round(((totalCount - remainingCount) / Math.max(totalCount, 1)) * 100);

  return (
    <>
      {/* Top Left Floating Bar */}
      <div className="absolute top-3 left-3 md:top-4 md:left-4 z-20 flex flex-wrap items-center gap-2 pointer-events-none">
        {/* Weevil Remaining Counter */}
        <div className="bg-black/75 backdrop-blur-md border border-amber-500/20 px-3.5 py-1.5 rounded-full shadow-lg flex items-center gap-2 pointer-events-auto text-xs md:text-sm">
          <span className="text-base animate-bounce">🐜</span>
          <span className="font-bold text-amber-300">{t.hudRemaining}</span>
          <span className="font-black text-white">
            <span className="text-amber-400 text-sm md:text-base font-mono">{remainingCount}</span> /{' '}
            <span className="text-zinc-400">{totalCount}</span> {t.hudUnits}
          </span>
          {/* Mini progress bar inside badge */}
          <div className="w-12 h-2 bg-zinc-800 rounded-full overflow-hidden ml-1 border border-zinc-700">
            <div
              className="h-full bg-gradient-to-r from-amber-500 to-emerald-400 transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Stopwatch */}
        <div className="bg-black/75 backdrop-blur-md border border-white/10 px-3 py-1.5 rounded-full shadow-lg flex items-center gap-1.5 pointer-events-auto text-xs font-mono text-amber-200">
          <span>⏱️</span>
          <span>{formatTime(elapsedTime)}</span>
        </div>

        {/* Combo Indicator */}
        {combo > 1 && (
          <div className="bg-gradient-to-r from-amber-600/90 to-red-600/90 backdrop-blur-md border border-amber-300/40 px-3 py-1 rounded-full shadow-lg flex items-center gap-1.5 pointer-events-auto text-xs font-black text-white animate-pulse">
            <span>🔥</span>
            <span>{t.canvasCombo}{combo}!</span>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center gap-1.5 pointer-events-auto">
          {/* Restart */}
          <button
            onClick={onRestart}
            title={t.hudRestart}
            className="bg-black/75 hover:bg-amber-900/80 active:scale-90 border border-white/10 w-8 h-8 rounded-full shadow-lg flex items-center justify-center text-amber-200 hover:text-white transition"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>

          {/* Sound Toggle */}
          <button
            onClick={onToggleMute}
            title={isMuted ? t.hudUnmute : t.hudMute}
            className="bg-black/75 hover:bg-amber-900/80 active:scale-90 border border-white/10 w-8 h-8 rounded-full shadow-lg flex items-center justify-center text-amber-200 hover:text-white transition"
          >
            {isMuted ? <VolumeX className="w-3.5 h-3.5 text-red-400" /> : <Volume2 className="w-3.5 h-3.5 text-emerald-400" />}
          </button>

          {/* Language Toggle (EN / TH) */}
          <button
            onClick={onToggleLanguage}
            title={t.hudLang}
            className="bg-black/75 hover:bg-amber-900/80 active:scale-90 border border-amber-400/30 px-2 h-8 rounded-full shadow-lg flex items-center justify-center gap-1 text-amber-200 hover:text-white transition text-[11px] font-bold"
          >
            <Languages className="w-3 h-3 text-amber-400" />
            <span>{language.toUpperCase()}</span>
          </button>

          {/* Settings / Difficulty */}
          <button
            onClick={onOpenSettings}
            title={t.hudSettings}
            className="bg-black/75 hover:bg-amber-900/80 active:scale-90 border border-white/10 w-8 h-8 rounded-full shadow-lg flex items-center justify-center text-amber-200 hover:text-white transition"
          >
            <Settings className="w-3.5 h-3.5" />
          </button>

          {/* Sprite Sheet Manager */}
          <button
            onClick={onOpenSprite}
            title={language === 'en' ? 'Weevil Character Spritesheet' : 'สไปร์ทชีทตัวมอด'}
            className="bg-black/75 hover:bg-amber-900/80 active:scale-90 border border-white/10 w-8 h-8 rounded-full shadow-lg flex items-center justify-center text-amber-200 hover:text-white transition"
          >
            <Palette className="w-3.5 h-3.5 text-pink-400" />
          </button>

          {/* Fun Facts / Rice Storage tips */}
          <button
            onClick={onOpenKnowledge}
            title={t.hudKnowledge}
            className="bg-black/75 hover:bg-amber-900/80 active:scale-90 border border-white/10 w-8 h-8 rounded-full shadow-lg flex items-center justify-center text-amber-200 hover:text-white transition"
          >
            <BookOpen className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Top Right Tip Banner */}
      <div className="absolute top-3 right-3 md:top-4 md:right-4 z-10 bg-black/55 backdrop-blur-md border border-white/10 px-3.5 py-1.5 rounded-full text-[11px] md:text-xs text-amber-200/90 pointer-events-none shadow-md flex items-center gap-1.5">
        <span className="text-sm">💡</span>
        <span>{t.hudTip}</span>
      </div>
    </>
  );
};
