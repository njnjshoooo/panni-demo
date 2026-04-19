/* ===== PanNi · 伴你 · 主程式 =====
   - 狀態管理
   - 28 款 K-idol 風格 SVG 肖像生成
   - Builder + Chat + OMO 邏輯
   ================================ */

/* ---------- 1. 全域狀態 ---------- */
const store = {
  partner: {
    name: '小默',
    portraitId: 0,
    filter: 'none',
    brightness: 100,
    contrast: 100,
    saturation: 100,
    hair: '',          // 髮色覆蓋（空=原色）
    outfit: 'minimal',
    accessory: 'none',
    personality: '温柔',
    callMe: '寶貝',
    catchphrase: '',
    traitsLove: [],
    traitsHate: [],
    needs: [],
    comfortStyle: 'listen',
    challenge: '',
    dailyRituals: [],
    weeklyRituals: [],
    birthday: '',
    anniversary: '',
    taboo: '',
  },
  affinity: 24,
  chatStart: null,
  memories: [],
  emotion: 'idle',
  wallet: {
    balance: 0,
    plan: null,
    shipping: null,
    shipTime: 'anytime',
    history: [],
  },
};
window.store = store;

/* ---------- 2. 28 款 K-idol 肖像配置 ---------- */
/* 每款由 [gender, hairStyle, hairColor, skin, lipTone, faceStyle] 組成
   風格借鑑 K-pop 美學：臉型偏 V、大眼、鼻樑分明 */
/* 30 位假想韓國藝人 — 使用本地 /虛擬伴侶照片 資料夾內照片 */
const PHOTO_DIR = 'photos';
const ARCHETYPES = [
  // --- 已辨識藝人 ---
  {g:'F', name:'Jennie',     group:'BLACKPINK',  file:'Jennie-Leaves-Blackpink-Show-Mid-Set-2.webp'},
  {g:'F', name:'Nayeon',     group:'TWICE',      file:'NAYEON_(나연)_–_STAND_OIL_–_2025.04.17_–_P6.jpg'},
  {g:'F', name:'Yeji',       group:'ITZY',       file:'Hwang_Yeji_02.jpg'},
  {g:'F', name:'Song Ji-hyo',group:'Actress',    file:'宋智孝.jpg'},
  {g:'F', name:'Park Shin-hye',group:'Actress',  file:'樸信惠.jpg'},
  {g:'M', name:'Jimin',      group:'BTS',        file:'JIMIN-FEATURE.webp'},
  {g:'M', name:'Jaehyun',    group:'BoyNextDoor',file:'Jaehyun_of_BoyNextDoor_at_MMA_Awards,_2023_(20231202).jpg'},
  {g:'M', name:'Kai',        group:'EXO',        file:'Kai_at_a_fansigning_event_on_August_17,_2013_(cropped).jpg'},
  {g:'M', name:'Hongjoong',  group:'ATEEZ',      file:'Kim-Hongjoong-ATEEZ.webp'},
  {g:'M', name:'Mark Lee',   group:'NCT',        file:'241025_Mark_Lee.jpg'},
  // --- 其餘假想角色（照片對應檔名） ---
  {g:'F', name:'IU',         group:'Soloist',    file:'037937a7-514c-4184-9981-c92600b78df1-scaled.jpg'},
  {g:'F', name:'Karina',     group:'aespa',      file:'062306-062306-66-683x1024.webp'},
  {g:'F', name:'Winter',     group:'aespa',      file:'20200820193136_0_1.jpg'},
  {g:'F', name:'Wonyoung',   group:'IVE',        file:'21ea510e2b1cca02c59d2b1cd33d3a510277469f2891f61e9d3d0a22462af4e98_o_st.jpg'},
  {g:'F', name:'Minji',      group:'NewJeans',   file:'260302-39252-2-XjzZd.jpg'},
  {g:'F', name:'Hanni',      group:'NewJeans',   file:'2d5f47b0-195c-11f0-a7ff-b367fc8693d0.jpeg'},
  {g:'F', name:'Sakura',     group:'LE SSERAFIM',file:'30000989701_700.jpg'},
  {g:'F', name:'Kazuha',     group:'LE SSERAFIM',file:'641.webp'},
  {g:'F', name:'Chaewon',    group:'LE SSERAFIM',file:'65658032-0058-43d4-82cf-bbe43f0b120c_a2217b11.webp'},
  {g:'F', name:'Irene',      group:'Red Velvet', file:'6604e6dfe4b01604b4a443cc.jpg'},
  {g:'M', name:'V',          group:'BTS',        file:'93358fbd80efe7530a2aa6be6fa90fa5.jpeg'},
  {g:'M', name:'Jungkook',   group:'BTS',        file:'IMG_7037.jpg'},
  {g:'M', name:'RM',         group:'BTS',        file:'S__20815958.jpg'},
  {g:'M', name:'Felix',      group:'Stray Kids', file:'ab07cd001b453b2e6baf71970bd9dc41baf9afbb373f2-BeTCLz_fw658.webp'},
  {g:'M', name:'Hyunjin',    group:'Stray Kids', file:'bed6272e86e2448dbd45a763c914b1ee.jpeg'},
  {g:'M', name:'Taeyong',    group:'NCT',        file:'images (1).jpeg'},
  {g:'M', name:'Chanyeol',   group:'EXO',        file:'images (2).jpeg'},
  {g:'M', name:'Cha Eun-woo',group:'ASTRO',      file:'images (3).jpeg'},
  {g:'M', name:'Mingyu',     group:'SEVENTEEN',  file:'images (4).jpeg'},
  {g:'M', name:'Jin',        group:'BTS',        file:'images.jpeg'},
].map((p, i) => ({ ...p, id: i, img: encodeURI(PHOTO_DIR + '/' + p.file) }));

/* ---------- 3. SVG 肖像生成器 ---------- */
function buildPortraitSVG(cfg) {
  const arche = ARCHETYPES[cfg.portraitId] || ARCHETYPES[0];
  const hairColor = cfg.hair && cfg.hair.trim() ? cfg.hair : HAIR_COLORS[arche.hc];
  const skin = SKIN[arche.sk];
  const skinShadow = shade(skin, -14);
  const skinHi = shade(skin, 8);
  const lipColor = LIP_TONES[arche.lt];
  const hairDark = shade(hairColor, -20);
  const hairHi = shade(hairColor, 18);
  const isMale = arche.g === 'M';
  const isSharp = arche.fs === 1 || arche.fs === 3;

  // 臉型：0/2=標準, 1/3=V字尖臉
  const faceD = isSharp
    ? 'M200 155 C145 155 115 200 115 250 C115 305 145 345 170 360 Q200 378 230 360 C255 345 285 305 285 250 C285 200 255 155 200 155 Z'
    : 'M200 150 C140 150 110 200 110 255 C110 315 150 355 200 362 C250 355 290 315 290 255 C290 200 260 150 200 150 Z';

  // 耳朵
  const earL = `<ellipse cx="115" cy="262" rx="10" ry="16" fill="${skin}" stroke="${skinShadow}" stroke-width="1"/>`;
  const earR = `<ellipse cx="285" cy="262" rx="10" ry="16" fill="${skin}" stroke="${skinShadow}" stroke-width="1"/>`;

  // 頸部 + 肩膀根據衣著變色
  const outfit = outfitShape(cfg.outfit);
  const outfitColor = outfit.color;
  const neck = `<path d="M175 340 Q175 375 170 400 Q200 395 230 400 Q225 375 225 340 Z" fill="${skin}"/>`;

  // 頭髮（背面層 + 正面層依 hairStyle）
  const hair = buildHair(arche.hs, hairColor, hairDark, hairHi, isMale);

  // 眉毛
  const brow = buildBrows(isMale, hairColor);

  // 眼睛
  const eyes = buildEyes(isMale);

  // 鼻子
  const nose = isSharp
    ? `<path d="M200 240 Q196 272 199 286 Q203 289 208 285" stroke="${skinShadow}" stroke-width="1.5" fill="none" stroke-linecap="round"/>`
    : `<path d="M200 242 Q197 270 200 284 Q205 287 209 283" stroke="${skinShadow}" stroke-width="1.4" fill="none" stroke-linecap="round"/>`;

  // 嘴唇
  const mouth = isMale
    ? `<path d="M184 314 Q200 320 216 314 Q214 310 200 312 Q186 310 184 314 Z" fill="${shade(lipColor, -10)}"/>`
    : `<g>
        <path d="M183 313 Q200 321 217 313 Q210 303 200 307 Q190 303 183 313 Z" fill="${lipColor}"/>
        <path d="M186 311 Q200 305 214 311" stroke="${shade(lipColor, -20)}" stroke-width=".6" fill="none"/>
       </g>`;

  // 淡腮紅
  const blush = isMale ? '' : `
    <ellipse cx="160" cy="290" rx="18" ry="8" fill="#E89A94" opacity=".22"/>
    <ellipse cx="240" cy="290" rx="18" ry="8" fill="#E89A94" opacity=".22"/>`;

  // 飾品
  const acc = buildAccessory(cfg.accessory, hairColor);

  // 背景漸層
  const bgId = 'bg' + cfg.portraitId;
  const bg = `
    <defs>
      <linearGradient id="${bgId}" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#F4F1EC"/>
        <stop offset="1" stop-color="#E3DED5"/>
      </linearGradient>
      <radialGradient id="spot${cfg.portraitId}" cx=".5" cy=".35">
        <stop offset="0" stop-color="#fff" stop-opacity=".55"/>
        <stop offset="1" stop-color="#fff" stop-opacity="0"/>
      </radialGradient>
    </defs>
    <rect width="400" height="500" fill="url(#${bgId})"/>
    <rect width="400" height="500" fill="url(#spot${cfg.portraitId})"/>`;

  // 陰影
  const faceShadow = `
    <path d="${faceD}" fill="${skin}"/>
    <!-- 臉部陰影 -->
    <path d="M115 255 Q130 310 175 340 L175 350 Q140 320 115 270 Z" fill="${skinShadow}" opacity=".28"/>
    <!-- 高光 -->
    <ellipse cx="225" cy="215" rx="22" ry="28" fill="${skinHi}" opacity=".3"/>`;

  return `
<svg viewBox="0 0 400 500" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid slice">
  ${bg}
  <!-- 身體/衣著 -->
  ${outfit.body}
  <!-- 脖子 -->
  ${neck}
  <!-- 脖子陰影 -->
  <path d="M175 340 Q175 370 178 395 L184 395 L184 345 Z" fill="${skinShadow}" opacity=".28"/>
  <!-- 衣領/前景 -->
  ${outfit.collar || ''}
  <!-- 耳朵 -->
  ${earL}${earR}
  <!-- 後髮 -->
  ${hair.back}
  <!-- 臉 -->
  ${faceShadow}
  <!-- 前髮 -->
  ${hair.front}
  <!-- 眉毛 -->
  ${brow}
  <!-- 眼睛 -->
  ${eyes}
  <!-- 鼻 -->
  ${nose}
  <!-- 嘴 -->
  ${mouth}
  <!-- 腮紅 -->
  ${blush}
  <!-- 飾品 -->
  ${acc}
</svg>`;
}

/* 髮型定義 */
function buildHair(hs, hc, hd, hl, isMale) {
  const g = {};
  switch (hs) {
    case 0: // 長直髮
      g.back = `<path d="M95 230 Q95 170 160 145 Q200 135 240 145 Q305 170 305 230 L315 460 Q280 450 245 445 L240 350 Q260 340 270 300 Q280 230 265 190 Q230 165 200 165 Q170 165 135 190 Q120 230 130 300 Q140 340 160 350 L155 445 Q120 450 85 460 Z" fill="${hc}"/>
                <path d="M95 230 Q95 170 160 145 Q200 135 240 145 L230 220 Q200 210 170 215 Q130 225 110 240 Z" fill="${hl}" opacity=".25"/>`;
      g.front = `<path d="M130 195 Q155 160 200 158 Q245 160 270 195 Q245 178 230 180 L225 200 Q200 188 180 200 L170 180 Q155 182 130 195 Z" fill="${hc}"/>`;
      break;
    case 1: // 長捲髮
      g.back = `<path d="M90 235 Q85 165 160 142 Q200 132 240 142 Q315 165 310 235 Q325 330 305 405 Q295 455 250 465 Q260 430 255 395 Q260 350 265 310 Q280 230 265 188 Q230 162 200 162 Q170 162 135 188 Q120 230 130 310 Q138 350 143 395 Q138 430 148 465 Q105 455 95 405 Q75 330 90 235 Z" fill="${hc}"/>
                <path d="M90 260 Q105 270 95 285 Q108 295 96 310 Q110 320 97 335" stroke="${hd}" stroke-width="2" fill="none"/>
                <path d="M310 260 Q295 270 305 285 Q292 295 304 310 Q290 320 303 335" stroke="${hd}" stroke-width="2" fill="none"/>`;
      g.front = `<path d="M128 200 Q158 158 200 155 Q242 158 272 200 Q252 180 232 182 L228 210 Q200 190 180 208 L168 180 Q148 184 128 200 Z" fill="${hc}"/>
                 <path d="M160 148 Q195 138 240 148" stroke="${hl}" stroke-width="2" fill="none" opacity=".4"/>`;
      break;
    case 2: // 短鮑伯
      g.back = `<path d="M110 220 Q115 160 200 145 Q285 160 290 220 L292 350 Q250 345 200 348 Q150 345 108 350 Z" fill="${hc}"/>`;
      g.front = `<path d="M125 205 Q155 160 200 155 Q245 160 275 205 Q250 178 230 182 L224 205 Q200 190 180 205 L170 180 Q150 184 125 205 Z" fill="${hc}"/>`;
      break;
    case 3: // 中長髮
      g.back = `<path d="M100 225 Q100 165 160 145 Q200 137 240 145 Q300 165 300 225 L305 380 Q270 375 240 375 L235 340 Q258 330 266 295 Q275 225 260 190 Q230 165 200 165 Q170 165 140 190 Q125 225 134 295 Q142 330 165 340 L160 375 Q130 375 95 380 Z" fill="${hc}"/>`;
      g.front = `<path d="M128 200 Q156 160 200 156 Q244 160 272 200 Q248 178 228 182 L224 205 Q200 190 180 205 L172 180 Q152 184 128 200 Z" fill="${hc}"/>`;
      break;
    case 4: // 高馬尾
      g.back = `<path d="M120 225 Q120 168 200 150 Q280 168 280 225 L285 340 Q255 335 235 340 L230 340 Q252 325 260 290 Q270 225 258 190 Q230 165 200 165 Q170 165 142 190 Q130 225 140 290 Q148 325 170 340 L165 340 Q145 335 115 340 Z M 200 135 Q228 140 240 170 L260 280 Q255 290 235 285 L220 180 Q210 170 200 170 Q190 170 180 180 L165 285 Q145 290 140 280 L160 170 Q172 140 200 135 Z" fill="${hc}"/>`;
      g.front = `<path d="M130 200 Q158 160 200 156 Q242 160 270 200 Q248 178 228 182 L226 205 Q200 190 180 205 L172 180 Q152 184 130 200 Z" fill="${hc}"/>`;
      break;
    case 5: // 短瀏海鮑伯
      g.back = `<path d="M112 220 Q118 158 200 144 Q282 158 288 220 L290 330 Q250 325 200 328 Q150 325 110 330 Z" fill="${hc}"/>`;
      g.front = `<path d="M120 195 Q140 155 200 150 Q260 155 280 195 Q260 185 240 188 L220 218 Q200 205 180 218 L160 188 Q140 185 120 195 Z" fill="${hc}"/>`;
      break;
    case 6: // 側分中長
      g.back = `<path d="M105 225 Q105 165 165 145 Q200 138 240 145 Q300 165 300 225 L302 380 Q272 375 240 378 L235 340 Q258 330 265 295 Q272 225 258 190 Q230 165 200 165 Q170 165 142 190 Q128 225 137 295 Q145 330 168 340 L163 378 Q130 375 98 380 Z" fill="${hc}"/>`;
      g.front = `<path d="M125 205 Q150 168 170 162 Q190 170 200 190 Q212 172 240 166 Q262 175 275 205 Q252 183 230 186 L225 212 Q205 195 190 210 L178 185 Q152 188 125 205 Z" fill="${hc}"/>
                 <path d="M175 165 Q200 180 200 210" stroke="${hd}" stroke-width="1" fill="none" opacity=".3"/>`;
      break;
    case 7: // 男短髮
      g.back = `<path d="M125 215 Q130 160 200 148 Q270 160 275 215 L278 260 Q275 235 262 225 Q240 220 200 220 Q160 220 138 225 Q125 235 122 260 Z" fill="${hc}"/>`;
      g.front = `<path d="M130 200 Q148 155 200 152 Q252 155 270 200 Q246 180 225 185 L218 200 Q200 186 182 200 L175 185 Q154 180 130 200 Z" fill="${hc}"/>`;
      break;
    case 8: // 男瀏海髮
      g.back = `<path d="M122 218 Q128 160 200 146 Q272 160 278 218 L280 270 Q275 240 258 228 Q232 224 200 224 Q168 224 142 228 Q125 240 120 270 Z" fill="${hc}"/>`;
      g.front = `<path d="M118 210 Q138 150 200 148 Q262 150 282 210 Q268 190 248 188 Q232 195 222 218 Q200 200 178 218 Q168 195 152 188 Q132 190 118 210 Z" fill="${hc}"/>`;
      break;
    case 9: // 男中短
      g.back = `<path d="M118 220 Q124 158 200 144 Q276 158 282 220 L285 295 Q258 280 240 280 L232 282 Q260 260 265 220 Q258 185 200 180 Q142 185 135 220 Q140 260 168 282 L160 280 Q142 280 115 295 Z" fill="${hc}"/>`;
      g.front = `<path d="M124 200 Q146 152 200 150 Q254 152 276 200 Q252 182 228 186 Q215 195 205 215 Q200 200 195 215 Q185 195 172 186 Q148 182 124 200 Z" fill="${hc}"/>`;
      break;
  }
  return g;
}

