import React from 'react';
import { Star } from 'lucide-react';
import { TranslationStrings } from '../i18n/translations';

interface VictoryModalProps {
  isOpen: boolean;
  totalWeevils: number;
  elapsedTime: number;
  maxCombo: number;
  accuracy: number;
  bestTime: number | null;
  t: TranslationStrings;
  onPlayAgain: () => void;
  onNextDifficulty?: () => void;
  hasNextDifficulty?: boolean;
  onOpenTitle?: () => void;
}

export const VictoryModal: React.FC<VictoryModalProps> = ({
  isOpen,
  totalWeevils,
  elapsedTime,
  maxCombo,
  accuracy,
  bestTime,
  t,
  onPlayAgain,
  onNextDifficulty,
  hasNextDifficulty,
  onOpenTitle,
}) => {
  if (!isOpen) return null;

  const formatSecs = (sec: number) => {
    return `${sec.toFixed(1)} ${t.victorySecUnit}`;
  };

  // Determine star rank
  let stars = 1;
  if (accuracy >= 65 && elapsedTime <= totalWeevils * 0.9) {
    stars = 3;
  } else if (accuracy >= 45) {
    stars = 2;
  }

  const isNewBest = bestTime === null || elapsedTime <= bestTime;

  return (
    <div className="fixed inset-0 bg-amber-950/85 backdrop-blur-md flex flex-col justify-center items-center z-50 p-4 transition-all duration-300 font-['Kanit',sans-serif]">
      <div className="bg-gradient-to-b from-amber-900 to-amber-950 p-6 md:p-8 rounded-3xl border border-amber-500/40 shadow-2xl text-center max-w-sm md:max-w-md w-full relative overflow-hidden animate-in fade-in zoom-in-95 duration-300">
        {/* Glow ambient background */}
        <div className="absolute -top-16 -left-16 w-36 h-36 bg-amber-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-16 -right-16 w-36 h-36 bg-cyan-400/20 rounded-full blur-3xl pointer-events-none" />

        <h2 className="text-2xl md:text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-amber-300 to-amber-400 mt-2">
          {t.victoryTitle}
        </h2>

        <p className="text-amber-100/90 mt-1.5 text-xs md:text-sm">
          {t.victorySubtitle(totalWeevils)}
        </p>

        {/* Stars rating (ONLY icons kept) */}
        <div className="flex justify-center items-center gap-1.5 my-4">
          {[1, 2, 3].map((s) => (
            <Star
              key={s}
              className={`w-8 h-8 md:w-9 md:h-9 transition-transform ${
                s <= stars
                  ? 'text-amber-400 fill-amber-400 drop-shadow-[0_0_10px_rgba(251,191,36,0.65)] scale-110'
                  : 'text-amber-950/70 fill-amber-950/40 stroke-amber-900'
              }`}
            />
          ))}
        </div>

        {/* Stats Grid (Icons removed) */}
        <div className="grid grid-cols-3 gap-2 bg-black/40 border border-amber-500/20 rounded-2xl p-3 my-3">
          <div className="flex flex-col items-center">
            <span className="text-amber-400/80 text-[10px] md:text-xs font-semibold">
              {t.victoryTime}
            </span>
            <span className="text-white font-mono font-bold text-xs md:text-sm mt-0.5">
              {formatSecs(elapsedTime)}
            </span>
            {isNewBest && (
              <span className="text-[9px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.2 rounded-full mt-0.5 font-semibold">
                {t.victoryNewBest}
              </span>
            )}
          </div>

          <div className="flex flex-col items-center border-x border-amber-500/20">
            <span className="text-amber-400/80 text-[10px] md:text-xs font-semibold">
              {t.victoryCombo}
            </span>
            <span className="text-white font-mono font-bold text-xs md:text-sm mt-0.5">
              x{maxCombo}
            </span>
            <span className="text-[9px] text-zinc-400 mt-0.5">{t.victoryComboSub}</span>
          </div>

          <div className="flex flex-col items-center">
            <span className="text-amber-400/80 text-[10px] md:text-xs font-semibold">
              {t.victoryAccuracy}
            </span>
            <span className="text-white font-mono font-bold text-xs md:text-sm mt-0.5">
              {accuracy}%
            </span>
            <span className="text-[9px] text-zinc-400 mt-0.5">{t.victoryAccuracySub}</span>
          </div>
        </div>

        {/* Action Buttons (Icons removed) */}
        <div className="mt-4 flex flex-col sm:flex-row gap-2">
          {onOpenTitle && (
            <button
              onClick={onOpenTitle}
              className="flex-1 flex items-center justify-center bg-black/60 hover:bg-zinc-800 font-bold py-2.5 px-3 rounded-xl shadow-lg transition duration-200 active:scale-95 text-xs md:text-sm text-amber-200 border border-white/20"
            >
              <span>{t.titleReturnToTitle}</span>
            </button>
          )}

          <button
            onClick={onPlayAgain}
            className="flex-1 flex items-center justify-center bg-gradient-to-r from-amber-600 to-amber-800 hover:from-amber-500 hover:to-amber-700 font-bold py-2.5 px-4 rounded-xl shadow-lg transition duration-200 active:scale-95 text-xs md:text-sm text-white border border-amber-400/30"
          >
            <span>{t.victoryPlayAgain}</span>
          </button>

          {hasNextDifficulty && (
            <button
              onClick={onNextDifficulty}
              className="flex-1 flex items-center justify-center bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-500 hover:to-teal-600 font-bold py-2.5 px-4 rounded-xl shadow-lg transition duration-200 active:scale-95 text-xs md:text-sm text-white border border-emerald-400/30"
            >
              <span>{t.victoryNextDiff}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
