import React, { useState, useEffect, useCallback, useRef } from 'react';
import { WeevilCanvas } from './components/WeevilCanvas';
import { GameHUD } from './components/GameHUD';
import { VictoryModal } from './components/VictoryModal';
import { SettingsModal } from './components/SettingsModal';
import { RiceKnowledgeModal } from './components/RiceKnowledgeModal';
import { GameDifficulty, DifficultyConfig } from './types/game';
import { soundManager } from './audio/soundManager';

const DIFFICULTIES: Record<GameDifficulty, DifficultyConfig> = {
  easy: {
    name: 'มือใหม่หัดจับมอด',
    count: 25,
    description: 'เหมาะสำหรับเด็กหรือผู้เริ่มเล่น มอดกระจายตัวโปร่งสบาย',
    speedMultiplier: 0.9,
  },
  normal: {
    name: 'กระสอบทั่วไป (ต้นฉบับ)',
    count: 45,
    description: 'จำนวนมอดมาตรฐาน 45 ตัวตามเกมดั้งเดิมกำลังสนุก',
    speedMultiplier: 1.0,
  },
  hard: {
    name: 'มอดบุกกระสอบ',
    count: 70,
    description: 'มอดหนาแน่นขึ้น วิ่งเร็วขึ้น ท้าทายความไวของนิ้ว',
    speedMultiplier: 1.2,
  },
  extreme: {
    name: 'ฝูงมอดดุเดือด (Frenzy)',
    count: 100,
    description: 'กระสอบข้าวสารแตก! มอด 100 ตัวเบียดเสียด วิ่งพล่าน',
    speedMultiplier: 1.35,
  },
};

const DIFFICULTY_ORDER: GameDifficulty[] = ['easy', 'normal', 'hard', 'extreme'];

export default function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [difficulty, setDifficulty] = useState<GameDifficulty>('normal');
  const [gameKey, setGameKey] = useState(0);

  // Counters
  const [remainingCount, setRemainingCount] = useState(DIFFICULTIES.normal.count);
  const [totalCount, setTotalCount] = useState(DIFFICULTIES.normal.count);
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

  // Victory Stats
  const [victoryStats, setVictoryStats] = useState({
    elapsed: 0,
    maxCombo: 0,
    accuracy: 0,
  });

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

  // Timer interval
  useEffect(() => {
    if (isPlaying && !showVictory && !showSettings && !showKnowledge) {
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
  }, [isPlaying, showVictory, showSettings, showKnowledge, elapsedTime]);

  // Restart game
  const handleRestart = useCallback(() => {
    setShowVictory(false);
    setRemainingCount(DIFFICULTIES[difficulty].count);
    setTotalCount(DIFFICULTIES[difficulty].count);
    setCombo(0);
    setElapsedTime(0);
    setIsPlaying(true);
    setGameKey((k) => k + 1);
  }, [difficulty]);

  // Difficulty change
  const handleSelectDifficulty = (newDiff: GameDifficulty) => {
    setDifficulty(newDiff);
    setShowSettings(false);
    setRemainingCount(DIFFICULTIES[newDiff].count);
    setTotalCount(DIFFICULTIES[newDiff].count);
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
      {/* Loading Screen from original source */}
      {isLoading && (
        <div
          id="loading-screen"
          className="absolute inset-0 bg-[#3a1c0e] flex flex-col justify-center items-center z-50 transition-opacity duration-500"
        >
          <div className="animate-pulse mb-4 text-6xl">🌾🐜👻🌾</div>
          <h1 className="text-2xl font-extrabold text-amber-100 tracking-wider text-center px-4">
            กำลังเทข้าวสารแบบเต็มกระสอบ...
          </h1>
          <p className="text-amber-200/60 mt-2 text-xs text-center">
            จัดวางตำแหน่งตัวมอดและระบบวิญญาณเรืองแสงสว่างจ้า
          </p>
        </div>
      )}

      {/* Main Fullscreen Canvas Game Engine */}
      <WeevilCanvas
        key={gameKey}
        totalCount={DIFFICULTIES[difficulty].count}
        isPaused={showSettings || showKnowledge}
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
        onRestart={handleRestart}
        onToggleMute={handleToggleMute}
        onOpenSettings={() => setShowSettings(true)}
        onOpenKnowledge={() => setShowKnowledge(true)}
      />

      {/* Victory Modal */}
      <VictoryModal
        isOpen={showVictory}
        totalWeevils={DIFFICULTIES[difficulty].count}
        elapsedTime={victoryStats.elapsed}
        maxCombo={victoryStats.maxCombo}
        accuracy={victoryStats.accuracy}
        bestTime={bestRecords[difficulty]}
        onPlayAgain={handleRestart}
        onNextDifficulty={handleNextDifficulty}
        hasNextDifficulty={hasNextDifficulty}
      />

      {/* Settings & Difficulty Modal */}
      <SettingsModal
        isOpen={showSettings}
        currentDifficulty={difficulty}
        difficulties={DIFFICULTIES}
        isMuted={isMuted}
        bestRecords={bestRecords}
        onSelectDifficulty={handleSelectDifficulty}
        onToggleMute={handleToggleMute}
        onClose={() => setShowSettings(false)}
      />

      {/* Fun Facts & Rice Weevil Knowledge Modal */}
      <RiceKnowledgeModal
        isOpen={showKnowledge}
        onClose={() => setShowKnowledge(false)}
      />
    </div>
  );
}
