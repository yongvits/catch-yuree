import React, { useState } from 'react';
import {
  Download,
  Smartphone,
  Share,
  PlusSquare,
  CheckCircle2,
  WifiOff,
  X,
  HardDriveDownload,
  MoreVertical,
} from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { Language } from '../i18n/translations';
import { cacheAllAssetsForOffline } from '../utils/pwaRegistration';

interface PWAInstallButtonProps {
  language?: Language;
  variant?: 'floating' | 'panel';
  isOfflineReady?: boolean;
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({
  language = 'en',
  variant = 'floating',
  isOfflineReady = false,
}) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showGuideModal, setShowGuideModal] = useState(false);
  const [isCaching, setIsCaching] = useState(false);
  const [manualCached, setManualCached] = useState(false);

  const isTh = language === 'th';
  const offlineSaved = isOfflineReady || manualCached;

  const handleSaveOfflineNow = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isCaching) return;
    setIsCaching(true);
    try {
      const ok = await cacheAllAssetsForOffline();
      if (ok) {
        setManualCached(true);
      }
    } finally {
      setIsCaching(false);
    }
  };

  const guideModal = showGuideModal && (
    <div
      onClick={(e) => {
        e.stopPropagation();
        setShowGuideModal(false);
      }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-sm rounded-3xl bg-gradient-to-b from-[#2a170e] to-[#1a0d05] border border-amber-500/40 p-6 shadow-2xl text-amber-50 animate-in fade-in zoom-in-95 duration-200"
      >
        <div className="flex items-center justify-between mb-3 border-b border-amber-900/60 pb-3">
          <div className="flex items-center gap-2">
            <WifiOff className="w-5 h-5 text-amber-400" />
            <h3 className="text-base font-extrabold text-amber-200">
              {isTh ? 'โหมดออฟไลน์ & ติดตั้งแอป' : 'Offline Mode & Install App'}
            </h3>
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowGuideModal(false);
            }}
            className="w-8 h-8 rounded-full bg-black/40 hover:bg-black/70 flex items-center justify-center text-zinc-400 hover:text-white transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Offline Cache Status Card */}
        <div className="bg-black/40 border border-amber-900/50 rounded-2xl p-3.5 mb-4">
          <div className="flex items-center justify-between gap-2 mb-2">
            <span className="text-xs font-bold text-amber-100">
              {isTh ? 'สถานะไฟล์ออฟไลน์ในเครื่อง' : 'Device Offline Storage'}
            </span>
            <span
              className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                offlineSaved
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                  : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
              }`}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  offlineSaved ? 'bg-emerald-400' : 'bg-amber-400 animate-pulse'
                }`}
              />
              {offlineSaved
                ? isTh
                  ? 'พร้อมเล่นออฟไลน์แล้ว'
                  : 'Offline Ready'
                : isTh
                ? 'กำลังบันทึก...'
                : 'Caching...'}
            </span>
          </div>

          <p className="text-[11px] text-zinc-300 leading-relaxed mb-3">
            {offlineSaved
              ? isTh
                ? 'ไฟล์เกม รูปภาพ และระบบเสียงถูกบันทึกไว้ในเครื่องเรียบร้อย สามารถปิดเน็ตเล่นได้ทันที'
                : 'Game assets, images, and audio are cached on this device for offline play.'
              : isTh
              ? 'กดปุ่มด้านล่างเพื่อดาวน์โหลดและตรวจสอบไฟล์เกมทั้งหมดสำหรับเล่นแบบออฟไลน์'
              : 'Tap below to download and verify all game files for offline play.'}
          </p>

          <button
            onClick={handleSaveOfflineNow}
            disabled={isCaching}
            className="w-full py-2 px-3 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-400/50 text-amber-200 font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer disabled:opacity-60"
          >
            <HardDriveDownload className={`w-4 h-4 ${isCaching ? 'animate-bounce' : ''}`} />
            <span>
              {isCaching
                ? isTh
                  ? 'กำลังบันทึกไฟล์ลงเครื่อง...'
                  : 'Saving offline files...'
                : offlineSaved
                ? isTh
                  ? 'อัปเดต / ตรวจสอบไฟล์ออฟไลน์อีกครั้ง'
                  : 'Verify / Refresh Offline Cache'
                : isTh
                ? 'บันทึกเกมไว้เล่นออฟไลน์ตอนนี้'
                : 'Save Game for Offline Play'}
            </span>
          </button>
        </div>

        {/* Direct Install Button if browser prompt became ready */}
        {isInstallable && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              install();
              setShowGuideModal(false);
            }}
            className="w-full mb-4 py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-extrabold text-xs md:text-sm flex items-center justify-center gap-2 shadow-lg transition cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>{isTh ? 'ติดตั้งลงหน้าจอโฮมทันที' : 'Install App Now'}</span>
          </button>
        )}

        {/* Platform Install Instructions */}
        <div className="space-y-2.5 text-xs text-amber-100">
          <div className="font-bold text-amber-300 text-[11px] uppercase tracking-wider">
            {isIOS
              ? isTh
                ? 'วิธีติดตั้งลงหน้าจอโฮม (iPhone / iPad)'
                : 'Add to Home Screen (iPhone / iPad)'
              : isTh
              ? 'วิธีติดตั้งเป็นแอปบนอุปกรณ์'
              : 'How to Install as App'}
          </div>

          {isIOS ? (
            <ol className="space-y-2">
              <li className="flex items-start gap-2.5 bg-black/35 border border-amber-900/40 rounded-2xl p-2.5">
                <Share className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
                <span>
                  {isTh ? (
                    <>
                      1. แตะปุ่ม <strong>แชร์ (Share)</strong> ที่แถบเครื่องมือ Safari
                    </>
                  ) : (
                    <>
                      1. Tap the <strong>Share</strong> button in Safari toolbar.
                    </>
                  )}
                </span>
              </li>
              <li className="flex items-start gap-2.5 bg-black/35 border border-amber-900/40 rounded-2xl p-2.5">
                <PlusSquare className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <span>
                  {isTh ? (
                    <>
                      2. เลื่อนลงแล้วแตะ <strong>เพิ่มไปยังหน้าจอโฮม (Add to Home Screen)</strong>
                    </>
                  ) : (
                    <>
                      2. Scroll down and tap <strong>Add to Home Screen</strong>.
                    </>
                  )}
                </span>
              </li>
            </ol>
          ) : (
            <ol className="space-y-2">
              <li className="flex items-start gap-2.5 bg-black/35 border border-amber-900/40 rounded-2xl p-2.5">
                <MoreVertical className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <span>
                  {isTh ? (
                    <>
                      1. เปิดเมนูเบราว์เซอร์ (<strong>⋮</strong> หรือไอคอนติดตั้งบนแถบ URL)
                    </>
                  ) : (
                    <>
                      1. Open the browser menu (<strong>⋮</strong> or install icon in the address bar).
                    </>
                  )}
                </span>
              </li>
              <li className="flex items-start gap-2.5 bg-black/35 border border-amber-900/40 rounded-2xl p-2.5">
                <Download className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>
                  {isTh ? (
                    <>
                      2. เลือก <strong>ติดตั้งแอป (Install App)</strong> หรือ <strong>เพิ่มลงหน้าจอหลัก</strong>
                    </>
                  ) : (
                    <>
                      2. Select <strong>Install App</strong> or <strong>Add to Home screen</strong>.
                    </>
                  )}
                </span>
              </li>
            </ol>
          )}
        </div>

        <button
          onClick={(e) => {
            e.stopPropagation();
            setShowGuideModal(false);
          }}
          className="mt-5 w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white font-bold text-xs md:text-sm shadow-lg transition cursor-pointer"
        >
          {isTh ? 'ปิดหน้าต่าง' : 'Close'}
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
                {offlineSaved
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
              onClick={(e) => {
                e.stopPropagation();
                install();
              }}
              className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs transition shadow cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{isTh ? 'ติดตั้งแอป' : 'Install'}</span>
            </button>
          ) : (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowGuideModal(true);
              }}
              className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-400/50 text-amber-200 font-bold text-xs transition cursor-pointer"
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>{isTh ? 'ตั้งค่าออฟไลน์' : 'Offline Setup'}</span>
            </button>
          )}
        </div>
        {guideModal}
      </>
    );
  }

  // Floating mode (used on TitleScreen): hide only if already running as installed standalone app
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
        className="flex items-center gap-2 rounded-full bg-black/80 hover:bg-amber-950/95 active:scale-95 backdrop-blur-md border border-amber-400/60 px-4 py-2 text-xs md:text-sm font-bold text-amber-200 shadow-2xl transition cursor-pointer"
      >
        <Download className="w-4 h-4 text-amber-400" />
        <span>{isTh ? 'ติดตั้งเกมไว้เล่นออฟไลน์' : 'Install for Offline Play'}</span>
      </button>
    );
  }

  // Always show accessible Offline / Install pill button on TitleScreen (for iOS, Safari, Firefox, or while SW is warming up)
  return (
    <>
      <button
        onClick={(e) => {
          e.stopPropagation();
          setShowGuideModal(true);
        }}
        className="flex items-center gap-2 rounded-full bg-black/80 hover:bg-amber-950/95 active:scale-95 backdrop-blur-md border border-amber-400/50 px-4 py-2 text-xs md:text-sm font-bold text-amber-200 shadow-2xl transition cursor-pointer"
      >
        <span
          className={`w-2 h-2 rounded-full shrink-0 ${
            offlineSaved ? 'bg-emerald-400' : 'bg-amber-400 animate-pulse'
          }`}
        />
        {isIOS ? (
          <Smartphone className="w-4 h-4 text-amber-400" />
        ) : (
          <HardDriveDownload className="w-4 h-4 text-amber-400" />
        )}
        <span>
          {isIOS
            ? isTh
              ? 'ติดตั้งเล่นออฟไลน์ (iOS)'
              : 'Install Offline (iOS)'
            : offlineSaved
            ? isTh
              ? 'พร้อมเล่นออฟไลน์ • ติดตั้งแอป'
              : 'Offline Ready • Install App'
            : isTh
            ? 'บันทึกเล่นออฟไลน์ / ติดตั้ง'
            : 'Save Offline / Install'}
        </span>
      </button>
      {guideModal}
    </>
  );
};
