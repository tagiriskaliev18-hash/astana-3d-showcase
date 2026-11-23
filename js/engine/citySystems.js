/**
 * Astana // Night City 2077 — Pass 4 Living Cyberpunk Urban Systems
 * 1. InstancedMesh Megacity Skyline (3D Interior-Mapping Parallax + Rooftop HVAC/Dishes/Neon Roof Signs)
 * 2. Physical Truss-Mounted Holo-Billboards + 12 Projecting Vertical Neon Blade Signs
 * 3. Street-Level Info-Kiosks/Totems + Volumetric Steam/Vapor Plume Vents + Neon Accent Pools
 * 4. Multi-Tier Flying AV Spinner Traffic w/ Downward Volumetric Searchlight Cones + Ground Traffic
 * 5. Volumetric Sweeping Sky Searchlights + Ultra-Fine Nocturnal Rain Streaks
 */
import * as THREE from 'three';
import * as BufferGeometryUtils from 'three/addons/utils/BufferGeometryUtils.js';
import {
  createPBRSkyscraperMaterial,
  createCyberSignShaderMaterial,
  createVolumetricSteamMaterial,
  createLightConeMaterial,
  createSearchlightMaterial,
  createNeonRainMaterial,
  createRainMistMaterial
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

  // Extended Outer Urban Districts & Low/Mid-Rise Skyline Rings (r = 315..860m, outside КАД & Esil corridor)
  const outerRng = createRng(772099);
  for (let gx = -860; gx <= 860; gx += 36) {
    for (let gz = -860; gz <= 860; gz += 36) {
      const x = gx + (outerRng() - 0.5) * 14;
      const z = gz + (outerRng() - 0.5) * 14;
      const r = Math.hypot(x, z);
      if (r <= 315 || r > 860) continue;
      if (x > 116 && x < 180) continue; // Esil river valley
      if (Math.abs(r - 450) < 25) continue; // КАД orbital ring road corridor
      if (Math.abs(z) < 20 && x > -520 && x < 520) continue; // Main East-West avenue corridor
      if (r > 700 && outerRng() > 0.58) continue;

      const isInnerRing = r <= 425;
      const isCluster = !isInnerRing && outerRng() > 0.84;
      const h = isInnerRing
        ? 14 + outerRng() * 28
        : (isCluster ? 22 + outerRng() * 20 : 8 + outerRng() * 17);
      const w = 13 + outerRng() * 13;
      const d = 13 + outerRng() * 13;
      const seed = outerRng();
      const accent = outerRng();
      placements.push({ x, z, yBase: 0, w, h, d, seed, accent, topY: h, isOuter: true });
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
      if (!p.isOuter) {
        roofTowers.push(p);
        if (p.seed > 0.35 && p.topY > 28) dishTowers.push(p);
        if (Math.abs(p.z) >= 26 && Math.abs(p.z) <= 52 && p.x > -108 && p.x < 96 && p.h >= 24) {
          canyonTowers.push(p);
        }
      }
      if (p.topY > 36 && Math.hypot(p.x, p.z) < 520) tallAntennas.push(p);
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

  // Rooftop Spires & Asynchronous Pulsing Aviation Beacons
  const antMat = new THREE.MeshStandardMaterial({ color: 0x627080, metalness: 0.86, roughness: 0.28 });
  const beaconMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
  const antInst = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.08, 0.22, 12, 5), antMat, tallAntennas.length);
  const beaconInst = new THREE.InstancedMesh(new THREE.SphereGeometry(0.36, 6, 6), beaconMat, tallAntennas.length);
  const beaconColor = new THREE.Color();
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
    beaconColor.setRGB(1.25, 0.08, 0.16);
    beaconInst.setColorAt(i, beaconColor);
  });
  if (beaconInst.instanceColor) beaconInst.instanceColor.needsUpdate = true;
  group.add(antInst, beaconInst);

  // Rooftop Neon Cyrillic / Corporate Roof Signs mounted on steel frames (clear of Baiterek's orb axis)
  const roofSignConfigs = [
    { text: 'АСТАНА-2077', sub: 'SECTOR 01 // HQ', col: '#00E5FF', acc: '#FCEE0A', idx: 0, rotY: 0.06 },
    { text: 'КАЗ-КОРП', sub: 'СИНТЕЗ · НЕЙРО', col: '#FCEE0A', acc: '#FF1E56', idx: 2, rotY: -0.14 },
    { text: 'СИНТЕЗ-77', sub: 'BIO-DYNAMICS', col: '#FF1E56', acc: '#00E5FF', idx: 4, rotY: 0.12 },
    { text: 'ЭСИЛЬ-КОРП', sub: 'NURZHOL GRID', col: '#FF9E2C', acc: '#00E5FF', idx: 6, rotY: -0.10 }
  ];
  const roofSignMats = [];
  const roofFrameMat = new THREE.MeshStandardMaterial({ color: 0x1c2430, metalness: 0.85, roughness: 0.35 });
  const roofTargets = canyonTowers.filter((t) => t.topY > 30 && t.topY < 72 && Math.abs(t.x) > 34);
  roofSignConfigs.forEach((cfg, idx) => {
    const host = roofTargets[cfg.idx % Math.max(1, roofTargets.length)];
    if (!host) return;
    const tex = createRoofSignTexture(cfg.text, cfg.sub, cfg.col, cfg.acc);
    const mat = createCyberSignShaderMaterial(tex, {
      seed: idx * 0.41,
      doubleSided: false,
      transparent: false,
      intensity: 0.96
    });
    roofSignMats.push(mat);

    const signW = 11.2;
    const signH = 4.0;
    const signGroup = new THREE.Group();
    signGroup.position.set(host.x, host.topY + 3.0, host.z + (host.z < 0 ? host.d * 0.36 : -host.d * 0.36));
    signGroup.rotation.y = cfg.rotY;

    const coreBacking = new THREE.Mesh(new THREE.BoxGeometry(signW + 0.35, signH + 0.35, 0.24), roofFrameMat);
    signGroup.add(coreBacking);

    const panelFront = new THREE.Mesh(new THREE.PlaneGeometry(signW, signH), mat);
    panelFront.position.z = 0.14;
    signGroup.add(panelFront);

    const panelBack = new THREE.Mesh(new THREE.PlaneGeometry(signW, signH), mat);
    panelBack.position.z = -0.14;
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
      for (let i = 0; i < tallAntennas.length; i++) {
        const phase = tallAntennas[i].seed * 12.566;
        const pulse = 0.22 + 0.78 * Math.pow(0.5 + 0.5 * Math.sin(time * 2.8 + phase), 2.5);
        beaconColor.setRGB(1.30 * pulse, 0.08 * pulse, 0.16 * pulse);
        beaconInst.setColorAt(i, beaconColor);
      }
      if (beaconInst.instanceColor) beaconInst.instanceColor.needsUpdate = true;
    }
  };
}

