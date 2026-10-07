import React from 'react';
import { X, Check, Volume2, VolumeX, Globe } from 'lucide-react';
import { GameDifficulty, DifficultyConfig } from '../types/game';
import { TranslationStrings, Language } from '../i18n/translations';

interface SettingsModalProps {
  isOpen: boolean;
  currentDifficulty: GameDifficulty;
  difficulties: Record<GameDifficulty, DifficultyConfig>;
  isMuted: boolean;
  bestRecords: Record<GameDifficulty, number | null>;
  language: Language;
  t: TranslationStrings;
  onSelectDifficulty: (difficulty: GameDifficulty) => void;
  onToggleMute: () => void;
  onSelectLanguage: (lang: Language) => void;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  currentDifficulty,
  difficulties,
  isMuted,
  bestRecords,
  language,
  t,
  onSelectDifficulty,
  onToggleMute,
  onSelectLanguage,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex justify-center items-center z-50 p-4">
      <div className="bg-gradient-to-b from-[#2a170e] to-[#1a0d05] border border-amber-600/30 rounded-3xl p-6 max-w-sm md:max-w-md w-full shadow-2xl relative text-amber-50 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex justify-between items-center mb-4 border-b border-amber-900/60 pb-3">
          <div className="flex items-center gap-2">
            <span className="text-xl">⚙️</span>
            <h3 className="font-extrabold text-base md:text-lg text-amber-200">
              {t.settingsTitle}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-black/40 hover:bg-black/70 flex items-center justify-center text-zinc-400 hover:text-white transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Difficulty Selection */}
        <div className="space-y-2 mb-4">
          <div className="text-xs font-semibold text-amber-300 uppercase tracking-wider mb-1">
            {t.settingsSelectPopulation}
          </div>
          {(Object.entries(difficulties) as [GameDifficulty, DifficultyConfig][]).map(
            ([key, config]) => {
              const isSelected = currentDifficulty === key;
              const bestTime = bestRecords[key];
              return (
                <button
                  key={key}
                  onClick={() => onSelectDifficulty(key)}
                  className={`w-full p-3 rounded-2xl flex items-center justify-between border transition text-left ${
                    isSelected
                      ? 'bg-amber-600/25 border-amber-400 text-amber-100 shadow-md'
                      : 'bg-black/30 border-amber-900/40 hover:bg-black/50 text-amber-200/80'
                  }`}
                >
                  <div className="flex flex-col">
                    <span className="font-bold text-sm flex items-center gap-1.5">
                      {config.name}
                      <span className="text-xs font-normal text-amber-300/80">
                        ({config.count} {t.hudUnits})
                      </span>
                    </span>
                    <span className="text-[11px] text-zinc-400 mt-0.5">{config.description}</span>
                    {bestTime && (
                      <span className="text-[10px] text-emerald-400 font-mono mt-0.5">
                        {t.settingsBestRecord} {bestTime.toFixed(1)} {t.victorySecUnit}
                      </span>
                    )}
                  </div>
                  {isSelected && (
                    <div className="w-6 h-6 rounded-full bg-amber-500 text-black flex items-center justify-center">
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                    </div>
                  )}
                </button>
              );
            }
          )}
        </div>

        {/* Language Selection */}
        <div className="bg-black/40 border border-amber-900/40 p-3 rounded-2xl flex items-center justify-between mb-3">
          <div className="flex items-center gap-2.5">
            <Globe className="w-5 h-5 text-amber-300" />
            <div>
              <div className="font-bold text-xs md:text-sm text-amber-100">{t.settingsLanguage}</div>
              <div className="text-[11px] text-zinc-400">English / ภาษาไทย</div>
            </div>
          </div>
          <div className="flex items-center gap-1 bg-zinc-900/80 p-1 rounded-xl border border-zinc-700">
            <button
              onClick={() => onSelectLanguage('en')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition ${
                language === 'en'
                  ? 'bg-amber-500 text-black shadow'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              EN
            </button>
            <button
              onClick={() => onSelectLanguage('th')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition ${
                language === 'th'
                  ? 'bg-amber-500 text-black shadow'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              TH
            </button>
          </div>
        </div>

        {/* Audio Toggle */}
        <div className="bg-black/40 border border-amber-900/40 p-3 rounded-2xl flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            {isMuted ? (
              <VolumeX className="w-5 h-5 text-red-400" />
            ) : (
              <Volume2 className="w-5 h-5 text-emerald-400" />
            )}
            <div>
              <div className="font-bold text-xs md:text-sm text-amber-100">{t.settingsAudio}</div>
              <div className="text-[11px] text-zinc-400">{t.settingsAudioDesc}</div>
            </div>
          </div>
          <button
            onClick={onToggleMute}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
              isMuted
                ? 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                : 'bg-emerald-600 text-white hover:bg-emerald-500'
            }`}
          >
            {isMuted ? t.settingsAudioOff : t.settingsAudioOn}
          </button>
        </div>

        {/* Footer Close Button */}
        <button
          onClick={onClose}
          className="w-full py-2.5 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white font-bold rounded-xl shadow-lg transition text-xs md:text-sm"
        >
          {t.settingsSaveClose}
        </button>
      </div>
    </div>
  );
};
