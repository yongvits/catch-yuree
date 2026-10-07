import React, { useState, useRef, useEffect } from 'react';
import { X, Upload, RotateCcw, Check, Sliders, Ghost as GhostIcon, Bug, Loader2, Sparkles, HelpCircle } from 'lucide-react';
import { spriteEngine } from '../utils/spriteEngine';
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
  const [activeFrame, setActiveFrame] = useState(0);
  const [hasCustom, setHasCustom] = useState(spriteEngine.hasCustomSprite());
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [showGuide, setShowGuide] = useState(false);
  const [lengthScale, setLengthScale] = useState(spriteEngine.getLengthScale());
  const [previewMode, setPreviewMode] = useState<'alive' | 'ghost'>('ghost'); // Default shows ghost to let user see ghost palette
  const previewCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Sync length scale on open
  useEffect(() => {
    if (isOpen) {
      setLengthScale(spriteEngine.getLengthScale());
      setHasCustom(spriteEngine.hasCustomSprite());
      setStatusMsg(null);
    }
  }, [isOpen]);

  // Animation preview loop
  useEffect(() => {
    if (!isOpen) return;

    const interval = setInterval(() => {
      setActiveFrame((prev) => (prev + 1) % 8);
    }, 120);

    return () => clearInterval(interval);
  }, [isOpen]);

  // Render preview frame on canvas preserving natural aspect ratio
  useEffect(() => {
    if (!isOpen || !previewCanvasRef.current) return;
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
      // Enhanced luminous ethereal blue glow aura
      ctx.save();
      ctx.shadowColor = '#0284c7';
      ctx.shadowBlur = 38;
      ctx.fillStyle = 'rgba(56, 189, 248, 0.32)';
      ctx.beginPath();
      ctx.ellipse(centerX, centerY, 46, 56, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // Radiant core glow
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

      // Draw spectral ghost sprite with lower opacity & radiant bloom
      spriteEngine.drawFrame(
        ctx,
        activeFrame,
        centerX,
        centerY,
        27,
        0,
        0.72,
        1.0,
        true
      );
    } else {
      // Draw standard alive sprite
      spriteEngine.drawFrame(
        ctx,
        activeFrame,
        centerX,
        centerY,
        27,
        0,
        1.0,
        1.0,
        false
      );
    }
  }, [isOpen, activeFrame, lengthScale, previewMode]);

  if (!isOpen) return null;

  const isEn = language === 'en';

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

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
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
                {isEn ? 'Weevil Character / Spritesheet' : 'ตัวละครมอด / สกิน (Sprite Sheet)'}
              </h3>
              <p className="text-[11px] text-amber-300/70">
                {isEn
                  ? '8-Frame walk animation (4 cols × 2 rows)'
                  : 'แอนิเมชันเดิน 8 เฟรม (4 คอลัมน์ × 2 แถว)'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-black/40 hover:bg-black/70 flex items-center justify-center text-zinc-400 hover:text-white transition"
          >
            <X className="w-4 h-4" />
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

        {/* Live Animation Preview Box */}
        <div className="flex flex-col items-center justify-center p-3.5 bg-black/50 border border-amber-900/50 rounded-2xl mb-3.5">
          {/* Preview Mode Selector: Alive vs Ghost */}
          <div className="flex items-center gap-1.5 mb-2.5 bg-zinc-900/90 p-1 rounded-xl border border-zinc-800">
            <button
              onClick={() => setPreviewMode('alive')}
              className={`flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-bold transition ${
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
              className={`flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-bold transition ${
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
            <canvas
              ref={previewCanvasRef}
              width={160}
              height={192}
              className="w-full h-full block"
            />
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
              <span className="font-mono text-amber-400 font-bold">
                {Math.round(lengthScale * 100)}%
              </span>
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
              <button
                onClick={() => handleLengthChange(1.0)}
                className="hover:text-amber-300 underline"
              >
                {isEn ? 'Reset 100%' : 'สัดส่วนเดิม 100%'}
              </button>
              <button
                onClick={() => handleLengthChange(1.2)}
                className="hover:text-amber-300 underline"
              >
                {isEn ? 'Long 120%' : 'ยาวขึ้น 120%'}
              </button>
              <button
                onClick={() => handleLengthChange(1.35)}
                className="hover:text-amber-300 underline"
              >
                {isEn ? 'Extra Long 135%' : 'ยาวพิเศษ 135%'}
              </button>
            </div>
          </div>
        </div>

        {/* Tap/Drop Upload Box with Native Transparent Input for 100% iOS/Android Reliability */}
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          className={`relative overflow-hidden border-2 border-dashed rounded-2xl p-4 text-center transition flex flex-col items-center justify-center gap-1.5 mb-3.5 ${
            isDragging
              ? 'border-amber-400 bg-amber-600/20'
              : 'border-amber-600/60 bg-black/40 hover:bg-black/60 hover:border-amber-400'
          }`}
        >
          {/* Transparent native file input covering the entire box */}
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

          <div className="flex items-center gap-1 text-[10px] text-amber-400/90 font-medium mt-0.5">
            <Sparkles className="w-3 h-3" />
            <span>{isEn ? 'Supports 4x2 frames layout' : 'รองรับรูปสไปร์ทชีท 4 คอลัมน์ x 2 แถว'}</span>
          </div>
        </div>

        {/* Explanation & GitHub Deployment Tip Dropdown */}
        <div className="mb-3.5 bg-black/40 border border-amber-900/40 rounded-xl p-2.5 text-xs text-amber-200/90">
          <button
            onClick={() => setShowGuide(!showGuide)}
            className="w-full flex items-center justify-between text-left font-bold text-amber-300 text-xs hover:text-white transition"
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
                <code className="bg-black/60 px-1 py-0.5 rounded text-amber-300 font-mono">weevil_skin.png</code>
              </p>
              <p className="text-zinc-400">
                เมื่อ Deploy รอบใหม่ ตัวเกมจะดึงรูป <code className="text-amber-300 font-mono">weevil_skin.png</code> มาเป็นตัวละครหลักให้ทุกคนทันทีโดยไม่ต้องกดอัปโหลดเอง!
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
                    <img
                      src={frameCanvas.toDataURL()}
                      alt={`Frame ${idx + 1}`}
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <span className="text-[9px] text-zinc-500 font-mono">#{idx + 1}</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          {hasCustom && (
            <button
              onClick={handleReset}
              className="flex-1 py-2 px-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>{isEn ? 'Reset to Default' : 'รีเซ็ตเป็นค่าเริ่มต้น'}</span>
            </button>
          )}

          <button
            onClick={onClose}
            className="flex-1 py-2.5 px-3 rounded-xl bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white text-xs font-bold shadow-lg transition flex items-center justify-center gap-1.5"
          >
            <Check className="w-4 h-4" />
            <span>{isEn ? 'Apply & Play' : 'เสร็จสิ้น'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
