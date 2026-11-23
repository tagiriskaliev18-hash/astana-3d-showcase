/**
 * Astana -> Night City 2077
 * Living Urban Systems:
 * - InstancedMesh Procedural Megacity Skyline Filler + Rooftop Beacons
 * - Giant Animated Holographic Mega-Billboards
 * - Multi-Tier Flying AV Spinner Traffic & Ground Boulevard Traffic Streams
 * - Sweeping Volumetric Searchlight Beams
 * - GPU-Driven Neon Rain Streaks
 */
import * as THREE from 'three';
import {
  createPBRSkyscraperMaterial,
  createHoloBillboardMaterial,
  createSearchlightMaterial,
  createNeonRainMaterial
} from './shaders.js';
import { createAllBillboardTextures } from './textures.js';

// Deterministic seeded PRNG so the skyline layout is always curated & balanced
function createRng(seed = 2077) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

const EXCLUSION_CIRCLES = [
  { x: 0, z: 0, r: 32 }, // Baiterek
  { x: -116, z: 0, r: 46 }, // Khan Shatyr
  { x: -48, z: -58, r: 38 }, // Abu Dhabi Plaza
  { x: -46, z: 72, r: 44 }, // Nur Alem
  { x: 108, z: 0, r: 54 }, // Ak Orda ceremonial riverfront plaza (clear colonnade!)
  { x: 188, z: 0, r: 46 }, // Pyramid
  { x: 44, z: -48, r: 32 }, // Emerald Towers
  { x: -4, z: -64, r: 28 }, // Northern Lights
  { x: 34, z: 62, r: 28 } // Triumph of Astana
];

function isExcluded(x, z) {
  // Keep Nurzhol Boulevard ceremonial axis open
  if (Math.abs(z) < 28 && x > -150 && x < 230) return true;
  // Keep Esil River & embankments clear
  if (x > 122 && x < 172) return true;
  // Keep SW establishing overview camera foreground cleanly open so boulevard + all 6 landmarks breathe!
  if (x > -178 && x < -54 && z > 26 && z < 150) return true;
  for (const c of EXCLUSION_CIRCLES) {
    const dx = x - c.x;
    const dz = z - c.z;
    if (dx * dx + dz * dz < c.r * c.r) return true;
  }
  return false;
}

/* ============================================================================
   1. PROCEDURAL MEGACITY FILLER BLOCKS (InstancedMesh + GLSL Window Matrix)
   ============================================================================ */