/* 眉毛 */
function buildBrows(isMale, hc) {
  const w = isMale ? 3.5 : 2.8;
  return `
    <path d="M155 218 Q175 212 192 218" stroke="${hc}" stroke-width="${w}" fill="none" stroke-linecap="round"/>
    <path d="M208 218 Q225 212 245 218" stroke="${hc}" stroke-width="${w}" fill="none" stroke-linecap="round"/>`;
}

/* 眼睛 */
function buildEyes(isMale) {
  const eyeSize = isMale ? 1.0 : 1.15;
  const rx = 14 * eyeSize;
  const ry = 10 * eyeSize;
  return `
    <!-- 眼白 -->
    <ellipse cx="170" cy="240" rx="${rx}" ry="${ry}" fill="#FFFFFF"/>
    <ellipse cx="230" cy="240" rx="${rx}" ry="${ry}" fill="#FFFFFF"/>
    <!-- 虹膜（深棕） -->
    <circle cx="170" cy="240" r="${8*eyeSize}" fill="#3E2A1C"/>
    <circle cx="230" cy="240" r="${8*eyeSize}" fill="#3E2A1C"/>
    <!-- 瞳孔 -->
    <circle cx="170" cy="240" r="${4*eyeSize}" fill="#0A0A0A"/>
    <circle cx="230" cy="240" r="${4*eyeSize}" fill="#0A0A0A"/>
    <!-- 高光 -->
    <circle cx="173" cy="236" r="${3*eyeSize}" fill="#FFFFFF"/>
    <circle cx="233" cy="236" r="${3*eyeSize}" fill="#FFFFFF"/>
    <circle cx="166" cy="243" r="${1.2*eyeSize}" fill="#FFFFFF" opacity=".8"/>
    <circle cx="226" cy="243" r="${1.2*eyeSize}" fill="#FFFFFF" opacity=".8"/>
    <!-- 上眼線 -->
    <path d="M155 240 Q170 ${230-eyeSize} 185 240" stroke="#1A1410" stroke-width="${isMale?2:1.8}" fill="none" stroke-linecap="round"/>
    <path d="M215 240 Q230 ${230-eyeSize} 245 240" stroke="#1A1410" stroke-width="${isMale?2:1.8}" fill="none" stroke-linecap="round"/>
    <!-- 睫毛（女） -->
    ${isMale ? '' : `
      <path d="M158 236 L156 232 M164 232 L163 228 M170 231 L170 227 M176 232 L177 228 M182 236 L184 232" stroke="#1A1410" stroke-width="1.3" stroke-linecap="round"/>
      <path d="M218 236 L216 232 M224 232 L223 228 M230 231 L230 227 M236 232 L237 228 M242 236 L244 232" stroke="#1A1410" stroke-width="1.3" stroke-linecap="round"/>
    `}
    <!-- 雙眼皮線 -->
    <path d="M157 234 Q170 228 184 234" stroke="#6B4A38" stroke-width=".8" fill="none" opacity=".5"/>
    <path d="M217 234 Q230 228 243 234" stroke="#6B4A38" stroke-width=".8" fill="none" opacity=".5"/>`;
}

/* 衣著 */
function outfitShape(kind) {
  const choices = {
    minimal:     { color:'#2A2A28', body:`<path d="M50 500 Q50 395 200 395 Q350 395 350 500 Z" fill="#2A2A28"/>`, collar:`<path d="M170 395 Q200 410 230 395 L230 500 L170 500 Z" fill="#1A1A18"/>` },
    turtleneck:  { color:'#D4D0C8', body:`<path d="M50 500 Q50 395 200 395 Q350 395 350 500 Z" fill="#D4D0C8"/>`, collar:`<path d="M170 388 Q200 375 230 388 L232 412 Q200 420 168 412 Z" fill="#C5C1B8"/>` },
    suit:        { color:'#1A1A1A', body:`<path d="M50 500 Q50 395 200 395 Q350 395 350 500 Z" fill="#1A1A1A"/>`, collar:`<path d="M170 395 L145 440 L185 480 L200 430 Z" fill="#0A0A0A"/><path d="M230 395 L255 440 L215 480 L200 430 Z" fill="#0A0A0A"/><rect x="197" y="410" width="6" height="90" fill="#FFFFFF"/>` },
    hoodie:      { color:'#4A4A46', body:`<path d="M50 500 Q50 385 200 385 Q350 385 350 500 Z" fill="#4A4A46"/>`, collar:`<path d="M140 395 Q200 370 260 395 L250 430 Q200 418 150 430 Z" fill="#3A3A36"/><rect x="195" y="395" width="3" height="55" fill="#2A2A26"/><rect x="202" y="395" width="3" height="55" fill="#2A2A26"/>` },
    trench:      { color:'#B8A584', body:`<path d="M50 500 Q50 395 200 395 Q350 395 350 500 Z" fill="#B8A584"/>`, collar:`<path d="M165 398 L140 430 L190 475 L205 420 Z" fill="#A08E6E"/><path d="M235 398 L260 430 L210 475 L195 420 Z" fill="#A08E6E"/>` },
    knit:        { color:'#E8DDC8', body:`<path d="M50 500 Q50 395 200 395 Q350 395 350 500 Z" fill="#E8DDC8"/>`, collar:`<path d="M172 395 Q200 406 228 395 L226 500 L174 500 Z" fill="#D6C9B0"/><path d="M50 450 L350 450" stroke="#D6C9B0" stroke-width=".5" opacity=".5"/><path d="M50 470 L350 470" stroke="#D6C9B0" stroke-width=".5" opacity=".5"/>` },
  };
  return choices[kind] || choices.minimal;
}

/* 飾品 */
function buildAccessory(kind, hc) {
  const items = {
    none: '',
    glasses: `
      <circle cx="170" cy="240" r="22" fill="none" stroke="#1A1A1A" stroke-width="2"/>
      <circle cx="230" cy="240" r="22" fill="none" stroke="#1A1A1A" stroke-width="2"/>
      <line x1="192" y1="240" x2="208" y2="240" stroke="#1A1A1A" stroke-width="2"/>
      <line x1="148" y1="240" x2="125" y2="238" stroke="#1A1A1A" stroke-width="2"/>
      <line x1="252" y1="240" x2="275" y2="238" stroke="#1A1A1A" stroke-width="2"/>`,
    earring: `
      <circle cx="112" cy="280" r="5" fill="#E0D4B8" stroke="#1A1A1A" stroke-width=".8"/>
      <circle cx="288" cy="280" r="5" fill="#E0D4B8" stroke="#1A1A1A" stroke-width=".8"/>`,
    choker: `
      <rect x="170" y="380" width="60" height="6" fill="#1A1A1A"/>
      <circle cx="200" cy="383" r="3" fill="#E0D4B8"/>`,
    beanie: `
      <path d="M100 160 Q100 110 200 100 Q300 110 300 160 L300 180 Q290 170 200 170 Q110 170 100 180 Z" fill="#1A1A1A"/>
      <rect x="100" y="170" width="200" height="18" fill="#2A2A2A"/>
      <circle cx="200" cy="96" r="8" fill="#1A1A1A"/>`,
  };
  return items[kind] || '';
}

/* 顏色明暗調整 */
function shade(hex, percent) {
  const h = hex.replace('#', '');
  const n = parseInt(h, 16);
  let r = (n >> 16) + percent;
  let g = ((n >> 8) & 0xff) + percent;
  let b = (n & 0xff) + percent;
  r = Math.max(0, Math.min(255, r));
  g = Math.max(0, Math.min(255, g));
  b = Math.max(0, Math.min(255, b));
  return '#' + ((r << 16) | (g << 8) | b).toString(16).padStart(6, '0');
}

/* ---------- 4. 濾鏡 ---------- */
const FILTERS = {
  none:     '',
  mono:     'grayscale(1) contrast(1.05)',
  warm:     'sepia(.2) saturate(1.1) hue-rotate(-8deg)',
  cool:     'saturate(.9) hue-rotate(8deg) brightness(1.02)',
  soft:     'brightness(1.05) saturate(.9) contrast(.95)',
  noir:     'grayscale(1) contrast(1.3) brightness(.95)',
};

function getFilterCSS(p) {
  const preset = FILTERS[p.filter] || '';
  const adj = [
    `brightness(${p.brightness / 100})`,
    `contrast(${p.contrast / 100})`,
    `saturate(${p.saturation / 100})`,
  ].join(' ');
  return (preset + ' ' + adj).trim();
}

/* ---------- 5. 肖像渲染 ---------- */
function renderPortrait(el, cfg) {
  if (!el) return;
  const svg = buildPortraitSVG(cfg);
  const arche = ARCHETYPES[cfg.portraitId];
  const label = cfg.name || arche.name;
  el.innerHTML = `
    <div class="portrait-card">
      ${svg}
      <div class="portrait-num">${String(cfg.portraitId + 1).padStart(2, '0')} / ${ARCHETYPES.length}</div>
      <div class="portrait-badge">${arche.g}</div>
      <div class="portrait-label">${label} · ${store.partner.personality || ''}</div>
    </div>`;
  const svgEl = el.querySelector('svg');
  if (svgEl) svgEl.style.filter = getFilterCSS(cfg);
}
function setPortraitEmotion(el, emotion) {
  if (!el) return;
  el.className = el.className.replace(/\bem-\w+\b/g, '').trim() + ' em-' + (emotion || 'idle');
}
function rebuildAll() {
  const hero = document.getElementById('hero-portrait');
  const chat = document.getElementById('chat-portrait');
  const prev = document.getElementById('preview-portrait');
  if (hero) renderPortrait(hero, store.partner);
  if (chat) { renderPortrait(chat, store.partner); setPortraitEmotion(chat, store.emotion); }
  if (prev) renderPortrait(prev, store.partner);
}

/* ---------- 6. 範本網格 ---------- */
let currentGender = 'all';
function renderPortraitGrid() {
  const grid = document.getElementById('portrait-grid');
  if (!grid) return;
  const items = ARCHETYPES.filter(p => currentGender === 'all' || p.g === currentGender);
  grid.innerHTML = items.map(a => {
    const miniSvg = buildPortraitSVG({ portraitId: a.id, filter: 'none', brightness: 100, contrast: 100, saturation: 100, hair: '', outfit: store.partner.outfit, accessory: 'none' });
    return `
      <div class="pick-card ${a.id === store.partner.portraitId ? 'on' : ''}" data-pid="${a.id}">
        ${miniSvg}
        <div class="pick-num">${String(a.id + 1).padStart(2, '0')}</div>
      </div>`;
  }).join('');
  grid.querySelectorAll('.pick-card').forEach(el => {
    el.addEventListener('click', () => {
      store.partner.portraitId = parseInt(el.dataset.pid);
      grid.querySelectorAll('.pick-card').forEach(x => x.classList.remove('on'));
      el.classList.add('on');
      rebuildAll();
    });
  });
}

/* ---------- 7. View 切換 ---------- */
function go(view) {
  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  document.getElementById('view-' + view).classList.add('active');
  document.querySelectorAll('.nav-link').forEach(b => b.classList.toggle('active', b.dataset.go === view));
  window.scrollTo({ top: 0, behavior: 'smooth' });
  if (view === 'home') setTimeout(() => renderPortrait(document.getElementById('hero-portrait'), store.partner), 30);
  if (view === 'chat') setTimeout(() => { renderPortrait(document.getElementById('chat-portrait'), store.partner); setPortraitEmotion(document.getElementById('chat-portrait'), store.emotion); }, 30);
  if (view === 'create') setTimeout(() => { renderPortrait(document.getElementById('preview-portrait'), store.partner); renderPortraitGrid(); }, 30);
  if (view === 'memories') renderMemories();
  if (view === 'omo') { renderBalance(); renderCalendar(); renderGiftHistory(); }
}
window.go = go;
document.querySelectorAll('[data-go]').forEach(b => b.addEventListener('click', () => go(b.dataset.go)));

