import React from 'react';
import { WifiOff } from 'lucide-react';
import { useOnlineStatus } from '../hooks/useOnlineStatus';
import { Language } from '../i18n/translations';

interface OfflineIndicatorProps {
  language?: Language;
}

export const OfflineIndicator: React.FC<OfflineIndicatorProps> = ({ language = 'th' }) => {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div className="fixed bottom-4 left-4 z-50 flex items-center gap-2 rounded-full bg-black/80 backdrop-blur-md border border-amber-400/40 px-3.5 py-1.5 text-xs font-semibold text-amber-200 shadow-xl pointer-events-none select-none">
      <WifiOff className="w-3.5 h-3.5 text-amber-400 shrink-0" />
      <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
      <span>
        {language === 'th'
          ? 'โหมดออฟไลน์ — เล่นได้ปกติ'
          : 'Offline Mode — Playable anytime'}
      </span>
    </div>
  );
};
