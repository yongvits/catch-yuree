import React from 'react';
import { X, Sparkles, ShieldCheck, Bug, Info } from 'lucide-react';

interface RiceKnowledgeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const RiceKnowledgeModal: React.FC<RiceKnowledgeModalProps> = ({ isOpen, onClose }) => {
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
                เกร็ดน่ารู้เรื่อง "มอดข้าวสาร"
              </h3>
              <p className="text-[11px] text-amber-300/70">Rice Weevil (Sitophilus oryzae)</p>
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
          {/* Card 1: ชีววิทยา */}
          <div className="bg-black/30 border border-amber-900/40 rounded-2xl p-3.5 flex gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-900/50 flex items-center justify-center shrink-0 text-amber-300">
              <Bug className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-amber-300 mb-1">มอดข้าวสารคือตัวอะไร?</h4>
              <p className="text-zinc-300 text-[11px] md:text-xs">
                มอดข้าวสารเป็นแมลงปีกแข็งขนาดเล็กประมาณ 2.5 - 3.5 มิลลิเมตร ลำตัวสีน้ำตาลอมแดงถึงดำ จุดเด่นคือมี <strong>"งวงยื่นยาว"</strong> ที่ส่วนหัว พร้อมขากรรไกรใช้กัดเจาะเมล็ดข้าวสารเพื่อวางไข่และแทะกิน
              </p>
            </div>
          </div>

          {/* Card 2: มอดมาจากไหน? */}
          <div className="bg-black/30 border border-amber-900/40 rounded-2xl p-3.5 flex gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-900/50 flex items-center justify-center shrink-0 text-amber-300">
              <Info className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-amber-300 mb-1">มอดมาจากไหนทั้งที่ปิดถังไว้?</h4>
              <p className="text-zinc-300 text-[11px] md:text-xs">
                ไข่มอดมักแฝงตัวอยู่ตั้งแต่เก็บเกี่ยวหรือโรงสี เมื่ออุณหภูมิและความชื้นเหมาะสม (27-31°C) ไข่จะฟักเป็นตัวหนอน เจาะกินเนื้อแป้งอยู่ข้างในเมล็ด แล้วเติบโตออกมาเป็นตัวเต็มวัยที่เดินยั้วเยี้ยในกระสอบ
              </p>
            </div>
          </div>

          {/* Card 3: ภูมิปัญญาไล่มอด */}
          <div className="bg-black/30 border border-amber-900/40 rounded-2xl p-3.5 flex gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-900/50 flex items-center justify-center shrink-0 text-emerald-300">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-emerald-300 mb-1">ภูมิปัญญาไทยป้องกันและไล่มอด</h4>
              <ul className="text-zinc-300 text-[11px] md:text-xs space-y-1 list-disc list-inside">
                <li><strong className="text-amber-200">ใบมะกรูดหรือพริกแห้ง:</strong> กลิ่นฉุนของน้ำมันหอมระเหยทำให้มอดหนีเตลิด</li>
                <li><strong className="text-amber-200">ช้อนสแตนเลส:</strong> ใส่ช้อนสแตนเลสลงในถังข้าว ช่วยกระจายความเย็นไล่มอดตามภูมิปัญญาโบราณ</li>
                <li><strong className="text-amber-200">แช่ตู้เย็นช่องฟรีซ:</strong> นำข้าวสารแช่ช่องฟรีซ 3-4 วัน เพื่อยับยั้งการเจริญเติบโตของไข่มอด</li>
                <li><strong className="text-amber-200">ตากแดดหรือผึ่งลม:</strong> หากมอดขึ้นแล้ว เทข้าวสารแผ่บางๆ บนกระด้งหรือผ้า มอดจะทนความร้อนไม่ไหวและหนีออกไป</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-4 pt-3 border-t border-amber-900/60 flex items-center justify-between">
          <div className="text-[10px] text-amber-400/60 flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-amber-400" />
            <span>เล่นเกมจับมอดช่วยทำความสะอาดกระสอบข้าว!</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-amber-700 hover:bg-amber-600 text-white font-bold rounded-xl text-xs transition"
          >
            เข้าใจแล้ว
          </button>
        </div>
      </div>
    </div>
  );
};