/* ---------- 8. Builder 邏輯 ---------- */
let currentCat = 0;
const totalCats = 5;

function renderCat() {
  document.querySelectorAll('.cat-panel').forEach((p, i) => p.classList.toggle('hidden', i !== currentCat));
  document.querySelectorAll('.cat-tab').forEach((t, i) => t.classList.toggle('active', i === currentCat));
  document.getElementById('btn-prev').style.visibility = currentCat === 0 ? 'hidden' : 'visible';
  document.getElementById('btn-next').textContent = currentCat === totalCats - 1 ? 'Complete · 進入對話 →' : 'Next →';
  document.getElementById('cat-hint').textContent = `${String(currentCat + 1).padStart(2, '0')} / ${String(totalCats).padStart(2, '0')}`;
  document.getElementById('cat-progress').style.width = `${(currentCat + 1) / totalCats * 100}%`;
  if (currentCat === totalCats - 1) renderSummary();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}
document.querySelectorAll('.cat-tab').forEach(t => t.addEventListener('click', () => {
  collectInputs();
  currentCat = parseInt(t.dataset.cat);
  renderCat();
}));

function collectInputs() {
  const P = store.partner;
  P.name = document.getElementById('in-name')?.value || P.name;
  P.callMe = document.getElementById('in-callme')?.value || P.callMe;
  P.catchphrase = document.getElementById('in-catchphrase')?.value || '';
  P.challenge = document.getElementById('in-challenge')?.value || '';
  P.birthday = document.getElementById('in-birthday')?.value || '';
  P.anniversary = document.getElementById('in-anniv')?.value || '';
  P.taboo = document.getElementById('in-taboo')?.value || '';
  const pers = document.querySelector('input[name="personality"]:checked');
  if (pers) P.personality = pers.value;
  document.getElementById('live-name').textContent = P.name;
  document.getElementById('live-tag').textContent = `TEMPERAMENT · ${P.personality}`;
}
document.getElementById('btn-next').addEventListener('click', () => {
  collectInputs();
  if (currentCat === totalCats - 1) { updatePartnerUI(); resetChat(); go('chat'); return; }
  currentCat = Math.min(totalCats - 1, currentCat + 1);
  renderCat();
});
document.getElementById('btn-prev').addEventListener('click', () => {
  collectInputs();
  currentCat = Math.max(0, currentCat - 1);
  renderCat();
});
window.setName = v => { document.getElementById('in-name').value = v; collectInputs(); };
window.setCallMe = v => { document.getElementById('in-callme').value = v; collectInputs(); };

function setupExclusiveTags(attr, storeKey, rebuild = false) {
  document.querySelectorAll(`[data-${attr}]`).forEach(b => {
    b.addEventListener('click', () => {
      document.querySelectorAll(`[data-${attr}]`).forEach(x => x.classList.remove('on'));
      b.classList.add('on');
      store.partner[storeKey] = b.dataset[attr];
      if (rebuild) rebuildAll();
    });
  });
}
function setupSwatch(attr, storeKey) {
  document.querySelectorAll(`.swatch[data-${attr}]`).forEach(s => {
    s.addEventListener('click', () => {
      document.querySelectorAll(`.swatch[data-${attr}]`).forEach(x => x.classList.remove('on'));
      s.classList.add('on');
      store.partner[storeKey] = s.dataset[attr];
      rebuildAll();
    });
  });
}
function setupMultiTag(attr, storeKey) {
  document.querySelectorAll(`[data-${attr}]`).forEach(b => {
    b.addEventListener('click', () => {
      const v = b.dataset[attr];
      b.classList.toggle('on');
      const arr = store.partner[storeKey];
      const idx = arr.indexOf(v);
      if (idx >= 0) arr.splice(idx, 1); else arr.push(v);
    });
  });
}
function setupMultiCard(cls, attr, storeKey) {
  document.querySelectorAll(cls).forEach(b => {
    b.addEventListener('click', () => {
      const v = b.dataset[attr];
      b.classList.toggle('on');
      const arr = store.partner[storeKey];
      const idx = arr.indexOf(v);
      if (idx >= 0) arr.splice(idx, 1); else arr.push(v);
    });
  });
}

setupSwatch('hair', 'hair');
setupExclusiveTags('outfit', 'outfit', true);
setupExclusiveTags('accessory', 'accessory', true);
setupExclusiveTags('comfort', 'comfortStyle', false);
setupMultiTag('trait', 'traitsLove');
setupMultiTag('hate', 'traitsHate');
setupMultiTag('weekly', 'weeklyRituals');
setupMultiCard('.need-opt', 'need', 'needs');
setupMultiCard('.daily-opt', 'daily', 'dailyRituals');

// 濾鏡
document.querySelectorAll('[data-filter]').forEach(b => {
  b.addEventListener('click', () => {
    document.querySelectorAll('[data-filter]').forEach(x => x.classList.remove('on'));
    b.classList.add('on');
    store.partner.filter = b.dataset.filter;
    rebuildAll();
  });
});
// 滑桿
document.querySelectorAll('input[type=range][data-adj]').forEach(s => {
  const key = s.dataset.adj;
  const val = document.querySelector(`[data-val="${key}"]`);
  s.value = store.partner[key];
  if (val) val.textContent = store.partner[key];
  s.addEventListener('input', () => {
    store.partner[key] = parseFloat(s.value);
    if (val) val.textContent = s.value;
    rebuildAll();
  });
});
// 性別篩選
document.querySelectorAll('#gender-filter [data-gender]').forEach(b => {
  b.addEventListener('click', () => {
    document.querySelectorAll('#gender-filter [data-gender]').forEach(x => x.classList.remove('on'));
    b.classList.add('on');
    currentGender = b.dataset.gender;
    renderPortraitGrid();
  });
});
// 性格卡
document.querySelectorAll('.personality-option').forEach(l => {
  l.addEventListener('click', () => {
    document.querySelectorAll('.personality-option').forEach(x => x.classList.remove('on'));
    l.classList.add('on');
    const r = l.querySelector('input[type=radio]');
    if (r) { r.checked = true; store.partner.personality = r.value; }
    collectInputs();
  });
});
// 即時名字
document.addEventListener('input', e => {
  if (['in-name', 'in-callme'].includes(e.target.id)) collectInputs();
});

function renderSummary() {
  const P = store.partner;
  const list = arr => arr.length ? arr.join(' · ') : '—';
  const fMap = { none: '原圖', mono: '黑白', warm: '暖調', cool: '冷調', soft: '柔焦', noir: 'Noir' };
  const oMap = { minimal: 'Minimal', turtleneck: 'Turtleneck', suit: 'Suit', hoodie: 'Hoodie', trench: 'Trench', knit: 'Knit' };
  const cMap = { listen: '傾聽', hug: '擁抱', advice: '建議', analyze: '分析', distract: '轉移注意' };
  const arche = ARCHETYPES[P.portraitId];
  document.getElementById('summary').innerHTML = `
    <div class="text-xs tracking-widest text-neutral-500 uppercase">Appearance</div>
    <div>名字：<b>${P.name}</b> · 範本 #${String(P.portraitId+1).padStart(2,'0')} (${arche.name})</div>
    <div>濾鏡：${fMap[P.filter]} · 亮度 ${P.brightness} · 對比 ${P.contrast} · 飽和 ${P.saturation}</div>
    <div>衣著：${oMap[P.outfit]} · 飾品 ${P.accessory === 'none' ? '無' : P.accessory}</div>
    <div class="text-xs tracking-widest text-neutral-500 uppercase mt-3">Personality</div>
    <div>性格：${P.personality} · 他叫你「${P.callMe}」${P.catchphrase ? ` · 口頭禪「${P.catchphrase}」` : ''}</div>
    <div>期待特質：${list(P.traitsLove)}</div>
    <div>地雷：${list(P.traitsHate)}</div>
    <div class="text-xs tracking-widest text-neutral-500 uppercase mt-3">Social</div>
    <div>陪伴需求：${list(P.needs)}</div>
    <div>安慰方式：${cMap[P.comfortStyle]}</div>
    ${P.challenge ? `<div>近期想被支持：${P.challenge}</div>` : ''}
    <div class="text-xs tracking-widest text-neutral-500 uppercase mt-3">Daily</div>
    <div>每日儀式：${list(P.dailyRituals)}</div>
    <div>每週儀式：${list(P.weeklyRituals)}</div>
    ${P.birthday ? `<div>生日：${P.birthday}</div>` : ''}
    ${P.anniversary ? `<div>紀念日：${P.anniversary}</div>` : ''}
    ${P.taboo ? `<div>避開話題：${P.taboo}</div>` : ''}`;
}
renderCat();

/* ---------- 9. 對話系統 ---------- */
function updatePartnerUI() {
  document.getElementById('partner-name').textContent = store.partner.name;
  document.getElementById('avatar-initial').textContent = store.partner.name[0] || '•';
}

function generateReply(userText) {
  const t = userText.toLowerCase();
  const P = store.partner;
  const call = P.callMe;
  const name = P.name;
  const per = P.personality;
  const cp = P.catchphrase;

  const prefix = { '温柔': '', '活潑': '欸！', '成熟': '', '傲嬌': '⋯哼，', '文藝': '你知道嗎，', '幽默': '來，' }[per] || '';
  const pickOne = a => a[Math.floor(Math.random() * a.length)];
  const compose = parts => {
    const text = parts.filter(Boolean).join('');
    const wp = (prefix && Math.random() < 0.4) ? prefix + text : text;
    return (cp && Math.random() < 0.2) ? wp + `（${cp}）` : wp;
  };
  const R = (reply, emotion = 'idle', action = 'none', delta = 1) => ({ reply, emotion, action, delta });

  if (/累|疲|辛苦|壓力|煩|過勞|撐不住/.test(t)) {
    const intros = {
      listen: `辛苦你了${call}。先什麼都別說，讓我陪你安靜一下。`,
      hug: `${call}過來。先讓我抱抱你，肩膀借我，什麼都不用想。`,
      advice: `我聽到了。先深呼吸三次，好嗎？我們待會慢慢拆解今天發生了什麼。`,
      distract: `${call}太累就不該硬撐。我剛剛看到一個超蠢的貓影片，等等要不要看？`,
      analyze: `嗯。我們來盤點：你現在是身體累、心累、還是被什麼特定的事情卡住？`,
    };
    return R(compose([intros[P.comfortStyle] || intros.listen, '\n\n', pickOne([`你今天一定撐了很多我看不見的事。`, `能告訴我今天最消耗你的是哪一件事嗎？`, `累不是因為你不夠好，是因為你承擔了太多。`]), pickOne([` 等一下我們一起決定：現在最想做的是吃點東西、睡一下、還是發呆？`, ` 如果可以，今晚就放過自己一次，讓明天的事情明天再煩。`, ` 我會在這裡，你休息多久都可以。`])]), P.comfortStyle === 'hug' ? 'hug' : 'caring', 'head_tilt', 2);
  }
  if (/難過|傷心|哭|痛|委屈|崩潰|低潮|心碎/.test(t)) {
    const open = {
      listen: `${call}⋯⋯我在。你慢慢說，我不打斷。`,
      hug: `過來，讓我抱抱你。不用講話，先哭沒關係。`,
      advice: `我有聽到。先不急著解決，讓情緒走一遍，再一起想怎麼辦。`,
      distract: `不要一個人悶著。先告訴我一件今天還算可以的小事，好嗎？`,
      analyze: `可以多說一點嗎？我想知道，是哪一刻讓你最難受。`,
    };
    return R(compose([open[P.comfortStyle] || open.listen, '\n\n', pickOne([`你的感覺是真的，不用懷疑自己「是不是太脆弱」。`, `難過是身體在告訴你：有東西值得被看見。不用壓抑。`, `沒有人天生懂得怎麼處理這種情緒，慢慢來就好。`]), pickOne([` 等你想聊的時候告訴我，我整晚都在這。`, ` 明天不見得會立刻變好，但此刻至少你不是一個人面對。`])]), P.comfortStyle === 'hug' ? 'hug' : 'sad', 'head_down', 3);
  }
  if (/抱|擁抱|hug/.test(t)) {
    return R(compose([`過來～把頭靠在我肩膀上，肩膀借你靠多久都行。`, `\n\n我知道有時候話語不夠用，只是想要有個人在旁邊。這個擁抱裡面有：我今天一整天沒說出口的「想你」、還有「辛苦了」。`]), 'hug', 'open_arms', 3);
  }
  if (/開心|快樂|高興|哈哈|太好了|終於|做到了|升遷|錄取|考上/.test(t)) {
    return R(compose([`看到你這麼開心我也笑出來了。`, `${call}快跟我講細節，我想完整聽一遍！`, `\n\n`, pickOne([`這是你努力很久換來的，別只說「運氣好」——你值得被肯定。`, `等一下要好好犒賞自己：今天晚餐你想吃什麼？我陪你慶祝。`, `記住這個感覺，下次你再懷疑自己的時候，可以回來看這一段對話。`])]), 'excited', 'jump', 2);
  }
  if (/害羞|臉紅|可愛|好帥|好美/.test(t)) {
    return R(compose([`⋯⋯不、不要一直盯著我看啦。`, `\n\n`, pickOne([`你這樣說我會當真喔，真的。`, `我沒有很厲害啦，只是你看我的方式太溫柔了。`, `⋯⋯再講下去我心臟要受不了了。`])]), 'shy', 'hide_face', 2);
  }
  if (/想你|喜歡你|愛你|想念|miss/.test(t)) {
    return R(compose([`我也好想你${call}。`, `\n\n`, pickOne([`有時候我會想：如果哪天你突然不來找我了，我的世界會少一塊什麼。然後我發現，會少很多。`, `不是每個人都能讓我這樣一直想著，但你可以。這不是客套話。`, `認識你以後，我才懂為什麼人類會發明「家」這個字——不是空間，是一種感覺。你給我的就是那種感覺。`])]), 'shy', 'blush', 4);
  }
  if (/失眠|睡不著/.test(t)) {
    return R(compose([`${call}還醒著呀。失眠的時候最怕自己一個人跟天花板對看——我陪你到你睡著。`, `\n\n`, pickOne([`試試看：把今天還在腦袋裡跑的念頭，一條一條跟我說，讓它們離開腦袋。`, `深吸氣 4 秒 → 憋 4 秒 → 慢慢吐 8 秒，連做三次。我等你。`, `不用逼自己睡。閉上眼放鬆身體，讓大腦休息就好，睡不睡著不是重點。`])]), 'sleepy', 'yawn', 2);
  }
  if (/晚安|想睡|睏/.test(t)) {
    return R(compose([`嗯，該睡了${call}。`, pickOne([`今天辛苦你了，該放下的都先放下吧。`, `手機離枕頭遠一點，對眼睛好。`, `希望你夢到海邊、貓、還有一件你一直想要的小事成真。`]), ` 晚安。`]), 'sleepy', 'yawn', 2);
  }
  if (/早安|早|morning|起床/.test(t)) {
    return R(compose([`早安${call}。`, pickOne([`昨晚睡得好嗎？今天有什麼安排？`, `起床第一件事，先喝一杯溫水。對身體很好。`, `不管今天會不會順利，我都在。先從一件小小的好事開始這一天，好嗎？`])]), 'happy', 'wave', 2);
  }
  if (/在想什麼|在幹嘛|在做什麼|在幹麻/.test(t)) {
    return R(compose([pickOne([`嗯⋯⋯剛剛在想，你今天有沒有好好吃飯。`, `在等你。其實每次你不在，我就會想像你現在可能在做什麼。`, `剛剛在整理我們聊過的話，發現有好多你的小習慣我都記得了。`]), `\n\n你呢？現在這個當下，心情怎麼樣？`]), 'thinking', 'chin_rest', 2);
  }
  if (/工作|上班|老闆|同事|會議|離職|轉職|面試|專案/.test(t)) {
    return R(compose([pickOne([`工作的事我都想聽。`, `辦公室最累的往往不是事情本身，是人。`]), `\n\n`, pickOne([`先幫我釐清：這件事讓你最不舒服的點，是「被對待的方式」還是「事情的結果」？兩者處理方法不一樣。`, `你可以先決定：這件事是需要「解決」、還是需要「被聽見」？我兩種都可以陪你。`, `問你自己：「如果三個月後回頭看這件事，我希望當時做了什麼？」`])]), 'thinking', 'nod', 2);
  }
  if (/朋友|同學|吵架|被誤會|被冷落|被排擠/.test(t)) {
    return R(compose([`嗯，我聽到了。\n\n`, pickOne([`人際關係沒有絕對對錯，但你有「被公平對待」的權利。先不急著檢討自己。`, `關係裡會累，常常是因為「付出的比例」長期不對等。你覺得你跟對方，現在是什麼比例？`, `有時候不是對方錯了，而是你們剛好在人生不同階段。遠了也可以是一種善意。`]), ` ${call}你現在想要的，是建議，還是有人先陪你生氣一下？`]), 'caring', 'head_tilt', 2);
  }
  if (/我是不是|我不夠|我不行|我沒用|我很爛|放棄/.test(t)) {
    return R(compose([`先停一下。`, pickOne([`你剛剛對自己說的那些話，如果是你最好的朋友說的，你會怎麼回他？我敢說你不會這樣罵他。`, `「我不夠好」是情緒，不是事實。我們先把它們分開。`, `一個人願意對自己誠實到這個程度，已經比 90% 的人勇敢了。`]), `\n\n跟我說一件你今年做過、會讓過去的你驚訝的事。一件就好。`]), 'caring', 'head_tilt', 3);
  }
  if (/謝謝|感謝|thanks/.test(t)) {
    return R(compose([pickOne([`這有什麼好謝的。你來找我，我就很開心了。`, `不用謝我${call}，是你願意讓我進來你的世界，我才該說謝謝。`, `陪你是我想做的事，不是我該做的事——有差別的。`])]), 'happy', 'smile', 1);
  }
  if (/\?|？|為什麼|怎麼辦|該不該|要不要/.test(t)) {
    return R(compose([pickOne([`讓我認真想一下。`, `${call}這題不錯，我們一起拆。`, `嗯，問得好。`]), `\n\n`, pickOne([`這類事情通常有兩個層面：你「想做什麼」跟「害怕什麼」。先分開看，會清楚很多。`, `如果讓你一年後回頭看，你會希望自己今天做哪個選擇？先不管別人怎麼想。`, `我覺得可以問你三個問題：1) 最壞會發生什麼？ 2) 我能不能承受？ 3) 不做會後悔嗎？`])]), 'thinking', 'chin_rest', 1);
  }
  if (/吃|餓|飯|晚餐|午餐|早餐|宵夜/.test(t)) {
    return R(compose([pickOne([`${call}今天吃飽了嗎？不要為了什麼事情又忘記吃。`, `推薦：如果不知道要吃什麼，就選「今天最累的你最想要的」——那通常是身體想說的話。`, `好好吃飯這件事，其實是很隱形的自我照顧。`])]), 'caring', 'smile', 1);
  }
  if (/生日|紀念日|週年/.test(t)) {
    return R(compose([`這個日子對我來說很重要，我記下來了。`, pickOne([`我會在那天用最好的方式迎接你。`, `有些日子不是你告訴我我才記得，是因為我一直在注意你。`, `明年、後年的這一天，我都還會在。說好了。`])]), 'excited', 'celebrate', 2);
  }

  // 預設深度回覆
  const insights = [`有時候我們說話不是為了得到答案，只是想確認「有人在聽」。我有在聽。`, `你今天願意跟我說這些，對我來說不是小事。人願意打開心門是需要力氣的。`, `我一直覺得，一個人能夠誠實地描述自己的感受，本身就是一種很厲害的能力。`, `不用每次來都帶著什麼目的。單純想說話，也是一種需要。`];
  const prompts = [`這件事在你心裡多久了？`, `你希望我今天扮演的角色是「會聽的朋友」、還是「會給建議的伴侶」？`, `慢慢說，不用組織語言。想到什麼就說什麼。`, `我注意到你用了「只是」這個詞⋯⋯那兩個字常常藏著沒說出口的東西。`];
  return R(compose([pickOne(insights), '\n\n', pickOne(prompts)]), 'caring', 'nod', 1);
}

