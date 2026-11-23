/**
 * Astana // Night City 2077 — Pass 4 Living Cyberpunk Urban Systems
 * 1. InstancedMesh Megacity Skyline (3D Interior-Mapping Parallax + Rooftop HVAC/Dishes/Neon Roof Signs)
 * 2. Physical Truss-Mounted Holo-Billboards + 12 Projecting Vertical Neon Blade Signs
 * 3. Street-Level Info-Kiosks/Totems + Volumetric Steam/Vapor Plume Vents + Neon Accent Pools
 * 4. Multi-Tier Flying AV Spinner Traffic w/ Downward Volumetric Searchlight Cones + Ground Traffic
 * 5. Volumetric Sweeping Sky Searchlights + Ultra-Fine Nocturnal Rain Streaks
 */
import * as THREE from 'three';
import {
  createPBRSkyscraperMaterial,
  createCyberSignShaderMaterial,
  createVolumetricSteamMaterial,
  createLightConeMaterial,
  createSearchlightMaterial,
  createNeonRainMaterial
} from './shaders.js';
import {
  createAllBillboardTextures,
  createAllBladeSignTextures,
  createRoofSignTexture
} from './textures.js';

function createRng(seed = 2077) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

const EXCLUSION_CIRCLES = [
  { x: 0, z: 0, r: 32 },
  { x: -116, z: 0, r: 46 },
  { x: -48, z: -58, r: 38 },
  { x: -46, z: 72, r: 44 },
  { x: 108, z: 0, r: 54 },
  { x: 188, z: 0, r: 46 },
  { x: 44, z: -48, r: 32 },
  { x: -4, z: -64, r: 28 },
  { x: 34, z: 62, r: 28 }
];

function isExcluded(x, z) {
  if (Math.abs(z) < 28 && x > -150 && x < 230) return true;
  if (x > 122 && x < 172) return true;
  if (x > -178 && x < -54 && z > 26 && z < 150) return true;
  for (const c of EXCLUSION_CIRCLES) {
    const dx = x - c.x;
    const dz = z - c.z;
    if (dx * dx + dz * dz < c.r * c.r) return true;
  }
  return false;
}

/* ============================================================================
   1. PROCEDURAL MEGACITY SKYLINE (3D Interior-Mapping + Rooftop Details)
   ============================================================================ */