export function buildMegacityBlocks(pbr) {
  const group = new THREE.Group();
  group.name = 'City_Megablocks';
  const rng = createRng(20771997);

  const placements = [];

  // Structured urban grid districts flanking Nurzhol Boulevard (North & South) + East Bank
  for (let gx = -260; gx <= 310; gx += 22) {
    for (let gz = -220; gz <= 220; gz += 22) {
      const x = gx + (rng() - 0.5) * 7;
      const z = gz + (rng() - 0.5) * 7;
      if (isExcluded(x, z)) continue;

      const distFromCenter = Math.hypot(x, z);
      if (distFromCenter > 315) continue;

      // Keep SW establishing foreground terrace lower so all 6 landmarks soar above it
      const inSwForeground = x < -65 && x > -185 && z > 30 && z < 150;
      // Keep north-side skyline dramatic & tall as Night City backdrop!
      const inNorthBackdrop = z < -30 && x > -160 && x < 120;
      // Right bank behind Pyramid lower & wider
      const inEastBank = x > 170;

      let h;
      if (inSwForeground) {
        h = 12 + rng() * 20;
      } else if (inNorthBackdrop) {
        h = 34 + rng() * 68;
      } else if (inEastBank) {
        h = 18 + rng() * 44;
      } else if (Math.abs(z) < 52 && Math.abs(x) < 95) {
        // Flanking canyon blocks right along Nurzhol Boulevard (medium-tall canyon walls)
        h = 26 + rng() * 36;
      } else {
        h = 18 + rng() * 54;
      }

      const w = 10 + rng() * 9.5;
      const d = 10 + rng() * 9.5;
      const seed = rng();
      const accent = rng();

      placements.push({ x, z, w, h, d, seed, accent });
    }
  }

  // Add sculpted architectural setback crown tiers on ~50% of tall megatowers for rich Night City silhouettes!
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
    tintHex: 0xbfd0e2,
    uvScaleX: 24,
    uvScaleY: 54
  });
  const buildingsInst = new THREE.InstancedMesh(boxGeo, buildingMat, count);
  buildingsInst.castShadow = false;
  buildingsInst.receiveShadow = true;

  // Per-instance dark glass architectural tint variation (charcoal, cool blue-steel, bronze-slate!)
  const instTint = new THREE.Color();
  const paletteHex = [0x9eb4cc, 0x8ea8b8, 0xb8c4d4, 0x7c96a8, 0xbcb0a0, 0x8aa2be];
  const dummy = new THREE.Object3D();
  const roofTowers = [];
  const tallAntennas = [];
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
    }
  }
  buildingsInst.instanceMatrix.needsUpdate = true;
  if (buildingsInst.instanceColor) buildingsInst.instanceColor.needsUpdate = true;
  group.add(buildingsInst);

  // Rooftop HVAC mechanical penthouses / cooling units with real photoscanned metal PBR
  const mechMat = new THREE.MeshStandardMaterial({
    color: 0x3b4454,
    map: pbr.metal.albedo,
    normalMap: pbr.metal.normal,
    roughnessMap: pbr.metal.rough,
    metalness: 0.78,
    roughness: 0.52,
    envMapIntensity: 1.3
  });
  const hvacInst = new THREE.InstancedMesh(
    new THREE.BoxGeometry(1, 1, 1),
    mechMat,
    roofTowers.length
  );
  roofTowers.forEach((p, idx) => {
    const hw = p.w * (0.28 + p.seed * 0.16);
    const hd = p.d * (0.28 + (1 - p.seed) * 0.16);
    const hh = 1.6 + p.seed * 2.2;
    dummy.position.set(p.x + (p.seed - 0.5) * 1.4, p.topY + hh * 0.5, p.z);
    dummy.scale.set(hw, hh, hd);
    dummy.updateMatrix();
    hvacInst.setMatrixAt(idx, dummy.matrix);
  });
  group.add(hvacInst);

  // Rooftop spires / communication antennae & red aviation beacons on tall megablocks
  const antMat = new THREE.MeshStandardMaterial({ color: 0x5c6b7c, metalness: 0.86, roughness: 0.28 });
  const beaconMat = new THREE.MeshBasicMaterial({ color: 0xe61c34 });
  const antInst = new THREE.InstancedMesh(
    new THREE.CylinderGeometry(0.08, 0.22, 12, 5),
    antMat,
    tallAntennas.length
  );
  const beaconInst = new THREE.InstancedMesh(
    new THREE.SphereGeometry(0.36, 6, 6),
    beaconMat,
    tallAntennas.length
  );

  tallAntennas.forEach((p, i) => {
    const spireScale = 0.75 + p.seed * 0.7;
    const spireH = 12 * spireScale;
    dummy.position.set(p.x, p.topY + spireH * 0.5, p.z);
    dummy.scale.set(1, spireScale, 1);
    dummy.updateMatrix();
    antInst.setMatrixAt(i, dummy.matrix);

    dummy.position.set(p.x, p.topY + spireH + 0.2, p.z);
    dummy.scale.set(1, 1, 1);
    dummy.updateMatrix();
    beaconInst.setMatrixAt(i, dummy.matrix);
  });
  group.add(antInst, beaconInst);

  return {
    group,
    count,
    update(time, cyber) {
      buildingMat.userData.customUniforms.uTime.value = time;
      buildingMat.userData.customUniforms.uCyber.value = cyber;
      buildingMat.emissiveIntensity = THREE.MathUtils.lerp(0.62, 1.38, cyber);
      const blink = 0.45 + 0.55 * (Math.sin(time * 3.8) > 0 ? 1 : 0.2);
      beaconMat.color.setRGB(1.25 * blink, 0.08 * blink, 0.16 * blink);
    }
  };
}