/* ============================================================================
   2. ARCHITECTURAL FACADE MEDIA PANELS & 12 VERTICAL NEON BLADE SIGNS
      - Anchored strictly flush onto flanking skyscraper facades & podium crowns
      - Zero floating/overlapping holographic planes over Baiterek's orb axis
   ============================================================================ */
export function buildHoloBillboards(pbr, canyonTowers = []) {
  const group = new THREE.Group();
  group.name = 'City_HoloBillboards';

  const textures = createAllBillboardTextures();
  const byId = Object.fromEntries(textures.map((t) => [t.id, t]));
  const verticalIds = ['qazcorp', 'khantech', 'esil_syndicate', 'samruk_bio', 'noir_kumys', 'baiterek_net'];
  const horizontalIds = ['steppe_av', 'expo_grid', 'astana_2077'];

  const frameSteelMat = new THREE.MeshStandardMaterial({
    color: 0x1d2532,
    map: pbr.metal.albedo,
    normalMap: pbr.metal.normal,
    roughnessMap: pbr.metal.rough,
    metalness: 0.88,
    roughness: 0.34
  });

  const signMaterials = [];

  function mountFacadeMediaPanel({ texId, pos, rotY, w, h, seed, podiumLegs = false }) {
    const texObj = byId[texId] || textures[0];
    const mat = createCyberSignShaderMaterial(texObj.texture, {
      seed,
      doubleSided: false,
      transparent: false,
      intensity: 0.96,
      opacity: 1.0
    });
    signMaterials.push(mat);

    const boardGroup = new THREE.Group();
    boardGroup.position.set(pos[0], pos[1], pos[2]);
    boardGroup.rotation.y = rotY;

    const screen = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat);
    screen.position.z = 0.04;
    boardGroup.add(screen);

    // Physical dark-steel bezel housing + rear wall-anchor struts
    const backPlate = new THREE.Mesh(new THREE.BoxGeometry(w + 0.56, h + 0.56, 0.36), frameSteelMat);
    backPlate.position.z = -0.16;
    boardGroup.add(backPlate);

    for (const sx of [-w * 0.42, w * 0.42]) {
      const strut = new THREE.Mesh(new THREE.BoxGeometry(0.28, h + 0.85, 0.52), frameSteelMat);
      strut.position.set(sx, 0, -0.32);
      boardGroup.add(strut);
    }

    if (podiumLegs) {
      for (const sx of [-w * 0.42, 0, w * 0.42]) {
        const leg = new THREE.Mesh(new THREE.BoxGeometry(0.32, 2.2, 0.36), frameSteelMat);
        leg.position.set(sx, -h * 0.5 - 0.7, -0.18);
        boardGroup.add(leg);
      }
    }

    group.add(boardGroup);
  }

  // A. Abu Dhabi Plaza (-48, 0, -58): flush facade & podium-crown architectural LED screens
  mountFacadeMediaPanel({ texId: 'qazcorp', pos: [-53, 84, -50.62], rotY: 0, w: 11.5, h: 23.0, seed: 0.17 });
  mountFacadeMediaPanel({ texId: 'steppe_av', pos: [-36.5, 50, -49.12], rotY: 0, w: 10.5, h: 5.4, seed: 0.53 });
  mountFacadeMediaPanel({ texId: 'astana_2077', pos: [-48, 13.7, -44.5], rotY: 0, w: 18.0, h: 4.2, seed: 0.89, podiumLegs: true });

  // B. Flanking Megacity Canyon Towers (strictly outside Baiterek's central golden orb axis |x| > 36)
  function pickSpacedHosts(list, minGapX, maxCount) {
    const picked = [];
    for (const t of list) {
      if (picked.every((p) => Math.abs(p.x - t.x) >= minGapX)) {
        picked.push(t);
        if (picked.length >= maxCount) break;
      }
    }
    return picked;
  }

  const eligibleNorth = canyonTowers
    .filter((t) => t.z < 0 && Math.abs(t.x) > 36 && t.h >= 34 && t.w >= 11.5)
    .sort((a, b) => a.x - b.x);
  const eligibleSouth = canyonTowers
    .filter((t) => t.z > 0 && Math.abs(t.x) > 36 && t.h >= 34 && t.w >= 11.5)
    .sort((a, b) => a.x - b.x);

  const selectedHosts = [
    ...pickSpacedHosts(eligibleNorth, 30, 3),
    ...pickSpacedHosts(eligibleSouth, 30, 3)
  ];

  selectedHosts.forEach((t, idx) => {
    const facingDir = t.z < 0 ? 1 : -1;
    const isWide = t.w >= 14.5 && t.h < 52;
    const texId = isWide
      ? horizontalIds[idx % horizontalIds.length]
      : verticalIds[(idx + 1) % verticalIds.length];

    const panelW = isWide ? Math.min(t.w * 0.72, 13.5) : Math.min(t.w * 0.62, 9.2);
    const panelH = isWide ? panelW * 0.5 : Math.min(panelW * 1.95, t.h * 0.42);
    const mountY = THREE.MathUtils.clamp(t.h * 0.56, panelH * 0.65 + 8, t.h - panelH * 0.65 - 2);
    const faceZ = t.z + facingDir * (t.d * 0.5 + 0.36);

    mountFacadeMediaPanel({
      texId,
      pos: [t.x, mountY, faceZ],
      rotY: facingDir > 0 ? 0 : Math.PI,
      w: panelW,
      h: panelH,
      seed: 1.1 + idx * 0.37
    });
  });

  // 12 Projecting Vertical Neon Blade Signs bolted onto distinct dark-steel facade brackets along Nurzhol Canyon
  const bladeTextures = createAllBladeSignTextures();
  const hostSet = new Set(selectedHosts);
  const sortedNorth = canyonTowers
    .filter((t) => t.z < 0 && Math.abs(t.x) > 24 && !hostSet.has(t))
    .sort((a, b) => a.x - b.x);
  const sortedSouth = canyonTowers
    .filter((t) => t.z > 0 && Math.abs(t.x) > 24 && !hostSet.has(t))
    .sort((a, b) => a.x - b.x);

  const bladeNorth = pickSpacedHosts(sortedNorth, 14, 6);
  const bladeSouth = pickSpacedHosts(sortedSouth, 14, 6);

  const bladeMounts = [];
  for (let i = 0; i < bladeNorth.length; i++) {
    bladeMounts.push({ tower: bladeNorth[i], side: 1, tex: bladeTextures[(i * 2) % bladeTextures.length] });
  }
  for (let i = 0; i < bladeSouth.length; i++) {
    bladeMounts.push({ tower: bladeSouth[i], side: -1, tex: bladeTextures[(i * 2 + 1) % bladeTextures.length] });
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

    // Double-sided vertical neon blade faces mounted solidly onto the 0.28m dark-steel spine
    const bMat = createCyberSignShaderMaterial(m.tex.texture, {
      seed: 2.1 + idx * 0.31,
      doubleSided: false,
      transparent: false,
      intensity: 1.02,
      opacity: 1.0
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
      doubleSided: false,
      transparent: false,
      intensity: 1.0,
      opacity: 1.0
    });
    shaderMaterials.push(kMat);

    const kCore = new THREE.Mesh(new THREE.BoxGeometry(1.16, 2.98, 0.12), steelMat);
    kCore.position.y = 2.45;
    kiosk.add(kCore);

    const screenFront = new THREE.Mesh(new THREE.PlaneGeometry(1.12, 2.95), kMat);
    screenFront.position.set(0, 2.45, 0.07);
    kiosk.add(screenFront);

    const screenBack = new THREE.Mesh(new THREE.PlaneGeometry(1.12, 2.95), kMat);
    screenBack.position.set(0, 2.45, -0.07);
    screenBack.rotation.y = Math.PI;
    kiosk.add(screenBack);

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

  // D. Warm-Lit Plaza Food/Tech Stall Pavilions & Strolling Pedestrian Silhouettes along Nurzhol Promenade
  const stallAwningMat = new THREE.MeshStandardMaterial({ color: 0x1a222d, metalness: 0.78, roughness: 0.35 });
  const stallGlowMat = new THREE.MeshStandardMaterial({
    color: 0xffd292,
    emissive: 0xff9428,
    emissiveIntensity: 0.85,
    roughness: 0.25
  });
  const stallXs = [-82, -60, -38, -26, 26, 38, 60, 82];
  stallXs.forEach((sx, idx) => {
    const sz = idx % 2 === 0 ? 6.6 : -6.6;
    const stall = new THREE.Group();
    stall.position.set(sx, 0.7, sz);

    const counter = new THREE.Mesh(new THREE.BoxGeometry(3.4, 1.05, 1.45), stallAwningMat);
    counter.position.y = 0.52;
    stall.add(counter);

    const lightBand = new THREE.Mesh(new THREE.BoxGeometry(3.2, 0.36, 1.50), stallGlowMat);
    lightBand.position.y = 1.02;
    stall.add(lightBand);

    const roof = new THREE.Mesh(new THREE.BoxGeometry(3.8, 0.22, 1.9), stallAwningMat);
    roof.position.y = 2.65;
    stall.add(roof);

    for (const px of [-1.55, 1.55]) {
      const post = new THREE.Mesh(new THREE.BoxGeometry(0.14, 1.6, 0.14), stallAwningMat);
      post.position.set(px, 1.82, 0);
      stall.add(post);
    }
    group.add(stall);
  });

  // 110 Instanced Pedestrian Silhouettes strolling along Nurzhol Promenade & Baiterek outer plaza
  const pedBody = new THREE.CylinderGeometry(0.14, 0.18, 1.28, 6).toNonIndexed();
  pedBody.translate(0, 0.64, 0);
  const pedHead = new THREE.SphereGeometry(0.13, 6, 6).toNonIndexed();
  pedHead.translate(0, 1.42, 0);
  const pedGeo = BufferGeometryUtils.mergeGeometries([pedBody, pedHead], false);
  pedBody.dispose();
  pedHead.dispose();

  const pedMat = new THREE.MeshStandardMaterial({ color: 0x0e141d, roughness: 0.75, metalness: 0.15 });
  const pedRng = createRng(4042077);
  const pedestrians = [];
  for (let i = 0; i < 110; i++) {
    const isPlaza = i < 24;
    if (isPlaza) {
      const a = (i / 24) * Math.PI * 2 + pedRng() * 0.2;
      const r = 16.5 + pedRng() * 3.8;
      pedestrians.push({
        isPlaza: true,
        baseA: a,
        r,
        y: 1.4,
        speed: (pedRng() > 0.5 ? 1 : -1) * (0.04 + pedRng() * 0.05),
        phase: pedRng() * 6.28
      });
    } else {
      const side = pedRng() > 0.5 ? 1 : -1;
      const x = side * (25 + pedRng() * 64);
      const z = (pedRng() - 0.5) * 11.5;
      pedestrians.push({
        isPlaza: false,
        x,
        z,
        y: 0.7,
        amp: 2.5 + pedRng() * 4.5,
        speed: 0.45 + pedRng() * 0.55,
        phase: pedRng() * 6.28,
        dir: pedRng() > 0.5 ? 1 : -1
      });
    }
  }
  const pedInst = new THREE.InstancedMesh(pedGeo, pedMat, pedestrians.length);
  const pedDummy = new THREE.Object3D();
  group.add(pedInst);

  return {
    group,
    shaderMaterials,
    update(time) {
      for (let i = 0; i < shaderMaterials.length; i++) {
        shaderMaterials[i].uniforms.uTime.value = time;
      }
      for (let i = 0; i < pedestrians.length; i++) {
        const p = pedestrians[i];
        if (p.isPlaza) {
          const a = p.baseA + time * p.speed;
          pedDummy.position.set(Math.cos(a) * p.r, p.y, Math.sin(a) * p.r);
          pedDummy.rotation.set(0, -a, 0);
        } else {
          const walk = Math.sin(time * p.speed + p.phase);
          pedDummy.position.set(p.x + walk * p.amp * p.dir, p.y + Math.abs(Math.sin(time * p.speed * 4.2 + p.phase)) * 0.04, p.z);
          pedDummy.rotation.set(0, Math.cos(time * p.speed + p.phase) * p.dir >= 0 ? 0 : Math.PI, 0);
        }
        pedDummy.updateMatrix();
        pedInst.setMatrixAt(i, pedDummy.matrix);
      }
      pedInst.instanceMatrix.needsUpdate = true;
    }
  };
}