export function buildMegacityBlocks(pbr) {
  const group = new THREE.Group();
  group.name = 'City_Megablocks';
  const rng = createRng(20771997);

  const placements = [];
  for (let gx = -260; gx <= 310; gx += 22) {
    for (let gz = -220; gz <= 220; gz += 22) {
      const x = gx + (rng() - 0.5) * 7;
      const z = gz + (rng() - 0.5) * 7;
      if (isExcluded(x, z)) continue;

      const distFromCenter = Math.hypot(x, z);
      if (distFromCenter > 315) continue;

      const inSwForeground = x < -65 && x > -185 && z > 30 && z < 150;
      const inNorthBackdrop = z < -30 && x > -160 && x < 120;
      const inEastBank = x > 170;

      let h;
      if (inSwForeground) {
        h = 14 + rng() * 20;
      } else if (inNorthBackdrop) {
        h = 36 + rng() * 68;
      } else if (inEastBank) {
        h = 20 + rng() * 44;
      } else if (Math.abs(z) < 52 && Math.abs(x) < 95) {
        h = 28 + rng() * 38;
      } else {
        h = 20 + rng() * 54;
      }

      const w = 10 + rng() * 9.5;
      const d = 10 + rng() * 9.5;
      const seed = rng();
      const accent = rng();
      placements.push({ x, z, w, h, d, seed, accent });
    }
  }

  const baseCount = placements.length;
  for (let i = 0; i < baseCount; i++) {
    const p = placements[i];
    if (p.h > 38 && p.seed > 0.44) {
      const crownH = 8 + rng() * 16;
      const scale = 0.56 + rng() * 0.22;
      placements.push({
        x: p.x + (rng() - 0.5) * p.w * 0.14,
        z: p.z + (rng() - 0.5) * p.d * 0.14,
        yBase: p.h,
        w: p.w * scale,
        h: crownH,
        d: p.d * scale,
        seed: p.seed,
        accent: p.accent,
        isSetback: true
      });
      p.topY = p.h + crownH;
    } else {
      p.yBase = 0;
      p.topY = p.h;
    }
  }

  const count = placements.length;
  const boxGeo = new THREE.BoxGeometry(1, 1, 1);
  const dataArray = new Float32Array(count * 4);
  for (let i = 0; i < count; i++) {
    const p = placements[i];
    dataArray[i * 4 + 0] = p.w;
    dataArray[i * 4 + 1] = p.h;
    dataArray[i * 4 + 2] = p.seed;
    dataArray[i * 4 + 3] = p.accent;
  }
  boxGeo.setAttribute('aBuildingData', new THREE.InstancedBufferAttribute(dataArray, 4));

  const buildingMat = createPBRSkyscraperMaterial(pbr, {
    isInstanced: true,
    tintHex: 0xc2d2e4,
    uvScaleX: 24,
    uvScaleY: 54
  });
  const buildingsInst = new THREE.InstancedMesh(boxGeo, buildingMat, count);
  buildingsInst.castShadow = false;
  buildingsInst.receiveShadow = true;

  const instTint = new THREE.Color();
  const paletteHex = [0x9eb4cc, 0x8ea8b8, 0xb8c4d4, 0x7c96a8, 0xbcb0a0, 0x8aa2be];
  const dummy = new THREE.Object3D();
  const roofTowers = [];
  const tallAntennas = [];
  const dishTowers = [];
  const canyonTowers = [];

  for (let i = 0; i < count; i++) {
    const p = placements[i];
    const yBase = p.yBase || 0;
    dummy.position.set(p.x, yBase + p.h * 0.5, p.z);
    dummy.scale.set(p.w, p.h, p.d);
    dummy.rotation.set(0, 0, 0);
    dummy.updateMatrix();
    buildingsInst.setMatrixAt(i, dummy.matrix);

    const hex = paletteHex[Math.floor(p.seed * paletteHex.length) % paletteHex.length];
    instTint.setHex(hex);
    buildingsInst.setColorAt(i, instTint);

    if (!p.isSetback) {
      roofTowers.push(p);
      if (p.topY > 46) tallAntennas.push(p);
      if (p.seed > 0.35 && p.topY > 28) dishTowers.push(p);
      if (Math.abs(p.z) >= 26 && Math.abs(p.z) <= 52 && p.x > -108 && p.x < 96 && p.h >= 24) {
        canyonTowers.push(p);
      }
    }
  }
  buildingsInst.instanceMatrix.needsUpdate = true;
  if (buildingsInst.instanceColor) buildingsInst.instanceColor.needsUpdate = true;
  group.add(buildingsInst);

  // Rooftop HVAC mechanical penthouses & AC duct banks (PBR dark brushed metal)
  const mechMat = new THREE.MeshStandardMaterial({
    color: 0x5c6674,
    map: pbr.metal.albedo,
    normalMap: pbr.metal.normal,
    roughnessMap: pbr.metal.rough,
    metalness: 0.78,
    roughness: 0.52,
    envMapIntensity: 1.4
  });
  const hvacInst = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), mechMat, roofTowers.length);
  const ductInst = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), mechMat, roofTowers.length);
  roofTowers.forEach((p, idx) => {
    const hw = p.w * (0.28 + p.seed * 0.14);
    const hd = p.d * (0.28 + (1 - p.seed) * 0.14);
    const hh = 1.6 + p.seed * 2.2;
    dummy.position.set(p.x + (p.seed - 0.5) * 1.4, p.topY + hh * 0.5, p.z);
    dummy.scale.set(hw, hh, hd);
    dummy.rotation.set(0, 0, 0);
    dummy.updateMatrix();
    hvacInst.setMatrixAt(idx, dummy.matrix);

    // Secondary AC condenser duct unit
    dummy.position.set(p.x - (p.seed - 0.5) * p.w * 0.25, p.topY + 0.55, p.z + (p.accent - 0.5) * p.d * 0.24);
    dummy.scale.set(hw * 0.65, 1.1, hd * 0.45);
    dummy.updateMatrix();
    ductInst.setMatrixAt(idx, dummy.matrix);
  });
  group.add(hvacInst, ductInst);

  // Rooftop Parabolic Satellite Dishes
  const dishGeo = new THREE.CylinderGeometry(1.3, 0.25, 0.65, 12, 1, true);
  const dishMat = new THREE.MeshStandardMaterial({
    color: 0x94a3b8,
    metalness: 0.85,
    roughness: 0.28,
    side: THREE.DoubleSide
  });
  const dishInst = new THREE.InstancedMesh(dishGeo, dishMat, dishTowers.length);
  dishTowers.forEach((p, idx) => {
    dummy.position.set(p.x + (p.accent - 0.5) * p.w * 0.3, p.topY + 1.1, p.z - (p.seed - 0.5) * p.d * 0.3);
    dummy.scale.setScalar(0.85 + p.seed * 0.45);
    dummy.rotation.set(-0.55, p.seed * Math.PI * 2, 0.25);
    dummy.updateMatrix();
    dishInst.setMatrixAt(idx, dummy.matrix);
  });
  group.add(dishInst);

  // Rooftop Spires & Aviation Beacons
  const antMat = new THREE.MeshStandardMaterial({ color: 0x627080, metalness: 0.86, roughness: 0.28 });
  const beaconMat = new THREE.MeshBasicMaterial({ color: 0xe61c34 });
  const antInst = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.08, 0.22, 12, 5), antMat, tallAntennas.length);
  const beaconInst = new THREE.InstancedMesh(new THREE.SphereGeometry(0.36, 6, 6), beaconMat, tallAntennas.length);
  tallAntennas.forEach((p, i) => {
    const spireScale = 0.75 + p.seed * 0.7;
    const spireH = 12 * spireScale;
    dummy.position.set(p.x, p.topY + spireH * 0.5, p.z);
    dummy.scale.set(1, spireScale, 1);
    dummy.rotation.set(0, 0, 0);
    dummy.updateMatrix();
    antInst.setMatrixAt(i, dummy.matrix);

    dummy.position.set(p.x, p.topY + spireH + 0.2, p.z);
    dummy.scale.set(1, 1, 1);
    dummy.updateMatrix();
    beaconInst.setMatrixAt(i, dummy.matrix);
  });
  group.add(antInst, beaconInst);

  // Rooftop Neon Cyrillic / Corporate Roof Signs mounted on steel frames
  const roofSignConfigs = [
    { text: 'АСТАНА-2077', sub: 'SECTOR 01 // HQ', col: '#00E5FF', acc: '#FCEE0A', idx: 0, rotY: 0.08 },
    { text: 'КАЗ-КОРП', sub: 'СИНТЕЗ · НЕЙРО', col: '#FCEE0A', acc: '#FF1E56', idx: 3, rotY: -0.22 },
    { text: 'СИНТЕЗ-77', sub: 'BIO-DYNAMICS', col: '#FF1E56', acc: '#00E5FF', idx: 6, rotY: 0.16 },
    { text: 'ЭСИЛЬ-КОРП', sub: 'NURZHOL GRID', col: '#FF9E2C', acc: '#00E5FF', idx: 9, rotY: -0.14 }
  ];
  const roofSignMats = [];
  const roofFrameMat = new THREE.MeshStandardMaterial({ color: 0x1c2430, metalness: 0.85, roughness: 0.35 });
  const roofTargets = canyonTowers.filter((t) => t.topY > 30 && t.topY < 72);
  roofSignConfigs.forEach((cfg, idx) => {
    const host = roofTargets[cfg.idx % Math.max(1, roofTargets.length)];
    if (!host) return;
    const tex = createRoofSignTexture(cfg.text, cfg.sub, cfg.col, cfg.acc);
    const mat = createCyberSignShaderMaterial(tex, { seed: idx * 0.41, doubleSided: true, intensity: 1.25 });
    roofSignMats.push(mat);

    const signW = 11.5;
    const signH = 4.2;
    const signGroup = new THREE.Group();
    signGroup.position.set(host.x, host.topY + 3.0, host.z + (host.z < 0 ? host.d * 0.38 : -host.d * 0.38));
    signGroup.rotation.y = cfg.rotY;

    const panelFront = new THREE.Mesh(new THREE.PlaneGeometry(signW, signH), mat);
    panelFront.position.z = 0.16;
    signGroup.add(panelFront);

    const panelBack = new THREE.Mesh(new THREE.PlaneGeometry(signW, signH), mat);
    panelBack.position.z = -0.16;
    panelBack.rotation.y = Math.PI;
    signGroup.add(panelBack);

    // Physical dark-steel rooftop mounting truss legs
    for (const sx of [-signW * 0.4, 0, signW * 0.4]) {
      const leg = new THREE.Mesh(new THREE.BoxGeometry(0.24, 3.4, 0.24), roofFrameMat);
      leg.position.set(sx, -1.7, 0);
      signGroup.add(leg);
    }
    const topBar = new THREE.Mesh(new THREE.BoxGeometry(signW + 0.5, 0.22, 0.32), roofFrameMat);
    topBar.position.y = signH * 0.5 + 0.1;
    signGroup.add(topBar);
    group.add(signGroup);
  });

  return {
    group,
    count,
    canyonTowers,
    placements,
    shaderMaterials: roofSignMats,
    update(time) {
      buildingMat.userData.customUniforms.uTime.value = time;
      for (let i = 0; i < roofSignMats.length; i++) {
        roofSignMats[i].uniforms.uTime.value = time;
      }
      const blink = 0.45 + 0.55 * (Math.sin(time * 3.8) > 0 ? 1 : 0.2);
      beaconMat.color.setRGB(1.25 * blink, 0.08 * blink, 0.16 * blink);
    }
  };
}