/* ============================================================================
   2. GIANT ANIMATED HOLOGRAPHIC MEGA-BILLBOARDS
   ============================================================================ */
export function buildHoloBillboards() {
  const group = new THREE.Group();
  group.name = 'City_HoloBillboards';

  const textures = createAllBillboardTextures();
  const byId = Object.fromEntries(textures.map((t) => [t.id, t]));

  // Carefully curated placements framing Abu Dhabi Plaza, Nurzhol Canyon, Khan Shatyr, Nur Alem & Esil River
  const specs = [
    // Abu Dhabi Plaza colossal vertical & crown holos (angled subtly toward SW overview & canyon!)
    { tex: 'qazcorp', pos: [-55, 86, -46], rotY: -0.32, w: 17, h: 35 },
    { tex: 'baiterek_net', pos: [-35, 72, -46], rotY: -0.22, w: 14, h: 29 },
    { tex: 'astana_2077', pos: [-48, 126, -46], rotY: -0.28, w: 34, h: 16 },
    // Emerald Towers & North Skyline
    { tex: 'expo_grid', pos: [44, 76, -36], rotY: -0.38, w: 28, h: 14 },
    { tex: 'samruk_bio', pos: [26, 52, -38], rotY: -0.35, w: 13, h: 27 },
    { tex: 'esil_syndicate', pos: [68, 56, -36], rotY: -0.45, w: 14, h: 29 },
    // Nurzhol Boulevard Street Canyon flanks (razor-sharp legibility from both overview & canyon!)
    { tex: 'khantech', pos: [-74, 29, -27], rotY: -0.42, w: 11, h: 23 },
    { tex: 'noir_kumys', pos: [-54, 24, 27], rotY: -0.85, w: 10, h: 21 },
    { tex: 'steppe_av', pos: [-24, 34, -30], rotY: -0.25, w: 24, h: 12 },
    { tex: 'baiterek_net', pos: [26, 28, -28], rotY: -0.35, w: 11, h: 23 },
    { tex: 'astana_2077', pos: [50, 26, 28], rotY: Math.PI + 0.35, w: 24, h: 12 },
    { tex: 'qazcorp', pos: [14, 28, 30], rotY: -0.65, w: 11, h: 22 },
    // Khan Shatyr West Node (cleanly flanking without occluding the iconic tilted tent!)
    { tex: 'khantech', pos: [-106, 48, -36], rotY: -0.25, w: 15, h: 31 },
    { tex: 'steppe_av', pos: [-74, 34, 36], rotY: -0.58, w: 24, h: 12 },
    // Nur Alem EXPO South Sector
    { tex: 'expo_grid', pos: [-12, 40, 74], rotY: -0.55, w: 26, h: 13 },
    // Esil Riverfront & Right Bank (facing River & Ak Orda cleanly — never mirrored!)
    { tex: 'esil_syndicate', pos: [118, 46, -46], rotY: 0.42, w: 14, h: 30 },
    { tex: 'samruk_bio', pos: [112, 40, -56], rotY: 0.65, w: 13, h: 27 },
    { tex: 'astana_2077', pos: [184, 52, -46], rotY: -0.42, w: 30, h: 15 }
  ];

  const materials = [];
  specs.forEach((s, idx) => {
    const texObj = byId[s.tex] || textures[idx % textures.length];
    const mat = createHoloBillboardMaterial(texObj.texture, idx * 0.37);
    materials.push(mat);

    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(s.w, s.h), mat);
    mesh.position.set(s.pos[0], s.pos[1], s.pos[2]);
    mesh.rotation.y = s.rotY;
    mesh.userData.baseY = s.pos[1];
    mesh.userData.phase = idx * 1.1;
    group.add(mesh);
  });

  return {
    group,
    update(time, cyber) {
      const visible = cyber > 0.14;
      group.visible = visible;
      if (!visible) return;
      for (let i = 0; i < materials.length; i++) {
        materials[i].uniforms.uTime.value = time;
        materials[i].uniforms.uCyber.value = cyber;
      }
      // Subtle floating hover on sky holograms
      group.children.forEach((m) => {
        m.position.y = m.userData.baseY + Math.sin(time * 0.9 + m.userData.phase) * 0.45;
      });
    }
  };
}

