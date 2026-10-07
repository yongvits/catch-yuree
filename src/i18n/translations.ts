export type Language = 'en' | 'th';

export interface TranslationStrings {
  loadingTitle: string;
  loadingSubtitle: string;
  hudRemaining: string;
  hudUnits: string;
  hudTimeLabel: string;
  hudTip: string;
  hudRestart: string;
  hudRestartBtn: string;
  hudSoundBtn: string;
  hudSettingsBtn: string;
  hudSpriteBtn: string;
  hudKnowledgeBtn: string;
  hudHideBtn: string;
  hudHiddenNotice: string;
  hudMute: string;
  hudUnmute: string;
  hudSettings: string;
  hudKnowledge: string;
  hudLang: string;
  canvasAscended: string;
  canvasCombo: string;
  victoryTitle: string;
  victorySubtitle: (count: number) => string;
  victoryTime: string;
  victoryCombo: string;
  victoryComboSub: string;
  victoryAccuracy: string;
  victoryAccuracySub: string;
  victoryNewBest: string;
  victoryPlayAgain: string;
  victoryNextDiff: string;
  victorySecUnit: string;
  settingsTitle: string;
  settingsSelectPopulation: string;
  settingsAudio: string;
  settingsAudioDesc: string;
  settingsAudioOn: string;
  settingsAudioOff: string;
  settingsLanguage: string;
  settingsSaveClose: string;
  settingsBestRecord: string;
  difficultyEasyName: string;
  difficultyEasyDesc: string;
  difficultyNormalName: string;
  difficultyNormalDesc: string;
  difficultyHardName: string;
  difficultyHardDesc: string;
  difficultyExtremeName: string;
  difficultyExtremeDesc: string;
  knowledgeTitle: string;
  knowledgeSubtitle: string;
  knowledgeWhatTitle: string;
  knowledgeWhatDesc: string;
  knowledgeOriginTitle: string;
  knowledgeOriginDesc: string;
  knowledgeTipsTitle: string;
  knowledgeTip1: string;
  knowledgeTip2: string;
  knowledgeTip3: string;
  knowledgeTip4: string;
  knowledgeFooter: string;
  knowledgeClose: string;
}

