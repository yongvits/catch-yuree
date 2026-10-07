import React from 'react';
import { TranslationStrings, Language } from '../i18n/translations';

interface GameHUDProps {
  remainingCount: number;
  totalCount: number;
  elapsedTime: number;
  combo: number;
  isMuted: boolean;
  language: Language;
  t: TranslationStrings;
  isInterfaceHidden: boolean;
  onHideInterface: () => void;
  onUnhideInterface: () => void;
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
  isInterfaceHidden,
  onHideInterface,
  onUnhideInterface,
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
        {/* Weevil Remaining Counter (Clean - No icon) */}
        <div className="bg-black/75 backdrop-blur-md border border-amber-500/20 px-3.5 py-1.5 rounded-full shadow-lg flex items-center gap-2 pointer-events-auto text-xs md:text-sm">
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

        {/* Stopwatch (Clean - No icon) */}
        <div
          onClick={isInterfaceHidden ? onUnhideInterface : undefined}
          title={isInterfaceHidden ? t.hudHiddenNotice : undefined}
          className={`bg-black/75 backdrop-blur-md border border-white/10 px-3 py-1.5 rounded-full shadow-lg flex items-center gap-1.5 pointer-events-auto text-xs md:text-sm font-mono text-amber-200 transition ${
            isInterfaceHidden ? 'cursor-pointer hover:border-amber-400/50' : ''
          }`}
        >
          <span className="text-zinc-400 font-sans text-xs">{t.hudTimeLabel}:</span>
          <span className="font-semibold">{formatTime(elapsedTime)}</span>
        </div>

        {/* Combo Indicator (Clean - No icon, shown when UI is visible) */}
        {!isInterfaceHidden && combo > 1 && (
          <div className="bg-gradient-to-r from-amber-600/90 to-red-600/90 backdrop-blur-md border border-amber-300/40 px-3 py-1 rounded-full shadow-lg flex items-center gap-1.5 pointer-events-auto text-xs font-black text-white animate-pulse">
            <span>{t.canvasCombo}{combo}!</span>
          </div>
        )}

        {/* Action Buttons (Rendered only when interface is not hidden) */}
        {!isInterfaceHidden && (
          <div className="flex flex-wrap items-center gap-1.5 pointer-events-auto">
            {/* Restart */}
            <button
              onClick={onRestart}
              title={t.hudRestart}
              className="bg-black/75 hover:bg-amber-900/80 active:scale-95 border border-white/10 px-3 py-1.5 rounded-full shadow-lg text-amber-200 hover:text-white transition text-xs font-medium"
            >
              {t.hudRestartBtn}
            </button>

            {/* Sound Toggle */}
            <button
              onClick={onToggleMute}
              title={isMuted ? t.hudUnmute : t.hudMute}
              className={`bg-black/75 hover:bg-amber-900/80 active:scale-95 border border-white/10 px-3 py-1.5 rounded-full shadow-lg transition text-xs font-medium ${
                isMuted ? 'text-zinc-400' : 'text-emerald-300'
              }`}
            >
              {isMuted ? `${t.hudSoundBtn}: OFF` : `${t.hudSoundBtn}: ON`}
            </button>

            {/* Language Toggle (EN / TH) */}
            <button
              onClick={onToggleLanguage}
              title={t.hudLang}
              className="bg-black/75 hover:bg-amber-900/80 active:scale-95 border border-amber-400/30 px-3 py-1.5 rounded-full shadow-lg text-amber-200 hover:text-white transition text-xs font-bold"
            >
              {language.toUpperCase()}
            </button>

            {/* Settings / Difficulty */}
            <button
              onClick={onOpenSettings}
              title={t.hudSettings}
              className="bg-black/75 hover:bg-amber-900/80 active:scale-95 border border-white/10 px-3 py-1.5 rounded-full shadow-lg text-amber-200 hover:text-white transition text-xs font-medium"
            >
              {t.hudSettingsBtn}
            </button>

            {/* Sprite Sheet Manager / Upload Custom Skin */}
            <button
              onClick={onOpenSprite}
              title={language === 'en' ? 'Upload Spritesheet / Character Skins' : 'อัปโหลดรูปภาพตัวมอด / จัดการสกิน'}
              className="bg-amber-950/80 hover:bg-amber-800/90 active:scale-95 border border-amber-500/50 px-3 py-1.5 rounded-full shadow-lg text-amber-200 hover:text-white transition text-xs font-semibold flex items-center gap-1"
            >
              <span className="text-pink-300">🎨</span>
              <span>{t.hudSpriteBtn}</span>
            </button>

            {/* Fun Facts / Rice Storage tips */}
            <button
              onClick={onOpenKnowledge}
              title={t.hudKnowledge}
              className="bg-black/75 hover:bg-amber-900/80 active:scale-95 border border-white/10 px-3 py-1.5 rounded-full shadow-lg text-amber-200 hover:text-white transition text-xs font-medium"
            >
              {t.hudKnowledgeBtn}
            </button>

            {/* Hide Interface Button */}
            <button
              onClick={onHideInterface}
              title={t.hudHideBtn}
              className="bg-amber-950/80 hover:bg-amber-900 active:scale-95 border border-amber-500/40 px-3 py-1.5 rounded-full shadow-lg text-amber-300 hover:text-amber-100 transition text-xs font-semibold"
            >
              {t.hudHideBtn}
            </button>
          </div>
        )}
      </div>

      {/* Top Right Tip Banner (Clean - No icon, hidden when interface is hidden) */}
      {!isInterfaceHidden && (
        <div className="absolute top-3 right-3 md:top-4 md:right-4 z-10 bg-black/55 backdrop-blur-md border border-white/10 px-3.5 py-1.5 rounded-full text-[11px] md:text-xs text-amber-200/90 pointer-events-none shadow-md">
          <span>{t.hudTip}</span>
        </div>
      )}
    </>
  );
};