/* ============================================================================
   3. MULTI-TIER FLYING AV SPINNER TRAFFIC + GROUND BOULEVARD TRAFFIC
   ============================================================================ */
export function buildFlyingTraffic() {
  const group = new THREE.Group();
  group.name = 'City_Traffic';
  const rng = createRng(9099);

  // Build aerial AV lanes weaving through Astana Night City at multiple altitudes
  const aerialAgents = [];
  const laneDefs = [
    // East-West Sky-Highways flanking Baiterek & Nurzhol Boulevard
    { axis: 'x', z: -22, y: 24, dir: 1, span: 440, count: 18 },
    { axis: 'x', z: 22, y: 31, dir: -1, span: 440, count: 18 },
    { axis: 'x', z: -34, y: 48, dir: 1, span: 460, count: 16 },
    { axis: 'x', z: 36, y: 56, dir: -1, span: 460, count: 16 },
    { axis: 'x', z: -12, y: 74, dir: 1, span: 480, count: 14 },
    { axis: 'x', z: 14, y: 86, dir: -1, span: 480, count: 12 },
    // North-South Cross-City Skyways (over Esil River & Midtown)
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

  // Ground Boulevard & River Bridge traffic streams (visible in both Reality Dusk & Night City)
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

  // Additive glowing light-trail ribbons for blazing Night City traffic feel
  const trailGeo = new THREE.BoxGeometry(1, 0.34, 0.42);
  const cyanMat = new THREE.MeshBasicMaterial({
    color: 0x00f0ff,
    transparent: true,
    opacity: 0.92,
    blending: THREE.AdditiveBlending,
    depthWrite: false
  });
  const crimsonMat = new THREE.MeshBasicMaterial({
    color: 0xff0044,
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

  const dummy = new THREE.Object3D();

  function updateBatch(inst, list, time, cyber, speedMul) {
    const aerialScale = THREE.MathUtils.smoothstep(cyber, 0.12, 0.85);
    for (let i = 0; i < list.length; i++) {
      const a = list[i];
      const travel = a.offset + time * a.speed * speedMul * a.dir;
      const half = a.span * 0.5;
      const pos = ((((travel + half) % a.span) + a.span) % a.span) - half;

      const s = a.isGround ? 1.0 : aerialScale;
      if (s < 0.01) {
        dummy.scale.set(0.0001, 0.0001, 0.0001);
        dummy.position.set(0, -50, 0);
        dummy.updateMatrix();
        inst.setMatrixAt(i, dummy.matrix);
        continue;
      }

      const bob = a.isGround ? 0 : Math.sin(time * 2.2 + a.bobPhase) * 0.55;
      if (a.axis === 'x') {
        dummy.position.set(pos, a.y + bob, a.baseZ);
        dummy.rotation.set(0, 0, 0);
      } else {
        dummy.position.set(a.baseX, a.y + bob, pos);
        dummy.rotation.set(0, Math.PI / 2, 0);
      }
      dummy.scale.set(a.len * s, s, s);
      dummy.updateMatrix();
      inst.setMatrixAt(i, dummy.matrix);
    }
    inst.instanceMatrix.needsUpdate = true;
  }

  return {
    group,
    update(time, cyber, speedMul = 1.0) {
      cyanMat.color.setHex(0xffe9b5).lerp(new THREE.Color(0x00f0ff), cyber);
      crimsonMat.color.setHex(0xff3b30).lerp(new THREE.Color(0xff0044), cyber);
      updateBatch(cyanInst, cyanAgents, time, cyber, speedMul);
      updateBatch(crimsonInst, crimsonAgents, time, cyber, speedMul);
    }
  };
}

/* ============================================================================
   4. VOLUMETRIC SWEEPING SEARCHLIGHT BEAMS
   ============================================================================ */
export function buildSearchlights() {
  const group = new THREE.Group();
  group.name = 'City_Searchlights';

  // Open cylinder cone tapering from emitter base up into the smog clouds
  const coneGeo = new THREE.CylinderGeometry(16, 1.4, 210, 16, 1, true);
  coneGeo.translate(0, 105, 0);

  const configs = [
    { pos: [-52, 10, -58], color: 0x6cd8ee, rx: 0.22, rz: -0.18, speed: 0.28, phase: 0.0 },
    { pos: [-38, 10, -58], color: 0xe6b45a, rx: -0.18, rz: 0.24, speed: 0.24, phase: 1.4 },
    { pos: [0, 3, -24], color: 0x6cd8ee, rx: 0.26, rz: 0.14, speed: 0.26, phase: 2.1 },
    { pos: [0, 3, 24], color: 0xd8a254, rx: -0.24, rz: -0.18, speed: 0.30, phase: 0.7 },
    { pos: [-116, 8, -22], color: 0x5cc4de, rx: 0.18, rz: 0.28, speed: 0.22, phase: 3.3 },
    { pos: [-46, 6, 88], color: 0x52d4c2, rx: -0.25, rz: 0.15, speed: 0.28, phase: 4.0 },
    { pos: [108, 6, -26], color: 0x72d4ee, rx: 0.2, rz: -0.24, speed: 0.26, phase: 1.9 },
    { pos: [108, 6, 26], color: 0xe6ba62, rx: -0.22, rz: -0.2, speed: 0.22, phase: 5.1 },
    { pos: [188, 6, -24], color: 0xe6ba62, rx: 0.18, rz: -0.26, speed: 0.2, phase: 2.8 },
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
    update(time, cyber, boost = 1.0) {
      const active = cyber > 0.1 && boost > 0.02;
      group.visible = active;
      if (!active) return;
      for (const b of beams) {
        b.mat.uniforms.uCyber.value = cyber;
        b.mat.uniforms.uBoost.value = boost;
        b.mat.uniforms.uTime.value = time;
        b.mesh.rotation.x = b.cfg.rx + Math.sin(time * b.cfg.speed + b.cfg.phase) * 0.22;
        b.mesh.rotation.z = b.cfg.rz + Math.cos(time * b.cfg.speed * 0.8 + b.cfg.phase) * 0.24;
      }
    }
  };
}

/* ============================================================================
   5. GPU-DRIVEN FALLING NEON RAIN STREAKS (3,800 streaks, 1 draw call)
   ============================================================================ */
export function buildNeonRain() {
  const count = 3800;
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
    const speed = 72 + rng() * 48;
    const phase = rng();
    const tint = rng();
    const len = 3.2 + rng() * 3.4;

    const i0 = i * 2;
    const i1 = i * 2 + 1;

    // Both vertices share anchor (x, y, z); top vertex uses aOffsetY = len so modulo wrap never stretches!
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
    update(time, cyber, rainIntensity = 1.0, accentHex = 0x00e8ff, horizonHex = 0xff2a85) {
      rainLines.visible = cyber > 0.14 && rainIntensity > 0.02;
      if (!rainLines.visible) return;
      mat.uniforms.uTime.value = time;
      mat.uniforms.uCyber.value = cyber;
      mat.uniforms.uRainIntensity.value = rainIntensity;
      mat.uniforms.uColorA.value.setHex(accentHex);
      mat.uniforms.uColorB.value.setHex(horizonHex);
    }
  };
}
