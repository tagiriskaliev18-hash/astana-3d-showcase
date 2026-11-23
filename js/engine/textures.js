/**
 * Procedural High-Res Cyberpunk Billboard Canvas Textures & Neon Studio PMREM Environment Map
 * Zero external image dependencies — crisp typography, Kazakh/Cyrillic + Katakana + Cyber UI graphics
 */
import * as THREE from 'three';

const BILLBOARD_DESIGNS = [
  {
    id: 'qazcorp',
    orientation: 'vertical',
    bg1: '#0a0702',
    bg2: '#1f1600',
    primary: '#FCEE0A',
    accent: '#00F0FF',
    brand: 'QAZ-CORP',
    sub: 'NEURAL SYNTH // 2077',
    kz: 'ҚАЗ-КОРП · БОЛАШАҚ',
    jp: 'カズ・コープ 2077',
    badge: 'ARCOLOGY SEC-01',
    emblem: 'hex'
  },
  {
    id: 'baiterek_net',
    orientation: 'vertical',
    bg1: '#03111c',
    bg2: '#071f33',
    primary: '#00F0FF',
    accent: '#FCEE0A',
    brand: 'BAITEREK',
    sub: 'NET-RUNNER CORE',
    kz: 'БӘЙТЕРЕК // ЖЕЛІ',
    jp: 'バイテレク・ネット',
    badge: 'NODE 97M LIVE',
    emblem: 'orb'
  },
  {
    id: 'khantech',
    orientation: 'vertical',
    bg1: '#1a0211',
    bg2: '#330623',
    primary: '#FF005C',
    accent: '#00F0FF',
    brand: 'KHAN-TECH',
    sub: 'CYBERNETICS & BIO',
    kz: 'ХАН-ТЕХ // КИБЕР',
    jp: 'ハン・テック',
    badge: 'ETFE BIO-DOME',
    emblem: 'tent'
  },
  {
    id: 'esil_syndicate',
    orientation: 'vertical',
    bg1: '#190207',
    bg2: '#2e0510',
    primary: '#FF003C',
    accent: '#FCEE0A',
    brand: 'ESIL',
    sub: 'SYNDICATE // 01',
    kz: 'ЕСІЛ СИНДИКАТЫ',
    jp: 'エシル・シンジケート',
    badge: 'NIGHT SECTOR',
    emblem: 'wave'
  },
  {
    id: 'steppe_av',
    orientation: 'horizontal',
    bg1: '#060c18',
    bg2: '#13192b',
    primary: '#FF9B00',
    accent: '#00F0FF',
    brand: 'STEPPE DYNAMICS',
    sub: 'AV-9 AEROSPACE SPINNER // ZERO-G TURBINE',
    kz: 'ДАЛА ДИНАМИКС · АЭРО-ТРАНСПОРТ',
    jp: 'ステップ・ダイナミクス',
    badge: 'FLIGHT PERMIT 2077',
    emblem: 'wing'
  },
  {
    id: 'astana_2077',
    orientation: 'horizontal',
    bg1: '#0c0519',
    bg2: '#22093a',
    primary: '#FCEE0A',
    accent: '#FF005C',
    brand: 'ASTANA 2077',
    sub: 'WELCOME TO NUR-CITY // NIGHT SECTOR',
    kz: 'АСТАНА 2077 · НҰР-СИТИ',
    jp: 'アスタナ 2077 ナイトシティ',
    badge: 'NURZHOL BLVD',
    emblem: 'orb'
  },
  {
    id: 'samruk_bio',
    orientation: 'vertical',
    bg1: '#0c031c',
    bg2: '#210742',
    primary: '#D946EF',
    accent: '#00F0FF',
    brand: 'SAMRUK BIO',
    sub: 'KINETIC OPTICS MK-IV',
    kz: 'САМРҰҚ // ОПТИКА',
    jp: 'サムルク・バイオ',
    badge: 'OPTIC UPGRADE',
    emblem: 'iris'
  },
  {
    id: 'expo_grid',
    orientation: 'horizontal',
    bg1: '#021614',
    bg2: '#052b2a',
    primary: '#00FFB3',
    accent: '#00F0FF',
    brand: 'EXPO // QUANTUM',
    sub: 'NUR ALEM FUSION GRID · 99.98% OUTPUT',
    kz: 'НҰР ӘЛЕМ · ЭНЕРГИЯ 2077',
    jp: 'エキスポ・クォンタム',
    badge: 'SPHERE CORE',
    emblem: 'hex'
  },
  {
    id: 'noir_kumys',
    orientation: 'vertical',
    bg1: '#180c02',
    bg2: '#2c1205',
    primary: '#00F0FF',
    accent: '#FF005C',
    brand: 'NEON QYMIZ',
    sub: 'SYNTH-BOOST 400ML',
    kz: 'ҚЫМЫЗ 2077 · ЭНЕРГИЯ',
    jp: 'ネオン・クミス',
    badge: '100% SYNTH-STEPPE',
    emblem: 'wave'
  }
];