/* ============================================================================
   2. PHYSICAL TRUSS-MOUNTED HOLO-BILLBOARDS & 12 VERTICAL NEON BLADE SIGNS
   ============================================================================ */
export function buildHoloBillboards(pbr, canyonTowers = []) {
  const group = new THREE.Group();
  group.name = 'City_HoloBillboards';

  const textures = createAllBillboardTextures();
  const byId = Object.fromEntries(textures.map((t) => [t.id, t]));

  const frameSteelMat = new THREE.MeshStandardMaterial({
    color: 0x202936,
    map: pbr.metal.albedo,
    normalMap: pbr.metal.normal,
    roughnessMap: pbr.metal.rough,
    metalness: 0.86,
    roughness: 0.38
  });

  // 16 Mega-billboards mounted inside physical dark-steel truss frames & support pylons
  const specs = [
    { tex: 'qazcorp', pos: [-53, 86, -49], rotY: -0.24, w: 16, h: 33 },
    { tex: 'baiterek_net', pos: [-36, 72, -49], rotY: -0.18, w: 13.5, h: 28 },
    { tex: 'astana_2077', pos: [-48, 126, -49], rotY: -0.22, w: 32, h: 15 },
    { tex: 'expo_grid', pos: [44, 76, -39], rotY: -0.32, w: 26, h: 13 },
    { tex: 'samruk_bio', pos: [26, 52, -39], rotY: -0.28, w: 12.5, h: 25 },
    { tex: 'esil_syndicate', pos: [68, 56, -38], rotY: -0.38, w: 13.5, h: 27 },
    { tex: 'khantech', pos: [-74, 29, -29], rotY: -0.35, w: 10.5, h: 21 },
    { tex: 'noir_kumys', pos: [-54, 24, 29], rotY: -0.72, w: 10, h: 20 },
    { tex: 'steppe_av', pos: [-24, 34, -31], rotY: -0.20, w: 23, h: 11.5 },
    { tex: 'baiterek_net', pos: [26, 28, -29], rotY: -0.28, w: 10.5, h: 21 },
    { tex: 'astana_2077', pos: [50, 26, 29], rotY: Math.PI + 0.30, w: 23, h: 11.5 },
    { tex: 'qazcorp', pos: [14, 28, 31], rotY: -0.58, w: 10.5, h: 21 },
    { tex: 'khantech', pos: [-106, 48, -36], rotY: -0.24, w: 14, h: 28 },
    { tex: 'steppe_av', pos: [-74, 34, 36], rotY: -0.55, w: 23, h: 11.5 },
    { tex: 'expo_grid', pos: [-12, 40, 74], rotY: -0.52, w: 25, h: 12.5 },
    { tex: 'esil_syndicate', pos: [118, 46, -46], rotY: 0.40, w: 13.5, h: 28 }
  ];

  const signMaterials = [];
  specs.forEach((s, idx) => {
    const texObj = byId[s.tex] || textures[idx % textures.length];
    const mat = createCyberSignShaderMaterial(texObj.texture, {
      seed: idx * 0.37,
      doubleSided: false,
      intensity: 1.18,
      opacity: 0.94
    });
    signMaterials.push(mat);

    const boardGroup = new THREE.Group();
    boardGroup.position.set(s.pos[0], s.pos[1], s.pos[2]);
    boardGroup.rotation.y = s.rotY;

    const screen = new THREE.Mesh(new THREE.PlaneGeometry(s.w, s.h), mat);
    boardGroup.add(screen);

    // Physical dark-steel backing box + perimeter structural truss frame
    const backPlate = new THREE.Mesh(new THREE.BoxGeometry(s.w + 0.6, s.h + 0.6, 0.35), frameSteelMat);
    backPlate.position.z = -0.24;
    boardGroup.add(backPlate);

    // Corner mounting brackets / cross braces
    for (const sx of [-s.w * 0.42, s.w * 0.42]) {
      const strut = new THREE.Mesh(new THREE.BoxGeometry(0.32, s.h + 1.4, 0.48), frameSteelMat);
      strut.position.set(sx, 0, -0.35);
      boardGroup.add(strut);
    }
    group.add(boardGroup);
  });

  // 12 Projecting Vertical Neon Blade Signs bolted onto dark-steel facade brackets along Nurzhol Canyon
  const bladeTextures = createAllBladeSignTextures();
  const sortedNorth = canyonTowers.filter((t) => t.z < 0).sort((a, b) => a.x - b.x);
  const sortedSouth = canyonTowers.filter((t) => t.z > 0).sort((a, b) => a.x - b.x);

  const bladeMounts = [];
  for (let i = 0; i < 6; i++) {
    const nt = sortedNorth[Math.floor((i * sortedNorth.length) / 6)] || { x: -75 + i * 28, z: -34, d: 14, h: 36 };
    bladeMounts.push({ tower: nt, side: 1, tex: bladeTextures[i * 2] });
    const st = sortedSouth[Math.floor((i * sortedSouth.length) / 6)] || { x: -65 + i * 28, z: 34, d: 14, h: 36 };
    bladeMounts.push({ tower: st, side: -1, tex: bladeTextures[i * 2 + 1] });
  }

  bladeMounts.forEach((m, idx) => {
    const t = m.tower;
    const wallFaceZ = t.z + m.side * (t.d * 0.5);
    const signH = THREE.MathUtils.clamp(t.h * 0.44, 11, 18);
    const signW = signH * 0.25;
    const mountY = Math.min(t.h * 0.52, 18 + (idx % 3) * 3.5);
    const armLen = 3.2;

    const bladeGroup = new THREE.Group();
    bladeGroup.position.set(t.x, mountY, wallFaceZ + m.side * (armLen * 0.5 + signW * 0.5));

    // Double-sided vertical neon blade faces mounted cleanly outside the 0.28m dark-steel spine
    const bMat = createCyberSignShaderMaterial(m.tex.texture, {
      seed: 2.1 + idx * 0.31,
      doubleSided: false,
      intensity: 1.32,
      opacity: 0.98
    });
    signMaterials.push(bMat);

    const bladeEast = new THREE.Mesh(new THREE.PlaneGeometry(signW, signH), bMat);
    bladeEast.position.x = 0.165;
    bladeEast.rotation.y = Math.PI / 2;
    bladeGroup.add(bladeEast);

    const bladeWest = new THREE.Mesh(new THREE.PlaneGeometry(signW, signH), bMat);
    bladeWest.position.x = -0.165;
    bladeWest.rotation.y = -Math.PI / 2;
    bladeGroup.add(bladeWest);

    // Dark-steel spine housing + bolted cantilever brackets anchoring to tower facade
    const spine = new THREE.Mesh(new THREE.BoxGeometry(0.28, signH + 0.5, signW + 0.35), frameSteelMat);
    bladeGroup.add(spine);

    for (const by of [-signH * 0.36, 0, signH * 0.36]) {
      const bracket = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.32, armLen + signW), frameSteelMat);
      bracket.position.set(0, by, -m.side * (armLen * 0.5));
      bladeGroup.add(bracket);
    }

    group.add(bladeGroup);
  });

  return {
    group,
    shaderMaterials: signMaterials,
    update(time) {
      for (let i = 0; i < signMaterials.length; i++) {
        signMaterials[i].uniforms.uTime.value = time;
      }
    }
  };
}

