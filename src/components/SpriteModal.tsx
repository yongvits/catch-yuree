import React, { useState, useRef, useEffect } from 'react';
import { X, Upload, RotateCcw, Check, Sliders } from 'lucide-react';
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
  const [lengthScale, setLengthScale] = useState(spriteEngine.getLengthScale());
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const previewCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Sync length scale on open
  useEffect(() => {
    if (isOpen) {
      setLengthScale(spriteEngine.getLengthScale());
      setHasCustom(spriteEngine.hasCustomSprite());
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

    // Draw active animated weevil with natural length
    spriteEngine.drawFrame(
      ctx,
      activeFrame,
      canvas.width / 2,
      canvas.height / 2,
      27,
      0,
      1.0,
      1.0
    );
  }, [isOpen, activeFrame, lengthScale]);

  if (!isOpen) return null;

  const handleFileUpload = async (file: File) => {
    if (!file.type.startsWith('image/')) return;
    const ok = await spriteEngine.loadFromFile(file);
    if (ok) {
      setHasCustom(true);
      onSpriteUpdated();
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  const handleReset = () => {
    spriteEngine.resetToDefault();
    setHasCustom(false);
    setLengthScale(1.0);
    onSpriteUpdated();
  };

  const handleLengthChange = (val: number) => {
    setLengthScale(val);
    spriteEngine.setLengthScale(val);
    onSpriteUpdated();
  };

  const isEn = language === 'en';

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-sm flex justify-center items-center z-50 p-4">
      <div className="bg-gradient-to-b from-[#2a170e] to-[#1a0d05] border border-amber-500/40 rounded-3xl p-5 md:p-6 max-w-sm md:max-w-md w-full shadow-2xl relative text-amber-50 max-h-[95vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex justify-between items-center mb-3 border-b border-amber-900/60 pb-3">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🎨</span>
            <div>
              <h3 className="font-extrabold text-base md:text-lg text-amber-200">
                {isEn ? 'Weevil Spritesheet Character' : 'สไปร์ทชีทตัวมอด (Sprite Sheet)'}
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

        {/* Live Animation Preview Box (Proportional Height to avoid squishing) */}
        <div className="flex flex-col items-center justify-center p-3.5 bg-black/50 border border-amber-900/50 rounded-2xl mb-3.5">
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
              {hasCustom
                ? isEn
                  ? 'Custom Uploaded Spritesheet Active'
                  : 'กำลังใช้งานสไปร์ทชีทที่อัปโหลด'
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
                <span>{isEn ? 'Body Length (Vertical Proportion):' : 'ความยาวตัวละคร (สัดส่วนความสูง):'}</span>
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
                {isEn ? 'Reset 100% (Native)' : 'สัดส่วนรูปเดิม 100%'}
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

        {/* Drag & Drop / File Input Box */}
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`cursor-pointer border-2 border-dashed rounded-2xl p-3 text-center transition flex flex-col items-center justify-center gap-1 mb-3.5 ${
            isDragging
              ? 'border-amber-400 bg-amber-600/20'
              : 'border-amber-800/60 bg-black/30 hover:bg-black/50 hover:border-amber-500/50'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            className="hidden"
            onChange={(e) => {
              if (e.target.files && e.target.files[0]) {
                handleFileUpload(e.target.files[0]);
              }
            }}
          />

          <div className="w-8 h-8 rounded-full bg-amber-600/30 flex items-center justify-center text-amber-300">
            <Upload className="w-4 h-4" />
          </div>

          <div className="font-bold text-xs md:text-sm text-amber-200">
            {isEn
              ? 'Drop or click to upload PNG spritesheet'
              : 'ลากไฟล์หรือคลิกเพื่ออัปโหลด PNG สไปร์ทชีท'}
          </div>

          <p className="text-[10px] text-zinc-400 max-w-xs">
            {isEn
              ? 'Maintains true frame height & width with automatic white background removal.'
              : 'รักษาสัดส่วนความยาวตามรูปภาพจริง พร้อมตัดพื้นหลังสีขาวโปร่งใส'}
          </p>
        </div>

        {/* 8 Frames Strip Gallery */}
        <div className="mb-3.5">
          <div className="text-[11px] font-semibold text-amber-300/80 mb-1">
            {isEn ? 'Animation Frames (4x2):' : 'ภาพเฟรมทั้งหมด (4x2):'}
          </div>
          <div className="grid grid-cols-4 gap-1.5 bg-black/40 p-2 rounded-xl border border-amber-950">
            {[0, 1, 2, 3, 4, 5, 6, 7].map((idx) => {
              const frameCanvas = spriteEngine.getFrameCanvas(idx);
              const isActive = activeFrame === idx;
              return (
                <div
                  key={idx}
                  className={`aspect-[3/4] rounded-lg flex items-center justify-center p-1 bg-amber-950/40 border transition ${
                    isActive
                      ? 'border-amber-400 bg-amber-800/40 shadow-sm ring-2 ring-amber-400/50'
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
              <span>{isEn ? 'Reset to Default' : 'รีเซ็ตกลับเป็นค่าเริ่มต้น'}</span>
            </button>
          )}

          <button
            onClick={onClose}
            className="flex-1 py-2 px-3 rounded-xl bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white text-xs font-bold shadow-lg transition flex items-center justify-center gap-1.5"
          >
            <Check className="w-4 h-4" />
            <span>{isEn ? 'Apply & Play' : 'เสร็จสิ้น'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