function drawEmblem(ctx, type, cx, cy, r, primary, accent) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.strokeStyle = primary;
  ctx.fillStyle = accent;
  ctx.lineWidth = 4;

  if (type === 'orb') {
    // Stylized Baiterek orb + cradle ribs
    ctx.beginPath();
    ctx.arc(0, -r * 0.25, r * 0.42, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = primary;
    ctx.globalAlpha = 0.22;
    ctx.fill();
    ctx.globalAlpha = 1;
    for (let i = -3; i <= 3; i++) {
      ctx.beginPath();
      ctx.moveTo(i * r * 0.14, r * 0.85);
      ctx.quadraticCurveTo(i * r * 0.06, r * 0.15, i * r * 0.22, -r * 0.2);
      ctx.stroke();
    }
    ctx.strokeStyle = accent;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.ellipse(0, -r * 0.25, r * 0.78, r * 0.22, -0.25, 0, Math.PI * 2);
    ctx.stroke();
  } else if (type === 'tent') {
    // Stylized Khan Shatyr tilted spire
    ctx.beginPath();
    ctx.moveTo(-r * 0.85, r * 0.65);
    ctx.quadraticCurveTo(-r * 0.1, r * 0.1, r * 0.22, -r * 0.85);
    ctx.quadraticCurveTo(r * 0.35, r * 0.15, r * 0.85, r * 0.65);
    ctx.closePath();
    ctx.stroke();
    for (let i = -3; i <= 3; i++) {
      ctx.beginPath();
      ctx.moveTo(i * r * 0.24, r * 0.65);
      ctx.lineTo(r * 0.22, -r * 0.85);
      ctx.strokeStyle = accent;
      ctx.lineWidth = 2;
      ctx.stroke();
    }
  } else if (type === 'hex') {
    for (let ring = 0; ring < 2; ring++) {
      const rr = ring === 0 ? r * 0.78 : r * 0.46;
      ctx.beginPath();
      for (let i = 0; i < 6; i++) {
        const a = (i * Math.PI) / 3 - Math.PI / 6;
        const x = Math.cos(a) * rr;
        const y = Math.sin(a) * rr;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.strokeStyle = ring === 0 ? primary : accent;
      ctx.stroke();
    }
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.16, 0, Math.PI * 2);
    ctx.fill();
  } else if (type === 'iris') {
    ctx.beginPath();
    ctx.ellipse(0, 0, r * 0.85, r * 0.46, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.34, 0, Math.PI * 2);
    ctx.strokeStyle = accent;
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.14, 0, Math.PI * 2);
    ctx.fill();
  } else if (type === 'wing') {
    for (let i = 0; i < 4; i++) {
      ctx.beginPath();
      ctx.moveTo(-r * 0.85, -r * 0.3 + i * r * 0.22);
      ctx.lineTo(r * 0.7 - i * r * 0.18, -r * 0.3 + i * r * 0.22);
      ctx.lineTo(r * 0.9 - i * r * 0.18, -r * 0.16 + i * r * 0.22);
      ctx.strokeStyle = i % 2 === 0 ? primary : accent;
      ctx.lineWidth = 5;
      ctx.stroke();
    }
  } else {
    // Stylized wave / bars
    for (let i = -3; i <= 3; i++) {
      const h = (1 - Math.abs(i) / 4.2) * r * 0.8;
      ctx.fillStyle = i % 2 === 0 ? primary : accent;
      ctx.fillRect(i * r * 0.22 - r * 0.06, -h * 0.5, r * 0.12, h);
    }
  }
  ctx.restore();
}