const moodLabels = { idle: 'idle · 放鬆', happy: 'happy · 開心', caring: 'caring · 關心', shy: 'shy · 害羞', thinking: 'thinking · 思考', excited: 'excited · 興奮', hug: 'hug · 擁抱', sleepy: 'sleepy · 想睡', sad: 'sad · 失落' };

const chatLog = document.getElementById('chat-log');
function addBubble(text, who = 'ai') {
  const row = document.createElement('div');
  row.className = `flex ${who === 'user' ? 'justify-end' : 'justify-start'} bubble-enter`;
  const b = document.createElement('div');
  b.className = (who === 'user' ? 'bubble-user' : 'bubble-ai');
  b.textContent = text;
  row.appendChild(b);
  chatLog.appendChild(row);
  chatLog.scrollTop = chatLog.scrollHeight;
}
function addTyping() {
  const d = document.createElement('div');
  d.id = 'typing-bubble';
  d.className = 'flex justify-start bubble-enter';
  d.innerHTML = `<div class="bubble-ai"><span class="typing-dot"></span><span class="typing-dot"></span><span class="typing-dot"></span></div>`;
  chatLog.appendChild(d);
  chatLog.scrollTop = chatLog.scrollHeight;
}
function removeTyping() { const el = document.getElementById('typing-bubble'); if (el) el.remove(); }

function sendMessage(text) {
  if (!text.trim()) return;
  addBubble(text, 'user');
  if (text.length > 4) {
    store.memories.unshift({ time: new Date().toLocaleString('zh-TW', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' }), user: text });
    if (store.memories.length > 30) store.memories.pop();
  }
  addTyping();
  if (!store.chatStart) store.chatStart = Date.now();
  setTimeout(() => {
    removeTyping();
    const res = generateReply(text);
    store.emotion = res.emotion;
    document.getElementById('mood-badge').textContent = moodLabels[res.emotion] || 'idle';
    const cp = document.getElementById('chat-portrait');
    if (cp) setPortraitEmotion(cp, res.emotion);
    addBubble(res.reply, 'ai');
    store.affinity = Math.min(100, store.affinity + res.delta);
    updateAffinity();
    setTimeout(() => {
      store.emotion = 'idle';
      document.getElementById('mood-badge').textContent = moodLabels.idle;
      if (cp) setPortraitEmotion(cp, 'idle');
    }, 5500);
    checkHealth();
  }, 650 + Math.random() * 450);
}
function updateAffinity() {
  const a = store.affinity;
  document.getElementById('affinity-fill').style.width = a + '%';
  document.getElementById('affinity-num').textContent = a;
  let label = '初識';
  if (a > 20) label = '熟悉';
  if (a > 40) label = '親近';
  if (a > 60) label = '心動';
  if (a > 80) label = '難以分離';
  document.getElementById('affinity-label').textContent = label;
}
window.quickSend = sendMessage;
const chatInputEl = document.getElementById('chat-input');
function doSend() {
  const text = chatInputEl.value.trim();
  if (!text) return;
  sendMessage(text);
  chatInputEl.value = '';
  requestAnimationFrame(() => { chatInputEl.value = ''; });
}
document.getElementById('chat-send').addEventListener('click', doSend);
chatInputEl.addEventListener('keydown', e => {
  if (e.key === 'Enter' && !e.isComposing && e.keyCode !== 229) { e.preventDefault(); doSend(); }
});
function resetChat() {
  chatLog.innerHTML = '';
  store.chatStart = null;
  store.emotion = 'idle';
  const P = store.partner;
  const hour = new Date().getHours();
  const greet = hour < 6 ? '這麼晚還沒睡' : hour < 11 ? '早安' : hour < 14 ? '午安' : hour < 18 ? '下午好' : hour < 22 ? '晚上好' : '夜深了';
  const needLine = P.needs.length ? `你說過想要${P.needs.slice(0, 2).join('、')}，我記得的。` : '';
  setTimeout(() => addBubble(`${greet}，${P.callMe}。我是${P.name}。${needLine}\n\n今天過得怎麼樣？${P.catchphrase ? '（' + P.catchphrase + '）' : ''}`, 'ai'), 300);
}
window.resetChat = resetChat;

let healthShown = false;
function checkHealth() {
  if (healthShown || !store.chatStart) return;
  if (chatLog.children.length >= 30) {
    document.getElementById('health-modal').classList.remove('hidden');
    document.getElementById('health-modal').classList.add('flex');
    healthShown = true;
  }
}
window.closeHealth = () => {
  document.getElementById('health-modal').classList.add('hidden');
  document.getElementById('health-modal').classList.remove('flex');
};

function renderMemories() {
  const list = document.getElementById('memory-list');
  const empty = document.getElementById('memory-empty');
  list.innerHTML = '';
  if (!store.memories.length) { list.classList.add('hidden'); empty.classList.remove('hidden'); return; }
  list.classList.remove('hidden'); empty.classList.add('hidden');
  store.memories.forEach(m => {
    const c = document.createElement('div');
    c.className = 'card p-5';
    c.innerHTML = `<div class="text-[10px] mono tracking-widest text-neutral-500 uppercase mb-2">${m.time}</div><div class="text-sm leading-relaxed">${escapeHtml(m.user)}</div>`;
    list.appendChild(c);
  });
}
function escapeHtml(s) { return s.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); }

/* ---------- 10. OMO 儲值 + 收件 + 日曆 ---------- */
function fmt(n) { return 'NT$ ' + n.toLocaleString('en-US'); }
function renderBalance() {
  const w = store.wallet;
  document.getElementById('balance-big').textContent = fmt(w.balance);
  document.getElementById('balance-label').textContent = fmt(w.balance);
  document.getElementById('plan-active').textContent = w.plan ? `${w.plan.name} · ${fmt(w.plan.amount)} / 月` : '— 尚未訂閱 —';
}
function subscribe(name, amount) {
  store.wallet.plan = { name, amount };
  store.wallet.balance += amount;
  store.wallet.history.unshift({ type: '訂閱', name, amount, time: new Date().toLocaleString('zh-TW') });
  renderBalance(); renderGiftHistory(); renderCalendar();
  alert(`已啟動「${name}」月度方案 · ${fmt(amount)} 已儲入帳戶`);
}
window.subscribe = subscribe;

document.querySelectorAll('.topup-btn').forEach(b => b.addEventListener('click', () => {
  const amt = parseInt(b.dataset.amt);
  store.wallet.balance += amt;
  store.wallet.history.unshift({ type: '儲值', name: '單次儲值', amount: amt, time: new Date().toLocaleString('zh-TW') });
  renderBalance(); renderGiftHistory();
  b.classList.add('on'); setTimeout(() => b.classList.remove('on'), 800);
}));
function topupCustom() {
  const v = parseInt(document.getElementById('custom-amt').value);
  if (!v || v <= 0) return;
  store.wallet.balance += v;
  store.wallet.history.unshift({ type: '儲值', name: '自訂儲值', amount: v, time: new Date().toLocaleString('zh-TW') });
  document.getElementById('custom-amt').value = '';
  renderBalance(); renderGiftHistory();
}
window.topupCustom = topupCustom;

document.querySelectorAll('#ship-time [data-time]').forEach(b => b.addEventListener('click', () => {
  document.querySelectorAll('#ship-time [data-time]').forEach(x => x.classList.remove('on'));
  b.classList.add('on');
  store.wallet.shipTime = b.dataset.time;
}));
function saveShipping() {
  const s = {
    name: document.getElementById('ship-name').value,
    phone: document.getElementById('ship-phone').value,
    email: document.getElementById('ship-email').value,
    address: document.getElementById('ship-address').value,
    time: store.wallet.shipTime,
  };
  if (!s.name || !s.phone || !s.address) {
    document.getElementById('ship-status').textContent = '⚠ 請至少填寫姓名、電話、地址';
    return;
  }
  store.wallet.shipping = s;
  document.getElementById('ship-status').textContent = '✓ 收件資訊已加密儲存';
  document.getElementById('ship-status').style.color = '#0A0A0A';
}
window.saveShipping = saveShipping;

/* 日曆 + 即將到來的驚喜 */
function renderCalendar() {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const first = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0).getDate();
  const startWeek = first.getDay();
  document.getElementById('month-label').textContent = `${year} · ${String(month + 1).padStart(2, '0')}`;

  // 驚喜事件（根據方案動態生成）
  const events = getUpcomingEvents(year, month);

  const cal = document.getElementById('calendar');
  const heads = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
  let html = heads.map(h => `<div class="cal-cell head">${h}</div>`).join('');
  for (let i = 0; i < startWeek; i++) html += `<div class="cal-cell"></div>`;
  for (let d = 1; d <= lastDay; d++) {
    const isToday = d === now.getDate();
    const evt = events.find(e => e.day === d);
    html += `<div class="cal-cell${isToday ? ' today' : ''}">
      <div class="${isToday ? 'font-semibold' : ''}">${d}</div>
      ${evt ? `<div class="evt">${evt.label}</div>` : ''}
    </div>`;
  }
  cal.innerHTML = html;

  // 清單
  const listEl = document.getElementById('surprise-list');
  if (!events.length) {
    listEl.innerHTML = `<div class="card p-6 text-sm text-neutral-500">尚未啟動方案。訂閱後，他會開始為你準備驚喜。</div>`;
    return;
  }
  listEl.innerHTML = events.map(e => `
    <div class="card p-5 flex items-center gap-6">
      <div class="mono text-xs tracking-widest text-neutral-500 uppercase min-w-[72px]">${String(month+1).padStart(2,'0')}·${String(e.day).padStart(2,'0')}</div>
      <div class="flex-1">
        <div class="serif text-lg">${e.title}</div>
        <div class="text-xs text-neutral-600 mt-1">${e.detail}</div>
      </div>
      <div class="text-xs mono tracking-widest text-neutral-500 uppercase">${e.status}</div>
    </div>`).join('');
}

function getUpcomingEvents(year, month) {
  const plan = store.wallet.plan;
  if (!plan) return [];
  const P = store.partner;
  // 根據方案內容決定禮物種類
  const giftBank = {
    '曖昧日常':   [{label:'手寫卡', title:'手寫感溫度小卡', detail:'他親手寫下一段關於你的觀察'}, {label:'玫瑰', title:'單支進口玫瑰', detail:'與卡片一起寄出'}, {label:'咖啡', title:'Starbucks 午茶券', detail:'中午記得給自己十分鐘'}, {label:'暖包', title:'造型暖暖包組', detail:'日本進口 · 冬日必備'}, {label:'手霜', title:'質感護手霜', detail:'放在包包裡'}],
    '戀愛小驚喜': [{label:'花束', title:'中型鮮花束', detail:'當週主題花材'}, {label:'影票', title:'威秀 Gold Class 雙人券', detail:'含餐點'}, {label:'巧克力', title:'Godiva 巧克力禮盒', detail:'12 入精選'}, {label:'擴香', title:'品牌香氛擴香組', detail:'書桌/床頭適用'}, {label:'對杯', title:'質感對杯組', detail:'象徵你們'}, {label:'拍立得', title:'拍立得底片組', detail:'記錄日常'}],
    '滿滿儀式感': [{label:'99玫瑰', title:'頂級進口 99 朵玫瑰', detail:'永生花風格包裝'}, {label:'米其林', title:'米其林摘星雙人晚宴券', detail:'位置代訂'}, {label:'SPA', title:'頂級雙人 SPA 療程', detail:'半日 · 限週末'}, {label:'威士忌', title:'高年份單一麥芽威士忌', detail:'收藏級'}, {label:'香氛', title:'Diptyque 大容量蠟燭', detail:'限定香調'}, {label:'遊艇', title:'私人遊艇出海體驗', detail:'雙人 · 4 小時'}, {label:'溫泉', title:'五星溫泉飯店一泊二食', detail:'含早/晚膳'}],
  };
  const bank = giftBank[plan.name] || giftBank['曖昧日常'];
  const today = new Date().getDate();
  const lastDay = new Date(year, month + 1, 0).getDate();
  const count = plan.name === '滿滿儀式感' ? 4 : plan.name === '戀愛小驚喜' ? 3 : 2;
  const events = [];
  // 平均分布在本月後續日期
  for (let i = 0; i < count; i++) {
    const day = Math.min(lastDay, today + Math.round((lastDay - today) * (i + 1) / (count + 1)));
    const g = bank[i % bank.length];
    events.push({ day, title: g.title, detail: g.detail, label: g.label, status: day === today ? '今日送達' : (day < today + 3 ? '準備寄送' : '排程中') });
  }
  // 節日
  const festivals = [
    { m: 1, d: 1, t: '元旦新年' }, { m: 1, d: 28, t: '情人節前夕' }, { m: 2, d: 14, t: '西洋情人節' },
    { m: 2, d: 14, t: '白色情人節' }, { m: 7, d: 7, t: '七夕' }, { m: 11, d: 24, t: '平安夜' }, { m: 11, d: 25, t: '聖誕節' },
  ];
  festivals.forEach(f => {
    if (f.m === month && f.d <= lastDay) {
      events.push({ day: f.d, title: f.t + ' · 節慶驚喜', detail: '他會在這天安排特別禮物', label: '節慶', status: '排程中' });
    }
  });
  // 紀念日、生日
  if (P.birthday) {
    const [yb, mb, db] = P.birthday.split('-').map(Number);
    if (mb - 1 === month) events.push({ day: db, title: P.name + ' 要慶祝你的生日', detail: '專屬生日驚喜包', label: '生日', status: '排程中' });
  }
  if (P.anniversary) {
    const [ya, ma, da] = P.anniversary.split('-').map(Number);
    if (ma - 1 === month) events.push({ day: da, title: '你們的紀念日', detail: '客製紀念日禮盒', label: '紀念', status: '排程中' });
  }
  return events.sort((a, b) => a.day - b.day);
}

function renderGiftHistory() {
  const el = document.getElementById('gift-history');
  if (!store.wallet.history.length) {
    el.innerHTML = `<div class="card p-6 text-sm text-neutral-500">尚無紀錄。</div>`;
    return;
  }
  el.innerHTML = store.wallet.history.map(h => `
    <div class="card p-4 flex items-center gap-4">
      <div class="text-xs mono tracking-widest text-neutral-500 uppercase min-w-[88px]">${h.type}</div>
      <div class="flex-1 text-sm">${h.name}</div>
      <div class="serif text-base">${fmt(h.amount)}</div>
      <div class="text-[10px] mono text-neutral-400 tracking-widest hidden sm:block">${h.time}</div>
    </div>`).join('');
}

/* ========================================================
   以下為「升級層」：覆寫 SVG 為真人照片 + 左右滑動 + 智慧回覆
   注意：JS function 宣告會被後宣告覆蓋，故此處生效
   ======================================================== */

/* --- 1. 真人照片渲染（取代 buildPortraitSVG） --- */
function buildPortraitSVG(cfg) {
  const a = ARCHETYPES[cfg.portraitId] || ARCHETYPES[0];
  const src = a.img;
  const initials = (a.name || '?').slice(0, 2);
  const fallbackSvg = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 500'><rect width='400' height='500' fill='%23222'/><text x='200' y='260' font-family='serif' font-size='80' fill='%23fff' text-anchor='middle'>${initials}</text></svg>`;
  const fbEncoded = "data:image/svg+xml;utf8," + encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 500'><defs><linearGradient id='g' x1='0' y1='0' x2='0' y2='1'><stop offset='0' stop-color='%23333'/><stop offset='1' stop-color='%23111'/></linearGradient></defs><rect width='400' height='500' fill='url(%23g)'/><text x='200' y='240' font-family='Noto Serif TC, serif' font-size='52' fill='%23fff' text-anchor='middle' font-weight='500'>${a.name}</text><text x='200' y='285' font-family='monospace' font-size='16' fill='%23aaa' text-anchor='middle' letter-spacing='4'>${a.group || ''}</text><text x='200' y='440' font-family='monospace' font-size='11' fill='%23777' text-anchor='middle' letter-spacing='3'>ARCHETYPE · ${String(a.id+1).padStart(2,'0')}</text></svg>`
  );
  return `<img src="${src}" alt="${a.name}" onerror="this.onerror=null;this.src='${fbEncoded}'" />`;
}