/* ============================================================================
   3. STREET-LEVEL CYBERPUNK DETAILS:
      - Glowing Holographic Info-Kiosks / Totems along Nurzhol Promenade
      - Custom Volumetric Steam / Vapor Plume Vents (Grates & Rooftops)
      - Special Cyberpunk Colored Lighting Pools along Nurzhol Canyon
   ============================================================================ */
export function buildCyberpunkStreetDetails(pbr, placements = []) {
  const group = new THREE.Group();
  group.name = 'City_CyberpunkDetails';
  const shaderMaterials = [];

  const steelMat = new THREE.MeshStandardMaterial({
    color: 0x202936,
    map: pbr.metal.albedo,
    normalMap: pbr.metal.normal,
    roughnessMap: pbr.metal.rough,
    metalness: 0.86,
    roughness: 0.38
  });

  // A. Glowing Holographic Info-Kiosks / Totems along Nurzhol Promenade
  const bladeTexs = createAllBladeSignTextures();
  const kioskXs = [-76, -50, -32, -18, 18, 32, 50, 76];
  kioskXs.forEach((kx, idx) => {
    const kz = idx % 2 === 0 ? -6.4 : 6.4;
    const kiosk = new THREE.Group();
    kiosk.position.set(kx, 0.7, kz);
    kiosk.rotation.y = idx % 2 === 0 ? 0.25 : -0.25;

    const plinth = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.85, 0.9), steelMat);
    plinth.position.y = 0.42;
    kiosk.add(plinth);

    for (const sx of [-0.68, 0.68]) {
      const post = new THREE.Mesh(new THREE.BoxGeometry(0.18, 3.6, 0.28), steelMat);
      post.position.set(sx, 2.2, 0);
      kiosk.add(post);
    }
    const cap = new THREE.Mesh(new THREE.BoxGeometry(1.65, 0.24, 0.42), steelMat);
    cap.position.y = 4.05;
    kiosk.add(cap);

    const texObj = bladeTexs[idx % bladeTexs.length];
    const kMat = createCyberSignShaderMaterial(texObj.texture, {
      seed: 4.3 + idx * 0.5,
      doubleSided: true,
      intensity: 1.35,
      opacity: 0.96
    });
    shaderMaterials.push(kMat);

    const screen = new THREE.Mesh(new THREE.PlaneGeometry(1.12, 2.95), kMat);
    screen.position.y = 2.45;
    kiosk.add(screen);

    group.add(kiosk);
  });

  // B. Volumetric Steam / Vapor Plume Vents (Crossed-quad InstancedMesh in 1 draw call!)
  const steamSites = [];
  for (let sx = -84; sx <= 84; sx += 18) {
    if (Math.abs(sx) < 20) continue;
    steamSites.push({ x: sx, y: 0.1, z: -8.6, scale: 4.8, h: 8.5, col: 0x00e5ff });
    steamSites.push({ x: sx + 7, y: 0.1, z: 8.6, scale: 4.5, h: 8.0, col: 0xff9e2c });
  }
  const roofSteamHosts = placements.filter((p) => !p.isSetback && p.topY > 28 && p.x > -105 && p.x < 95).slice(0, 12);
  roofSteamHosts.forEach((p, idx) => {
    const col = idx % 3 === 0 ? 0x00e5ff : (idx % 3 === 1 ? 0xff9e2c : 0xff1e56);
    steamSites.push({ x: p.x, y: p.topY + 1.4, z: p.z, scale: 6.5, h: 12.0, col });
  });

  const steamGeo = new THREE.PlaneGeometry(1, 1);
  steamGeo.translate(0, 0.5, 0);
  const steamMat = createVolumetricSteamMaterial();
  shaderMaterials.push(steamMat);

  const steamCount = steamSites.length * 2; // 2 crossed planes per plume for 360deg volumetric look
  const steamDataArr = new Float32Array(steamCount * 3);
  const steamInst = new THREE.InstancedMesh(steamGeo, steamMat, steamCount);
  steamInst.frustumCulled = false;

  const dummy = new THREE.Object3D();
  const sColor = new THREE.Color();
  steamSites.forEach((site, idx) => {
    sColor.setHex(site.col);
    for (let k = 0; k < 2; k++) {
      const instIdx = idx * 2 + k;
      dummy.position.set(site.x, site.y, site.z);
      dummy.rotation.set(0, k === 0 ? 0.35 : 0.35 + Math.PI / 2, 0);
      dummy.scale.set(site.scale, site.h, 1);
      dummy.updateMatrix();
      steamInst.setMatrixAt(instIdx, dummy.matrix);
      steamInst.setColorAt(instIdx, sColor);

      steamDataArr[instIdx * 3 + 0] = idx * 1.37;
      steamDataArr[instIdx * 3 + 1] = 0.24 + (idx % 4) * 0.06;
      steamDataArr[instIdx * 3 + 2] = site.y > 5 ? 0.24 : 0.28;
    }
  });
  steamGeo.setAttribute('aSteamData', new THREE.InstancedBufferAttribute(steamDataArr, 3));
  steamInst.instanceMatrix.needsUpdate = true;
  if (steamInst.instanceColor) steamInst.instanceColor.needsUpdate = true;
  group.add(steamInst);

  // C. Special Cyberpunk Lighting Accent Pools along Nurzhol Canyon
  const canyonLights = [
    { pos: [-72, 13, -18], col: 0x00e5ff, int: 28, dist: 56 },
    { pos: [-48, 13, 18], col: 0xff1e56, int: 26, dist: 54 },
    { pos: [-26, 12, -16], col: 0xff9e2c, int: 28, dist: 54 },
    { pos: [28, 12, 16], col: 0x00e5ff, int: 28, dist: 54 },
    { pos: [54, 13, -18], col: 0xff1e56, int: 26, dist: 54 },
    { pos: [74, 13, 18], col: 0xff9e2c, int: 26, dist: 54 }
  ];
  canyonLights.forEach((cl) => {
    const pt = new THREE.PointLight(cl.col, cl.int, cl.dist, 1.7);
    pt.position.set(...cl.pos);
    group.add(pt);
  });

  return {
    group,
    shaderMaterials,
    update(time) {
      for (let i = 0; i < shaderMaterials.length; i++) {
        shaderMaterials[i].uniforms.uTime.value = time;
      }
    }
  };
}