/* ============================================================================
   4. MULTI-TIER AV TRAFFIC + PAIRED GROUND HEADLIGHTS/TAILLIGHTS (AVS + КАД RING ROAD)
      + STRICTLY 3 PATROL AIRSHIPS MAX + DISTANT ATMOSPHERIC DRONE FLOCKS
   ============================================================================ */
export function buildFlyingTraffic() {
  const group = new THREE.Group();
  group.name = 'City_Traffic';
  const rng = createRng(9099);

  // A. Multi-tier flying AV light streams across main & outer skyline corridors
  const aerialAgents = [];
  const laneDefs = [
    { axis: 'x', z: -22, y: 24, dir: 1, span: 640, count: 22 },
    { axis: 'x', z: 22, y: 31, dir: -1, span: 640, count: 22 },
    { axis: 'x', z: -34, y: 48, dir: 1, span: 680, count: 18 },
    { axis: 'x', z: 36, y: 56, dir: -1, span: 680, count: 18 },
    { axis: 'x', z: -12, y: 74, dir: 1, span: 720, count: 16 },
    { axis: 'x', z: 14, y: 86, dir: -1, span: 720, count: 14 },
    { axis: 'z', x: 148, y: 38, dir: 1, span: 620, count: 18 },
    { axis: 'z', x: 152, y: 52, dir: -1, span: 620, count: 16 },
    { axis: 'z', x: -72, y: 42, dir: 1, span: 540, count: 14 },
    { axis: 'z', x: 74, y: 44, dir: -1, span: 540, count: 14 }
  ];

  for (const lane of laneDefs) {
    for (let i = 0; i < lane.count; i++) {
      aerialAgents.push({
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

  const cyanAgents = aerialAgents.filter((a) => a.dir > 0);
  const crimsonAgents = aerialAgents.filter((a) => a.dir < 0);

  const trailGeo = new THREE.BoxGeometry(1, 0.30, 0.38);
  const cyanMat = new THREE.MeshBasicMaterial({
    color: 0x00e5ff,
    transparent: true,
    opacity: 0.88,
    blending: THREE.AdditiveBlending,
    depthWrite: false
  });
  const crimsonMat = new THREE.MeshBasicMaterial({
    color: 0xff1e56,
    transparent: true,
    opacity: 0.88,
    blending: THREE.AdditiveBlending,
    depthWrite: false
  });

  const cyanInst = new THREE.InstancedMesh(trailGeo, cyanMat, cyanAgents.length);
  const crimsonInst = new THREE.InstancedMesh(trailGeo, crimsonMat, crimsonAgents.length);
  cyanInst.frustumCulled = false;
  crimsonInst.frustumCulled = false;
  group.add(cyanInst, crimsonInst);

  // B. Paired Headlight & Taillight Ground Traffic (Nurzhol Blvd + Cross Avenues + River Bridges + КАД Ring Road)
  const groundCars = [];
  const straightLanes = [
    { axis: 'x', z: -13.5, y: 0.72, dir: 1, span: 520, count: 28, speedMin: 15 },
    { axis: 'x', z: -15.8, y: 0.72, dir: 1, span: 520, count: 24, speedMin: 17 },
    { axis: 'x', z: 13.5, y: 0.72, dir: -1, span: 520, count: 28, speedMin: 15 },
    { axis: 'x', z: 15.8, y: 0.72, dir: -1, span: 520, count: 24, speedMin: 17 },
    { axis: 'z', x: -72.0, y: 0.72, dir: 1, span: 440, count: 20, speedMin: 14 },
    { axis: 'z', x: 74.0, y: 0.72, dir: -1, span: 440, count: 20, speedMin: 14 },
    { axis: 'x', z: 0.0, y: 1.55, dir: 1, span: 110, centerOffset: 148, count: 8, speedMin: 12 },
    { axis: 'x', z: -88.0, y: 1.55, dir: -1, span: 110, centerOffset: 148, count: 6, speedMin: 12 },
    { axis: 'x', z: 86.0, y: 1.55, dir: 1, span: 110, centerOffset: 148, count: 6, speedMin: 12 }
  ];
  for (const lane of straightLanes) {
    for (let i = 0; i < lane.count; i++) {
      groundCars.push({
        isRing: false,
        axis: lane.axis,
        dir: lane.dir,
        span: lane.span,
        centerOffset: lane.centerOffset || 0,
        baseX: lane.x ?? 0,
        baseZ: lane.z ?? 0,
        y: lane.y,
        offset: (rng() - 0.5) * lane.span,
        speed: lane.speedMin + rng() * 11
      });
    }
  }
  // КАД Outer Orbital Highway Ring Traffic (R=445.5 CW & R=454.5 CCW, 140 vehicles)
  for (const ringDef of [
    { r: 445.5, dir: 1, count: 70 },
    { r: 454.5, dir: -1, count: 70 }
  ]) {
    for (let i = 0; i < ringDef.count; i++) {
      groundCars.push({
        isRing: true,
        r: ringDef.r,
        dir: ringDef.dir,
        y: 1.25,
        angle0: (i / ringDef.count) * Math.PI * 2 + rng() * 0.04,
        angSpeed: (18 + rng() * 8) / ringDef.r
      });
    }
  }

  // Build paired lamp geometry (left + right beam dots spaced 1.1m across car width)
  const lampL = new THREE.BoxGeometry(0.65, 0.28, 0.34).toNonIndexed();
  lampL.translate(0, 0, -0.55);
  const lampR = new THREE.BoxGeometry(0.65, 0.28, 0.34).toNonIndexed();
  lampR.translate(0, 0, 0.55);
  const pairLampGeo = BufferGeometryUtils.mergeGeometries([lampL, lampR], false);
  lampL.dispose();
  lampR.dispose();

  const headLampMat = new THREE.MeshBasicMaterial({
    color: 0xffe4aa,
    transparent: true,
    opacity: 0.94,
    blending: THREE.AdditiveBlending,
    depthWrite: false
  });
  const tailLampMat = new THREE.MeshBasicMaterial({
    color: 0xff2248,
    transparent: true,
    opacity: 0.92,
    blending: THREE.AdditiveBlending,
    depthWrite: false
  });
  const headInst = new THREE.InstancedMesh(pairLampGeo, headLampMat, groundCars.length);
  const tailInst = new THREE.InstancedMesh(pairLampGeo, tailLampMat, groundCars.length);
  headInst.frustumCulled = false;
  tailInst.frustumCulled = false;
  group.add(headInst, tailInst);

  // C. Strictly 3 Patrol Airships MAX on the entire map
  const MAX_AIRSHIPS = 3;
  const airshipHullMat = new THREE.MeshStandardMaterial({ color: 0x151d2a, metalness: 0.78, roughness: 0.34 });
  const airshipTrimMat = new THREE.MeshBasicMaterial({ color: 0x00e5ff });
  const airshipAmberMat = new THREE.MeshBasicMaterial({ color: 0xffb244 });
  const airshipConeMat = createLightConeMaterial({ opacity: 0.085, colorHex: 0x8be9ff });
  const airshipConeGeo = new THREE.CylinderGeometry(0.45, 7.5, 48, 14, 1, true);
  airshipConeGeo.translate(0, -24, 0);

  const airshipConfigs = [
    { z: -38, y: 82, dir: 1, span: 560, offset: -140, speed: 9.5 },
    { z: 42, y: 94, dir: -1, span: 560, offset: 95, speed: 8.5 },
    { z: -98, y: 108, dir: 1, span: 620, offset: 40, speed: 7.8 }
  ].slice(0, MAX_AIRSHIPS);

  const patrolAirships = airshipConfigs.map((cfg, idx) => {
    const ship = new THREE.Group();
    const envGeo = new THREE.SphereGeometry(1, 20, 12);
    envGeo.scale(10.5, 2.3, 2.3);
    ship.add(new THREE.Mesh(envGeo, airshipHullMat));

    const gondola = new THREE.Mesh(new THREE.BoxGeometry(6.8, 1.35, 1.8), airshipHullMat);
    gondola.position.y = -2.45;
    ship.add(gondola);

    // Tail fins
    const vFin = new THREE.Mesh(new THREE.BoxGeometry(3.2, 3.6, 0.16), airshipHullMat);
    vFin.position.set(-cfg.dir * 8.4, 0, 0);
    ship.add(vFin);
    const hFin = new THREE.Mesh(new THREE.BoxGeometry(3.2, 0.16, 3.6), airshipHullMat);
    hFin.position.set(-cfg.dir * 8.4, 0, 0);
    ship.add(hFin);

    const trim = new THREE.Mesh(
      new THREE.BoxGeometry(15.5, 0.16, 4.7),
      idx % 2 === 0 ? airshipTrimMat : airshipAmberMat
    );
    ship.add(trim);

    const cone = new THREE.Mesh(airshipConeGeo, airshipConeMat);
    cone.position.y = -3.0;
    cone.rotation.z = cfg.dir * 0.28;
    ship.add(cone);

    group.add(ship);
    return { mesh: ship, cone, cfg, phase: idx * 2.1 };
  });

  // D. Small Flocks of Distant Atmospheric Drones (4 flocks x 8 = 32 micro-drones, 1 draw call)
  const droneFlocks = [
    { cx: -195, cy: 62, cz: -140, rx: 42, rz: 28, speed: 0.24 },
    { cx: 148, cy: 52, cz: 190, rx: 32, rz: 48, speed: -0.22 },
    { cx: 240, cy: 76, cz: -165, rx: 48, rz: 36, speed: 0.19 },
    { cx: -210, cy: 68, cz: 195, rx: 38, rz: 44, speed: -0.21 }
  ];
  const drones = [];
  for (let f = 0; f < droneFlocks.length; f++) {
    const fl = droneFlocks[f];
    for (let d = 0; d < 8; d++) {
      drones.push({
        flock: fl,
        phase: d * 0.35 + f * 1.7,
        offX: (rng() - 0.5) * 14,
        offY: (rng() - 0.5) * 6,
        offZ: (rng() - 0.5) * 14,
        isAmber: d % 3 === 0
      });
    }
  }
  const droneMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
  const droneInst = new THREE.InstancedMesh(new THREE.BoxGeometry(0.55, 0.22, 0.55), droneMat, drones.length);
  const dCol = new THREE.Color();
  drones.forEach((dr, i) => {
    dCol.setHex(dr.isAmber ? 0xffaa3a : 0x2de2ff);
    droneInst.setColorAt(i, dCol);
  });
  if (droneInst.instanceColor) droneInst.instanceColor.needsUpdate = true;
  droneInst.frustumCulled = false;
  group.add(droneInst);

  const dummy = new THREE.Object3D();
  function updateBatch(inst, list, time, speedMul) {
    for (let i = 0; i < list.length; i++) {
      const a = list[i];
      const travel = a.offset + time * a.speed * speedMul * a.dir;
      const half = a.span * 0.5;
      const pos = ((((travel + half) % a.span) + a.span) % a.span) - half;

      const bob = Math.sin(time * 2.2 + a.bobPhase) * 0.55;
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

      // Update paired ground headlights & taillights (boulevard + КАД ring road)
      for (let i = 0; i < groundCars.length; i++) {
        const c = groundCars[i];
        let cx, cz, yaw;
        if (c.isRing) {
          const ang = c.angle0 + time * c.angSpeed * speedMul * c.dir;
          cx = Math.cos(ang) * c.r;
          cz = Math.sin(ang) * c.r;
          yaw = c.dir > 0 ? -ang - Math.PI / 2 : -ang + Math.PI / 2;
        } else {
          const travel = c.offset + time * c.speed * speedMul * c.dir;
          const half = c.span * 0.5;
          const pos = ((((travel + half) % c.span) + c.span) % c.span) - half + c.centerOffset;
          if (c.axis === 'x') {
            cx = pos;
            cz = c.baseZ;
            yaw = c.dir > 0 ? 0 : Math.PI;
          } else {
            cx = c.baseX;
            cz = pos;
            yaw = c.dir > 0 ? -Math.PI / 2 : Math.PI / 2;
          }
        }
        const fx = Math.cos(yaw) * 1.45;
        const fz = -Math.sin(yaw) * 1.45;
        dummy.scale.set(1, 1, 1);
        dummy.rotation.set(0, yaw, 0);
        dummy.position.set(cx + fx, c.y, cz + fz);
        dummy.updateMatrix();
        headInst.setMatrixAt(i, dummy.matrix);

        dummy.position.set(cx - fx, c.y, cz - fz);
        dummy.updateMatrix();
        tailInst.setMatrixAt(i, dummy.matrix);
      }
      headInst.instanceMatrix.needsUpdate = true;
      tailInst.instanceMatrix.needsUpdate = true;

      airshipConeMat.uniforms.uTime.value = time;
      for (const s of patrolAirships) {
        const travel = s.offset + time * s.cfg.speed * speedMul * s.cfg.dir;
        const half = s.cfg.span * 0.5;
        const px = ((((travel + half) % s.cfg.span) + s.cfg.span) % s.cfg.span) - half;
        s.mesh.position.set(px, s.cfg.y + Math.sin(time * 0.9 + s.phase) * 1.1, s.cfg.z);
        s.cone.rotation.x = Math.sin(time * 0.65 + s.phase) * 0.18;
      }

      dummy.scale.set(1, 1, 1);
      for (let i = 0; i < drones.length; i++) {
        const dr = drones[i];
        const a = time * dr.flock.speed + dr.phase;
        dummy.position.set(
          dr.flock.cx + Math.cos(a) * dr.flock.rx + dr.offX,
          dr.flock.cy + Math.sin(time * 1.4 + dr.phase) * 2.2 + dr.offY,
          dr.flock.cz + Math.sin(a) * dr.flock.rz + dr.offZ
        );
        dummy.rotation.set(0, -a, 0);
        dummy.updateMatrix();
        droneInst.setMatrixAt(i, dummy.matrix);
      }
      droneInst.instanceMatrix.needsUpdate = true;
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
   6. GPU-DRIVEN SOFT NOCTURNAL RAINDROPS + ATMOSPHERIC MIST LAYER
   ============================================================================ */
export function buildNeonRain() {
  const rainGroup = new THREE.Group();
  rainGroup.name = 'City_NeonRain';

  const count = 2600;
  const rng = createRng(772077);

  const positions = new Float32Array(count * 2 * 3);
  const speeds = new Float32Array(count * 2);
  const phases = new Float32Array(count * 2);
  const tints = new Float32Array(count * 2);
  const offsetsY = new Float32Array(count * 2);
  const alongs = new Float32Array(count * 2);

  for (let i = 0; i < count; i++) {
    const x = (rng() - 0.5) * 440 + 10;
    const y = rng() * 170;
    const z = (rng() - 0.5) * 340;
    const speed = 64 + rng() * 38;
    const phase = rng();
    const tint = rng();
    const len = 0.65 + rng() * 0.85;

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
    alongs[i0] = 0;
    alongs[i1] = 1;
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geo.setAttribute('aSpeed', new THREE.BufferAttribute(speeds, 1));
  geo.setAttribute('aPhase', new THREE.BufferAttribute(phases, 1));
  geo.setAttribute('aTint', new THREE.BufferAttribute(tints, 1));
  geo.setAttribute('aOffsetY', new THREE.BufferAttribute(offsetsY, 1));
  geo.setAttribute('aAlong', new THREE.BufferAttribute(alongs, 1));

  const mat = createNeonRainMaterial();
  const rainLines = new THREE.LineSegments(geo, mat);
  rainLines.frustumCulled = false;
  rainGroup.add(rainLines);

  // Subtle low-lying nocturnal rain mist drifting above wet boulevard & Esil river
  const mistCount = 48;
  const mistGeo = new THREE.PlaneGeometry(1, 1);
  const mistMat = createRainMistMaterial();
  const mistInst = new THREE.InstancedMesh(mistGeo, mistMat, mistCount);
  mistInst.frustumCulled = false;

  const mistData = new Float32Array(mistCount * 3);
  const mDummy = new THREE.Object3D();
  const mColor = new THREE.Color();

  for (let i = 0; i < mistCount; i++) {
    const mx = -140 + (i / mistCount) * 350 + (rng() - 0.5) * 18;
    const mz = (rng() - 0.5) * 110;
    const my = 2.8 + rng() * 8.5;
    const scaleW = 24 + rng() * 22;
    const scaleH = 7 + rng() * 6;

    mDummy.position.set(mx, my, mz);
    mDummy.rotation.set(0, (rng() - 0.5) * 0.9, 0);
    mDummy.scale.set(scaleW, scaleH, 1);
    mDummy.updateMatrix();
    mistInst.setMatrixAt(i, mDummy.matrix);

    const isRiver = Math.abs(mx - 148) < 28;
    mColor.setHex(isRiver ? 0x4b8aa6 : (i % 3 === 0 ? 0x3f7b96 : 0x5c6f88));
    mistInst.setColorAt(i, mColor);

    mistData[i * 3 + 0] = rng() * 6.28;
    mistData[i * 3 + 1] = 0.06 + rng() * 0.08;
    mistData[i * 3 + 2] = 0.032 + rng() * 0.020;
  }
  mistGeo.setAttribute('aMistData', new THREE.InstancedBufferAttribute(mistData, 3));
  mistInst.instanceMatrix.needsUpdate = true;
  if (mistInst.instanceColor) mistInst.instanceColor.needsUpdate = true;
  rainGroup.add(mistInst);

  return {
    mesh: rainGroup,
    shaderMaterials: [mistMat],
    update(time, rainIntensity = 0.78, accentHex = 0x5ccbe6, horizonHex = 0xdba264) {
      mat.uniforms.uTime.value = time;
      mat.uniforms.uRainIntensity.value = rainIntensity;
      mat.uniforms.uColorA.value.setHex(accentHex);
      mat.uniforms.uColorB.value.setHex(horizonHex);
      mistMat.uniforms.uTime.value = time;
      mistMat.uniforms.uRainIntensity.value = rainIntensity;
    }
  };
}