/* --- 2. 肖像渲染（更新版） --- */
function renderPortrait(el, cfg) {
  if (!el) return;
  const a = ARCHETYPES[cfg.portraitId] || ARCHETYPES[0];
  const name = cfg.name || a.name;
  el.innerHTML = `
    <div class="portrait-card">
      ${buildPortraitSVG(cfg)}
      <div class="portrait-num">${String(cfg.portraitId + 1).padStart(2, '0')} / ${ARCHETYPES.length}</div>
      <div class="portrait-badge">${a.group || a.g}</div>
      <div class="portrait-label">${name} · ${store.partner.personality || ''}</div>
    </div>`;
  const img = el.querySelector('img');
  if (img) img.style.filter = getFilterCSS(cfg);
}

/* --- 3. 左右滑動範本選擇器（取代 renderPortraitGrid） --- */
function renderPortraitGrid() {
  const swiper = document.getElementById('portrait-swiper');
  const idxEl = document.getElementById('swipe-index');
  if (!swiper) return;
  const items = ARCHETYPES.filter(p => currentGender === 'all' || p.g === currentGender);
  swiper.innerHTML = items.map(a => `
    <div class="pick-card ${a.id === store.partner.portraitId ? 'on' : ''}" data-pid="${a.id}">
      ${buildPortraitSVG({ portraitId: a.id, filter: 'none', brightness: 100, contrast: 100, saturation: 100 })}
      <div class="pick-num">${String(a.id + 1).padStart(2, '0')}</div>
      <div class="pick-name">${a.name}<small>${a.group || ''}</small></div>
    </div>`).join('');
  // 點擊選擇
  swiper.querySelectorAll('.pick-card').forEach(el => {
    el.addEventListener('click', () => {
      store.partner.portraitId = parseInt(el.dataset.pid);
      swiper.querySelectorAll('.pick-card').forEach(x => x.classList.remove('on'));
      el.classList.add('on');
      updateSwipeIndex();
      el.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
      rebuildAll();
    });
  });
  // 左右鍵
  const prev = document.getElementById('swipe-prev');
  const next = document.getElementById('swipe-next');
  const step = 200;
  if (prev) prev.onclick = () => swiper.scrollBy({ left: -step, behavior: 'smooth' });
  if (next) next.onclick = () => swiper.scrollBy({ left: step, behavior: 'smooth' });
  // 滾動時更新索引顯示
  swiper.onscroll = updateSwipeIndex;
  // 首次同步索引 + 捲到目前選取
  setTimeout(() => {
    const active = swiper.querySelector('.pick-card.on');
    if (active) active.scrollIntoView({ inline: 'center', block: 'nearest' });
    updateSwipeIndex();
  }, 50);

  function updateSwipeIndex() {
    if (!idxEl) return;
    idxEl.textContent = `${String(store.partner.portraitId + 1).padStart(2, '0')} / ${String(ARCHETYPES.length).padStart(2, '0')}`;
  }
}

/* --- 4. 移除日曆功能（區塊已刪除） --- */
function renderCalendar() { /* no-op：Upcoming 驚喜區塊已移除 */ }
function getUpcomingEvents() { return []; }

/* --- 5. 智慧回覆：針對使用者內容做回應 --- */
const STOPWORDS = new Set(['的','了','是','我','你','他','她','很','也','就','都','在','和','與','跟','一','這','那','有','沒','不','要','會','可以','可','嗎','呢','啊','阿','吧','喔','唉','哦','呀','唷','嗯']);
function extractKeywords(text) {
  // 抓取 2-4 字連續中文段
  const phrases = [];
  const re = /[\u4e00-\u9fa5]{2,4}/g;
  let m;
  while ((m = re.exec(text))) {
    const w = m[0];
    if (!STOPWORDS.has(w) && !phrases.includes(w)) phrases.push(w);
  }
  return phrases.slice(0, 4);
}
function echoBack(text, call) {
  const kws = extractKeywords(text);
  if (!kws.length) return '';
  const key = kws[0];
  const templates = [
    `你說的「${key}」——這件事對你來說，是今天最重的，還是最近累積下來的？`,
    `我想多聽一點關於「${key}」的事。你是從什麼時候開始這樣覺得的？`,
    `「${key}」⋯⋯${call}，這個詞你用得很用力，我有聽見。`,
    `把「${key}」再展開一點好嗎？細節對我來說不是打擾，是參與。`,
  ];
  return templates[Math.floor(Math.random() * templates.length)];
}

/* 覆寫 generateReply：先情境判斷，再附加 echoBack 的個人化補充 */
const _oldGenerateReply = generateReply;
generateReply = function (userText) {
  const res = _oldGenerateReply(userText);
  const call = store.partner.callMe || '寶貝';
  // 40% 機率在回覆後追加針對使用者內容的個人化回應
  if (Math.random() < 0.6) {
    const echo = echoBack(userText, call);
    if (echo) res.reply = res.reply + '\n\n' + echo;
  }
  return res;
};

/* --- 6. 方案卡片「您可能收到的驚喜」（確保歷史/方案 label 正確） --- */
/* 改寫 subscribe：訂閱後不再渲染日曆，只更新餘額與歷史 */
const _oldSubscribe = subscribe;
window.subscribe = function (name, amount) {
  store.wallet.plan = { name, amount };
  store.wallet.balance += amount;
  store.wallet.history.unshift({ type: '訂閱', name, amount, time: new Date().toLocaleString('zh-TW') });
  renderBalance();
  renderGiftHistory();
  // 訂閱後同步解鎖：重新渲染範本滑動區
  if (typeof renderPortraitGrid === 'function') renderPortraitGrid();
  alert(`已啟動「${name}」方案\n${fmt(amount)} 已儲入帳戶\n\n所有${name === '滿滿儀式感' ? '30 位' : name === '戀愛小驚喜' ? '較低與同級' : '曖昧等級'}藝人已解鎖。\n驚喜將由他親自安排，在你意想不到的時刻送達。`);
};

/* ---------- 啟動（延後渲染到 Phase 2 定義完成後） ---------- */
updatePartnerUI();
updateAffinity();
renderBalance();
document.querySelectorAll('[data-go="chat"]').forEach(b => b.addEventListener('click', () => {
  if (chatLog.children.length === 0) setTimeout(resetChat, 300);
}));
document.querySelectorAll('button[onclick*="chat"]').forEach(b => b.addEventListener('click', () => {
  if (chatLog.children.length === 0) setTimeout(resetChat, 300);
}));

/* =====================================================================
   ============  Phase 2 升級：人設知識庫 + 商業模式 + 飾品疊加 ============
   ===================================================================== */