/* ============================================================================
   4. MULTI-TIER FLYING AV SPINNER TRAFFIC + PATROL SEARCHLIGHT CONES + GROUND TRAFFIC
   ============================================================================ */
export function buildFlyingTraffic() {
  const group = new THREE.Group();
  group.name = 'City_Traffic';
  const rng = createRng(9099);

  const aerialAgents = [];
  const laneDefs = [
    { axis: 'x', z: -22, y: 24, dir: 1, span: 440, count: 18 },
    { axis: 'x', z: 22, y: 31, dir: -1, span: 440, count: 18 },
    { axis: 'x', z: -34, y: 48, dir: 1, span: 460, count: 16 },
    { axis: 'x', z: 36, y: 56, dir: -1, span: 460, count: 16 },
    { axis: 'x', z: -12, y: 74, dir: 1, span: 480, count: 14 },
    { axis: 'x', z: 14, y: 86, dir: -1, span: 480, count: 12 },
    { axis: 'z', x: 148, y: 38, dir: 1, span: 420, count: 16 },
    { axis: 'z', x: 152, y: 52, dir: -1, span: 420, count: 14 },
    { axis: 'z', x: -72, y: 42, dir: 1, span: 380, count: 12 },
    { axis: 'z', x: 74, y: 44, dir: -1, span: 380, count: 12 }
  ];

  for (const lane of laneDefs) {
    for (let i = 0; i < lane.count; i++) {
      aerialAgents.push({
        isGround: false,
        axis: lane.axis,
        dir: lane.dir,
        span: lane.span,
        baseX: lane.x ?? 0,
        baseZ: lane.z ?? 0,
        y: lane.y + (rng() - 0.5) * 4.5,
        offset: (rng() - 0.5) * lane.span,
        speed: 22 + rng() * 26,
        bobPhase: rng() * Math.PI * 2,
        len: 4.5 + rng() * 5.0
      });
    }
  }

  const groundAgents = [];
  const groundLanes = [
    { axis: 'x', z: -13.5, y: 0.75, dir: 1, span: 340, count: 22 },
    { axis: 'x', z: -15.8, y: 0.75, dir: 1, span: 340, count: 16 },
    { axis: 'x', z: 13.5, y: 0.75, dir: -1, span: 340, count: 22 },
    { axis: 'x', z: 15.8, y: 0.75, dir: -1, span: 340, count: 16 }
  ];
  for (const lane of groundLanes) {
    for (let i = 0; i < lane.count; i++) {
      groundAgents.push({
        isGround: true,
        axis: lane.axis,
        dir: lane.dir,
        span: lane.span,
        baseX: 0,
        baseZ: lane.z,
        y: lane.y,
        offset: (rng() - 0.5) * lane.span,
        speed: 14 + rng() * 12,
        bobPhase: 0,
        len: 2.6 + rng() * 1.4
      });
    }
  }

  const allAgents = [...aerialAgents, ...groundAgents];
  const cyanAgents = allAgents.filter((a) => a.dir > 0);
  const crimsonAgents = allAgents.filter((a) => a.dir < 0);

  const trailGeo = new THREE.BoxGeometry(1, 0.34, 0.42);
  const cyanMat = new THREE.MeshBasicMaterial({
    color: 0x00e5ff,
    transparent: true,
    opacity: 0.92,
    blending: THREE.AdditiveBlending,
    depthWrite: false
  });
  const crimsonMat = new THREE.MeshBasicMaterial({
    color: 0xff1e56,
    transparent: true,
    opacity: 0.92,
    blending: THREE.AdditiveBlending,
    depthWrite: false
  });

  const cyanInst = new THREE.InstancedMesh(trailGeo, cyanMat, cyanAgents.length);
  const crimsonInst = new THREE.InstancedMesh(trailGeo, crimsonMat, crimsonAgents.length);
  cyanInst.frustumCulled = false;
  crimsonInst.frustumCulled = false;
  group.add(cyanInst, crimsonInst);

  // 5 Patrolling AV Spinners with Volumetric Downward Searchlight Cones cutting through the avenue
  const spinnerHullMat = new THREE.MeshStandardMaterial({ color: 0x161d28, metalness: 0.9, roughness: 0.25 });
  const spinnerStripMat = new THREE.MeshBasicMaterial({ color: 0x00e5ff });
  const spinnerConeMat = createLightConeMaterial({ opacity: 0.13, colorHex: 0x8be9ff });
  const spinnerConeGeo = new THREE.CylinderGeometry(0.35, 6.2, 26, 14, 1, true);
  spinnerConeGeo.translate(0, -13, 0);

  const patrolSpinners = [
    { z: -14, y: 26, dir: 1, span: 360, offset: -90, speed: 18 },
    { z: 14, y: 31, dir: -1, span: 360, offset: 40, speed: 20 },
    { z: 0, y: 42, dir: 1, span: 380, offset: 110, speed: 16 },
    { z: -26, y: 36, dir: -1, span: 340, offset: -20, speed: 22 },
    { z: 26, y: 38, dir: 1, span: 340, offset: 15, speed: 19 }
  ].map((cfg, idx) => {
    const av = new THREE.Group();
    const body = new THREE.Mesh(new THREE.BoxGeometry(4.4, 1.1, 2.0), spinnerHullMat);
    av.add(body);
    const navStrip = new THREE.Mesh(new THREE.BoxGeometry(4.5, 0.2, 2.1), spinnerStripMat);
    av.add(navStrip);

    const cone = new THREE.Mesh(spinnerConeGeo, spinnerConeMat);
    cone.rotation.z = cfg.dir * 0.36; // Sweep forward/downward through canyon air
    av.add(cone);

    group.add(av);
    return { mesh: av, cone, cfg, phase: idx * 1.4 };
  });

  const dummy = new THREE.Object3D();
  function updateBatch(inst, list, time, speedMul) {
    for (let i = 0; i < list.length; i++) {
      const a = list[i];
      const travel = a.offset + time * a.speed * speedMul * a.dir;
      const half = a.span * 0.5;
      const pos = ((((travel + half) % a.span) + a.span) % a.span) - half;

      const bob = a.isGround ? 0 : Math.sin(time * 2.2 + a.bobPhase) * 0.55;
      if (a.axis === 'x') {
        dummy.position.set(pos, a.y + bob, a.baseZ);
        dummy.rotation.set(0, 0, 0);
      } else {
        dummy.position.set(a.baseX, a.y + bob, pos);
        dummy.rotation.set(0, Math.PI / 2, 0);
      }
      dummy.scale.set(a.len, 1, 1);
      dummy.updateMatrix();
      inst.setMatrixAt(i, dummy.matrix);
    }
    inst.instanceMatrix.needsUpdate = true;
  }

  return {
    group,
    update(time, speedMul = 1.0) {
      updateBatch(cyanInst, cyanAgents, time, speedMul);
      updateBatch(crimsonInst, crimsonAgents, time, speedMul);

      spinnerConeMat.uniforms.uTime.value = time;
      for (const s of patrolSpinners) {
        const travel = s.offset + time * s.cfg.speed * speedMul * s.cfg.dir;
        const half = s.cfg.span * 0.5;
        const px = ((((travel + half) % s.cfg.span) + s.cfg.span) % s.cfg.span) - half;
        s.mesh.position.set(px, s.cfg.y + Math.sin(time * 1.8 + s.phase) * 0.8, s.cfg.z);
        s.cone.rotation.x = Math.sin(time * 0.9 + s.phase) * 0.22;
      }
    }
  };
}

