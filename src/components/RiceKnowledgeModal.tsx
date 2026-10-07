import React from 'react';
import { X, Sparkles, ShieldCheck, Bug, Info } from 'lucide-react';
import { TranslationStrings } from '../i18n/translations';

interface RiceKnowledgeModalProps {
  isOpen: boolean;
  t: TranslationStrings;
  onClose: () => void;
}

export const RiceKnowledgeModal: React.FC<RiceKnowledgeModalProps> = ({ isOpen, t, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex justify-center items-center z-50 p-4">
      <div className="bg-gradient-to-b from-[#2a170e] to-[#1a0d05] border border-amber-600/30 rounded-3xl p-5 md:p-6 max-w-sm md:max-w-lg w-full shadow-2xl relative text-amber-50 max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex justify-between items-center mb-4 border-b border-amber-900/60 pb-3">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🌾</span>
            <div>
              <h3 className="font-extrabold text-base md:text-lg text-amber-200">
                {t.knowledgeTitle}
              </h3>
              <p className="text-[11px] text-amber-300/70">{t.knowledgeSubtitle}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-black/40 hover:bg-black/70 flex items-center justify-center text-zinc-400 hover:text-white transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content sections */}
        <div className="space-y-3.5 text-xs md:text-sm text-amber-100/90 leading-relaxed">
          {/* Card 1: Biology */}
          <div className="bg-black/30 border border-amber-900/40 rounded-2xl p-3.5 flex gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-900/50 flex items-center justify-center shrink-0 text-amber-300">
              <Bug className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-amber-300 mb-1">{t.knowledgeWhatTitle}</h4>
              <p className="text-zinc-300 text-[11px] md:text-xs">{t.knowledgeWhatDesc}</p>
            </div>
          </div>

          {/* Card 2: Origin */}
          <div className="bg-black/30 border border-amber-900/40 rounded-2xl p-3.5 flex gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-900/50 flex items-center justify-center shrink-0 text-amber-300">
              <Info className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-amber-300 mb-1">{t.knowledgeOriginTitle}</h4>
              <p className="text-zinc-300 text-[11px] md:text-xs">{t.knowledgeOriginDesc}</p>
            </div>
          </div>

          {/* Card 3: Storage Tips */}
          <div className="bg-black/30 border border-amber-900/40 rounded-2xl p-3.5 flex gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-900/50 flex items-center justify-center shrink-0 text-emerald-300">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-emerald-300 mb-1">{t.knowledgeTipsTitle}</h4>
              <ul className="text-zinc-300 text-[11px] md:text-xs space-y-1 list-disc list-inside">
                <li>{t.knowledgeTip1}</li>
                <li>{t.knowledgeTip2}</li>
                <li>{t.knowledgeTip3}</li>
                <li>{t.knowledgeTip4}</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-4 pt-3 border-t border-amber-900/60 flex items-center justify-between">
          <div className="text-[10px] text-amber-400/60 flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-amber-400" />
            <span>{t.knowledgeFooter}</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-amber-700 hover:bg-amber-600 text-white font-bold rounded-xl text-xs transition"
          >
            {t.knowledgeClose}
          </button>
        </div>
      </div>
    </div>
  );
};
