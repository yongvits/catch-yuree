const fs = require('fs');
const sharp = require('sharp');

async function generateTitleArt() {
  const width = 1920;
  const height = 1080;

  // 1. Create full background SVG scene
  const svgScene = `
<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="wallGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#fdf4dc" />
      <stop offset="40%" stop-color="#fae8b8" />
      <stop offset="70%" stop-color="#f5d488" />
      <stop offset="100%" stop-color="#e2a84b" />
    </linearGradient>

    <linearGradient id="shelfGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#dfa052" />
      <stop offset="30%" stop-color="#c67d30" />
      <stop offset="100%" stop-color="#934d12" />
    </linearGradient>

    <linearGradient id="riceBedGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#fffbeb" />
      <stop offset="25%" stop-color="#fef3c7" />
      <stop offset="65%" stop-color="#fde68a" />
      <stop offset="85%" stop-color="#fcd34d" />
      <stop offset="100%" stop-color="#d97706" />
    </linearGradient>

    <linearGradient id="woodPlaque" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#fed7aa" />
      <stop offset="20%" stop-color="#f59e0b" />
      <stop offset="80%" stop-color="#d97706" />
      <stop offset="100%" stop-color="#9a3412" />
    </linearGradient>

    <linearGradient id="sunbeam" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#ffffff" stop-opacity="0.35" />
      <stop offset="40%" stop-color="#fef08a" stop-opacity="0.2" />
      <stop offset="100%" stop-color="#ffffff" stop-opacity="0" />
    </linearGradient>
  </defs>

  <!-- Background Kitchen Wall & Lighting -->
  <rect width="${width}" height="${height}" fill="url(#wallGrad)" />

  <!-- Sunbeams streaming from top-left -->
  <polygon points="0,0 600,0 1200,${height} 400,${height}" fill="url(#sunbeam)" />
  <polygon points="300,0 800,0 1600,${height} 900,${height}" fill="url(#sunbeam)" />
  <polygon points="800,0 1300,0 1920,800 1700,${height}" fill="url(#sunbeam)" opacity="0.6" />

  <!-- Shelves in the background -->
  <!-- Top Shelf -->
  <rect x="0" y="240" width="460" height="28" rx="6" fill="url(#shelfGrad)" stroke="#5c2609" stroke-width="4" />
  <rect x="1460" y="240" width="460" height="28" rx="6" fill="url(#shelfGrad)" stroke="#5c2609" stroke-width="4" />

  <!-- Glass Jars on Left Shelf -->
  <rect x="60" y="100" width="130" height="140" rx="16" fill="#ffffff" fill-opacity="0.4" stroke="#78350f" stroke-width="4" />
  <rect x="75" y="86" width="100" height="16" rx="6" fill="#a16207" stroke="#451a03" stroke-width="3" />
  <rect x="68" y="140" width="114" height="92" rx="10" fill="#fef3c7" />

  <rect x="230" y="110" width="120" height="130" rx="16" fill="#ffffff" fill-opacity="0.4" stroke="#78350f" stroke-width="4" />
  <rect x="245" y="96" width="90" height="16" rx="6" fill="#a16207" stroke="#451a03" stroke-width="3" />
  <rect x="238" y="150" width="104" height="82" rx="10" fill="#ef4444" opacity="0.75" />

  <!-- Glass Jars on Right Shelf -->
  <rect x="1560" y="100" width="130" height="140" rx="16" fill="#ffffff" fill-opacity="0.4" stroke="#78350f" stroke-width="4" />
  <rect x="1575" y="86" width="100" height="16" rx="6" fill="#a16207" stroke="#451a03" stroke-width="3" />
  <rect x="1568" y="140" width="114" height="92" rx="10" fill="#fef3c7" />

  <rect x="1720" y="110" width="120" height="130" rx="16" fill="#ffffff" fill-opacity="0.4" stroke="#78350f" stroke-width="4" />
  <rect x="1735" y="96" width="90" height="16" rx="6" fill="#a16207" stroke="#451a03" stroke-width="3" />
  <rect x="1728" y="150" width="104" height="82" rx="10" fill="#ef4444" opacity="0.75" />

  <!-- Burlap Sack Edge Framing Left & Right -->
  <path d="M 0 460 C 200 480 340 620 320 840 C 300 960 220 1080 0 1080 Z" fill="#92400e" stroke="#451a03" stroke-width="6" />
  <path d="M 0 480 C 180 500 310 630 290 830 C 270 950 200 1060 0 1060 Z" fill="#b45309" />

  <path d="M 1920 460 C 1720 480 1580 620 1600 840 C 1620 960 1700 1080 1920 1080 Z" fill="#92400e" stroke="#451a03" stroke-width="6" />
  <path d="M 1920 480 C 1740 500 1610 630 1630 830 C 1650 950 1720 1060 1920 1060 Z" fill="#b45309" />

  <!-- Massive Glistening Bed of Rice in Foreground -->
  <path d="M 0 620 Q 960 520 1920 620 L 1920 1080 L 0 1080 Z" fill="url(#riceBedGrad)" stroke="#b45309" stroke-width="4" />

  <!-- Individual Scattered Jasmine Rice Grains on the bed -->
  <g fill="#ffffff" stroke="#92400e" stroke-width="1.8" opacity="0.95">
    <!-- Row 1 -->
    <ellipse cx="400" cy="650" rx="22" ry="10" transform="rotate(-15 400 650)" />
    <ellipse cx="480" cy="670" rx="24" ry="11" transform="rotate(35 480 670)" />
    <ellipse cx="560" cy="640" rx="20" ry="9" transform="rotate(-40 560 640)" />
    <ellipse cx="640" cy="660" rx="25" ry="11" transform="rotate(10 640 660)" />
    <ellipse cx="730" cy="645" rx="22" ry="10" transform="rotate(-25 730 645)" />
    <ellipse cx="820" cy="660" rx="24" ry="11" transform="rotate(45 820 660)" />
    <ellipse cx="910" cy="640" rx="21" ry="9" transform="rotate(5 910 640)" />
    <ellipse cx="1010" cy="655" rx="23" ry="10" transform="rotate(-30 1010 655)" />
    <ellipse cx="1100" cy="645" rx="22" ry="10" transform="rotate(20 1100 645)" />
    <ellipse cx="1190" cy="660" rx="25" ry="11" transform="rotate(-10 1190 660)" />
    <ellipse cx="1280" cy="645" rx="23" ry="10" transform="rotate(30 1280 645)" />
    <ellipse cx="1370" cy="665" rx="21" ry="9" transform="rotate(-45 1370 665)" />
    <ellipse cx="1460" cy="650" rx="24" ry="11" transform="rotate(15 1460 650)" />

    <!-- Row 2 -->
    <ellipse cx="320" cy="720" rx="24" ry="11" transform="rotate(25 320 720)" />
    <ellipse cx="430" cy="740" rx="26" ry="12" transform="rotate(-15 430 740)" />
    <ellipse cx="530" cy="710" rx="23" ry="10" transform="rotate(40 530 710)" />
    <ellipse cx="630" cy="735" rx="25" ry="11" transform="rotate(-20 630 735)" />
    <ellipse cx="740" cy="715" rx="22" ry="10" transform="rotate(10 740 715)" />
    <ellipse cx="850" cy="730" rx="26" ry="12" transform="rotate(-35 850 730)" />
    <ellipse cx="960" cy="710" rx="24" ry="11" transform="rotate(30 960 710)" />
    <ellipse cx="1070" cy="735" rx="23" ry="10" transform="rotate(-15 1070 735)" />
    <ellipse cx="1180" cy="720" rx="25" ry="11" transform="rotate(25 1180 720)" />
    <ellipse cx="1290" cy="730" rx="22" ry="10" transform="rotate(-40 1290 730)" />
    <ellipse cx="1400" cy="715" rx="26" ry="12" transform="rotate(15 1400 715)" />
    <ellipse cx="1510" cy="740" rx="23" ry="10" transform="rotate(-20 1510 740)" />
    <ellipse cx="1610" cy="720" rx="25" ry="11" transform="rotate(35 1610 720)" />

    <!-- Foreground Dense Rice Row -->
    <ellipse cx="250" cy="880" rx="28" ry="13" transform="rotate(-30 250 880)" />
    <ellipse cx="370" cy="890" rx="30" ry="14" transform="rotate(20 370 890)" />
    <ellipse cx="490" cy="870" rx="27" ry="12" transform="rotate(-10 490 870)" />
    <ellipse cx="610" cy="900" rx="32" ry="14" transform="rotate(40 610 900)" />
    <ellipse cx="740" cy="880" rx="29" ry="13" transform="rotate(-25 740 880)" />
    <ellipse cx="880" cy="910" rx="31" ry="14" transform="rotate(15 880 910)" />
    <ellipse cx="1020" cy="890" rx="30" ry="13" transform="rotate(-35 1020 890)" />
    <ellipse cx="1160" cy="915" rx="28" ry="13" transform="rotate(30 1160 915)" />
    <ellipse cx="1300" cy="895" rx="32" ry="14" transform="rotate(-15 1300 895)" />
    <ellipse cx="1440" cy="920" rx="29" ry="13" transform="rotate(25 1440 920)" />
    <ellipse cx="1580" cy="900" rx="31" ry="14" transform="rotate(-40 1580 900)" />
    <ellipse cx="1710" cy="915" rx="28" ry="13" transform="rotate(10 1710 915)" />
  </g>

  <!-- Ambient Golden Sparkle Dust -->
  <g fill="#fef08a" opacity="0.8">
    <circle cx="280" cy="380" r="6" />
    <circle cx="520" cy="420" r="8" />
    <circle cx="820" cy="360" r="5" />
    <circle cx="1120" cy="390" r="7" />
    <circle cx="1450" cy="410" r="9" />
    <circle cx="1680" cy="350" r="6" />
  </g>

  <!-- TOP TITLE LOGO: CATCH YUREE! -->
  <g id="title-logo">
    <!-- Wooden Plaque Under Title -->
    <rect x="520" y="240" width="880" height="74" rx="37" fill="url(#woodPlaque)" stroke="#271004" stroke-width="7" />
    <path d="M 550 262 Q 960 256 1370 264" stroke="#fef08a" stroke-width="3" opacity="0.65" fill="none" />
    <path d="M 540 292 Q 960 298 1380 290" stroke="#78350f" stroke-width="3" opacity="0.6" fill="none" />

    <!-- Subtitle: Rice Weevil Catcher -->
    <text x="960" y="291" text-anchor="middle" font-size="36" font-weight="900" font-family="Arial Black, Impact, sans-serif" fill="#2e1205" letter-spacing="3">
      Rice Weevil Catcher
    </text>

    <!-- Decorative leaves & rice grains on plaque edges -->
    <ellipse cx="525" cy="275" rx="20" ry="10" fill="#22c55e" stroke="#14532d" stroke-width="3" transform="rotate(-30 525 275)" />
    <ellipse cx="545" cy="260" rx="16" ry="8" fill="#4ade80" stroke="#14532d" stroke-width="2.5" transform="rotate(20 545 260)" />
    <ellipse cx="560" cy="285" rx="14" ry="7" fill="#ffffff" stroke="#271004" stroke-width="2.5" />

    <ellipse cx="1395" cy="275" rx="20" ry="10" fill="#22c55e" stroke="#14532d" stroke-width="3" transform="rotate(30 1395 275)" />
    <ellipse cx="1375" cy="260" rx="16" ry="8" fill="#4ade80" stroke="#14532d" stroke-width="2.5" transform="rotate(-20 1375 260)" />
    <ellipse cx="1360" cy="285" rx="14" ry="7" fill="#ffffff" stroke="#271004" stroke-width="2.5" />

    <!-- MAIN BUBBLE TEXT: CATCH -->
    <text x="680" y="215" text-anchor="middle" font-size="140" font-weight="900" font-family="Arial Black, Impact, sans-serif"
      fill="#facc15" stroke="#271004" stroke-width="22" stroke-linejoin="round" paint-order="stroke fill" letter-spacing="-2">
      CATCH
    </text>
    <text x="680" y="215" text-anchor="middle" font-size="140" font-weight="900" font-family="Arial Black, Impact, sans-serif"
      fill="#fde047" stroke="#eab308" stroke-width="8" stroke-linejoin="round" paint-order="stroke fill" letter-spacing="-2">
      CATCH
    </text>

    <!-- MAIN BUBBLE TEXT: YUREE! -->
    <text x="1240" y="215" text-anchor="middle" font-size="140" font-weight="900" font-family="Arial Black, Impact, sans-serif"
      fill="#f43f5e" stroke="#271004" stroke-width="22" stroke-linejoin="round" paint-order="stroke fill" letter-spacing="-2">
      YUREE!
    </text>
    <text x="1240" y="215" text-anchor="middle" font-size="140" font-weight="900" font-family="Arial Black, Impact, sans-serif"
      fill="#fb7185" stroke="#e11d48" stroke-width="8" stroke-linejoin="round" paint-order="stroke fill" letter-spacing="-2">
      YUREE!
    </text>
  </g>

  <!-- Yellow excitement marks around Yuree -->
  <g fill="#facc15" stroke="#78350f" stroke-width="3">
    <polygon points="560,560 620,535 605,585" />
    <polygon points="540,610 610,615 580,645" />
    <polygon points="1360,560 1300,535 1315,585" />
    <polygon points="1380,610 1310,615 1340,645" />
  </g>
</svg>
`;

  console.log('Generating background buffer from SVG...');
  const bgBuffer = await sharp(Buffer.from(svgScene)).png().toBuffer();

  // 2. Extract mascot and ingredients
  console.log('Extracting character and ingredients...');
  const mascotFrame = await sharp('public/yuree.png')
    .extract({ left: 0, top: 0, width: 362, height: 543 })
    .toBuffer();

  const mainMascot = await sharp(mascotFrame)
    .resize(520, 780, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .toBuffer();

  const babyMascotLeft = await sharp(mascotFrame)
    .resize(220, 330, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .toBuffer();

  const babyMascotRight = await sharp(mascotFrame)
    .resize(200, 300, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .toBuffer();

  const redChiliBig = await sharp('public/herbs.png')
    .extract({ left: 0, top: 0, width: 400, height: 400 })
    .resize(360, 360, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .toBuffer();

  const limeLeaf = await sharp('public/herbs.png')
    .extract({ left: 0, top: 400, width: 400, height: 400 })
    .resize(260, 260, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .toBuffer();

  const garlic = await sharp('public/herbs.png')
    .extract({ left: 0, top: 800, width: 400, height: 400 })
    .resize(240, 240, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .toBuffer();

  console.log('Compositing full 1920x1080 title image...');
  const finalImage = await sharp(bgBuffer)
    .composite([
      { input: babyMascotLeft, top: 270, left: 100 },
      { input: babyMascotLeft, top: 520, left: 40 },
      { input: babyMascotRight, top: 270, left: 1540 },

      { input: garlic, top: 540, left: 340 },
      { input: limeLeaf, top: 380, left: 370 },
      { input: redChiliBig, top: 680, left: 80 },

      { input: garlic, top: 520, left: 1470 },
      { input: limeLeaf, top: 680, left: 1440 },
      { input: redChiliBig, top: 530, left: 1580 },

      { input: mainMascot, top: 310, left: 690 },

      { input: garlic, top: 660, left: 350 },
      { input: garlic, top: 800, left: 1320 },
      { input: limeLeaf, top: 110, left: 1680 }
    ])
    .png({ quality: 95 })
    .toBuffer();

  fs.writeFileSync('public/12219197-A83B-4477-AB69-A98739F00D3F.png', finalImage);
  fs.writeFileSync('public/title_bg.png', finalImage);

  if (fs.existsSync('dist')) {
    fs.writeFileSync('dist/12219197-A83B-4477-AB69-A98739F00D3F.png', finalImage);
    fs.writeFileSync('dist/title_bg.png', finalImage);
  }

  console.log('Successfully generated public/12219197-A83B-4477-AB69-A98739F00D3F.png! Bytes:', finalImage.length);
}

generateTitleArt().catch(console.error);
