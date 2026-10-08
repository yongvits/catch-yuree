import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { WeevilCanvas } from './components/WeevilCanvas';
import { GameHUD } from './components/GameHUD';
import { VictoryModal } from './components/VictoryModal';
import { SettingsModal } from './components/SettingsModal';
import { RiceKnowledgeModal } from './components/RiceKnowledgeModal';
import { SpriteModal } from './components/SpriteModal';
import { GameDifficulty, DifficultyConfig } from './types/game';
import { soundManager } from './audio/soundManager';
import { translations, Language } from './i18n/translations';
import { spriteEngine } from './utils/spriteEngine';
import { Upload } from 'lucide-react';

const DIFFICULTY_ORDER: GameDifficulty[] = ['easy', 'normal', 'hard', 'extreme'];

export default function App() {
  const [language, setLanguage] = useState<Language>('en');
  const t = translations[language];

  const difficulties: Record<GameDifficulty, DifficultyConfig> = useMemo(() => {
    return {
      easy: {
        name: t.difficultyEasyName,
        count: 25,
        description: t.difficultyEasyDesc,
        speedMultiplier: 0.9,
      },
      normal: {
        name: t.difficultyNormalName,
        count: 45,
        description: t.difficultyNormalDesc,
        speedMultiplier: 1.0,
      },
      hard: {
        name: t.difficultyHardName,
        count: 70,
        description: t.difficultyHardDesc,
        speedMultiplier: 1.2,
      },
      extreme: {
        name: t.difficultyExtremeName,
        count: 100,
        description: t.difficultyExtremeDesc,
        speedMultiplier: 1.35,
      },
    };
  }, [t]);

  const [isLoading, setIsLoading] = useState(true);
  const [difficulty, setDifficulty] = useState<GameDifficulty>('normal');
  const [gameKey, setGameKey] = useState(0);

  // Counters
  const [remainingCount, setRemainingCount] = useState(45);
  const [totalCount, setTotalCount] = useState(45);
  const [combo, setCombo] = useState(0);
  const [isMuted, setIsMuted] = useState(soundManager.isMuted);

  // Timer
  const [elapsedTime, setElapsedTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const timerRef = useRef<number | null>(null);

  // Modals
  const [showVictory, setShowVictory] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showKnowledge, setShowKnowledge] = useState(false);
  const [showSpriteModal, setShowSpriteModal] = useState(false);

  // Drag & drop indicator
  const [isWindowDragging, setIsWindowDragging] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Victory Stats
  const [victoryStats, setVictoryStats] = useState({
    elapsed: 0,
    maxCombo: 0,
    accuracy: 0,
  });

  // Interface visibility (Hide all except time and remaining count by default)
  const [isInterfaceHidden, setIsInterfaceHidden] = useState(true);
  const [showUnhideHint, setShowUnhideHint] = useState(false);
  const hintTimerRef = useRef<number | null>(null);

  const handleHideInterface = useCallback(() => {
    setIsInterfaceHidden(true);
    setShowUnhideHint(true);
    if (hintTimerRef.current) clearTimeout(hintTimerRef.current);
    hintTimerRef.current = window.setTimeout(() => {
      setShowUnhideHint(false);
    }, 4000);
  }, []);

  const handleUnhideInterface = useCallback(() => {
    setIsInterfaceHidden(false);
    setShowUnhideHint(false);
    if (hintTimerRef.current) clearTimeout(hintTimerRef.current);
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      try {
        navigator.vibrate([30, 40, 30]);
      } catch {
        // ignore vibrate error
      }
    }
  }, []);

  // 4-finger multi-touch listener to restore interface
  useEffect(() => {
    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches && e.touches.length >= 4) {
        handleUnhideInterface();
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      // Desktop keyboard shortcut (H, Escape, 4) to toggle / restore interface
      if (e.key === 'Escape' || e.key === 'h' || e.key === 'H' || e.key === '4') {
        setIsInterfaceHidden((prev) => !prev);
      }
    };

    window.addEventListener('touchstart', handleTouchStart, { passive: true });
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleUnhideInterface]);

  // Best Records
  const [bestRecords, setBestRecords] = useState<Record<GameDifficulty, number | null>>(() => {
    try {
      const saved = localStorage.getItem('weevil_game_records');
      return saved
        ? JSON.parse(saved)
        : {
            easy: null,
            normal: null,
            hard: null,
            extreme: null,
          };
    } catch {
      return {
        easy: null,
        normal: null,
        hard: null,
        extreme: null,
      };
    }
  });

  // Loading screen dismissal
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
      setIsPlaying(true);
    }, 700);
    return () => clearTimeout(timer);
  }, []);

  // Global drag & drop for spritesheet file
  useEffect(() => {
    const handleDragOver = (e: DragEvent) => {
      e.preventDefault();
      setIsWindowDragging(true);
    };

    const handleDragLeave = (e: DragEvent) => {
      if (e.clientX <= 0 || e.clientY <= 0) {
        setIsWindowDragging(false);
      }
    };

    const handleDrop = async (e: DragEvent) => {
      e.preventDefault();
      setIsWindowDragging(false);
      if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0]) {
        const file = e.dataTransfer.files[0];
        if (file.type.startsWith('image/')) {
          const success = await spriteEngine.loadFromFile(file);
          if (success) {
            setToastMessage(language === 'en' ? 'Spritesheet loaded successfully!' : 'โหลดสไปร์ทชีทสำเร็จแล้ว!');
            setTimeout(() => setToastMessage(null), 3000);
            setGameKey((k) => k + 1);
          }
        }
      }
    };

    window.addEventListener('dragover', handleDragOver);
    window.addEventListener('dragleave', handleDragLeave);
    window.addEventListener('drop', handleDrop);

    return () => {
      window.removeEventListener('dragover', handleDragOver);
      window.removeEventListener('dragleave', handleDragLeave);
      window.removeEventListener('drop', handleDrop);
    };
  }, [language]);

  // Timer interval
  useEffect(() => {
    if (isPlaying && !showVictory && !showSettings && !showKnowledge && !showSpriteModal) {
      const startTimestamp = performance.now() - elapsedTime * 1000;
      timerRef.current = window.setInterval(() => {
        const sec = (performance.now() - startTimestamp) / 1000;
        setElapsedTime(sec);
      }, 100);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPlaying, showVictory, showSettings, showKnowledge, showSpriteModal, elapsedTime]);

  // Restart game
  const handleRestart = useCallback(() => {
    const count = difficulties[difficulty].count;
    setShowVictory(false);
    setRemainingCount(count);
    setTotalCount(count);
    setCombo(0);
    setElapsedTime(0);
    setIsPlaying(true);
    setGameKey((k) => k + 1);
  }, [difficulty, difficulties]);

  // Difficulty change
  const handleSelectDifficulty = (newDiff: GameDifficulty) => {
    setDifficulty(newDiff);
    setShowSettings(false);
    const count = difficulties[newDiff].count;
    setRemainingCount(count);
    setTotalCount(count);
    setCombo(0);
    setElapsedTime(0);
    setIsPlaying(true);
    setGameKey((k) => k + 1);
  };

  // Sound toggle
  const handleToggleMute = () => {
    const muted = soundManager.toggleMute();
    setIsMuted(muted);
  };

  // Language toggle
  const handleToggleLanguage = () => {
    setLanguage((prev) => (prev === 'en' ? 'th' : 'en'));
  };

  // Count update callback
  const handleCountChange = useCallback((remaining: number, total: number) => {
    setRemainingCount(remaining);
    setTotalCount(total);
  }, []);

  // Hit & combo callback
  const handleHit = useCallback((currentCombo: number) => {
    setCombo(currentCombo);
  }, []);

  // Miss callback
  const handleMiss = useCallback(() => {
    setCombo(0);
  }, []);

  // Victory callback
  const handleVictory = useCallback(
    (elapsed: number, maxCombo: number, accuracy: number) => {
      setIsPlaying(false);
      setVictoryStats({
        elapsed,
        maxCombo,
        accuracy,
      });

      // Update best record
      setBestRecords((prev) => {
        const currentBest = prev[difficulty];
        const newBest = currentBest === null || elapsed < currentBest ? elapsed : currentBest;
        const updated = { ...prev, [difficulty]: newBest };
        try {
          localStorage.setItem('weevil_game_records', JSON.stringify(updated));
        } catch {
          // ignore localStorage error
        }
        return updated;
      });

      setShowVictory(true);
    },
    [difficulty]
  );

  // Next difficulty
  const currentDiffIndex = DIFFICULTY_ORDER.indexOf(difficulty);
  const hasNextDifficulty = currentDiffIndex < DIFFICULTY_ORDER.length - 1;

  const handleNextDifficulty = () => {
    if (hasNextDifficulty) {
      const nextDiff = DIFFICULTY_ORDER[currentDiffIndex + 1];
      handleSelectDifficulty(nextDiff);
    }
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden select-none bg-[#1a0d05] font-['Kanit',sans-serif]">
      {/* Loading Screen */}
      {isLoading && (
        <div
          id="loading-screen"
          className="absolute inset-0 bg-[#3a1c0e] flex flex-col justify-center items-center z-50 transition-opacity duration-500"
        >
          <div className="animate-pulse mb-4 text-6xl">🌾🐜👻🌾</div>
          <h1 className="text-2xl font-extrabold text-amber-100 tracking-wider text-center px-4">
            {t.loadingTitle}
          </h1>
          <p className="text-amber-200/60 mt-2 text-xs text-center">
            {t.loadingSubtitle}
          </p>
        </div>
      )}

      {/* Drag & drop overlay */}
      {isWindowDragging && (
        <div className="absolute inset-0 bg-amber-950/80 backdrop-blur-md z-50 flex flex-col items-center justify-center border-4 border-dashed border-amber-400 p-8 text-center pointer-events-none">
          <Upload className="w-16 h-16 text-amber-300 animate-bounce mb-3" />
          <h2 className="text-2xl font-black text-amber-100">
            {language === 'en' ? 'Drop Spritesheet Image Here' : 'ปล่อยไฟล์รูปสไปร์ทชีทที่นี่'}
          </h2>
          <p className="text-amber-300/80 text-sm mt-1">
            {language === 'en'
              ? '4x2 grid of 8 walk animation frames (white background is auto-removed)'
              : 'ตาราง 4x2 รวม 8 เฟรมแอนิเมชัน (ลบพื้นหลังขาวอัตโนมัติ)'}
          </p>
        </div>
      )}

      {/* Floating toast notification */}
      {toastMessage && (
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-50 bg-black/80 backdrop-blur-md border border-amber-400/50 text-amber-200 px-4 py-2 rounded-2xl shadow-2xl text-xs md:text-sm animate-in fade-in slide-in-from-bottom-4 duration-300">
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Floating hint when Interface is hidden */}
      {isInterfaceHidden && showUnhideHint && (
        <div
          onClick={handleUnhideInterface}
          className="absolute top-16 left-1/2 -translate-x-1/2 z-30 bg-black/85 backdrop-blur-md border border-amber-400/40 text-amber-200 px-4 py-2 rounded-2xl shadow-2xl text-xs md:text-sm animate-in fade-in slide-in-from-top-3 duration-300 cursor-pointer"
        >
          <span>{t.hudHiddenNotice}</span>
        </div>
      )}

      {/* Main Fullscreen Canvas Game Engine */}
      <WeevilCanvas
        key={gameKey}
        totalCount={difficulties[difficulty].count}
        ascendedText={t.canvasAscended}
        comboPrefix={t.canvasCombo}
        isPaused={showSettings || showKnowledge || showSpriteModal}
        onCountChange={handleCountChange}
        onVictory={handleVictory}
        onHit={handleHit}
        onMiss={handleMiss}
      />

      {/* Modern HUD with floating stats & controls */}
      <GameHUD
        remainingCount={remainingCount}
        totalCount={totalCount}
        elapsedTime={elapsedTime}
        combo={combo}
        isMuted={isMuted}
        language={language}
        t={t}
        isInterfaceHidden={isInterfaceHidden}
        onHideInterface={handleHideInterface}
        onUnhideInterface={handleUnhideInterface}
        onRestart={handleRestart}
        onToggleMute={handleToggleMute}
        onToggleLanguage={handleToggleLanguage}
        onOpenSettings={() => setShowSettings(true)}
        onOpenKnowledge={() => setShowKnowledge(true)}
        onOpenSprite={() => setShowSpriteModal(true)}
      />

      {/* Victory Modal */}
      <VictoryModal
        isOpen={showVictory}
        totalWeevils={difficulties[difficulty].count}
        elapsedTime={victoryStats.elapsed}
        maxCombo={victoryStats.maxCombo}
        accuracy={victoryStats.accuracy}
        bestTime={bestRecords[difficulty]}
        t={t}
        onPlayAgain={handleRestart}
        onNextDifficulty={handleNextDifficulty}
        hasNextDifficulty={hasNextDifficulty}
      />

      {/* Settings & Difficulty Modal */}
      <SettingsModal
        isOpen={showSettings}
        currentDifficulty={difficulty}
        difficulties={difficulties}
        isMuted={isMuted}
        bestRecords={bestRecords}
        language={language}
        t={t}
        onSelectDifficulty={handleSelectDifficulty}
        onToggleMute={handleToggleMute}
        onSelectLanguage={(lang) => setLanguage(lang)}
        onClose={() => setShowSettings(false)}
      />

      {/* Fun Facts & Rice Weevil Knowledge Modal */}
      <RiceKnowledgeModal
        isOpen={showKnowledge}
        t={t}
        onClose={() => setShowKnowledge(false)}
      />

      {/* Spritesheet Viewer & Uploader Modal */}
      <SpriteModal
        isOpen={showSpriteModal}
        language={language}
        t={t}
        onClose={() => setShowSpriteModal(false)}
        onSpriteUpdated={() => setGameKey((k) => k + 1)}
      />
    </div>
  );
}