export const translations: Record<Language, TranslationStrings> = {
  en: {
    loadingTitle: 'Pouring a full sack of rice...',
    loadingSubtitle: 'Placing weevils and activating luminous spirit glow',
    hudRemaining: 'Left:',
    hudUnits: 'bugs',
    hudTimeLabel: 'Time',
    hudTip: 'Tap weevils to release their glowing spirits',
    hudRestart: 'Restart game',
    hudRestartBtn: 'Restart',
    hudSoundBtn: 'Sound',
    hudSettingsBtn: 'Settings',
    hudSpriteBtn: 'Skins',
    hudKnowledgeBtn: 'Tips',
    hudHideBtn: 'Hide UI',
    hudHiddenNotice: 'UI Hidden — Tap with 4 fingers to restore',
    hudMute: 'Mute sound',
    hudUnmute: 'Unmute sound',
    hudSettings: 'Game Settings & Difficulty',
    hudKnowledge: 'Rice Weevil Facts & Tips',
    hudLang: 'Switch language',
    canvasAscended: 'Ascended ✨',
    canvasCombo: 'Combo x',
    victoryTitle: 'All Weevils Cleared!',
    victorySubtitle: (count: number) =>
      `You helped all ${count} weevil spirits ascend peacefully to the afterlife!`,
    victoryTime: 'Time',
    victoryCombo: 'Combo',
    victoryComboSub: 'Streak',
    victoryAccuracy: 'Accuracy',
    victoryAccuracySub: 'Hit Rate',
    victoryNewBest: 'NEW BEST!',
    victoryPlayAgain: 'Play Again 🌾',
    victoryNextDiff: 'Next Challenge',
    victorySecUnit: 's',
    settingsTitle: 'Game Settings & Difficulty',
    settingsSelectPopulation: 'Weevil Population in Sack',
    settingsAudio: 'Synthesized Web Audio',
    settingsAudioDesc: 'Squish effect, rising spirits & victory melody',
    settingsAudioOn: 'Audio Enabled',
    settingsAudioOff: 'Audio Muted',
    settingsLanguage: 'Language',
    settingsSaveClose: 'Save & Return to Game',
    settingsBestRecord: '⏱️ Best Record:',
    difficultyEasyName: 'Novice Catcher',
    difficultyEasyDesc: 'Gentle training with spacious bug distribution',
    difficultyNormalName: 'Standard Sack (Original)',
    difficultyNormalDesc: 'Classic 45 weevils from the original game',
    difficultyHardName: 'Weevil Swarm',
    difficultyHardDesc: 'Dense population with agile, fast scurry reflexes',
    difficultyExtremeName: 'Weevil Frenzy (100 Bugs)',
    difficultyExtremeDesc: 'Rice sack breach! 100 energetic weevils scrambling',
    knowledgeTitle: 'Rice Weevil Trivia & Care',
    knowledgeSubtitle: 'Sitophilus oryzae - Grain storage guide',
    knowledgeWhatTitle: 'What is a Rice Weevil?',
    knowledgeWhatDesc:
      'Rice weevils are small snout beetles (2.5–3.5 mm) with a distinctive curved rostrum (snout) and elbowed antennae. Their jaws at the tip of the snout are specialized for boring into grain kernels.',
    knowledgeOriginTitle: 'Where do they come from in sealed bags?',
    knowledgeOriginDesc:
      'Microscopic eggs are often already deposited inside grains before harvesting. When temperature and humidity are optimal (27–31°C), larvae feed inside the kernel and emerge as wandering adults.',
    knowledgeTipsTitle: 'Natural Prevention & Storage Wisdom',
    knowledgeTip1:
      'Kaffir lime leaves & dried chili: Strong aromatic essential oils naturally deter weevils.',
    knowledgeTip2:
      'Stainless steel spoon: Traditional Asian method—regulates thermal pockets and discourages nesting.',
    knowledgeTip3:
      'Freeze for 3–4 days: Freezing freshly bought rice effectively eliminates dormant eggs.',
    knowledgeTip4:
      'Sun aeration: Spread weevil-infested rice thinly on a cloth under sunlight; weevils flee the heat.',
    knowledgeFooter: 'Clean up the rice sack by catching every bug!',
    knowledgeClose: 'Got it!',
  },
  th: {
    loadingTitle: 'กำลังเทข้าวสารแบบเต็มกระสอบ...',
    loadingSubtitle: 'จัดวางตำแหน่งตัวมอดและระบบวิญญาณเรืองแสงสว่างจ้า',
    hudRemaining: 'เหลือ:',
    hudUnits: 'ตัว',
    hudTimeLabel: 'เวลา',
    hudTip: 'แตะตัวมอดเพื่อปลดปล่อยวิญญาณเรืองแสง',
    hudRestart: 'เริ่มเกมใหม่ (Restart)',
    hudRestartBtn: 'เริ่มใหม่',
    hudSoundBtn: 'เสียง',
    hudSettingsBtn: 'ตั้งค่า',
    hudSpriteBtn: 'สกิน',
    hudKnowledgeBtn: 'ความรู้',
    hudHideBtn: 'ซ่อน Interface',
    hudHiddenNotice: 'ซ่อน Interface แล้ว — แตะหน้าจอพร้อมกัน 4 นิ้วเพื่อแสดงกลับมา',
    hudMute: 'ปิดเสียง (Mute)',
    hudUnmute: 'เปิดเสียง (Unmute)',
    hudSettings: 'ตั้งค่าระดับความยากและระบบเกม',
    hudKnowledge: 'เกร็ดความรู้เรื่องมอดข้าวสาร',
    hudLang: 'เปลี่ยนภาษา',
    canvasAscended: 'สู่สุคติ ✨',
    canvasCombo: 'Combo x',
    victoryTitle: 'กำจัดมอดหมดเกลี้ยง!',
    victorySubtitle: (count: number) =>
      `คุณช่วยส่งวิญญาณมอดทั้งหมด ${count} ตัว ไปสู่สุคติแล้ว!`,
    victoryTime: 'เวลา',
    victoryCombo: 'คอมโบ',
    victoryComboSub: 'ต่อเนื่อง',
    victoryAccuracy: 'ความแม่นยำ',
    victoryAccuracySub: 'แตะโดน',
    victoryNewBest: 'สถิติใหม่!',
    victoryPlayAgain: 'เริ่มใหม่อีกครั้ง 🌾',
    victoryNextDiff: 'ด่านท้าทายขึ้น',
    victorySecUnit: 'วิ',
    settingsTitle: 'ตั้งค่าระดับความยากและระบบเกม',
    settingsSelectPopulation: 'เลือกระดับจำนวนมอดในกระสอบ',
    settingsAudio: 'ระบบเสียงสังเคราะห์',
    settingsAudioDesc: 'เสียงบี้มอด, วิญญาณลอย และชัยชนะ',
    settingsAudioOn: 'เปิดเสียงอยู่',
    settingsAudioOff: 'ปิดเสียงอยู่',
    settingsLanguage: 'ภาษา / Language',
    settingsSaveClose: 'บันทึกและกลับไปเล่นเกม',
    settingsBestRecord: '⏱️ สถิติที่ดีที่สุด:',
    difficultyEasyName: 'มือใหม่หัดจับมอด',
    difficultyEasyDesc: 'เหมาะสำหรับเด็กหรือผู้เริ่มเล่น มอดกระจายตัวโปร่งสบาย',
    difficultyNormalName: 'กระสอบทั่วไป (ต้นฉบับ)',
    difficultyNormalDesc: 'จำนวนมอดมาตรฐาน 45 ตัวตามเกมดั้งเดิมกำลังสนุก',
    difficultyHardName: 'มอดบุกกระสอบ',
    difficultyHardDesc: 'มอดหนาแน่นขึ้น วิ่งเร็วขึ้น ท้าทายความไวของนิ้ว',
    difficultyExtremeName: 'ฝูงมอดดุเดือด (Frenzy)',
    difficultyExtremeDesc: 'กระสอบข้าวสารแตก! มอด 100 ตัวเบียดเสียด วิ่งพล่าน',
    knowledgeTitle: 'เกร็ดน่ารู้เรื่อง "มอดข้าวสาร"',
    knowledgeSubtitle: 'Rice Weevil (Sitophilus oryzae)',
    knowledgeWhatTitle: 'มอดข้าวสารคือตัวอะไร?',
    knowledgeWhatDesc:
      'มอดข้าวสารเป็นแมลงปีกแข็งขนาดเล็กประมาณ 2.5 - 3.5 มิลลิเมตร ลำตัวสีน้ำตาลอมแดงถึงดำ จุดเด่นคือมี "งวงยื่นยาว" ที่ส่วนหัว พร้อมขากรรไกรใช้กัดเจาะเมล็ดข้าวสารเพื่อวางไข่และแทะกิน',
    knowledgeOriginTitle: 'มอดมาจากไหนทั้งที่ปิดถังไว้?',
    knowledgeOriginDesc:
      'ไข่มอดมักแฝงตัวอยู่ตั้งแต่เก็บเกี่ยวหรือโรงสี เมื่ออุณหภูมิและความชื้นเหมาะสม (27-31°C) ไข่จะฟักเป็นตัวหนอน เจาะกินเนื้อแป้งอยู่ข้างในเมล็ด แล้วเติบโตออกมาเป็นตัวเต็มวัยที่เดินยั้วเยี้ยในกระสอบ',
    knowledgeTipsTitle: 'ภูมิปัญญาไทยป้องกันและไล่มอด',
    knowledgeTip1:
      'ใบมะกรูดหรือพริกแห้ง: กลิ่นฉุนของน้ำมันหอมระเหยทำให้มอดหนีเตลิด',
    knowledgeTip2:
      'ช้อนสแตนเลส: ใส่ช้อนสแตนเลสลงในถังข้าว ช่วยกระจายความเย็นไล่มอดตามภูมิปัญญาโบราณ',
    knowledgeTip3:
      'แช่ตู้เย็นช่องฟรีซ: นำข้าวสารแช่ช่องฟรีซ 3-4 วัน เพื่อยับยั้งการเจริญเติบโตของไข่มอด',
    knowledgeTip4:
      'ตากแดดหรือผึ่งลม: หากมอดขึ้นแล้ว เทข้าวสารแผ่บางๆ บนกระด้งหรือผ้า มอดจะทนความร้อนไม่ไหวและหนีออกไป',
    knowledgeFooter: 'เล่นเกมจับมอดช่วยทำความสะอาดกระสอบข้าว!',
    knowledgeClose: 'เข้าใจแล้ว',
  },
};