/* ============================================================================
   5. VOLUMETRIC SWEEPING SKY SEARCHLIGHT BEAMS
   ============================================================================ */
export function buildSearchlights() {
  const group = new THREE.Group();
  group.name = 'City_Searchlights';

  const coneGeo = new THREE.CylinderGeometry(16, 1.4, 210, 16, 1, true);
  coneGeo.translate(0, 105, 0);

  const configs = [
    { pos: [-52, 10, -58], color: 0x00e5ff, rx: 0.22, rz: -0.18, speed: 0.28, phase: 0.0 },
    { pos: [-38, 10, -58], color: 0xff9e2c, rx: -0.18, rz: 0.24, speed: 0.24, phase: 1.4 },
    { pos: [0, 3, -24], color: 0x00e5ff, rx: 0.26, rz: 0.14, speed: 0.26, phase: 2.1 },
    { pos: [0, 3, 24], color: 0xff9e2c, rx: -0.24, rz: -0.18, speed: 0.30, phase: 0.7 },
    { pos: [-116, 8, -22], color: 0x5cc4de, rx: 0.18, rz: 0.28, speed: 0.22, phase: 3.3 },
    { pos: [-46, 6, 88], color: 0x52d4c2, rx: -0.25, rz: 0.15, speed: 0.28, phase: 4.0 },
    { pos: [108, 6, -26], color: 0x72d4ee, rx: 0.2, rz: -0.24, speed: 0.26, phase: 1.9 },
    { pos: [108, 6, 26], color: 0xffb85c, rx: -0.22, rz: -0.2, speed: 0.22, phase: 5.1 },
    { pos: [188, 6, -24], color: 0xffb85c, rx: 0.18, rz: -0.26, speed: 0.2, phase: 2.8 },
    { pos: [44, 12, -48], color: 0x52d4c2, rx: 0.24, rz: 0.22, speed: 0.27, phase: 3.9 }
  ];

  const beams = configs.map((c) => {
    const mat = createSearchlightMaterial(c.color);
    const mesh = new THREE.Mesh(coneGeo, mat);
    mesh.position.set(c.pos[0], c.pos[1], c.pos[2]);
    group.add(mesh);
    return { mesh, mat, cfg: c };
  });

  return {
    group,
    update(time, boost = 0.85) {
      for (const b of beams) {
        b.mat.uniforms.uBoost.value = boost;
        b.mat.uniforms.uTime.value = time;
        b.mesh.rotation.x = b.cfg.rx + Math.sin(time * b.cfg.speed + b.cfg.phase) * 0.22;
        b.mesh.rotation.z = b.cfg.rz + Math.cos(time * b.cfg.speed * 0.8 + b.cfg.phase) * 0.24;
      }
    }
  };
}