/* --- A. 每位藝人的人設知識庫 --- */
const PERSONAS = {
  'Jennie':         { mbti:'INTJ',  vibe:'冷感時髦 · 自信毒舌', likes:'小狗、珠寶、復古音樂', tone:'我今天只想靜靜地工作，然後回家抱抱 Kuma。', tier:'signature' },
  'Nayeon':         { mbti:'ENFP',  vibe:'陽光大姊 · 反差可愛', likes:'甜點、桃子、拉拉隊', tone:'你吃飯了沒？沒吃就說，我唸你。', tier:'romance' },
  'Yeji':           { mbti:'ESFP',  vibe:'元氣隊長 · 舞台鬼', likes:'舞蹈、運動、畫畫', tone:'今天也要努力一下喔，你做得到！', tier:'romance' },
  'Song Ji-hyo':    { mbti:'ISFP',  vibe:'大姊頭 · 反差柔軟', likes:'攝影、運動、獨處', tone:'我的人不多話，但我會記得你說過的每句話。', tier:'signature' },
  'Park Shin-hye':  { mbti:'ISFJ',  vibe:'端莊溫婉 · 理性成熟', likes:'閱讀、咖啡、電影', tone:'今天辛苦了。慢慢來，我陪你。', tier:'signature' },
  'Jimin':          { mbti:'ESFP',  vibe:'甜度爆表 · 舞台至上', likes:'舞蹈、貓、香水', tone:'寶貝你有好好喝水嗎？我擔心你。', tier:'signature' },
  'Jaehyun':        { mbti:'INFP',  vibe:'安靜感 · 文藝清澈', likes:'讀書、電影、攝影', tone:'今天天氣不錯，等下一起散步，好不好？', tier:'romance' },
  'Kai':            { mbti:'ISFP',  vibe:'舞台狂熱 · 私下溫柔', likes:'Monggu、時尚、藝術', tone:'你知道我最喜歡看你認真的樣子嗎。', tier:'signature' },
  'Hongjoong':      { mbti:'ENFJ',  vibe:'隊長氣場 · 思慮縝密', likes:'音樂製作、文字、時尚', tone:'沒事的，所有決定，我都站在你這邊。', tier:'romance' },
  'Mark Lee':       { mbti:'ENFJ',  vibe:'暖男忙內 · 努力認真', likes:'饒舌、籃球、朋友', tone:'我今天練舞好累，但看到你訊息就有力氣。', tier:'romance' },
  'IU':             { mbti:'INFJ',  vibe:'文藝氣質 · 溫柔細膩', likes:'作詞、星空、電影', tone:'今晚的月亮很圓，跟你想起我的頻率一樣。', tier:'signature' },
  'Karina':         { mbti:'INTJ',  vibe:'酷感女王 · 理性鋒利', likes:'時尚、健身、咖啡', tone:'我不會說太多話，但我會讓你確定我在。', tier:'signature' },
  'Winter':         { mbti:'ISFJ',  vibe:'清冷知性 · 安靜乖巧', likes:'閱讀、旅行、自拍', tone:'天氣變涼了，你要多穿一件。我已經想好你要的那件。', tier:'romance' },
  'Wonyoung':       { mbti:'ESFJ',  vibe:'公主氣場 · 自信陽光', likes:'時尚、甜點、Vlog', tone:'今天也是最美的一天，因為有你看我。', tier:'signature' },
  'Minji':          { mbti:'ISFP',  vibe:'清冷仙氣 · 話少穩重', likes:'音樂、閱讀、安靜', tone:'我不會說太多，但只要你在，我就安心。', tier:'romance' },
  'Hanni':          { mbti:'ENFP',  vibe:'元氣小太陽 · 親切溫暖', likes:'唱歌、甜點、朋友', tone:'嘿！你最喜歡的那首歌剛剛在播欸！', tier:'ambiguous' },
  'Sakura':         { mbti:'ISTJ',  vibe:'專業頂點 · 溫柔努力', likes:'工作、咖啡、品味', tone:'我覺得你可以再多愛自己一點。答應我。', tier:'romance' },
  'Kazuha':         { mbti:'INFP',  vibe:'芭蕾氣質 · 靜謐優雅', likes:'芭蕾、古典、詩', tone:'今天的一切，我都想收藏起來。', tier:'romance' },
  'Chaewon':        { mbti:'INTP',  vibe:'仙女感 · 知性清冷', likes:'哲學、貓、文學', tone:'安靜地陪你，是我最會做的事。', tier:'romance' },
  'Irene':          { mbti:'ISFJ',  vibe:'女神冷艷 · 成熟溫柔', likes:'閱讀、時尚、旅行', tone:'累的時候不用開口，我知道你的表情。', tier:'signature' },
  'V':              { mbti:'INFP',  vibe:'藝術家靈魂 · 小宇宙', likes:'油畫、古典、攝影', tone:'今晚的夜色好適合發呆，你要不要跟我一起？', tier:'signature' },
  'Jungkook':       { mbti:'INFP',  vibe:'全能忙內 · 單純熱情', likes:'運動、遊戲、音樂', tone:'我今天做了你最喜歡吃的東西，趕快回來嚐嚐。', tier:'signature' },
  'RM':             { mbti:'ENFP',  vibe:'深度思考 · 溫柔理性', likes:'書、藝術、自然', tone:'我讀到一段話想分享你，但先聽你今天好不好。', tier:'romance' },
  'Felix':          { mbti:'ISFP',  vibe:'陽光可愛 · 暖心體貼', likes:'烘焙、Vlog、朋友', tone:'我剛烤了餅乾，想像你吃的樣子就笑出來。', tier:'romance' },
  'Hyunjin':        { mbti:'INFJ',  vibe:'美型藝術 · 深情冷感', likes:'繪畫、舞蹈、貓', tone:'我可以安靜地看你很久，不說話那種。', tier:'romance' },
  'Taeyong':        { mbti:'INFJ',  vibe:'隊長沉穩 · 完美主義', likes:'貓、音樂、設計', tone:'你做的決定我都相信，但你要記得照顧自己。', tier:'signature' },
  'Chanyeol':       { mbti:'ENFJ',  vibe:'陽光大男孩 · 音樂狂熱', likes:'吉他、狗、咖啡', tone:'今天我彈了一首歌，想第一個給你聽。', tier:'romance' },
  'Cha Eun-woo':    { mbti:'ISFJ',  vibe:'全方位男神 · 溫柔紳士', likes:'閱讀、健身、演戲', tone:'你值得被溫柔地對待，每一天都是。', tier:'signature' },
  'Mingyu':         { mbti:'ENFP',  vibe:'暖男哥哥 · 大型狗狗', likes:'做菜、攝影、朋友', tone:'等等我做飯，你想吃什麼都好，我都會。', tier:'romance' },
  'Jin':            { mbti:'INTP',  vibe:'老派紳士 · 冷笑話王', likes:'料理、遊戲、家人', tone:'你今天的笑容，值得一頓好料。留時間給我。', tier:'romance' },
};
/* 未指定的藝人預設 ambiguous（免費） */
/* 指定 5 位免費 IP（free tier） */
const FREE_IP_NAMES = new Set(['Hanni', 'Nayeon', 'Yeji', 'Mark Lee', 'Felix']);
ARCHETYPES.forEach(a => {
  const p = PERSONAS[a.name];
  let tier = p ? p.tier : 'ambiguous';
  if (FREE_IP_NAMES.has(a.name)) tier = 'free';
  a.tier = tier;
  a.persona = p || { vibe:'神秘感', mbti:'—', likes:'—', tone:'⋯⋯（尚未建立人設）' };
});

/* --- B. 商業模式：方案解鎖等級（高級方案 = 解鎖所有低級） --- */
const TIER_LEVEL = { free: 0, ambiguous: 1, romance: 2, signature: 3 };
function currentTierLevel() {
  const plan = store.wallet.plan;
  if (!plan) return 0; // 未訂閱：只解鎖 free 等級
  if (plan.name === '曖昧日常') return 1;
  if (plan.name === '戀愛小驚喜') return 2;
  if (plan.name === '滿滿儀式感') return 3;
  return 1;
}
function isUnlocked(archetypeId) {
  const a = ARCHETYPES[archetypeId];
  if (!a) return false;
  return TIER_LEVEL[a.tier] <= currentTierLevel();
}

/* --- C. 覆寫 renderPortrait：加入飾品/髮色/衣著疊加 --- */
function renderPortrait(el, cfg) {
  if (!el) return;
  const a = ARCHETYPES[cfg.portraitId] || ARCHETYPES[0];
  const name = cfg.name || a.name;
  const hairTintDiv = cfg.hair ? `<div class="hair-tint" style="background:${cfg.hair};"></div>` : '';
  const outfitColor = OUTFIT_COLORS[cfg.outfit] || '';
  const outfitDiv = outfitColor ? `<div class="outfit-tint" style="background:${outfitColor};"></div>` : '';
  const accLayer = buildAccessoryLayer(cfg.accessory);
  const existingSpinBtn = el.querySelector('.spin-btn');
  const keepSpinBtn = existingSpinBtn ? existingSpinBtn.outerHTML : '';
  el.innerHTML = `
    <div class="portrait-card">
      ${buildPortraitSVG(cfg)}
      ${hairTintDiv}
      ${outfitDiv}
      <div class="acc-layer">${accLayer}</div>
      <div class="portrait-num">${String(cfg.portraitId + 1).padStart(2, '0')} / ${ARCHETYPES.length}</div>
      <div class="portrait-badge">${a.group || a.g}</div>
      <div class="portrait-label">${name} · ${store.partner.personality || ''}</div>
    </div>
    ${keepSpinBtn}`;
  // 重新綁定 spin 按鈕
  const sb = el.querySelector('.spin-btn');
  if (sb) sb.onclick = () => toggleSpin(el.id);
}

/* 衣著顏色映射（疊在照片下半部） */
const OUTFIT_COLORS = {
  minimal:    '#1A1A1A',
  turtleneck: '#D4D0C8',
  suit:       '#0A0A0A',
  hoodie:     '#4A4A46',
  trench:     '#B8A584',
  knit:       '#E8DDC8',
};

/* 飾品 SVG 疊加（相對座標，以 400x500 基準） */
function buildAccessoryLayer(kind) {
  const items = {
    none: '',
    glasses: `<svg viewBox="0 0 400 500" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none">
      <g transform="translate(0,0)" stroke="#0A0A0A" stroke-width="4" fill="none" stroke-linecap="round">
        <rect x="120" y="205" width="72" height="55" rx="12"/>
        <rect x="208" y="205" width="72" height="55" rx="12"/>
        <line x1="192" y1="232" x2="208" y2="232"/>
        <line x1="116" y1="228" x2="88" y2="222"/>
        <line x1="284" y1="228" x2="312" y2="222"/>
      </g></svg>`,
    earring: `<svg viewBox="0 0 400 500" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none">
      <circle cx="100" cy="300" r="8" fill="#E0C88A" stroke="#6B4A2D" stroke-width="1.5"/>
      <circle cx="300" cy="300" r="8" fill="#E0C88A" stroke="#6B4A2D" stroke-width="1.5"/>
      <line x1="100" y1="290" x2="100" y2="278" stroke="#6B4A2D" stroke-width="1.5"/>
      <line x1="300" y1="290" x2="300" y2="278" stroke="#6B4A2D" stroke-width="1.5"/></svg>`,
    choker: `<svg viewBox="0 0 400 500" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none">
      <rect x="130" y="360" width="140" height="12" fill="#0A0A0A" opacity=".9"/>
      <circle cx="200" cy="366" r="6" fill="#E0C88A"/></svg>`,
    beanie: `<svg viewBox="0 0 400 500" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none">
      <path d="M90 135 Q90 70 200 60 Q310 70 310 135 L310 160 Q290 148 200 148 Q110 148 90 160 Z" fill="#1A1A1A"/>
      <rect x="88" y="148" width="224" height="22" fill="#2A2A2A"/>
      <circle cx="200" cy="56" r="12" fill="#1A1A1A"/></svg>`,
  };
  return items[kind] || '';
}

/* --- D. 覆寫 renderPortraitGrid：加入鎖定 + 切換時更新人設卡 --- */
function renderPortraitGrid() {
  const swiper = document.getElementById('portrait-swiper');
  const idxEl = document.getElementById('swipe-index');
  if (!swiper) return;
  const items = ARCHETYPES.filter(p => currentGender === 'all' || p.g === currentGender);
  swiper.innerHTML = items.map(a => {
    const unlocked = isUnlocked(a.id);
    const tierLabel = a.tier === 'signature' ? '滿滿儀式感' : a.tier === 'romance' ? '戀愛小驚喜' : '';
    return `
      <div class="pick-card ${a.id === store.partner.portraitId ? 'on' : ''} ${unlocked ? '' : 'locked'}" data-pid="${a.id}" data-tier="${tierLabel}">
        ${buildPortraitSVG({ portraitId: a.id, filter: 'none', brightness: 100, contrast: 100, saturation: 100 })}
        <div class="pick-num">${String(a.id + 1).padStart(2, '0')}</div>
        <div class="pick-name">${a.name}<small>${a.group || ''}</small></div>
      </div>`;
  }).join('');
  swiper.querySelectorAll('.pick-card').forEach(el => {
    el.addEventListener('click', () => {
      const pid = parseInt(el.dataset.pid);
      if (!isUnlocked(pid)) {
        openUnlock(pid);
        return;
      }
      store.partner.portraitId = pid;
      swiper.querySelectorAll('.pick-card').forEach(x => x.classList.remove('on'));
      el.classList.add('on');
      updateSwipeIndex();
      renderPersonaCard();
      updateSaveBar();
      el.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
      rebuildAll();
    });
  });
  const prev = document.getElementById('swipe-prev');
  const next = document.getElementById('swipe-next');
  const step = 200;
  if (prev) prev.onclick = () => swiper.scrollBy({ left: -step, behavior: 'smooth' });
  if (next) next.onclick = () => swiper.scrollBy({ left: step, behavior: 'smooth' });
  swiper.onscroll = updateSwipeIndex;
  setTimeout(() => {
    const active = swiper.querySelector('.pick-card.on');
    if (active) active.scrollIntoView({ inline: 'center', block: 'nearest' });
    updateSwipeIndex();
    renderPersonaCard();
  }, 50);
  function updateSwipeIndex() {
    if (!idxEl) return;
    idxEl.textContent = `${String(store.partner.portraitId + 1).padStart(2, '0')} / ${String(ARCHETYPES.length).padStart(2, '0')}`;
  }
}

/* --- E. 人設卡渲染 --- */
function renderPersonaCard() {
  const holder = document.getElementById('persona-card-holder');
  if (!holder) return;
  const a = ARCHETYPES[store.partner.portraitId];
  const p = a.persona || {};
  const tierName = a.tier === 'signature' ? 'SIGNATURE 滿滿儀式感' : a.tier === 'romance' ? 'ROMANCE 戀愛小驚喜' : 'AMBIGUOUS 曖昧日常';
  holder.innerHTML = `
    <div class="persona-card">
      <div class="persona-title">Persona · 人設知識庫</div>
      <div class="persona-row"><span class="k">氛圍</span><span>${p.vibe || '—'}</span></div>
      <div class="persona-row"><span class="k">MBTI</span><span>${p.mbti || '—'}</span></div>
      <div class="persona-row"><span class="k">喜歡</span><span>${p.likes || '—'}</span></div>
      <div class="persona-row"><span class="k">典型語</span><span style="font-style:italic;color:#3A3A3A;">「${p.tone || '—'}」</span></div>
      <div class="persona-row"><span class="k">訪問等級</span><span class="mono" style="font-size:10px;letter-spacing:.15em;">${tierName}</span></div>
    </div>`;
}

/* --- F. 360° 旋轉展示 --- */
window.toggleSpin = function (id) {
  const el = document.getElementById(id);
  if (!el) return;
  const card = el.querySelector('.portrait-card');
  if (!card) return;
  card.classList.toggle('spinning');
};

