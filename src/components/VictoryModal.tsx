import React from 'react';
import { Trophy, Clock, Zap, Target, Star, RotateCcw, ArrowRight } from 'lucide-react';

interface VictoryModalProps {
  isOpen: boolean;
  totalWeevils: number;
  elapsedTime: number;
  maxCombo: number;
  accuracy: number;
  bestTime: number | null;
  onPlayAgain: () => void;
  onNextDifficulty?: () => void;
  hasNextDifficulty?: boolean;
}

export const VictoryModal: React.FC<VictoryModalProps> = ({
  isOpen,
  totalWeevils,
  elapsedTime,
  maxCombo,
  accuracy,
  bestTime,
  onPlayAgain,
  onNextDifficulty,
  hasNextDifficulty,
}) => {
  if (!isOpen) return null;

  const formatSecs = (sec: number) => {
    return `${sec.toFixed(1)} วิ`;
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
    <div className="fixed inset-0 bg-amber-950/85 backdrop-blur-md flex flex-col justify-center items-center z-50 p-4 transition-all duration-300">
      <div className="bg-gradient-to-b from-amber-900 to-amber-950 p-6 md:p-8 rounded-3xl border border-amber-500/40 shadow-2xl text-center max-w-sm md:max-w-md w-full relative overflow-hidden animate-in fade-in zoom-in-95 duration-300">
        {/* Glow ambient background */}
        <div className="absolute -top-16 -left-16 w-36 h-36 bg-amber-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-16 -right-16 w-36 h-36 bg-cyan-400/20 rounded-full blur-3xl pointer-events-none" />

        <div className="text-5xl md:text-6xl mb-2 animate-bounce">🌾🏆✨</div>
        
        <h2 className="text-2xl md:text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-amber-300 to-amber-400">
          กำจัดมอดหมดเกลี้ยง!
        </h2>
        
        <p className="text-amber-100/90 mt-1.5 text-xs md:text-sm">
          คุณช่วยส่งวิญญาณมอดทั้งหมด{' '}
          <span className="font-bold text-amber-300 text-base">{totalWeevils}</span> ตัว
          ไปสู่สุคติแล้ว!
        </p>

        {/* Stars rating */}
        <div className="flex justify-center items-center gap-1.5 my-3.5">
          {[1, 2, 3].map((s) => (
            <Star
              key={s}
              className={`w-7 h-7 md:w-8 md:h-8 transition-transform ${
                s <= stars
                  ? 'text-amber-400 fill-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.6)] scale-110'
                  : 'text-amber-900 fill-amber-950/60'
              }`}
            />
          ))}
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-2 bg-black/40 border border-amber-500/20 rounded-2xl p-3 my-3">
          <div className="flex flex-col items-center">
            <span className="text-amber-400/80 text-[10px] md:text-xs flex items-center gap-1">
              <Clock className="w-3 h-3" /> เวลา
            </span>
            <span className="text-white font-mono font-bold text-xs md:text-sm mt-0.5">
              {formatSecs(elapsedTime)}
            </span>
            {isNewBest && (
              <span className="text-[9px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.2 rounded-full mt-0.5 font-semibold">
                สถิติใหม่!
              </span>
            )}
          </div>

          <div className="flex flex-col items-center border-x border-amber-500/20">
            <span className="text-amber-400/80 text-[10px] md:text-xs flex items-center gap-1">
              <Zap className="w-3 h-3" /> คอมโบ
            </span>
            <span className="text-white font-mono font-bold text-xs md:text-sm mt-0.5">
              x{maxCombo}
            </span>
            <span className="text-[9px] text-zinc-400 mt-0.5">ต่อเนื่อง</span>
          </div>

          <div className="flex flex-col items-center">
            <span className="text-amber-400/80 text-[10px] md:text-xs flex items-center gap-1">
              <Target className="w-3 h-3" /> ความแม่นยำ
            </span>
            <span className="text-white font-mono font-bold text-xs md:text-sm mt-0.5">
              {accuracy}%
            </span>
            <span className="text-[9px] text-zinc-400 mt-0.5">แตะโดน</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-4 flex flex-col sm:flex-row gap-2">
          <button
            onClick={onPlayAgain}
            className="flex-1 flex items-center justify-center gap-1.5 bg-gradient-to-r from-amber-600 to-amber-800 hover:from-amber-500 hover:to-amber-700 font-bold py-2.5 px-4 rounded-xl shadow-lg transition duration-200 active:scale-95 text-xs md:text-sm text-white border border-amber-400/30"
          >
            <RotateCcw className="w-4 h-4" />
            <span>เริ่มใหม่อีกครั้ง 🌾</span>
          </button>

          {hasNextDifficulty && (
            <button
              onClick={onNextDifficulty}
              className="flex-1 flex items-center justify-center gap-1.5 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-500 hover:to-teal-600 font-bold py-2.5 px-4 rounded-xl shadow-lg transition duration-200 active:scale-95 text-xs md:text-sm text-white border border-emerald-400/30"
            >
              <span>ด่านท้าทายขึ้น</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