/* ============================================================================
   6. GPU-DRIVEN ULTRA-FINE NOCTURNAL RAIN STREAKS (4,200 streaks, 1 draw call)
   ============================================================================ */
export function buildNeonRain() {
  const count = 4200;
  const rng = createRng(772077);

  const positions = new Float32Array(count * 2 * 3);
  const speeds = new Float32Array(count * 2);
  const phases = new Float32Array(count * 2);
  const tints = new Float32Array(count * 2);
  const offsetsY = new Float32Array(count * 2);

  for (let i = 0; i < count; i++) {
    const x = (rng() - 0.5) * 440 + 10;
    const y = rng() * 175;
    const z = (rng() - 0.5) * 340;
    const speed = 78 + rng() * 52;
    const phase = rng();
    const tint = rng();
    const len = 2.4 + rng() * 2.6;

    const i0 = i * 2;
    const i1 = i * 2 + 1;

    positions[i0 * 3 + 0] = x;
    positions[i0 * 3 + 1] = y;
    positions[i0 * 3 + 2] = z;

    positions[i1 * 3 + 0] = x;
    positions[i1 * 3 + 1] = y;
    positions[i1 * 3 + 2] = z;

    speeds[i0] = speed;
    speeds[i1] = speed;
    phases[i0] = phase;
    phases[i1] = phase;
    tints[i0] = tint;
    tints[i1] = tint;
    offsetsY[i0] = 0;
    offsetsY[i1] = len;
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geo.setAttribute('aSpeed', new THREE.BufferAttribute(speeds, 1));
  geo.setAttribute('aPhase', new THREE.BufferAttribute(phases, 1));
  geo.setAttribute('aTint', new THREE.BufferAttribute(tints, 1));
  geo.setAttribute('aOffsetY', new THREE.BufferAttribute(offsetsY, 1));

  const mat = createNeonRainMaterial();
  const rainLines = new THREE.LineSegments(geo, mat);
  rainLines.frustumCulled = false;
  rainLines.name = 'City_NeonRain';

  return {
    mesh: rainLines,
    update(time, rainIntensity = 0.85, accentHex = 0x5ccbe6, horizonHex = 0xdba264) {
      mat.uniforms.uTime.value = time;
      mat.uniforms.uRainIntensity.value = rainIntensity;
      mat.uniforms.uColorA.value.setHex(accentHex);
      mat.uniforms.uColorB.value.setHex(horizonHex);
    }
  };
}
