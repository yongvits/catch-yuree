import React, { useState } from 'react';
import { Download, Smartphone, Share, PlusSquare, CheckCircle2, WifiOff, X } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { Language } from '../i18n/translations';

interface PWAInstallButtonProps {
  language?: Language;
  variant?: 'floating' | 'panel';
  isOfflineReady?: boolean;
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({
  language = 'th',
  variant = 'floating',
  isOfflineReady = false,
}) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  const isTh = language === 'th';

  const iosModal = showIOSGuide && (
    <div
      onClick={(e) => {
        e.stopPropagation();
        setShowIOSGuide(false);
      }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-sm rounded-3xl bg-gradient-to-b from-[#2a170e] to-[#1a0d05] border border-amber-500/40 p-6 shadow-2xl text-amber-50 animate-in fade-in zoom-in-95 duration-200"
      >
        <div className="flex items-center justify-between mb-3 border-b border-amber-900/60 pb-3">
          <div className="flex items-center gap-2">
            <Smartphone className="w-5 h-5 text-amber-400" />
            <h3 className="text-base font-extrabold text-amber-200">
              {isTh ? 'ติดตั้งลง iPhone / iPad' : 'Install on iPhone / iPad'}
            </h3>
          </div>
          <button
            onClick={() => setShowIOSGuide(false)}
            className="w-8 h-8 rounded-full bg-black/40 hover:bg-black/70 flex items-center justify-center text-zinc-400 hover:text-white transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="text-xs text-amber-200/80 mb-4 leading-relaxed">
          {isTh
            ? 'ติดตั้งเกมไว้บนหน้าจอโฮมเพื่อเปิดเล่นแบบเต็มจอและเล่นออฟไลน์ได้โดยไม่ต้องใช้อินเทอร์เน็ต:'
            : 'Add this game to your Home Screen for fullscreen launch and full offline play:'}
        </p>

        <ol className="space-y-3 text-xs md:text-sm text-amber-100">
          <li className="flex items-start gap-2.5 bg-black/35 border border-amber-900/40 rounded-2xl p-3">
            <Share className="w-5 h-5 text-sky-400 shrink-0 mt-0.5" />
            <span>
              {isTh ? (
                <>
                  1. แตะปุ่ม <strong>แชร์ (Share)</strong> ที่แถบเครื่องมือของ Safari
                </>
              ) : (
                <>
                  1. Tap the <strong>Share</strong> button in the Safari toolbar.
                </>
              )}
            </span>
          </li>
          <li className="flex items-start gap-2.5 bg-black/35 border border-amber-900/40 rounded-2xl p-3">
            <PlusSquare className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <span>
              {isTh ? (
                <>
                  2. เลื่อนลงแล้วเลือก <strong>เพิ่มไปยังหน้าจอโฮม (Add to Home Screen)</strong>
                </>
              ) : (
                <>
                  2. Scroll down and tap <strong>Add to Home Screen</strong>.
                </>
              )}
            </span>
          </li>
        </ol>

        <button
          onClick={() => setShowIOSGuide(false)}
          className="mt-5 w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white font-bold text-xs md:text-sm shadow-lg transition"
        >
          {isTh ? 'เข้าใจแล้ว' : 'Got it'}
        </button>
      </div>
    </div>
  );

  // Panel mode inside SettingsModal
  if (variant === 'panel') {
    if (isInstalled) {
      return (
        <div className="bg-emerald-950/35 border border-emerald-500/30 p-3 rounded-2xl flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <div>
              <div className="font-bold text-xs md:text-sm text-emerald-200">
                {isTh ? 'ติดตั้งแอปออฟไลน์แล้ว' : 'Offline App Installed'}
              </div>
              <div className="text-[11px] text-emerald-300/70">
                {isTh ? 'สามารถเล่นได้ทุกที่โดยไม่ต้องใช้เน็ต' : 'Ready to play anywhere without internet'}
              </div>
            </div>
          </div>
        </div>
      );
    }

    return (
      <>
        <div className="bg-black/40 border border-amber-900/40 p-3 rounded-2xl flex items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2.5 min-w-0">
            <WifiOff className="w-5 h-5 text-amber-400 shrink-0" />
            <div className="min-w-0">
              <div className="font-bold text-xs md:text-sm text-amber-100">
                {isTh ? 'โหมดออฟไลน์ / ติดตั้งเกม' : 'Offline Mode & Install'}
              </div>
              <div className="text-[11px] text-zinc-400 truncate">
                {isOfflineReady
                  ? isTh
                    ? 'บันทึกไฟล์เกมไว้ในเครื่องแล้ว เล่นออฟไลน์ได้'
                    : 'Cached in device — ready for offline play'
                  : isTh
                  ? 'กำลังเตรียมแคชไฟล์สำหรับเล่นออฟไลน์'
                  : 'Caching game assets for offline play'}
              </div>
            </div>
          </div>

          {isInstallable ? (
            <button
              onClick={install}
              className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs transition shadow cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{isTh ? 'ติดตั้งแอป' : 'Install'}</span>
            </button>
          ) : isIOS ? (
            <button
              onClick={() => setShowIOSGuide(true)}
              className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-400/50 text-amber-200 font-bold text-xs transition cursor-pointer"
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>{isTh ? 'วิธีติดตั้ง iOS' : 'Install iOS'}</span>
            </button>
          ) : (
            <span
              className={`shrink-0 px-2.5 py-1 rounded-xl text-[11px] font-semibold ${
                isOfflineReady
                  ? 'bg-emerald-600/25 text-emerald-300 border border-emerald-500/30'
                  : 'bg-zinc-800 text-zinc-400'
              }`}
            >
              {isOfflineReady ? (isTh ? 'พร้อมออฟไลน์' : 'Offline Ready') : isTh ? 'กำลังแคช...' : 'Caching...'}
            </span>
          )}
        </div>
        {iosModal}
      </>
    );
  }

  // Floating mode (used on TitleScreen): hide if already installed as standalone app
  if (isInstalled) {
    return null;
  }

  if (isInstallable) {
    return (
      <button
        onClick={(e) => {
          e.stopPropagation();
          install();
        }}
        className="flex items-center gap-2 rounded-full bg-black/75 hover:bg-amber-950/90 active:scale-95 backdrop-blur-md border border-amber-400/50 px-4 py-2 text-xs md:text-sm font-bold text-amber-200 shadow-xl transition cursor-pointer"
      >
        <Download className="w-4 h-4 text-amber-400" />
        <span>{isTh ? 'ติดตั้งเกมไว้เล่นออฟไลน์' : 'Install for Offline Play'}</span>
      </button>
    );
  }

  if (isIOS) {
    return (
      <>
        <button
          onClick={(e) => {
            e.stopPropagation();
            setShowIOSGuide(true);
          }}
          className="flex items-center gap-2 rounded-full bg-black/75 hover:bg-amber-950/90 active:scale-95 backdrop-blur-md border border-amber-400/50 px-4 py-2 text-xs md:text-sm font-bold text-amber-200 shadow-xl transition cursor-pointer"
        >
          <Smartphone className="w-4 h-4 text-amber-400" />
          <span>{isTh ? 'ติดตั้งเล่นออฟไลน์ (iOS)' : 'Install Offline (iOS)'}</span>
        </button>
        {iosModal}
      </>
    );
  }

  return null;
};