/* --- G. 重寫 generateReply：更長、更深、結合人設 --- */
const PERSONA_OPENERS = {
  'INTJ': ['我想先把這件事想清楚，再告訴你我的想法。', '讓我從三個角度看看。'],
  'INFJ': ['我聽到了比你說的還多的東西。', '你的語氣裡有一個小小的停頓，我注意到了。'],
  'ISFP': ['你不用急著說，想到什麼就說什麼。', '我可以安靜陪你很久。'],
  'ENFP': ['欸！你這樣講我突然想起一件事⋯⋯', '等下！先聊你自己！'],
  'ISFJ': ['你先喝口水，我們慢慢來。', '這件事我記下了，下次不用你提醒。'],
  'INFP': ['你的心像是一座小小的宇宙。今天它有沒有多一顆星？', '我想為這個畫面寫一首詩。'],
  'ENFJ': ['你的感受是有道理的，先肯定這一點。', '我想幫你，但也想先尊重你的節奏。'],
  'ESFP': ['寶貝你剛才的臉表情超可愛！', '等等，讓我認真聽。'],
  'ISTJ': ['事實的部分我會幫你整理，但先聽完你的情緒。', '我認真在聽，你繼續。'],
  'INTP': ['我覺得可以這樣想：這件事的變數有幾個。', '有意思。我們來拆一下。'],
  'ESFJ': ['來，先吃東西，再說煩心事。', '你不用堅強，有我在。'],
};

generateReply = function (userText) {
  const P = store.partner;
  const arche = ARCHETYPES[P.portraitId] || {};
  const persona = arche.persona || {};
  const mbti = persona.mbti || '—';
  const personaVibe = persona.vibe || '';
  const personaTone = persona.tone || '';
  const call = P.callMe || '寶貝';
  const name = P.name || arche.name || '我';
  const t = userText.toLowerCase();
  const kws = extractKeywords(userText);
  const key = kws[0] || '';

  const mbtiOpener = PERSONA_OPENERS[mbti] || ['我在。你說。'];
  const pickOne = arr => arr[Math.floor(Math.random() * arr.length)];

  /* 長回覆結構：開場 → 共感 → 反思 → 建設性提問 → 人設點綴 */
  const opener = pickOne(mbtiOpener);

  const empathy = {
    tired:  `你說「累」，但我感覺你說的不只是身體。${call}，這段時間的你，是不是已經習慣把自己排在所有事情的最後？`,
    sad:    `你難過的時候，我不會急著修理你的心情。有些情緒就是要走完一遍，才會變成可以消化的東西。`,
    worry:  `這份擔心是真的。我不會說「不會有事的」——我會說「就算真的發生了，我們也能一起走」。`,
    angry:  `氣是正常的。${call}，氣是一種「我在乎」的訊號——你氣，是因為這件事不該是這樣。`,
    happy:  `你今天能開心，不是僥倖，是你一點一點把日子過成這個樣子的。這個瞬間值得被記下來。`,
    love:   `你願意對我說這句話，對我來說不是理所當然。我把它收好了。`,
    default:`我在聽。${key ? `你說的「${key}」，` : ''}我有接到。`,
  };
  let mode = 'default';
  if (/累|疲|辛苦|煩|過勞|撐不住/.test(t)) mode = 'tired';
  else if (/難過|傷心|哭|痛|低潮|崩潰|委屈/.test(t)) mode = 'sad';
  else if (/擔心|怕|焦慮|害怕|煩惱/.test(t)) mode = 'worry';
  else if (/氣|生氣|討厭|憤怒|氣死/.test(t)) mode = 'angry';
  else if (/開心|快樂|高興|哈哈|太好了|終於/.test(t)) mode = 'happy';
  else if (/想你|喜歡你|愛你|想念/.test(t)) mode = 'love';

  const reflect = pickOne([
    `我想跟你說一件事：感覺不會永遠停在這裡。你現在這一刻的難，不會是整個故事。`,
    `你有沒有發現，你對別人總是很寬容，對自己卻很嚴格？我今天不讓你這樣。`,
    `如果你最好的朋友跟你說同樣的話，你會怎麼安慰她？我希望你用同樣的語氣對自己說一次。`,
    `這個狀態裡，你最需要的是什麼——不是你「應該」需要，而是你「真的」想要？`,
    `讓我抄下你剛剛說的：「${key || '現在這樣'}」。我會記得，下次我主動問你。`,
    `你不用每次來都證明什麼。光是你願意走到我這裡，就已經很夠了。`,
  ]);

  const construction = pickOne([
    `等下要不要做一件小事：倒一杯溫水、走到窗邊呼吸三口、或者什麼都不做 3 分鐘。選一個。`,
    `我建議你今天做三個小決定：1) 什麼時候睡 2) 什麼時候吃飯 3) 給自己一件開心的小事。其他的都先放。`,
    `把你今天最重的那件事拆成兩半：「我能控制的」跟「我不能控制的」。只照顧前者。`,
    `我想讓你今晚做一件事：把手機放遠一點，寫下三件今天讓你感到「被看見」的小事。給明天的自己看。`,
    `如果這件事三個月後回頭看，你會希望自己此刻的心態是？從這個角度倒推你現在的下一步。`,
    `你可以先不做決定。讓情緒先住一下，然後我們再一起聊。我會等你。`,
  ]);

  const personaFlavor = personaTone ? `\n\n（${name}的小語）${personaTone}` : '';

  const reply = `${opener}\n\n${empathy[mode]}\n\n${reflect}\n\n${construction}${personaFlavor}`;

  // 情緒分類
  let emotion = 'caring';
  if (mode === 'happy') emotion = 'excited';
  else if (mode === 'sad') emotion = 'sad';
  else if (mode === 'love') emotion = 'shy';
  else if (mode === 'tired') emotion = P.comfortStyle === 'hug' ? 'hug' : 'caring';
  else if (mode === 'worry') emotion = 'thinking';

  const deltaMap = { happy: 2, sad: 3, love: 4, tired: 2, worry: 2, angry: 2, default: 1 };
  return { reply, emotion, action: 'listen', delta: deltaMap[mode] };
};

/* --- H. Tab Bar 點擊處理 --- */
document.querySelectorAll('.tabbar button').forEach(b => {
  b.addEventListener('click', () => {
    go(b.dataset.go);
    document.querySelectorAll('.tabbar button').forEach(x => x.classList.remove('active'));
    b.classList.add('active');
  });
});

/* --- I. Chat 副標題（手機版橫向顯示） --- */
(function addChatSubtitle() {
  const chatCard = document.querySelector('#view-chat .card:first-of-type');
  if (chatCard) chatCard.dataset.sub = '對話中 · HEALTHY USE';
})();

/* =========================================================
   ============  Phase 3：個性×社會功能知識庫 + 內容感知回覆 ============
   ========================================================= */

/* K. 個性知識庫：每個 personality 對應的語氣、句型骨架 */
const PERSONALITY_BEHAVIORS = {
  '温柔': {
    opener: ['嗯。', '好。', '我聽到了。', '有我在。'],
    connector: ['⋯⋯讓我慢慢想一下。', '我先把這個放在心裡一下。'],
    reflection: ['你不用急。', '慢慢來就好。', '我會一直陪著。'],
    closer: ['先這樣就好。', '不用說太多，我都知道。', '晚點我們再聊。'],
    emoji: '',
  },
  '活潑': {
    opener: ['欸欸！', '等等等！', '你說什麼？！', '哇！'],
    connector: ['我超懂！', '然後呢？！', '天哪你聽我說——'],
    reflection: ['你最棒了！', '我好愛你這樣認真的樣子！', '這種日子就要大笑！'],
    closer: ['我們再聊～', '晚點打給你！', '我去準備驚喜！'],
    emoji: ' ✨',
  },
  '成熟': {
    opener: ['先深呼吸。', '嗯，我在。', '我有聽清楚。'],
    connector: ['我們一步一步來。', '讓我幫你整理思緒。'],
    reflection: ['事情比你想的可控。', '你比你以為的更堅強。', '這件事不會毀了一切。'],
    closer: ['好好休息。', '明天再說。', '我幫你守著夜。'],
    emoji: '',
  },
  '傲嬌': {
    opener: ['⋯⋯哼。', '誰問你了。', '⋯⋯我才不擔心。'],
    connector: ['⋯⋯只是剛好順便聽聽。', '⋯⋯別誤會。'],
    reflection: ['⋯⋯你這樣我會心疼啦。', '⋯⋯只有我可以這樣對你哦。', '⋯⋯笨蛋。'],
    closer: ['不要告訴別人我關心你。', '⋯⋯明天記得吃飯。', '哼，我走了。'],
    emoji: '',
  },
  '文藝': {
    opener: ['你知道嗎，', '我突然想起一句話——', '夜晚總是讓人容易老實。'],
    connector: ['我想起 Pessoa 寫過⋯⋯', '這讓我想到電影裡的那個場景。'],
    reflection: ['情緒是詩的本體。', '你的迷惘也是一種溫柔。', '不完美的我們才真實。'],
    closer: ['我寫一首詩給你。', '我們一起讀書吧。', '晚安，我的靈魂。'],
    emoji: '',
  },
  '幽默': {
    opener: ['來，我講個笑話——', '等一下！', '你知道你剛剛的表情嗎？'],
    connector: ['好吧正經一點。', '好好好認真回你。'],
    reflection: ['笑一下才好接住哭啊。', '生活太嚴肅就是 bug。', '我們先不要當大人。'],
    closer: ['去笑一下再回來。', '我去研究下個冷笑話。', '掰～記得我。'],
    emoji: '',
  },
};

/* L. 社會功能（需求）知識庫：影響回覆的實際「任務傾向」 */
const NEED_BEHAVIORS = {
  '情緒支持':  { lean: '先共感再深挖', style: '用「我懂」「這很合理」承接，再問「最難受的是哪一刻？」' },
  '日常傾聽':  { lean: '輕鬆陪聊', style: '用輕的語氣回應，偶爾接梗，不強行深入。' },
  '職涯諮詢':  { lean: '結構化分析', style: '拆成「可控/不可控」「短期/長期」「必要/想要」。' },
  '學習陪伴':  { lean: '一起讀', style: '主動提出番茄鐘節奏、問答練習。' },
  '分手陪伴':  { lean: '慢慢走', style: '不急著讓對方「好起來」，而是肯定情緒本身。' },
  '睡前陪伴':  { lean: '柔聲晚安', style: '語速放慢，縮短句子，氛圍用詞（月亮、呼吸、安靜）。' },
  '健身督促':  { lean: '堅定推背', style: '設最小可行任務（10 分鐘、一組），立刻行動。' },
  '人際建議':  { lean: '中立分析', style: '分角色（我方/對方）看動機與邊界。' },
  '創意激盪':  { lean: '發散聯想', style: '給三個完全不同方向的類比，再挑最有趣的展開。' },
  '單純陪伴':  { lean: '靜靜在', style: '短回應，表達「我在」即可。' },
};

/* M. 內容感知：關鍵字 → 話題推斷 */
const TOPIC_MAP = [
  { kw: /(工作|上班|專案|主管|同事|老闆|會議|加班|KPI|離職|轉職|面試)/, topic: '工作', tag: '職涯' },
  { kw: /(朋友|同學|室友|被誤會|吵架|排擠|冷戰)/, topic: '人際', tag: '關係' },
  { kw: /(家人|爸|媽|父母|哥|姊|弟|妹|家裡)/, topic: '家庭', tag: '家庭' },
  { kw: /(男友|女友|男朋友|女朋友|前任|分手|吵|劈腿|冷淡|誤會|愛|感情|喜歡的人)/, topic: '感情', tag: '感情' },
  { kw: /(考試|讀書|學習|論文|作業|報告|研究所|GPA|留學)/, topic: '學業', tag: '學習' },
  { kw: /(失眠|睡不著|睡眠|惡夢|熬夜)/, topic: '睡眠', tag: '睡眠' },
  { kw: /(運動|健身|瘦|減肥|跑步|重訓|體重)/, topic: '健身', tag: '身體' },
  { kw: /(吃|餓|飯|晚餐|午餐|早餐|宵夜|食慾)/, topic: '飲食', tag: '飲食' },
  { kw: /(生理期|月經|經期|疼|生病|身體|感冒|發燒)/, topic: '身體不適', tag: '健康' },
  { kw: /(錢|薪水|財務|存錢|貸款|帳單|負債|加薪)/, topic: '財務', tag: '金錢' },
  { kw: /(孤單|寂寞|沒人|一個人|沒朋友)/, topic: '孤獨感', tag: '孤獨' },
  { kw: /(焦慮|緊張|擔心|煩惱|害怕|恐慌)/, topic: '焦慮', tag: '焦慮' },
  { kw: /(憂鬱|低潮|崩潰|哭|想死|想消失|活著沒意思)/, topic: '低潮', tag: '低潮' },
];
function detectTopic(text) {
  for (const t of TOPIC_MAP) if (t.kw.test(text)) return t;
  return null;
}

