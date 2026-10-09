import React, { useState, useRef, useEffect } from 'react';
import { X, Upload, RotateCcw, Check, Sliders, Ghost as GhostIcon, Bug, Loader2, Sparkles, HelpCircle, Flame } from 'lucide-react';
import { spriteEngine } from '../utils/spriteEngine';
import { herbEngine } from '../utils/herbEngine';
import { TranslationStrings, Language } from '../i18n/translations';

interface SpriteModalProps {
  isOpen: boolean;
  language: Language;
  t: TranslationStrings;
  onClose: () => void;
  onSpriteUpdated: () => void;
}

export const SpriteModal: React.FC<SpriteModalProps> = ({
  isOpen,
  language,
  onClose,
  onSpriteUpdated,
}) => {
  const [activeTab, setActiveTab] = useState<'character' | 'herbs'>('herbs');
  const [activeFrame, setActiveFrame] = useState(0);
  const [hasCustom, setHasCustom] = useState(spriteEngine.hasCustomSprite());
  const [hasCustomHerbs, setHasCustomHerbs] = useState(herbEngine.hasCustomSpritesheet());
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [showGuide, setShowGuide] = useState(false);
  const [showHerbsGuide, setShowHerbsGuide] = useState(false);
  const [lengthScale, setLengthScale] = useState(spriteEngine.getLengthScale());
  const [previewMode, setPreviewMode] = useState<'alive' | 'ghost'>('alive');
  const previewCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Sync state on open
  useEffect(() => {
    if (isOpen) {
      setLengthScale(spriteEngine.getLengthScale());
      setHasCustom(spriteEngine.hasCustomSprite());
      setHasCustomHerbs(herbEngine.hasCustomSpritesheet());
      setStatusMsg(null);
    }
  }, [isOpen]);

  // Animation preview loop for character
  useEffect(() => {
    if (!isOpen || activeTab !== 'character') return;

    const interval = setInterval(() => {
      setActiveFrame((prev) => (prev + 1) % 8);
    }, 120);

    return () => clearInterval(interval);
  }, [isOpen, activeTab]);

  // Render character preview frame on canvas
  useEffect(() => {
    if (!isOpen || activeTab !== 'character' || !previewCanvasRef.current) return;
    const canvas = previewCanvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Burlap background for preview
    ctx.fillStyle = '#b09477';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Rice grains hint
    ctx.fillStyle = '#fff9e6';
    ctx.beginPath();
    ctx.ellipse(30, 30, 8, 3, 0.4, 0, Math.PI * 2);
    ctx.ellipse(140, 40, 9, 3.5, -0.6, 0, Math.PI * 2);
    ctx.ellipse(35, 160, 8.5, 3, 0.2, 0, Math.PI * 2);
    ctx.ellipse(145, 170, 9, 3, 0.9, 0, Math.PI * 2);
    ctx.fill();

    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;

    if (previewMode === 'ghost') {
      ctx.save();
      ctx.shadowColor = '#0284c7';
      ctx.shadowBlur = 38;
      ctx.fillStyle = 'rgba(56, 189, 248, 0.32)';
      ctx.beginPath();
      ctx.ellipse(centerX, centerY, 46, 56, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      ctx.save();
      ctx.shadowColor = '#38bdf8';
      ctx.shadowBlur = 28;
      const coreGrad = ctx.createRadialGradient(centerX, centerY, 6, centerX, centerY, 40);
      coreGrad.addColorStop(0, 'rgba(224, 242, 254, 0.65)');
      coreGrad.addColorStop(0.55, 'rgba(56, 189, 248, 0.45)');
      coreGrad.addColorStop(1, 'rgba(14, 165, 233, 0)');
      ctx.fillStyle = coreGrad;
      ctx.beginPath();
      ctx.arc(centerX, centerY, 40, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      spriteEngine.drawFrame(ctx, activeFrame, centerX, centerY, 27, 0, 0.72, 1.0, true);
    } else {
      spriteEngine.drawFrame(ctx, activeFrame, centerX, centerY, 27, 0, 1.0, 1.0, false);
    }
  }, [isOpen, activeTab, activeFrame, lengthScale, previewMode]);

  if (!isOpen) return null;

  const isEn = language === 'en';

  // Character sprite upload handler
  const handleFileUpload = async (file: File) => {
    setIsProcessing(true);
    setStatusMsg(null);

    try {
      const res = await spriteEngine.loadFromFile(file);
      if (res.success) {
        setHasCustom(true);
        setStatusMsg({
          type: 'success',
          text: isEn
            ? '✓ Character sprite updated & saved permanently!'
            : '✓ อัปเดตรูปตัวมอดสำเร็จ! บันทึกลงเครื่องถาวรแล้ว',
        });
        onSpriteUpdated();
      } else {
        setStatusMsg({
          type: 'error',
          text: isEn
            ? `Upload failed: ${res.error || 'Please use an 8-frame 4x2 spritesheet image'}`
            : `ไม่สามารถนำเข้ารูปได้: ${res.error || 'กรุณาใช้รูปภาพที่มี 8 เฟรม (4 คอลัมน์ x 2 แถว)'}`,
        });
      }
    } catch (err: any) {
      setStatusMsg({
        type: 'error',
        text: err?.message || (isEn ? 'Failed to process image' : 'เกิดข้อผิดพลาดในการประมวลผลรูปภาพ'),
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // Herbs spritesheet upload handler (4 cols x 3 rows = 12 items)
  const handleHerbsFileUpload = async (file: File) => {
    setIsProcessing(true);
    setStatusMsg(null);

    try {
      const res = await herbEngine.loadFromFile(file);
      if (res.success) {
        setHasCustomHerbs(true);
        setStatusMsg({
          type: 'success',
          text: isEn
            ? '✓ Herbs spritesheet (Chili, Lime, Garlic) updated & saved!'
            : '✓ อัปเดตรูปสไปร์ทชีทสมุนไพร (พริก, มะกรูด, กระเทียม) เรียบร้อยแล้ว!',
        });
        onSpriteUpdated();
      } else {
        setStatusMsg({
          type: 'error',
          text: isEn
            ? `Upload failed: ${res.error || 'Please use a 4x3 herbs spritesheet'}`
            : `ไม่สามารถนำเข้ารูปได้: ${res.error || 'กรุณาใช้รูปภาพ 4 คอลัมน์ x 3 แถว'}`,
        });
      }
    } catch (err: any) {
      setStatusMsg({
        type: 'error',
        text: err?.message || 'Error processing herbs',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // Quick load character from repo
  const handleLoadUploadedPreset = async () => {
    setIsProcessing(true);
    setStatusMsg(null);
    try {
      const ok = await spriteEngine.loadPresetSkin();
      if (ok) {
        setHasCustom(true);
        setStatusMsg({
          type: 'success',
          text: isEn
            ? '✓ Character skin loaded from repository!'
            : '✓ โหลดรูปภาพตัวละคร (รูปที่ 2) สำเร็จเรียบร้อย!',
        });
        onSpriteUpdated();
      } else {
        setStatusMsg({
          type: 'error',
          text: isEn
            ? 'Uploaded skin file not found in public folder.'
            : 'ไม่พบไฟล์รูปภาพสกินในโฟลเดอร์ public',
        });
      }
    } catch (err: any) {
      setStatusMsg({
        type: 'error',
        text: err?.message || 'Error loading skin',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // Quick load herbs from repo
  const handleLoadHerbsPreset = async () => {
    setIsProcessing(true);
    setStatusMsg(null);
    try {
      const ok = await herbEngine.loadPresetHerbs();
      if (ok) {
        setHasCustomHerbs(true);
        setStatusMsg({
          type: 'success',
          text: isEn
            ? '✓ Herbs spritesheet loaded from repository!'
            : '✓ โหลดรูปภาพสไปร์ทชีทสมุนไพร 4x3 สำเร็จเรียบร้อย!',
        });
        onSpriteUpdated();
      } else {
        setStatusMsg({
          type: 'error',
          text: isEn
            ? 'Preset herbs spritesheet not found in public folder.'
            : 'ไม่พบไฟล์ 3BC67C8E... ใน public (ใช้ภาพจำลองที่สวยงามอยู่แล้ว)',
        });
      }
    } catch (err: any) {
      setStatusMsg({
        type: 'error',
        text: err?.message || 'Error loading herbs',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReset = async () => {
    await spriteEngine.resetToDefault();
    setHasCustom(false);
    setLengthScale(1.0);
    setStatusMsg({
      type: 'success',
      text: isEn ? 'Reset to default character' : 'รีเซ็ตกลับเป็นตัวมอดเริ่มต้นแล้ว',
    });
    onSpriteUpdated();
  };

  const handleLengthChange = (val: number) => {
    setLengthScale(val);
    spriteEngine.setLengthScale(val);
    onSpriteUpdated();
  };

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-sm flex justify-center items-center z-50 p-4">
      <div className="bg-gradient-to-b from-[#2a170e] to-[#1a0d05] border border-amber-500/40 rounded-3xl p-5 md:p-6 max-w-sm md:max-w-md w-full shadow-2xl relative text-amber-50 max-h-[95vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex justify-between items-center mb-3 border-b border-amber-900/60 pb-3">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🎨</span>
            <div>
              <h3 className="font-extrabold text-base md:text-lg text-amber-200">
                {isEn ? 'Game Artwork & Spritesheets' : 'สกินตัวละคร & สมุนไพรในกระสอบ'}
              </h3>
              <p className="text-[11px] text-amber-300/70">
                {isEn
                  ? 'Manage character walk frames & natural repellent herbs'
                  : 'จัดการสกินตัวมอด และสมุนไพรไล่มอด (พริก มะกรูด กระเทียม)'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-black/40 hover:bg-black/70 flex items-center justify-center text-zinc-400 hover:text-white transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="grid grid-cols-2 gap-1.5 p-1 bg-black/60 rounded-2xl border border-amber-900/60 mb-3.5">
          <button
            onClick={() => {
              setActiveTab('herbs');
              setStatusMsg(null);
            }}
            className={`py-2 px-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'herbs'
                ? 'bg-gradient-to-r from-red-600 via-amber-600 to-emerald-600 text-white shadow-lg'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <span>🌶️</span>
            <span>{isEn ? 'Herbs & Spices' : 'พริก มะกรูด กระเทียม'}</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('character');
              setStatusMsg(null);
            }}
            className={`py-2 px-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'character'
                ? 'bg-amber-600 text-white shadow-lg'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <span>🐛</span>
            <span>{isEn ? 'Weevil Skin' : 'ตัวละครมอด (8 เฟรม)'}</span>
          </button>
        </div>

        {/* Status Alert Banner */}
        {statusMsg && (
          <div
            className={`mb-3 p-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 ${
              statusMsg.type === 'success'
                ? 'bg-emerald-950/80 border border-emerald-500/50 text-emerald-200'
                : 'bg-red-950/80 border border-red-500/50 text-red-200'
            }`}
          >
            <span>{statusMsg.type === 'success' ? '✨' : '⚠️'}</span>
            <span>{statusMsg.text}</span>
          </div>
        )}

        {/* TAB 1: HERBS & REPELLENTS (CHILI, KAFFIR LIME, GARLIC) */}
        {activeTab === 'herbs' && (
          <div>
            <div className="p-3 bg-black/40 border border-amber-900/50 rounded-2xl mb-3 text-xs text-amber-200/90 leading-relaxed">
              <div className="flex items-center gap-1.5 font-bold text-amber-300 mb-1">
                <Flame className="w-4 h-4 text-red-400" />
                <span>{isEn ? 'Rice Sack Natural Repellents (12 Items)' : 'สมุนไพรไล่มอด 12 ชนิด (4x3)'}</span>
              </div>
              <p className="text-[11px] text-zinc-300">
                {isEn
                  ? 'Chilies, Kaffir lime leaves, and Garlic cloves are scattered randomly in the rice bed. Weevils naturally avoid crawling near them!'
                  : 'พริกแห้ง/พริกสด ใบมะกรูด และกลีบกระเทียม ถูกสุ่มวางกระจายในกระสอบข้าวสาร ตัวมอดจะเดินหลบเลี่ยงกลิ่นฉุนตามภูมิปัญญาโบราณ!'}
              </p>
            </div>

            {/* Quick Load Button for Herbs */}
            <div className="mb-3">
              <button
                onClick={handleLoadHerbsPreset}
                disabled={isProcessing}
                className="w-full py-2.5 px-3 rounded-2xl bg-gradient-to-r from-red-600 via-amber-600 to-emerald-600 hover:from-red-500 hover:to-emerald-500 active:scale-98 text-white text-xs font-bold shadow-lg transition flex items-center justify-center gap-2 border border-red-400/40 cursor-pointer disabled:opacity-50"
              >
                <Sparkles className="w-4 h-4 text-amber-200" />
                <span>
                  {isEn
                    ? '✨ Load Uploaded Herbs Spritesheet (3BC67C8E...)'
                    : '✨ โหลดรูปภาพสไปร์ทชีทสมุนไพร (3BC67C8E...)'}
                </span>
              </button>
            </div>

            {/* Native Tap/Drop Upload Box for Herbs */}
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={(e) => {
                e.preventDefault();
                setIsDragging(false);
                if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                  handleHerbsFileUpload(e.dataTransfer.files[0]);
                }
              }}
              className={`relative overflow-hidden border-2 border-dashed rounded-2xl p-4 text-center transition flex flex-col items-center justify-center gap-1.5 mb-3.5 ${
                isDragging
                  ? 'border-emerald-400 bg-emerald-600/20'
                  : 'border-amber-600/60 bg-black/40 hover:bg-black/60 hover:border-amber-400'
              }`}
            >
              <input
                type="file"
                accept="image/*"
                disabled={isProcessing}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    handleHerbsFileUpload(e.target.files[0]);
                  }
                }}
              />

              <div className="w-10 h-10 rounded-full bg-emerald-600/30 border border-emerald-500/40 flex items-center justify-center text-emerald-300">
                {isProcessing ? (
                  <Loader2 className="w-5 h-5 animate-spin text-amber-400" />
                ) : (
                  <Upload className="w-5 h-5" />
                )}
              </div>

              <div className="font-bold text-sm text-amber-200">
                {isProcessing
                  ? isEn
                    ? 'Processing & downscaling herbs spritesheet...'
                    : 'กำลังประมวลผลรูปสมุนไพรและตัดพื้นหลัง...'
                  : isEn
                  ? 'Tap to Upload Herbs Spritesheet (4 cols × 3 rows)'
                  : 'แตะที่นี่เพื่ออัปโหลดรูปภาพสไปร์ทชีทสมุนไพร'}
              </div>

              <p className="text-[11px] text-zinc-300 max-w-xs">
                {isEn
                  ? 'Supports 4x3 grid (Chili, Lime, Garlic), automatically cuts white background!'
                  : 'รองรับรูปภาพ 4 คอลัมน์ x 3 แถว ระบบจะตัดพื้นหลังสีขาวให้อัตโนมัติและจำไว้ถาวร'}
              </p>
            </div>

            {/* 12 Items Gallery Grid */}
            <div className="mb-3.5 bg-black/50 p-3 rounded-2xl border border-amber-950">
              <div className="text-[11px] font-bold text-amber-300 mb-2 flex justify-between items-center">
                <span>{isEn ? '12 Sliced Herb Sprites:' : 'ชิ้นส่วนสมุนไพรทั้ง 12 แบบ (4x3):'}</span>
                <span className="text-[10px] text-emerald-400">
                  {hasCustomHerbs ? (isEn ? 'Custom Active' : 'ใช้รูปที่อัปโหลด') : (isEn ? 'Built-in Active' : 'ใช้ภาพจำลอง')}
                </span>
              </div>

              {/* Row 1: Chilies */}
              <div className="text-[10px] font-semibold text-red-300 mb-1 flex items-center gap-1">
                <span>🌶️</span>
                <span>{isEn ? 'Row 1: Chilies (พริก 4 แบบ)' : 'แถวที่ 1: พริก (4 แบบ)'}</span>
              </div>
              <div className="grid grid-cols-4 gap-1.5 mb-2.5">
                {[0, 1, 2, 3].map((idx) => {
                  const f = herbEngine.getFrameCanvas(idx);
                  return (
                    <div
                      key={idx}
                      className="aspect-square bg-amber-950/40 rounded-xl border border-amber-900/40 flex items-center justify-center p-1"
                    >
                      {f ? (
                        <img src={f.toDataURL()} alt={`Chili ${idx + 1}`} className="w-full h-full object-contain" />
                      ) : (
                        <span className="text-[9px] text-zinc-500">#{idx + 1}</span>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Row 2: Kaffir Lime Leaves */}
              <div className="text-[10px] font-semibold text-emerald-300 mb-1 flex items-center gap-1">
                <span>🍃</span>
                <span>{isEn ? 'Row 2: Kaffir Lime Leaves (ใบมะกรูด 4 แบบ)' : 'แถวที่ 2: ใบมะกรูด (4 แบบ)'}</span>
              </div>
              <div className="grid grid-cols-4 gap-1.5 mb-2.5">
                {[4, 5, 6, 7].map((idx) => {
                  const f = herbEngine.getFrameCanvas(idx);
                  return (
                    <div
                      key={idx}
                      className="aspect-square bg-emerald-950/30 rounded-xl border border-emerald-900/40 flex items-center justify-center p-1"
                    >
                      {f ? (
                        <img src={f.toDataURL()} alt={`Lime ${idx - 3}`} className="w-full h-full object-contain" />
                      ) : (
                        <span className="text-[9px] text-zinc-500">#{idx + 1}</span>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Row 3: Garlic Cloves */}
              <div className="text-[10px] font-semibold text-amber-200 mb-1 flex items-center gap-1">
                <span>🧄</span>
                <span>{isEn ? 'Row 3: Garlic Cloves (กระเทียม 4 แบบ)' : 'แถวที่ 3: กระเทียม (4 แบบ)'}</span>
              </div>
              <div className="grid grid-cols-4 gap-1.5">
                {[8, 9, 10, 11].map((idx) => {
                  const f = herbEngine.getFrameCanvas(idx);
                  return (
                    <div
                      key={idx}
                      className="aspect-square bg-amber-950/40 rounded-xl border border-amber-900/40 flex items-center justify-center p-1"
                    >
                      {f ? (
                        <img src={f.toDataURL()} alt={`Garlic ${idx - 7}`} className="w-full h-full object-contain" />
                      ) : (
                        <span className="text-[9px] text-zinc-500">#{idx + 1}</span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* GitHub Deployment Tip */}
            <div className="mb-3.5 bg-black/40 border border-amber-900/40 rounded-xl p-2.5 text-xs text-amber-200/90">
              <button
                onClick={() => setShowHerbsGuide(!showHerbsGuide)}
                className="w-full flex items-center justify-between text-left font-bold text-amber-300 text-xs hover:text-white transition cursor-pointer"
              >
                <span className="flex items-center gap-1.5">
                  <HelpCircle className="w-3.5 h-3.5 text-amber-400" />
                  <span>
                    {isEn
                      ? 'How to make herbs spritesheet permanent on GitHub?'
                      : 'วิธีใส่รูปสมุนไพรลง GitHub Pages ให้ทุกคนเห็นถาวร?'}
                  </span>
                </span>
                <span className="text-zinc-400 text-[10px]">{showHerbsGuide ? '▲ ซ่อน' : '▼ ดูวิธี'}</span>
              </button>

              {showHerbsGuide && (
                <div className="mt-2 text-[11px] text-amber-100/80 leading-relaxed border-t border-amber-900/40 pt-2 space-y-1.5">
                  <p>
                    <strong>1. ใช้บนเครื่องนี้ทันที:</strong> กดแตะกล่องอัปโหลดด้านบนแล้วเลือกรูปภาพจากเครื่องได้ทันที
                  </p>
                  <p>
                    <strong>2. บน GitHub Pages:</strong> นำไฟล์รูปไปวางไว้ในโฟลเดอร์{' '}
                    <code className="bg-black/60 px-1 py-0.5 rounded text-amber-300 font-mono">public/</code> บน GitHub แล้วตั้งชื่อว่า{' '}
                    <code className="bg-black/60 px-1 py-0.5 rounded text-amber-300 font-mono">3BC67C8E-0E58-4179-BD41-6DE6B9B12918.png</code> หรือ{' '}
                    <code className="bg-black/60 px-1 py-0.5 rounded text-amber-300 font-mono">herbs_spritesheet.png</code>
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 2: WEEVIL CHARACTER SPRITESHEET (4 COLS X 2 ROWS = 8 FRAMES) */}
        {activeTab === 'character' && (
          <div>
            {/* Live Animation Preview Box */}
            <div className="flex flex-col items-center justify-center p-3.5 bg-black/50 border border-amber-900/50 rounded-2xl mb-3.5">
              <div className="flex items-center gap-1.5 mb-2.5 bg-zinc-900/90 p-1 rounded-xl border border-zinc-800">
                <button
                  onClick={() => setPreviewMode('alive')}
                  className={`flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                    previewMode === 'alive'
                      ? 'bg-amber-600 text-white shadow'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  <Bug className="w-3.5 h-3.5" />
                  <span>{isEn ? 'Normal Sprite' : 'ตัวปกติ'}</span>
                </button>
                <button
                  onClick={() => setPreviewMode('ghost')}
                  className={`flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                    previewMode === 'ghost'
                      ? 'bg-sky-600 text-white shadow'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  <GhostIcon className="w-3.5 h-3.5 text-sky-200" />
                  <span>{isEn ? 'Ghost Tone (ตอนตาย)' : 'โทนฟ้าตอนตาย'}</span>
                </button>
              </div>

              <div className="relative w-40 h-48 rounded-2xl overflow-hidden border-2 border-amber-500/30 shadow-inner bg-[#b09477]">
                <canvas ref={previewCanvasRef} width={160} height={192} className="w-full h-full block" />
                <div className="absolute bottom-1.5 right-2 bg-black/75 text-[10px] font-mono px-2 py-0.5 rounded text-amber-300">
                  Frame {activeFrame + 1}/8
                </div>
              </div>

              <div className="text-xs font-semibold text-amber-200 mt-2 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                <span>
                  {previewMode === 'ghost'
                    ? isEn
                      ? 'Spectral Ghost Color Active on Death'
                      : 'สีวิญญาณเรืองแสงใช้ตอนตายและลอยสู่สุคติ'
                    : hasCustom
                    ? isEn
                      ? 'Custom Uploaded Spritesheet Active'
                      : 'กำลังใช้งานรูปภาพตัวมอดที่อัปโหลด'
                    : isEn
                    ? 'Original Spritesheet Character Active'
                    : 'ใช้งานมอดสไปร์ทชีทต้นฉบับ'}
                </span>
              </div>

              {/* Body Length & Proportion Slider */}
              <div className="w-full mt-3 pt-2.5 border-t border-amber-900/40">
                <div className="flex justify-between items-center text-xs mb-1">
                  <span className="text-amber-300 flex items-center gap-1 font-semibold">
                    <Sliders className="w-3.5 h-3.5" />
                    <span>{isEn ? 'Body Length (Proportion):' : 'ความยาวตัวละคร (สัดส่วนความสูง):'}</span>
                  </span>
                  <span className="font-mono text-amber-400 font-bold">{Math.round(lengthScale * 100)}%</span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-zinc-400">80%</span>
                  <input
                    type="range"
                    min="0.8"
                    max="1.6"
                    step="0.05"
                    value={lengthScale}
                    onChange={(e) => handleLengthChange(parseFloat(e.target.value))}
                    className="flex-1 accent-amber-500 cursor-pointer h-1.5 bg-zinc-800 rounded-lg"
                  />
                  <span className="text-[10px] text-zinc-400">160%</span>
                </div>

                <div className="flex justify-between text-[10px] text-zinc-400 mt-1">
                  <button onClick={() => handleLengthChange(1.0)} className="hover:text-amber-300 underline cursor-pointer">
                    {isEn ? 'Reset 100%' : 'สัดส่วนเดิม 100%'}
                  </button>
                  <button onClick={() => handleLengthChange(1.2)} className="hover:text-amber-300 underline cursor-pointer">
                    {isEn ? 'Long 120%' : 'ยาวขึ้น 120%'}
                  </button>
                  <button onClick={() => handleLengthChange(1.35)} className="hover:text-amber-300 underline cursor-pointer">
                    {isEn ? 'Extra Long 135%' : 'ยาวพิเศษ 135%'}
                  </button>
                </div>
              </div>
            </div>

            {/* Quick Apply Button for Uploaded Character Skin (Photo 2) */}
            <div className="mb-3.5">
              <button
                onClick={handleLoadUploadedPreset}
                disabled={isProcessing}
                className="w-full py-2.5 px-3 rounded-2xl bg-gradient-to-r from-pink-600 via-rose-600 to-amber-600 hover:from-pink-500 hover:to-amber-500 active:scale-98 text-white text-xs font-bold shadow-lg transition flex items-center justify-center gap-2 border border-pink-400/40 cursor-pointer disabled:opacity-50"
              >
                <Sparkles className="w-4 h-4 text-amber-200" />
                <span>
                  {isEn
                    ? '✨ Load Uploaded Character Skin (Photo 2)'
                    : '✨ สลับใช้รูปตัวละครที่อัปโหลด (รูปที่ 2)'}
                </span>
              </button>
            </div>

            {/* Tap/Drop Upload Box for Character */}
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={(e) => {
                e.preventDefault();
                setIsDragging(false);
                if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                  handleFileUpload(e.dataTransfer.files[0]);
                }
              }}
              className={`relative overflow-hidden border-2 border-dashed rounded-2xl p-4 text-center transition flex flex-col items-center justify-center gap-1.5 mb-3.5 ${
                isDragging
                  ? 'border-amber-400 bg-amber-600/20'
                  : 'border-amber-600/60 bg-black/40 hover:bg-black/60 hover:border-amber-400'
              }`}
            >
              <input
                type="file"
                accept="image/*"
                disabled={isProcessing}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    handleFileUpload(e.target.files[0]);
                  }
                }}
              />

              <div className="w-10 h-10 rounded-full bg-amber-600/30 border border-amber-500/40 flex items-center justify-center text-amber-300">
                {isProcessing ? (
                  <Loader2 className="w-5 h-5 animate-spin text-amber-400" />
                ) : (
                  <Upload className="w-5 h-5" />
                )}
              </div>

              <div className="font-bold text-sm text-amber-200">
                {isProcessing
                  ? isEn
                    ? 'Processing & downscaling image...'
                    : 'กำลังประมวลผลรูปภาพและตัดพื้นหลัง...'
                  : isEn
                  ? 'Tap to Upload Spritesheet Image (Photo 2)'
                  : 'แตะที่นี่เพื่ออัปโหลดรูปภาพที่ 2 (จากมือถือ)'}
              </div>

              <p className="text-[11px] text-zinc-300 max-w-xs">
                {isEn
                  ? 'Automatically adapts mobile photos, removes white backgrounds, and saves permanently!'
                  : 'รองรับรูปจากมือถือ ตัดพื้นหลังสีขาวให้อัตโนมัติ และบันทึกลงเครื่องอย่างถาวร'}
              </p>
            </div>

            {/* Explanation & GitHub Deployment Tip Dropdown */}
            <div className="mb-3.5 bg-black/40 border border-amber-900/40 rounded-xl p-2.5 text-xs text-amber-200/90">
              <button
                onClick={() => setShowGuide(!showGuide)}
                className="w-full flex items-center justify-between text-left font-bold text-amber-300 text-xs hover:text-white transition cursor-pointer"
              >
                <span className="flex items-center gap-1.5">
                  <HelpCircle className="w-3.5 h-3.5 text-amber-400" />
                  <span>
                    {isEn
                      ? 'How to make this character permanent on GitHub Pages?'
                      : 'วิธีใส่รูปนี้ลง GitHub Pages ให้ทุกคนเห็นถาวร?'}
                  </span>
                </span>
                <span className="text-zinc-400 text-[10px]">{showGuide ? '▲ ซ่อน' : '▼ ดูวิธี'}</span>
              </button>

              {showGuide && (
                <div className="mt-2 text-[11px] text-amber-100/80 leading-relaxed border-t border-amber-900/40 pt-2 space-y-1.5">
                  <p>
                    <strong>1. ใช้ทันทีบนมือถือเครื่องนี้:</strong> กดที่กล่องอัปโหลดด้านบนแล้วเลือกรูปภาพที่ 2 จากเครื่องได้เลย
                    ระบบจะจำไว้ในเครื่องอัตโนมัติ
                  </p>
                  <p>
                    <strong>2. ให้ทุกคนที่เข้าเว็บเห็นรูปนี้ทันที:</strong> นำไฟล์รูปภาพที่ 2 ไปวางไว้ในโฟลเดอร์{' '}
                    <code className="bg-black/60 px-1 py-0.5 rounded text-amber-300 font-mono">public/</code> บน GitHub แล้วตั้งชื่อไฟล์ว่า{' '}
                    <code className="bg-black/60 px-1 py-0.5 rounded text-amber-300 font-mono">weevil_skin.png</code> หรือ{' '}
                    <code className="bg-black/60 px-1 py-0.5 rounded text-amber-300 font-mono">0E437456-E0D9-44E6-A2BC-3D63910CD8FE.png</code>
                  </p>
                </div>
              )}
            </div>

            {/* 8 Frames Strip Gallery */}
            <div className="mb-3.5">
              <div className="text-[11px] font-semibold text-amber-300/80 mb-1">
                {previewMode === 'ghost'
                  ? isEn
                    ? 'Spectral Ghost Frames (ตอนตาย 4x2):'
                    : 'เฟรมวิญญาณตอนตาย (4x2):'
                  : isEn
                  ? 'Animation Frames (4x2):'
                  : 'ภาพเฟรมทั้งหมด (4x2):'}
              </div>
              <div className="grid grid-cols-4 gap-1.5 bg-black/40 p-2 rounded-xl border border-amber-950">
                {[0, 1, 2, 3, 4, 5, 6, 7].map((idx) => {
                  const frameCanvas =
                    previewMode === 'ghost'
                      ? spriteEngine.getGhostFrameCanvas(idx) || spriteEngine.getFrameCanvas(idx)
                      : spriteEngine.getFrameCanvas(idx);
                  const isActive = activeFrame === idx;
                  return (
                    <div
                      key={idx}
                      className={`aspect-[3/4] rounded-lg flex items-center justify-center p-1 bg-amber-950/40 border transition ${
                        isActive
                          ? previewMode === 'ghost'
                            ? 'border-cyan-400 bg-cyan-950/40 shadow-sm ring-2 ring-cyan-400/50'
                            : 'border-amber-400 bg-amber-800/40 shadow-sm ring-2 ring-amber-400/50'
                          : 'border-zinc-800'
                      }`}
                    >
                      {frameCanvas ? (
                        <img src={frameCanvas.toDataURL()} alt={`Frame ${idx + 1}`} className="w-full h-full object-contain" />
                      ) : (
                        <span className="text-[9px] text-zinc-500 font-mono">#{idx + 1}</span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Modal Actions Footer */}
        <div className="flex items-center gap-2 pt-1 border-t border-amber-900/40">
          {activeTab === 'character' && hasCustom && (
            <button
              onClick={handleReset}
              className="flex-1 py-2 px-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>{isEn ? 'Reset Character' : 'รีเซ็ตตัวมอด'}</span>
            </button>
          )}

          <button
            onClick={() => {
              onClose();
              onSpriteUpdated();
            }}
            className="flex-1 py-2.5 px-3 rounded-xl bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white text-xs font-bold shadow-lg transition flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Check className="w-4 h-4" />
            <span>{isEn ? 'Apply & Play' : 'เสร็จสิ้น'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