function createBillboardCanvasTexture(cfg) {
  const isVert = cfg.orientation === 'vertical';
  const w = isVert ? 512 : 1024;
  const h = isVert ? 1024 : 512;

  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');

  // Deep cyber gradient background
  const grad = ctx.createLinearGradient(0, 0, w, h);
  grad.addColorStop(0, cfg.bg1);
  grad.addColorStop(1, cfg.bg2);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);

  // Tech grid lines
  ctx.strokeStyle = cfg.primary;
  ctx.globalAlpha = 0.1;
  ctx.lineWidth = 1;
  for (let x = 0; x < w; x += 32) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, h);
    ctx.stroke();
  }
  for (let y = 0; y < h; y += 32) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(w, y);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;

  // Chamfered neon border frame
  const pad = 18;
  const cut = 34;
  ctx.strokeStyle = cfg.primary;
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.moveTo(pad + cut, pad);
  ctx.lineTo(w - pad, pad);
  ctx.lineTo(w - pad, h - pad - cut);
  ctx.lineTo(w - pad - cut, h - pad);
  ctx.lineTo(pad, h - pad);
  ctx.lineTo(pad, pad + cut);
  ctx.closePath();
  ctx.stroke();

  // Accent corner bars
  ctx.fillStyle = cfg.accent;
  ctx.fillRect(pad + 12, pad + 12, isVert ? 120 : 180, 10);
  ctx.fillRect(w - pad - (isVert ? 140 : 210), h - pad - 22, isVert ? 128 : 198, 10);

  // Hazard diagonal stripe strip
  ctx.save();
  ctx.fillStyle = cfg.primary;
  ctx.globalAlpha = 0.85;
  const stripeY = isVert ? h - 108 : h - 82;
  ctx.fillRect(pad + 14, stripeY, w - (pad + 14) * 2, 26);
  ctx.fillStyle = '#05070d';
  for (let sx = pad; sx < w; sx += 28) {
    ctx.beginPath();
    ctx.moveTo(sx, stripeY);
    ctx.lineTo(sx + 12, stripeY);
    ctx.lineTo(sx - 4, stripeY + 26);
    ctx.lineTo(sx - 16, stripeY + 26);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();

  if (isVert) {
    // Top badge
    ctx.fillStyle = cfg.accent;
    ctx.font = '700 22px "JetBrains Mono", monospace';
    ctx.fillText(cfg.badge, 40, 74);

    // Katakana line
    ctx.fillStyle = cfg.primary;
    ctx.globalAlpha = 0.85;
    ctx.font = '700 28px sans-serif';
    ctx.fillText(cfg.jp, 40, 122);
    ctx.globalAlpha = 1;

    // Central glowing emblem
    drawEmblem(ctx, cfg.emblem, w / 2, 310, 130, cfg.primary, cfg.accent);

    // Bold Brand Title
    ctx.save();
    ctx.shadowColor = cfg.primary;
    ctx.shadowBlur = 20;
    ctx.fillStyle = cfg.primary;
    ctx.font = '900 72px "Orbitron", "Arial Black", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(cfg.brand, w / 2, 545, w - 68);
    ctx.restore();

    // Subtitle pill
    ctx.fillStyle = cfg.accent;
    ctx.fillRect(42, 580, w - 84, 52);
    ctx.fillStyle = '#05070d';
    ctx.font = '800 26px "Rajdhani", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(cfg.sub, w / 2, 615, w - 100);

    // Kazakh Cyrillic display
    ctx.fillStyle = '#ffffff';
    ctx.font = '700 30px "Rajdhani", "Segoe UI", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(cfg.kz, w / 2, 700, w - 76);

    // Telemetry / barcode footer
    ctx.fillStyle = cfg.primary;
    ctx.globalAlpha = 0.7;
    for (let bx = 46; bx < w - 46; bx += 11) {
      const bw = ((bx * 17) % 7) + 2;
      ctx.fillRect(bx, 760, bw, 74);
    }
    ctx.globalAlpha = 1;
    ctx.fillStyle = cfg.accent;
    ctx.font = '600 20px "JetBrains Mono", monospace';
    ctx.textAlign = 'left';
    ctx.fillText('ASTANA // 51.1282N 71.4304E', 44, 878);
  } else {
    // Horizontal mega-billboard layout
    drawEmblem(ctx, cfg.emblem, 175, h / 2 - 20, 118, cfg.primary, cfg.accent);

    ctx.textAlign = 'left';
    ctx.fillStyle = cfg.accent;
    ctx.font = '700 24px "JetBrains Mono", monospace';
    ctx.fillText(`${cfg.badge}  //  ${cfg.jp}`, 330, 96);

    ctx.save();
    ctx.shadowColor = cfg.primary;
    ctx.shadowBlur = 22;
    ctx.fillStyle = cfg.primary;
    ctx.font = '900 84px "Orbitron", "Arial Black", sans-serif';
    ctx.fillText(cfg.brand, 326, 206, w - 370);
    ctx.restore();

    ctx.fillStyle = '#ffffff';
    ctx.font = '700 32px "Rajdhani", sans-serif';
    ctx.fillText(cfg.kz, 330, 272, w - 370);

    ctx.fillStyle = cfg.accent;
    ctx.fillRect(330, 304, w - 380, 48);
    ctx.fillStyle = '#05070d';
    ctx.font = '800 25px "JetBrains Mono", monospace';
    ctx.fillText(cfg.sub, 346, 336, w - 410);

    // Barcode right corner
    ctx.fillStyle = cfg.primary;
    ctx.globalAlpha = 0.65;
    for (let bx = 48; bx < 290; bx += 10) {
      const bw = ((bx * 13) % 6) + 2;
      ctx.fillRect(bx, h - 130, bw, 36);
    }
    ctx.globalAlpha = 1;
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  texture.needsUpdate = true;
  return { texture, orientation: cfg.orientation, id: cfg.id, primary: cfg.primary };
}

export function createAllBillboardTextures() {
  return BILLBOARD_DESIGNS.map(createBillboardCanvasTexture);
}

/**
 * Generates a rich procedural Night City neon environment cubemap via PMREMGenerator
 * so metallic chrome, glass towers, Baiterek gold orb, and Nur Alem gleam realistically.
 */
export function createNeonEnvironmentMap(renderer) {
  const pmrem = new THREE.PMREMGenerator(renderer);
  pmrem.compileEquirectangularShader();

  const envScene = new THREE.Scene();
  envScene.background = new THREE.Color(0x060814);

  // Upper cool indigo dome glow
  const skyGeo = new THREE.SphereGeometry(50, 24, 16);
  const skyMat = new THREE.MeshBasicMaterial({
    color: 0x0b1228,
    side: THREE.BackSide
  });
  envScene.add(new THREE.Mesh(skyGeo, skyMat));

  // Neon horizon reflection bands (Cyan, Magenta, Cyber Gold, Deep Amber)
  const bands = [
    { color: 0x00f0ff, pos: [0, 8, -32], scale: [46, 6, 1], intensity: 2.2 },
    { color: 0xff0066, pos: [32, 6, 0], scale: [1, 7, 46], intensity: 2.2 },
    { color: 0xffc83b, pos: [-32, 10, 0], scale: [1, 6, 42], intensity: 2.0 },
    { color: 0x8b5cf6, pos: [0, 7, 32], scale: [44, 5, 1], intensity: 1.8 },
    { color: 0xffe099, pos: [0, 28, -10], scale: [24, 2, 24], intensity: 1.4 }
  ];

  const boxGeo = new THREE.BoxGeometry(1, 1, 1);
  for (const b of bands) {
    const c = new THREE.Color(b.color).multiplyScalar(b.intensity);
    const mat = new THREE.MeshBasicMaterial({ color: c });
    const m = new THREE.Mesh(boxGeo, mat);
    m.position.set(...b.pos);
    m.scale.set(...b.scale);
    envScene.add(m);
  }

  const rt = pmrem.fromScene(envScene, 0.04);
  pmrem.dispose();
  boxGeo.dispose();
  skyGeo.dispose();
  skyMat.dispose();
  return rt.texture;
}