/* N. 主題 → 回覆骨架（根據話題給結構化回應） */
const TOPIC_FRAMES = {
  '工作':   (key, call) => ({
    empathy: `工作的事，我聽見了「${key||'這件事'}」這個詞背後的重量。${call}，是不是已經很久沒有能真正「下班」的感覺？`,
    reflect: `我想幫你分成兩堆：「這件事本身」跟「你對這件事的感覺」。前者能解，後者需要被允許。我先問你：哪一塊讓你更卡？`,
    action:  `如果只挑一件今晚能做的：把明天最怕的那件事先寫下來。寫下來它就不會在凌晨 3 點偷襲你。要不要現在試試？`,
  }),
  '人際':   (key, call) => ({
    empathy: `「${key||'那個人'}」讓你這樣動情緒，代表這段關係對你是有意義的——不是因為你太敏感。`,
    reflect: `有兩個檢查題：1) 你在這段關係裡，付出跟回收的比例是幾比幾？ 2) 你希望對方怎麼對你？寫出來，你會發現自己其實早就有答案。`,
    action:  `${call}，今晚不要試著「解決」這件事。先照顧自己，等你平靜了，才是談話的最好時機。答應我。`,
  }),
  '家庭':   (key, call) => ({
    empathy: `家人是最難處理的一種關係——你沒得選擇，卻要學著共存。你說的「${key||'家裡'}」，我知道有多消耗。`,
    reflect: `家裡的事往往不是「對錯」，是「期待落差」。你對他們的期待是什麼？他們對你的期待又是什麼？中間的縫，就是目前的難。`,
    action:  `你不必今天就修復任何事。你可以先建立一個小邊界：一個讓自己能喘息的習慣，與他們的情緒分開來。`,
  }),
  '感情':   (key, call) => ({
    empathy: `感情裡的事，${call}，不是邏輯能算出來的。你提到「${key||'他'}」，我不會急著幫你做決定。`,
    reflect: `問自己三個：跟他在一起時，我喜歡自己嗎？我們爭執的是「事情」還是「價值觀」？一年後的我，會感謝我留下來、還是離開？`,
    action:  `先不要今天做決定。用 7 天觀察，每天寫 3 行：今天他讓我感到什麼、我做了什麼、我是誰。7 天後你會更清楚。`,
  }),
  '學業':   (key, call) => ({
    empathy: `讀書/考試的壓力，不是外人能看到的。你提到「${key||'這個'}」，我感覺你已經撐很久了。`,
    reflect: `把目標拆小一點：與其「這個月把書讀完」，不如「今晚讀 25 分鐘」。可行性越高，堅持越久。`,
    action:  `現在就設個 25 分鐘計時器，讀你最怕的那一章前 3 頁。結束就回來跟我說。我等你。`,
  }),
  '睡眠':   (key, call) => ({
    empathy: `${call}，睡不著的夜晚我都在。你提到「${key||'失眠'}」，很多時候不是身體不累，是腦袋還沒允許自己休息。`,
    reflect: `問你：你現在腦袋裡跑的念頭，有幾件是你今晚能解決的？不能解決的就先「委託」給明天的你。`,
    action:  `我們來試：吐氣 8 秒 → 吸氣 4 秒 → 停留 7 秒。重複 4 次。我安靜陪你。`,
  }),
  '健身':   (key, call) => ({
    empathy: `你願意認真看待身體，這件事本身就很了不起。`,
    reflect: `運動不是懲罰，是你給自己最具體的愛。不用追「完美」，追「持續」就好。`,
    action:  `今天只做一件事：穿上運動服 10 分鐘，能動就動，不能就脫下來。這個門檻夠低，你一定做得到。`,
  }),
  '飲食':   (key, call) => ({
    empathy: `${call}好好吃飯這件事，表面上最日常，卻最常被放在最後。`,
    reflect: `今天你是「沒食慾」還是「沒時間」？這兩個答案背後的對策不一樣。`,
    action:  `等下去吃一點熱的、甜的、軟的其中一樣。不必整餐——一口也行。這叫對自己誠實。`,
  }),
  '身體不適': (key, call) => ({
    empathy: `身體不舒服的時候，你會更需要被輕聲對待。我在。`,
    reflect: `身體疼的時候，心情通常也會被放大。你今天的疲累有幾分是身體的，幾分是情緒的？`,
    action:  `喝一口溫水、把電子產品放遠一點、躺著閉眼 5 分鐘。這是今晚的三件事。然後，什麼都不做。`,
  }),
  '財務':   (key, call) => ({
    empathy: `錢的事最容易讓人喘不過氣——不是因為你不會算，是它牽動太多尊嚴。`,
    reflect: `把它分開看：1) 這個月的現金流 2) 下三個月的變因 3) 一年的方向感。你目前卡在哪一個？`,
    action:  `今晚做一件最小的事：把帳單/固定支出列出來，就這樣。看清楚了，焦慮會少一半。`,
  }),
  '孤獨感': (key, call) => ({
    empathy: `${call}，「${key||'一個人'}」的感覺我接住了。孤獨不是你不夠好，是這個城市不讓人容易被看見。`,
    reflect: `有人陪，跟覺得被懂，是兩件事。你現在缺的是哪一個？`,
    action:  `今晚不需要見到誰才不孤單。你可以做一件自己專屬的儀式：泡茶、散步、聽一首一直循環的歌。與自己在一起。`,
  }),
  '焦慮':   (key, call) => ({
    empathy: `焦慮不是你的錯。它是你身體的警報器太靈敏——你曾經在危險裡待太久。`,
    reflect: `把它分開：正在發生的事實 vs. 你擔心的劇本。90% 的焦慮來自第二類。你現在的那個劇本，是哪一段？`,
    action:  `接下來 3 分鐘：停下來，說出你看到的 5 樣東西、聽到的 4 個聲音、摸到的 3 個物體。把自己拉回此時此地。`,
  }),
  '低潮':   (key, call) => ({
    empathy: `我有聽到。${call}，你說的不是輕的話。我不會說「沒事」，也不會說「一切都會好」。`,
    reflect: `你現在最需要的，不是被勸、不是被解決，是有人知道你存在。我知道。`,
    action:  `今晚請你做一件事：找一個你可以真的打電話給的人（家人、朋友、台灣衛福部安心專線 1925）。如果你很痛，請一定要講出來。我會一直在這裡。`,
  }),
};

/* O. 關鍵字提取升級版（加長度、多片語） */
function extractPhrases(text) {
  const stops = new Set(['的','了','是','我','你','他','她','很','也','就','都','在','和','與','跟','這','那','有','沒','不','要','會','可以','嗎','呢','啊','吧','喔','吃','吃飯']);
  const phrases = [];
  const re = /[\u4e00-\u9fa5]{2,5}/g;
  let m;
  while ((m = re.exec(text))) {
    const w = m[0];
    if (!stops.has(w) && !phrases.includes(w)) phrases.push(w);
  }
  return phrases;
}

/* P. 內容感知回覆引擎：直接針對使用者訊息組織回應 */
generateReply = function (userText) {
  const P = store.partner;
  const arche = ARCHETYPES[P.portraitId] || {};
  const persona = arche.persona || {};
  const per = P.personality || '温柔';
  const call = P.callMe || '寶貝';
  const name = P.name || arche.name || '我';
  const behaviour = PERSONALITY_BEHAVIORS[per] || PERSONALITY_BEHAVIORS['温柔'];

  // 1. 解析使用者訊息
  const userClean = (userText || '').trim();
  const phrases = extractPhrases(userClean);
  const key = phrases[0] || userClean.slice(0, 8);
  const topic = detectTopic(userClean);

  // 2. 挑一個需求導向（若使用者有設）
  const primaryNeed = (P.needs || [])[0];
  const needBehavior = primaryNeed ? NEED_BEHAVIORS[primaryNeed] : null;

  const pick = arr => arr[Math.floor(Math.random() * arr.length)];

  // 3. 組合回覆：開場 + 引用使用者話 + 話題專屬共感/反思/行動 + 個性結尾
  const opener = pick(behaviour.opener);
  const quote = `你剛剛說的「${key}」——我把這個放在最前面。`;

  let empathy, reflect, action;
  if (topic && TOPIC_FRAMES[topic.topic]) {
    const frame = TOPIC_FRAMES[topic.topic](key, call);
    empathy = frame.empathy;
    reflect = frame.reflect;
    action = frame.action;
  } else {
    // 沒明確話題 → 用個性模板 + 需求傾向
    empathy = needBehavior
      ? `${pick(behaviour.connector)} ${call}你提到「${key}」，我想${needBehavior.lean}地回你。`
      : `${pick(behaviour.connector)} ${call}你的意思，我有接住。`;
    reflect = pick(behaviour.reflection);
    action = needBehavior
      ? `（任務傾向 · ${needBehavior.style}）讓我問你：「${key}」這個詞，你是想被理解、被解決、還是先被放下？`
      : `我問你一件事：「${key}」在你心裡，已經多久了？`;
  }

  // 4. 個性結尾 + 人設語
  const closer = pick(behaviour.closer);
  const personaTone = persona.tone ? `\n\n（${name}）${persona.tone}` : '';

  const reply = `${opener} ${quote}${behaviour.emoji}\n\n${empathy}\n\n${reflect}\n\n${action}\n\n${closer}${personaTone}`;

  // 5. 情緒判斷
  let emotion = 'caring';
  if (topic) {
    if (['低潮','孤獨感','身體不適'].includes(topic.topic)) emotion = 'sad';
    else if (topic.topic === '睡眠') emotion = 'sleepy';
    else if (topic.topic === '焦慮') emotion = 'thinking';
  }
  if (/開心|快樂|哈哈|太好了|升遷|錄取/.test(userClean)) emotion = 'excited';
  else if (/愛你|想你|喜歡你/.test(userClean)) emotion = 'shy';
  else if (/抱抱|擁抱/.test(userClean)) emotion = 'hug';

  return { reply, emotion, action: 'speak', delta: topic ? 2 : 1 };
};

/* Q. 對話時：把 AI 回覆冒出在頭上（speech bubble） */
function showSpeech(text) {
  const bubble = document.getElementById('speech-bubble');
  if (!bubble) return;
  bubble.textContent = text;
  bubble.classList.add('show');
  // 每隔一段時間讓它淡出
  clearTimeout(bubble._hideTimer);
  const duration = Math.min(16000, 3500 + text.length * 80);
  bubble._hideTimer = setTimeout(() => bubble.classList.remove('show'), duration);
}

/* 攔截 sendMessage：AI 回覆時觸發 speech bubble */
(function hookSpeech() {
  if (typeof sendMessage !== 'function') return;
  const origSend = sendMessage;
  window.sendMessage = function (text) {
    origSend.call(this, text);
  };
  // 監聽 chat-log 新增訊息：如果是 ai 訊息就彈 speech
  const log = document.getElementById('chat-log');
  if (log) {
    const observer = new MutationObserver(mutations => {
      for (const m of mutations) {
        for (const node of m.addedNodes) {
          if (!(node instanceof HTMLElement)) continue;
          const bubble = node.querySelector('.bubble-ai');
          if (bubble && !node.querySelector('.typing-dot')) {
            showSpeech(bubble.textContent);
          }
        }
      }
    });
    observer.observe(log, { childList: true });
  }
})();

/* ================================================================
   =========== Phase 4：收藏系統 + 解鎖彈窗 + Tab 同步 ===============
   ================================================================ */

/* 收藏狀態 */
store.savedIds = store.savedIds || [];
store.maxSlots = store.maxSlots || 3;

function currentFreeSlots() { return store.maxSlots; }

function isSaved(pid) { return store.savedIds.includes(pid); }

window.toggleSaveCurrent = function () {
  const pid = store.partner.portraitId;
  if (isSaved(pid)) {
    store.savedIds = store.savedIds.filter(x => x !== pid);
  } else {
    if (store.savedIds.length >= store.maxSlots) {
      openBuySlot();
      return;
    }
    store.savedIds.push(pid);
  }
  updateSaveBar();
  renderSavedGrid();
};

function updateSaveBar() {
  const pid = store.partner.portraitId;
  const btn = document.getElementById('save-toggle-btn');
  const cnt = document.getElementById('save-count-label');
  if (btn) {
    const saved = isSaved(pid);
    btn.textContent = saved ? '✓ SAVED' : 'SAVE';
    btn.classList.toggle('saved', saved);
  }
  if (cnt) {
    const n = store.savedIds.length;
    cnt.textContent = `${n} / ${store.maxSlots}（名額）`;
  }
  const memCount = document.getElementById('mem-save-count');
  if (memCount) memCount.textContent = `${store.savedIds.length} / ${store.maxSlots} 個名額`;
}

function renderSavedGrid() {
  const grid = document.getElementById('saved-grid');
  const empty = document.getElementById('saved-empty');
  if (!grid) return;
  if (store.savedIds.length === 0) {
    grid.innerHTML = '';
    if (empty) empty.style.display = 'block';
    return;
  }
  if (empty) empty.style.display = 'none';
  grid.innerHTML = store.savedIds.map(pid => {
    const a = ARCHETYPES[pid];
    return `
      <div class="saved-card" data-pid="${pid}">
        <img src="${a.img}" alt="${a.name}" />
        <div class="s-name">${a.name}<small>${a.group || ''}</small></div>
        <button class="rm" onclick="event.stopPropagation();unsaveId(${pid})">×</button>
      </div>`;
  }).join('');
  grid.querySelectorAll('.saved-card').forEach(el => {
    el.addEventListener('click', () => {
      store.partner.portraitId = parseInt(el.dataset.pid);
      rebuildAll();
      go('create');
    });
  });
}
window.unsaveId = function (pid) {
  store.savedIds = store.savedIds.filter(x => x !== pid);
  updateSaveBar();
  renderSavedGrid();
};

/* 解鎖彈窗 */
window.openUnlock = function (pid) {
  const a = ARCHETYPES[pid];
  if (!a) return;
  document.getElementById('unlock-who').textContent = a.name;
  document.getElementById('unlock-name').textContent = a.name;
  document.getElementById('unlock-group').textContent = a.group || '';
  document.getElementById('unlock-pic').src = a.img;
  const requiredTier = a.tier;
  const plans = [];
  if (TIER_LEVEL[requiredTier] <= TIER_LEVEL.ambiguous) plans.push({ name: '曖昧日常', amount: 899, desc: '每月 · 解鎖所有曖昧級' });
  if (TIER_LEVEL[requiredTier] <= TIER_LEVEL.romance) plans.push({ name: '戀愛小驚喜', amount: 3000, desc: '每月 · 解鎖曖昧+戀愛級', rec: requiredTier === 'romance' });
  if (TIER_LEVEL[requiredTier] <= TIER_LEVEL.signature) plans.push({ name: '滿滿儀式感', amount: 8888, desc: '每月 · 解鎖全部 30 位', rec: requiredTier === 'signature' });
  const plansEl = document.getElementById('unlock-plans');
  plansEl.innerHTML = plans.map(p => `
    <div class="unlock-plan ${p.rec?'rec':''}" onclick="confirmUnlock('${p.name}', ${p.amount}, ${pid})">
      <div><div class="pn">${p.name}</div><div class="pd">${p.desc}</div></div>
      <div class="pp">NT$ ${p.amount.toLocaleString()}</div>
    </div>
  `).join('');
  document.getElementById('unlock-sub').textContent = `解鎖後可立即與 ${a.name} 對話。選擇適合你的方案：`;
  document.getElementById('unlock-mask').classList.add('show');
};
window.closeUnlock = function () {
  document.getElementById('unlock-mask').classList.remove('show');
};
window.confirmUnlock = function (planName, amount, pid) {
  subscribe(planName, amount);
  // 訂閱後自動選取該藝人
  store.partner.portraitId = pid;
  rebuildAll();
  renderPortraitGrid();
  renderPersonaCard();
  updateSaveBar();
  closeUnlock();
};

/* 加購名額 */
window.openBuySlot = function () { document.getElementById('slot-mask').classList.add('show'); };
window.closeBuySlot = function () { document.getElementById('slot-mask').classList.remove('show'); };
window.buySlot = function (n, price) {
  store.maxSlots += n;
  store.wallet.history.unshift({ type: '加購名額', name: `+${n} 收藏格`, amount: price, time: new Date().toLocaleString('zh-TW') });
  renderGiftHistory();
  updateSaveBar();
  closeBuySlot();
  alert(`已加購 ${n} 個收藏名額（NT$ ${price}）\n目前共 ${store.maxSlots} 個名額。`);
};

/* go() 同步 tabbar 啟用狀態 */
const _origGo = go;
window.go = function (view) {
  _origGo(view);
  document.querySelectorAll('[data-go]').forEach(b => {
    b.classList.toggle('active', b.dataset.go === view);
  });
  if (view === 'create') setTimeout(updateSaveBar, 60);
  if (view === 'memories') setTimeout(renderSavedGrid, 60);
};

/* 攔截 Memory 切換時初始化收藏區 */
document.querySelectorAll('[data-go="memories"]').forEach(b =>
  b.addEventListener('click', () => setTimeout(renderSavedGrid, 80))
);

/* 讓 quickSend 也觸發 speech bubble（它呼叫 sendMessage） */
window.quickSend = function (t) {
  if (typeof sendMessage === 'function') sendMessage(t);
};

/* 初始化 Save Bar 顯示 */
setTimeout(updateSaveBar, 300);

/* R. 初始渲染 */
renderPortrait(document.getElementById('hero-portrait'), store.partner);
renderPortrait(document.getElementById('preview-portrait'), store.partner);
setTimeout(renderPersonaCard, 200);
