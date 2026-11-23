/**
 * Astana -> Night City 2077
 * Pass 3: Photorealistic PBR Architectural Builders for All Iconic Astana Landmarks
 * Every surface uses real photoscanned PBR albedo/normal/roughness/emissive maps
 * and reflects the real 32-bit Shanghai Bund Night HDRI via scene.environment.
 */
import * as THREE from 'three';
import * as BufferGeometryUtils from 'three/addons/utils/BufferGeometryUtils.js';
import {
  createPBRSkyscraperMaterial,
  createEsilRiverMaterial,
  createWetRoadMaterial
} from './shaders.js';
import { cloneTiledPBR } from './pbrAssets.js';

function mergeSafe(geometries) {
  const normalized = geometries.map((g) => {
    const nonIndexed = g.index ? g.toNonIndexed() : g.clone();
    if (!nonIndexed.attributes.normal) nonIndexed.computeVertexNormals();
    if (!nonIndexed.attributes.uv) {
      const count = nonIndexed.attributes.position.count;
      nonIndexed.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(count * 2), 2));
    }
    return nonIndexed;
  });
  const merged = BufferGeometryUtils.mergeGeometries(normalized, false);
  normalized.forEach((g) => g.dispose());
  return merged;
}

function makeMetalMat(pbr, { color = 0xb8c4d4, roughness = 0.42, metalness = 0.86, env = 1.6, rx = 2, ry = 2 } = {}) {
  const t = cloneTiledPBR(pbr.metal, rx, ry);
  return new THREE.MeshStandardMaterial({
    color,
    map: t.albedo,
    normalMap: t.normal,
    normalScale: new THREE.Vector2(0.65, 0.65),
    roughnessMap: t.rough,
    roughness,
    metalness,
    envMapIntensity: env
  });
}

function makeConcreteMat(pbr, { color = 0x6c7584, roughness = 1.0, metalness = 0.08, env = 0.35, rx = 3, ry = 3 } = {}) {
  const t = cloneTiledPBR(pbr.concrete, rx, ry);
  return new THREE.MeshStandardMaterial({
    color,
    map: t.albedo,
    normalMap: t.normal,
    normalScale: new THREE.Vector2(0.85, 0.85),
    roughnessMap: t.rough,
    roughness,
    metalness,
    envMapIntensity: env
  });
}

function makePlazaMarbleMat(pbr, { color = 0x76808e, roughness = 1.0, metalness = 0.06, env = 0.32, rx = 4, ry = 4 } = {}) {
  const t = cloneTiledPBR(pbr.marble, rx, ry);
  return new THREE.MeshStandardMaterial({
    color,
    map: t.albedo,
    normalMap: t.normal,
    normalScale: new THREE.Vector2(0.75, 0.75),
    roughnessMap: t.rough,
    roughness,
    metalness,
    envMapIntensity: env
  });
}

/* ============================================================================
   1. BAITEREK TOWER (Центр бульвара Нуржол · X=0, Z=0)
   ============================================================================ */
export function buildBaiterek(pbr) {
  const group = new THREE.Group();
  group.name = 'Landmark_Baiterek';

  const plazaMat = makePlazaMarbleMat(pbr, { color: 0x454e5c, roughness: 1.0, env: 0.24, rx: 5, ry: 5 });
  const step1 = new THREE.Mesh(new THREE.CylinderGeometry(20, 22, 1.4, 8), plazaMat);
  step1.position.y = 0.7;
  step1.receiveShadow = true;
  group.add(step1);

  const step2 = new THREE.Mesh(new THREE.CylinderGeometry(14.5, 16, 1.6, 8), plazaMat);
  step2.position.y = 2.2;
  step2.receiveShadow = true;
  group.add(step2);

  // Subtle recessed reflecting ring light around Baiterek base
  const baseGlowMat = new THREE.MeshStandardMaterial({
    color: 0x00d8f0,
    emissive: 0x00d0e8,
    emissiveIntensity: 1.25,
    roughness: 0.18,
    metalness: 0.3
  });
  const poolRing = new THREE.Mesh(new THREE.TorusGeometry(17.5, 0.24, 10, 48), baseGlowMat);
  poolRing.rotation.x = Math.PI / 2;
  poolRing.position.y = 1.45;
  group.add(poolRing);

  // 18 iconic flared brushed-steel tree-of-life curved ribs (merged)
  const ribGeos = [];
  const neonStripGeos = [];
  const ribCount = 18;
  for (let i = 0; i < ribCount; i++) {
    const angle = (i / ribCount) * Math.PI * 2;
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    const pts = [
      new THREE.Vector3(cos * 10.6, 2.8, sin * 10.6),
      new THREE.Vector3(cos * 6.2, 11.5, sin * 6.2),
      new THREE.Vector3(cos * 3.7, 23.0, sin * 3.7),
      new THREE.Vector3(cos * 4.4, 33.5, sin * 4.4),
      new THREE.Vector3(cos * 8.6, 42.5, sin * 8.6),
      new THREE.Vector3(cos * 10.3, 47.8, sin * 10.3),
      new THREE.Vector3(cos * 9.4, 51.8, sin * 9.4)
    ];
    const curve = new THREE.CatmullRomCurve3(pts);
    ribGeos.push(new THREE.TubeGeometry(curve, 26, 0.34, 6, false));

    if (i % 3 === 0) {
      const nPts = pts.map((p) => new THREE.Vector3(p.x * 1.03, p.y, p.z * 1.03));
      neonStripGeos.push(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(nPts), 22, 0.11, 5, false));
    }
  }

  for (const c of [
    { y: 12, r: 5.9 },
    { y: 23, r: 3.75 },
    { y: 34, r: 4.55 },
    { y: 41.5, r: 8.2 },
    { y: 47.5, r: 10.2 }
  ]) {
    const t = new THREE.TorusGeometry(c.r, 0.28, 8, 36);
    t.rotateX(Math.PI / 2);
    t.translate(0, c.y, 0);
    ribGeos.push(t);
  }

  const ribMat = makeMetalMat(pbr, { color: 0xd4dde8, roughness: 0.34, metalness: 0.84, env: 1.75, rx: 3, ry: 8 });
  const trunkMesh = new THREE.Mesh(mergeSafe(ribGeos), ribMat);
  trunkMesh.castShadow = true;
  trunkMesh.receiveShadow = true;
  group.add(trunkMesh);

  const trunkNeonMat = new THREE.MeshStandardMaterial({
    color: 0x00d8f0,
    emissive: 0x00d0e8,
    emissiveIntensity: 1.45,
    roughness: 0.2
  });
  const trunkNeonMesh = new THREE.Mesh(mergeSafe(neonStripGeos), trunkNeonMat);
  group.add(trunkNeonMesh);

  // Glazed panoramic lift core shaft
  const shaftMat = new THREE.MeshPhysicalMaterial({
    color: 0x102030,
    emissive: 0x09344c,
    emissiveIntensity: 0.55,
    roughness: 0.16,
    metalness: 0.85,
    clearcoat: 1.0,
    envMapIntensity: 1.9
  });
  const shaft = new THREE.Mesh(new THREE.CylinderGeometry(2.15, 2.35, 42, 20), shaftMat);
  shaft.position.y = 23.5;
  group.add(shaft);

  const liftRingMat = new THREE.MeshBasicMaterial({ color: 0xffd15c });
  const liftRing = new THREE.Mesh(new THREE.TorusGeometry(2.45, 0.16, 8, 24), liftRingMat);
  liftRing.rotation.x = Math.PI / 2;
  liftRing.position.y = 18;
  group.add(liftRing);

  // GOLDEN CHAMELEON SAMRUK SPHERE (Physically reflective golden glass with real HDRI specular!)
  const sphereMat = new THREE.MeshPhysicalMaterial({
    color: 0xe6ad34,
    emissive: 0xc97b14,
    emissiveIntensity: 0.72,
    metalness: 0.90,
    roughness: 0.15,
    clearcoat: 1.0,
    clearcoatRoughness: 0.12,
    normalMap: pbr.metal.normal,
    normalScale: new THREE.Vector2(0.18, 0.18),
    envMapIntensity: 2.3
  });
  const sphere = new THREE.Mesh(new THREE.IcosahedronGeometry(8.4, 3), sphereMat);
  sphere.position.y = 48.0;
  sphere.castShadow = true;
  group.add(sphere);

  const cageMat = new THREE.MeshBasicMaterial({
    color: 0xdca444,
    wireframe: true,
    transparent: true,
    opacity: 0.28
  });
  const sphereCage = new THREE.Mesh(new THREE.IcosahedronGeometry(8.54, 2), cageMat);
  sphereCage.position.y = 48.0;
  group.add(sphereCage);

  // Refined restrained 2077 holographic orbital data rings
  const holoRingGroup = new THREE.Group();
  holoRingGroup.position.y = 48.0;

  const ring1Mat = new THREE.MeshBasicMaterial({
    color: 0x00d8f0,
    transparent: true,
    opacity: 0.58,
    blending: THREE.AdditiveBlending,
    depthWrite: false
  });
  const holoRing1 = new THREE.Mesh(new THREE.TorusGeometry(13.2, 0.15, 8, 64), ring1Mat);
  holoRing1.rotation.x = Math.PI / 2.35;
  holoRingGroup.add(holoRing1);

  const ring2Mat = new THREE.MeshBasicMaterial({
    color: 0xffc842,
    transparent: true,
    opacity: 0.52,
    blending: THREE.AdditiveBlending,
    depthWrite: false
  });
  const holoRing2 = new THREE.Mesh(new THREE.TorusGeometry(15.6, 0.12, 8, 64), ring2Mat);
  holoRing2.rotation.x = Math.PI / 1.7;
  holoRing2.rotation.y = 0.6;
  holoRingGroup.add(holoRing2);
  group.add(holoRingGroup);

  // Subtle focused vertical energy spire beam
  const beamMat = new THREE.MeshBasicMaterial({
    color: 0x45d8f0,
    transparent: true,
    opacity: 0.14,
    blending: THREE.AdditiveBlending,
    depthWrite: false
  });
  const skyBeam = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 1.05, 185, 12, 1, true), beamMat);
  skyBeam.position.y = 56 + 92.5;
  group.add(skyBeam);

  const orbLight = new THREE.PointLight(0xffaa2b, 26, 95, 1.5);
  orbLight.position.set(0, 48, 0);
  group.add(orbLight);

  return {
    group,
    update(time, cyber) {
      liftRing.position.y = 10 + (Math.sin(time * 0.65) * 0.5 + 0.5) * 29;
      sphereMat.emissiveIntensity = THREE.MathUtils.lerp(0.24, 0.92 + Math.sin(time * 2.0) * 0.12, cyber);
      orbLight.intensity = THREE.MathUtils.lerp(16, 32, cyber);
      shaftMat.emissiveIntensity = THREE.MathUtils.lerp(0.15, 0.62, cyber);

      ribMat.color.setHex(0xd4dde8).lerp(new THREE.Color(0x9cb4c8), cyber * 0.35);
      trunkNeonMesh.visible = cyber > 0.05;
      trunkNeonMat.emissiveIntensity = cyber * 1.35;
      baseGlowMat.emissive.setHex(0xdca048).lerp(new THREE.Color(0x00d0e8), cyber);
      baseGlowMat.emissiveIntensity = THREE.MathUtils.lerp(0.32, 1.25, cyber);

      const ringScale = THREE.MathUtils.smoothstep(cyber, 0.12, 0.95);
      holoRingGroup.visible = ringScale > 0.01;
      holoRingGroup.scale.setScalar(0.6 + ringScale * 0.4);
      holoRing1.rotation.z = time * 0.48;
      holoRing2.rotation.z = -time * 0.32;
      ring1Mat.opacity = ringScale * 0.56;
      ring2Mat.opacity = ringScale * 0.48;

      skyBeam.visible = cyber > 0.2;
      beamMat.opacity = THREE.MathUtils.smoothstep(cyber, 0.2, 1.0) * (0.14 + 0.04 * Math.sin(time * 3.0));
    }
  };
}

/* ============================================================================
   2. KHAN SHATYR (Западная ось · X=-116, Z=0 · Наклонный шатёр 15°)
      Photorealistic Smoked Architectural Glass / ETFE Tent + Warm Illuminated Inner Core
      (ZERO bubblegum pink!)
   ============================================================================ */
export function buildKhanShatyr(pbr) {
  const group = new THREE.Group();
  group.name = 'Landmark_KhanShatyr';
  group.position.set(-116, 0, 0);

  const concreteMat = makeConcreteMat(pbr, { color: 0x5c6472, roughness: 0.72, env: 1.0, rx: 6, ry: 2 });
  const baseDisc = new THREE.Mesh(new THREE.CylinderGeometry(31, 33, 2.4, 40), concreteMat);
  baseDisc.position.y = 1.2;
  baseDisc.scale.set(1.08, 1, 0.92);
  baseDisc.receiveShadow = true;
  group.add(baseDisc);

  const upperBase = new THREE.Mesh(new THREE.CylinderGeometry(28.2, 29.8, 4.4, 40), concreteMat);
  upperBase.position.y = 4.6;
  upperBase.scale.set(1.08, 1, 0.92);
  upperBase.castShadow = true;
  group.add(upperBase);

  // Recessed glazed retail arcade wrapping the podium (using photorealistic mullioned warm window map!)
  const arcadeTex = pbr.palaceWindow.clone();
  arcadeTex.wrapS = THREE.RepeatWrapping;
  arcadeTex.wrapT = THREE.RepeatWrapping;
  arcadeTex.repeat.set(28, 1);
  arcadeTex.needsUpdate = true;
  const arcadeMat = new THREE.MeshStandardMaterial({
    color: 0xd8d0c4,
    map: arcadeTex,
    emissive: new THREE.Color(0xffbd62),
    emissiveMap: arcadeTex,
    emissiveIntensity: 0.95,
    roughness: 0.18,
    metalness: 0.65,
    envMapIntensity: 1.6
  });
  const arcadeBand = new THREE.Mesh(new THREE.CylinderGeometry(29.2, 29.5, 2.2, 40, 1, true), arcadeMat);
  arcadeBand.position.y = 4.6;
  arcadeBand.scale.set(1.08, 1, 0.92);
  group.add(arcadeBand);

  // Slim restrained cyan architectural rim ring along upper terrace edge
  const rimNeonMat = new THREE.MeshStandardMaterial({
    color: 0x00d8f0,
    emissive: 0x00d0e8,
    emissiveIntensity: 1.35,
    roughness: 0.2
  });
  const terraceRim = new THREE.Mesh(new THREE.TorusGeometry(28.5, 0.18, 8, 56), rimNeonMat);
  terraceRim.rotation.x = Math.PI / 2;
  terraceRim.scale.set(1.08, 0.92, 1);
  terraceRim.position.y = 6.85;
  group.add(terraceRim);

  // Subtle recessed architectural interior mall galleries visible softly through smoked ETFE glass!
  const coreSlabMat = makeConcreteMat(pbr, { color: 0x3b352d, roughness: 0.72, env: 0.6, rx: 4, ry: 4 });
  const coreFloorMat = new THREE.MeshStandardMaterial({
    color: 0xf0be72,
    emissive: 0xc97d24,
    emissiveIntensity: 0.95,
    roughness: 0.25
  });
  for (let lvl = 0; lvl < 4; lvl++) {
    const r = 20.5 - lvl * 3.8;
    const y = 9.0 + lvl * 5.2;
    const deck = new THREE.Mesh(new THREE.CylinderGeometry(r, r * 1.03, 0.75, 32), coreSlabMat);
    deck.position.set(lvl * 1.4, y, 0);
    deck.scale.set(1.05, 1, 0.9);
    group.add(deck);

    // Warm golden glowing architectural gallery railing ring around each deck perimeter
    const railRing = new THREE.Mesh(new THREE.TorusGeometry(r, 0.22, 8, 40), coreFloorMat);
    railRing.rotation.x = Math.PI / 2;
    railRing.position.set(lvl * 1.4, y + 0.48, 0);
    railRing.scale.set(1.05, 0.9, 1);
    group.add(railRing);
  }

  // Sculpted 15-degree tilted translucent dark smoked architectural glass / ETFE shell
  const tentH = 66;
  const tiltX = 17.5;
  const tentGeo = new THREE.CylinderGeometry(1.15, 27.2, tentH, 48, 22, true);
  const pos = tentGeo.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const y = pos.getY(i);
    const z = pos.getZ(i);
    const t = (y + tentH / 2) / tentH;
    const linearR = THREE.MathUtils.lerp(27.2, 1.15, t);
    const targetR = THREE.MathUtils.lerp(27.2, 1.15, Math.pow(t, 0.68));
    const scale = linearR > 0.001 ? targetR / linearR : 1.0;
    pos.setXYZ(i, x * scale * 1.08 + Math.pow(t, 1.15) * tiltX, y + tentH / 2 + 6.5, z * scale * 0.92);
  }
  tentGeo.computeVertexNormals();

  const tentRough = cloneTiledPBR(pbr.metal, 6, 4);
  const tentMat = new THREE.MeshPhysicalMaterial({
    color: 0x1d2b36,
    emissive: 0x2e1c0a,
    emissiveIntensity: 0.32,
    roughnessMap: tentRough.rough,
    normalMap: tentRough.normal,
    normalScale: new THREE.Vector2(0.38, 0.38),
    roughness: 0.34,
    metalness: 0.28,
    clearcoat: 0.92,
    clearcoatRoughness: 0.16,
    envMapIntensity: 1.85,
    transparent: true,
    opacity: 0.80,
    side: THREE.DoubleSide
  });
  const tentMesh = new THREE.Mesh(tentGeo, tentMat);
  tentMesh.castShadow = true;
  group.add(tentMesh);

  // 32 Structural Dark-Chrome Steel Tension Cable Ribs + Horizontal Tension Rings (merged)
  const cableGeos = [];
  const apex = new THREE.Vector3(tiltX, 6.5 + tentH, 0);
  const cables = 32;
  for (let i = 0; i < cables; i++) {
    const a = (i / cables) * Math.PI * 2;
    const pts = [];
    for (let s = 0; s <= 10; s++) {
      const t = s / 10;
      const r = THREE.MathUtils.lerp(27.4, 1.18, Math.pow(t, 0.68));
      pts.push(
        new THREE.Vector3(
          Math.cos(a) * r * 1.08 + Math.pow(t, 1.15) * tiltX,
          6.5 + t * tentH,
          Math.sin(a) * r * 0.92
        )
      );
    }
    cableGeos.push(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 14, 0.16, 4, false));
  }
  const cableMat = makeMetalMat(pbr, { color: 0x94a3b8, roughness: 0.32, metalness: 0.88, env: 1.8 });
  group.add(new THREE.Mesh(mergeSafe(cableGeos), cableMat));

  // Internal heavy steel tripod mast
  const tripodGeos = [];
  for (let i = 0; i < 3; i++) {
    const a = (i / 3) * Math.PI * 2 + 0.4;
    const start = new THREE.Vector3(Math.cos(a) * 10, 5, Math.sin(a) * 10);
    tripodGeos.push(new THREE.TubeGeometry(new THREE.LineCurve3(start, apex), 4, 0.72, 6, false));
  }
  group.add(new THREE.Mesh(mergeSafe(tripodGeos), makeMetalMat(pbr, { color: 0x2c3644, roughness: 0.4 })));

  // Delicate translucent cyan telemetry scan ring climbing the tent in 2077 mode
  const scanRingMat = new THREE.MeshBasicMaterial({
    color: 0x38d8f0,
    transparent: true,
    opacity: 0.48,
    blending: THREE.AdditiveBlending,
    depthWrite: false
  });
  const scanRing = new THREE.Mesh(new THREE.TorusGeometry(1, 0.022, 8, 48), scanRingMat);
  scanRing.rotation.x = Math.PI / 2;
  group.add(scanRing);

  // Top Steel Spire & Restrained Cyan Apex Beacon
  const spireMat = new THREE.MeshStandardMaterial({
    color: 0xcbd5e1,
    emissive: 0x00d8f0,
    emissiveIntensity: 1.4,
    metalness: 0.9,
    roughness: 0.18
  });
  const spire = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.52, 11, 10), spireMat);
  spire.position.set(apex.x + 1.1, apex.y + 5.2, 0);
  spire.rotation.z = -0.22;
  group.add(spire);

  // Warm interior architectural lantern glow radiating outward from within the ETFE tent
  const tentLight = new THREE.PointLight(0xffa940, 32, 105, 1.5);
  tentLight.position.set(tiltX * 0.25, 22, 0);
  group.add(tentLight);

  return {
    group,
    update(time, cyber) {
      // Real Astana Dusk: warm translucent champagne-ivory ETFE -> Night City: dark smoked charcoal-teal glass w/ warm amber interior!
      tentMat.color.setHex(0xd4c6ae).lerp(new THREE.Color(0x1f2e3b), cyber);
      tentMat.emissive.setHex(0x6b4b24).lerp(new THREE.Color(0x4a2a0e), cyber);
      tentMat.emissiveIntensity = THREE.MathUtils.lerp(0.22, 0.46, cyber);

      coreFloorMat.emissiveIntensity = THREE.MathUtils.lerp(0.65, 1.25, cyber);
      arcadeMat.emissiveIntensity = THREE.MathUtils.lerp(0.65, 1.05, cyber);
      rimNeonMat.emissive.setHex(0xdca248).lerp(new THREE.Color(0x00d0e8), cyber);
      rimNeonMat.emissiveIntensity = THREE.MathUtils.lerp(0.25, 1.45, cyber);
      spireMat.emissiveIntensity = THREE.MathUtils.lerp(0.2, 1.45, cyber);
      tentLight.intensity = THREE.MathUtils.lerp(18, 36, cyber);

      scanRing.visible = cyber > 0.15;
      const t = (time * 0.18) % 1;
      const r = THREE.MathUtils.lerp(27.6, 1.3, Math.pow(t, 0.68));
      scanRing.position.set(Math.pow(t, 1.15) * tiltX, 6.5 + t * tentH, 0);
      scanRing.scale.set(r * 1.09, r * 0.93, 12);
      scanRingMat.opacity = Math.sin(t * Math.PI) * 0.44 * cyber;
    }
  };
}

/* ============================================================================
   3. ABU DHABI PLAZA (Северная мегабашня 311м · X=-48, Z=-58)
      Real 2048x2048 PBR Skyscraper Curtain-Wall Glass + Brushed Metal Fins
   ============================================================================ */
export function buildAbuDhabiPlaza(pbr) {
  const group = new THREE.Group();
  group.name = 'Landmark_AbuDhabiPlaza';
  group.position.set(-48, 0, -58);

  const mainMat = createPBRSkyscraperMaterial(pbr, {
    isInstanced: false,
    tintHex: 0xb6cae0,
    seed: 0.14,
    uvScaleX: 22,
    uvScaleY: 54
  });
  const wingMat = createPBRSkyscraperMaterial(pbr, {
    isInstanced: false,
    tintHex: 0xa2b8d0,
    seed: 0.61,
    uvScaleX: 20,
    uvScaleY: 52
  });

  const podiumMat = makeConcreteMat(pbr, { color: 0x3b4454, roughness: 0.55, metalness: 0.35, rx: 6, ry: 2 });
  const podium = new THREE.Mesh(new THREE.BoxGeometry(52, 11, 28), podiumMat);
  podium.position.set(0, 5.5, 0);
  podium.receiveShadow = true;
  podium.castShadow = true;
  group.add(podium);

  const tiers = [
    { w: 19, h: 146, d: 16, x: -5, z: -1, mat: mainMat },
    { w: 16, h: 112, d: 15, x: 11.5, z: 1, mat: wingMat },
    { w: 15, h: 86, d: 14, x: -20, z: 2, mat: wingMat },
    { w: 14, h: 58, d: 13, x: 23, z: 3, mat: mainMat }
  ];

  for (const t of tiers) {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(t.w, t.h, t.d), t.mat);
    mesh.position.set(t.x, t.h / 2 + 8, t.z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    group.add(mesh);
  }

  const finMat = makeMetalMat(pbr, { color: 0xcbd5e1, roughness: 0.24, metalness: 0.92, env: 2.0, rx: 1, ry: 10 });
  const finNeonMat = new THREE.MeshStandardMaterial({
    color: 0x38d8f0,
    emissive: 0x22c8e8,
    emissiveIntensity: 1.35,
    roughness: 0.15
  });
  const amberNeonMat = new THREE.MeshStandardMaterial({
    color: 0xf5b832,
    emissive: 0xe69f20,
    emissiveIntensity: 1.25,
    roughness: 0.15
  });

  const finPositions = [
    [-14.6, 82, 7.1, 148],
    [4.6, 82, 7.1, 148],
    [-14.6, 82, -9.1, 148],
    [4.6, 82, -9.1, 148],
    [19.6, 65, 8.6, 114],
    [-27.6, 52, 9.1, 88]
  ];
  for (let i = 0; i < finPositions.length; i++) {
    const [fx, fy, fz, fh] = finPositions[i];
    const fin = new THREE.Mesh(new THREE.BoxGeometry(0.65, fh, 1.3), finMat);
    fin.position.set(fx, fy, fz);
    group.add(fin);

    const neon = new THREE.Mesh(
      new THREE.BoxGeometry(0.24, fh * 0.98, 0.28),
      i < 4 ? finNeonMat : amberNeonMat
    );
    neon.position.set(fx, fy, fz + (fz > 0 ? 0.65 : -0.65));
    group.add(neon);
  }

  const crown = new THREE.Mesh(new THREE.BoxGeometry(19.6, 14, 2.2), finMat);
  crown.position.set(-5, 158, -1);
  group.add(crown);

  const spire1 = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.55, 22, 8), finMat);
  spire1.position.set(-9, 170, -1);
  group.add(spire1);

  const spire2 = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.42, 16, 8), finMat);
  spire2.position.set(-1, 167, -1);
  group.add(spire2);

  const beaconMat = new THREE.MeshBasicMaterial({ color: 0xff1e38 });
  const beacon1 = new THREE.Mesh(new THREE.SphereGeometry(0.75, 10, 10), beaconMat);
  beacon1.position.set(-9, 181.5, -1);
  group.add(beacon1);
  const beacon2 = new THREE.Mesh(new THREE.SphereGeometry(0.6, 10, 10), beaconMat);
  beacon2.position.set(-1, 175.5, -1);
  group.add(beacon2);

  const heliRing = new THREE.Mesh(
    new THREE.RingGeometry(4.2, 5.0, 24),
    new THREE.MeshBasicMaterial({ color: 0xf5c438, side: THREE.DoubleSide })
  );
  heliRing.rotation.x = -Math.PI / 2;
  heliRing.position.set(11.5, 120.3, 1);
  group.add(heliRing);

  return {
    group,
    update(time, cyber) {
      mainMat.userData.customUniforms.uTime.value = time;
      mainMat.userData.customUniforms.uCyber.value = cyber;
      mainMat.emissiveIntensity = THREE.MathUtils.lerp(0.75, 1.4, cyber);
      wingMat.userData.customUniforms.uTime.value = time;
      wingMat.userData.customUniforms.uCyber.value = cyber;
      wingMat.emissiveIntensity = THREE.MathUtils.lerp(0.7, 1.32, cyber);

      finNeonMat.emissiveIntensity = THREE.MathUtils.lerp(0.1, 1.45, cyber);
      amberNeonMat.emissiveIntensity = THREE.MathUtils.lerp(0.08, 1.35, cyber);
      const blink = Math.sin(time * 4.5) > 0.15 ? 1 : 0.15;
      beaconMat.color.setRGB(1.3 * blink, 0.08 * blink, 0.16 * blink);
    }
  };
}

/* ============================================================================
   4. NUR ALEM / EXPO SPHERE (Южная ось · X=-46, Z=72)
      Real Stone-Tile Terraced Plaza + Hollow Reflective Glass Crescent Wings
   ============================================================================ */
export function buildNurAlem(pbr) {
  const group = new THREE.Group();
  group.name = 'Landmark_NurAlem';
  group.position.set(-46, 0, 72);

  const stoneMat = makePlazaMarbleMat(pbr, { color: 0x606b7c, roughness: 0.48, env: 1.2, rx: 6, ry: 6 });
  const roofConcreteMat = makeConcreteMat(pbr, { color: 0x3b4452, roughness: 0.72, rx: 4, ry: 4 });
  const brushedSteelMat = makeMetalMat(pbr, { color: 0x7b899b, roughness: 0.3, metalness: 0.88, env: 1.75 });

  const plazaRingGlowMat = new THREE.MeshStandardMaterial({
    color: 0x38d8f0,
    emissive: 0x1fc4e0,
    emissiveIntensity: 1.15,
    roughness: 0.2
  });

  const tier1 = new THREE.Mesh(new THREE.CylinderGeometry(31.5, 32.8, 1.0, 48), stoneMat);
  tier1.position.y = 0.5;
  tier1.receiveShadow = true;
  group.add(tier1);

  const tier2 = new THREE.Mesh(new THREE.CylinderGeometry(25.5, 26.5, 1.1, 48), stoneMat);
  tier2.position.y = 1.55;
  tier2.receiveShadow = true;
  group.add(tier2);

  const atriumPedestal = new THREE.Mesh(new THREE.CylinderGeometry(14.5, 16.2, 3.2, 36), brushedSteelMat);
  atriumPedestal.position.y = 3.2;
  group.add(atriumPedestal);

  const ringTrim1 = new THREE.Mesh(new THREE.TorusGeometry(31.6, 0.14, 8, 64), plazaRingGlowMat);
  ringTrim1.rotation.x = Math.PI / 2;
  ringTrim1.position.y = 1.05;
  group.add(ringTrim1);

  const ringTrim2 = new THREE.Mesh(new THREE.TorusGeometry(25.6, 0.14, 8, 64), plazaRingGlowMat);
  ringTrim2.rotation.x = Math.PI / 2;
  ringTrim2.position.y = 2.15;
  group.add(ringTrim2);

  // Hollow curved annular glass EXPO crescent pavilions with reflective PBR curtain wall
  const wingGlassMat = new THREE.MeshPhysicalMaterial({
    color: 0x162638,
    emissive: 0x0b2a42,
    emissiveIntensity: 0.42,
    metalness: 0.85,
    roughness: 0.14,
    clearcoat: 1.0,
    envMapIntensity: 2.0
  });
  const wingMullionGeos = [];

  function buildCrescentPavilion(startAngle, endAngle) {
    const innerR = 31.2;
    const outerR = 37.6;
    const wingH = 7.4;

    const shape = new THREE.Shape();
    shape.absarc(0, 0, outerR, startAngle, endAngle, false);
    shape.absarc(0, 0, innerR, endAngle, startAngle, true);
    shape.closePath();

    const bodyGeo = new THREE.ExtrudeGeometry(shape, { depth: wingH, bevelEnabled: false, curveSegments: 28 });
    bodyGeo.rotateX(-Math.PI / 2);
    const bodyMesh = new THREE.Mesh(bodyGeo, wingGlassMat);
    bodyMesh.position.y = 0.2;
    bodyMesh.castShadow = true;
    bodyMesh.receiveShadow = true;
    group.add(bodyMesh);

    const roofShape = new THREE.Shape();
    roofShape.absarc(0, 0, outerR + 0.6, startAngle - 0.02, endAngle + 0.02, false);
    roofShape.absarc(0, 0, innerR - 0.6, endAngle + 0.02, startAngle - 0.02, true);
    roofShape.closePath();
    const roofGeo = new THREE.ExtrudeGeometry(roofShape, { depth: 0.85, bevelEnabled: false, curveSegments: 28 });
    roofGeo.rotateX(-Math.PI / 2);
    const roofMesh = new THREE.Mesh(roofGeo, roofConcreteMat);
    roofMesh.position.y = wingH + 0.2;
    group.add(roofMesh);

    const steps = 12;
    for (let i = 0; i <= steps; i++) {
      const a = THREE.MathUtils.lerp(startAngle, endAngle, i / steps);
      for (const r of [innerR - 0.08, outerR + 0.08]) {
        const col = new THREE.BoxGeometry(0.28, wingH + 0.3, 0.28);
        col.rotateY(-a);
        col.translate(Math.cos(a) * r, wingH * 0.5 + 0.2, -Math.sin(a) * r);
        wingMullionGeos.push(col);
      }
    }
  }

  buildCrescentPavilion(-0.62, 0.62);
  buildCrescentPavilion(Math.PI - 0.62, Math.PI + 0.62);
  group.add(new THREE.Mesh(mergeSafe(wingMullionGeos), brushedSteelMat));

  // Inner architectural exhibition decks + subtle quantum core
  const innerCoreMat = new THREE.MeshStandardMaterial({
    color: 0x38d8f0,
    emissive: 0x16b8d8,
    emissiveIntensity: 1.15,
    roughness: 0.2
  });
  const innerCore = new THREE.Mesh(new THREE.IcosahedronGeometry(5.8, 2), innerCoreMat);
  innerCore.position.y = 25.5;
  group.add(innerCore);

  const deckMat = new THREE.MeshStandardMaterial({
    color: 0x8cc2dc,
    emissive: 0x1890b8,
    emissiveIntensity: 0.65,
    roughness: 0.28
  });
  for (let i = -2; i <= 2; i++) {
    const dy = i * 5.0;
    const dr = Math.sqrt(Math.max(1, 20.5 * 20.5 - dy * dy)) * 0.86;
    const deck = new THREE.Mesh(new THREE.TorusGeometry(dr, 0.2, 8, 42), deckMat);
    deck.rotation.x = Math.PI / 2;
    deck.position.y = 25.5 + dy;
    group.add(deck);
  }

  // Outer Monumental Geodesic Architectural Glass Sphere reflecting real 32-bit HDRI
  const glassMat = new THREE.MeshPhysicalMaterial({
    color: 0x183452,
    emissive: 0x051828,
    emissiveIntensity: 0.25,
    metalness: 0.86,
    roughness: 0.12,
    clearcoat: 1.0,
    clearcoatRoughness: 0.08,
    envMapIntensity: 2.3,
    transparent: true,
    opacity: 0.66
  });
  const outerSphere = new THREE.Mesh(new THREE.IcosahedronGeometry(22, 3), glassMat);
  outerSphere.position.y = 25.5;
  outerSphere.castShadow = true;
  group.add(outerSphere);

  const latticeMat = new THREE.MeshBasicMaterial({
    color: 0x62b4cc,
    wireframe: true,
    transparent: true,
    opacity: 0.26
  });
  const lattice = new THREE.Mesh(new THREE.IcosahedronGeometry(22.14, 2), latticeMat);
  lattice.position.y = 25.5;
  group.add(lattice);

  const turbineMat = new THREE.MeshStandardMaterial({
    color: 0x94a3b8,
    emissive: 0x18b89a,
    emissiveIntensity: 0.8,
    metalness: 0.85,
    roughness: 0.2
  });
  const turbine1 = new THREE.Mesh(new THREE.TorusGeometry(3.8, 0.22, 8, 24), turbineMat);
  turbine1.position.set(-4.3, 46.0, 0);
  group.add(turbine1);
  const turbine2 = new THREE.Mesh(new THREE.TorusGeometry(3.8, 0.22, 8, 24), turbineMat);
  turbine2.position.set(4.3, 46.0, 0);
  group.add(turbine2);

  const eqRingMat = new THREE.MeshBasicMaterial({
    color: 0x28d8c8,
    transparent: true,
    opacity: 0.45,
    blending: THREE.AdditiveBlending,
    depthWrite: false
  });
  const eqRing = new THREE.Mesh(new THREE.TorusGeometry(27.8, 0.18, 8, 72), eqRingMat);
  eqRing.position.y = 25.5;
  eqRing.rotation.x = Math.PI / 2.25;
  group.add(eqRing);

  const sphereLight = new THREE.PointLight(0x28c4e0, 16, 95, 1.5);
  sphereLight.position.set(0, 25.5, 0);
  group.add(sphereLight);

  return {
    group,
    update(time, cyber) {
      innerCore.rotation.y = time * 0.42;
      innerCore.rotation.x = time * 0.2;
      eqRing.rotation.z = time * 0.3;
      turbine1.rotation.z = time * 2.0;
      turbine2.rotation.z = -time * 2.0;

      const pulse = 0.5 + 0.5 * Math.sin(time * 1.8);
      glassMat.opacity = THREE.MathUtils.lerp(0.84, 0.58, cyber);
      glassMat.emissiveIntensity = THREE.MathUtils.lerp(0.08, 0.32, cyber);
      wingGlassMat.emissive.setHex(0x6c522c).lerp(new THREE.Color(0x0a344c), cyber);
      wingGlassMat.emissiveIntensity = THREE.MathUtils.lerp(0.2, 0.48, cyber);

      plazaRingGlowMat.emissive.setHex(0xdca854).lerp(new THREE.Color(0x1fc4e0), cyber);
      plazaRingGlowMat.emissiveIntensity = THREE.MathUtils.lerp(0.28, 1.15, cyber);

      innerCore.visible = cyber > 0.1;
      innerCoreMat.emissiveIntensity = THREE.MathUtils.lerp(0.15, 1.05 + pulse * 0.22, cyber);
      deckMat.emissive.setHex(0xc89a56).lerp(new THREE.Color(0x18a0c8), cyber);
      deckMat.emissiveIntensity = THREE.MathUtils.lerp(0.22, 0.65, cyber);
      latticeMat.opacity = THREE.MathUtils.lerp(0.18, 0.30, cyber);
      turbineMat.emissiveIntensity = THREE.MathUtils.lerp(0.1, 0.9, cyber);

      eqRing.visible = cyber > 0.12;
      eqRingMat.opacity = THREE.MathUtils.smoothstep(cyber, 0.12, 0.9) * 0.46;
      sphereLight.intensity = THREE.MathUtils.lerp(6, 18, cyber);
    }
  };
}

/* ============================================================================
   5. AK ORDA PRESIDENTIAL PALACE (Восточная ось · Набережная Есиля · X=108, Z=0)
      Real Photorealistic Honed Ivory Marble PBR Maps (akorda_marble_albedo/normal/rough)
      + Mullioned Warm-Interior Palace Glass Windows + Ribbed Turquoise Dome
   ============================================================================ */
export function buildAkOrda(pbr) {
  const group = new THREE.Group();
  group.name = 'Landmark_AkOrda';
  group.position.set(108, 0, 0);

  // Real 1024x1024 Honed Ivory Marble Ashlar Slabs + Sobel Normals & Roughness (matte honed stone, zero HDR glare!)
  const marbleWallTex = cloneTiledPBR(pbr.akordaMarble, 4, 2);
  const marbleMat = new THREE.MeshStandardMaterial({
    color: 0xa89f92,
    map: marbleWallTex.albedo,
    normalMap: marbleWallTex.normal,
    normalScale: new THREE.Vector2(1.0, 1.0),
    roughnessMap: marbleWallTex.rough,
    roughness: 1.0,
    metalness: 0.02,
    emissive: 0x100e0b,
    emissiveIntensity: 0.06,
    envMapIntensity: 0.12
  });

  const marbleTrimTex = cloneTiledPBR(pbr.akordaMarble, 2, 2);
  const trimMarbleMat = new THREE.MeshStandardMaterial({
    color: 0xb6ada0,
    map: marbleTrimTex.albedo,
    normalMap: marbleTrimTex.normal,
    normalScale: new THREE.Vector2(0.9, 0.9),
    roughnessMap: marbleTrimTex.rough,
    roughness: 1.0,
    metalness: 0.02,
    emissive: 0x12100c,
    emissiveIntensity: 0.08,
    envMapIntensity: 0.12
  });

  // Matte dark slate/bitumen architectural roof membrane (eliminates specular sky/bloom blowout on flat roofs)
  const roofTex = cloneTiledPBR(pbr.akordaMarble, 4, 4);
  const roofCapMat = new THREE.MeshStandardMaterial({
    color: 0x353e4a,
    map: roofTex.albedo,
    normalMap: roofTex.normal,
    normalScale: new THREE.Vector2(0.35, 0.35),
    roughness: 0.94,
    metalness: 0.06,
    envMapIntensity: 0.08
  });

  const esplanadeMat = makePlazaMarbleMat(pbr, { color: 0x464e5a, roughness: 1.0, env: 0.22, rx: 6, ry: 8 });
  const bronzeRecessMat = makeMetalMat(pbr, { color: 0x1c222c, roughness: 0.38, metalness: 0.75, env: 1.2 });
  const goldMat = new THREE.MeshPhysicalMaterial({
    color: 0xe8b948,
    emissive: 0xb87e12,
    emissiveIntensity: 0.58,
    metalness: 0.94,
    roughness: 0.16,
    clearcoat: 0.85,
    envMapIntensity: 2.2
  });

  // Grand terraced marble & stone esplanade + sweeping West & East staircases
  const baseEsplanade = new THREE.Mesh(new THREE.BoxGeometry(42, 2.2, 62), esplanadeMat);
  baseEsplanade.position.set(0, 1.1, 0);
  baseEsplanade.receiveShadow = true;
  group.add(baseEsplanade);

  const upperEsplanade = new THREE.Mesh(new THREE.BoxGeometry(36, 2.0, 56), marbleMat);
  upperEsplanade.position.set(0, 3.2, 0);
  upperEsplanade.receiveShadow = true;
  group.add(upperEsplanade);

  for (let s = 0; s < 4; s++) {
    const stepW = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.52, 24 - s * 1.4), trimMarbleMat);
    stepW.position.set(-22.5 + s * 1.5, 0.4 + s * 0.52, 0);
    group.add(stepW);
    const stepE = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.52, 22 - s * 1.4), trimMarbleMat);
    stepE.position.set(22.2 - s * 1.4, 0.4 + s * 0.52, 0);
    group.add(stepE);
  }

  // Main Marble Wings + Recessed Bronze Core + Taller Central Ceremonial Pavilion
  const wingRecess = new THREE.Mesh(new THREE.BoxGeometry(23.2, 15.4, 49.2), bronzeRecessMat);
  wingRecess.position.set(0, 12.0, 0);
  group.add(wingRecess);

  const mainBody = new THREE.Mesh(new THREE.BoxGeometry(22.6, 16.0, 50.0), marbleMat);
  mainBody.position.set(0, 12.2, 0);
  mainBody.castShadow = true;
  mainBody.receiveShadow = true;
  group.add(mainBody);

  const centerBody = new THREE.Mesh(new THREE.BoxGeometry(25.2, 21.0, 23.0), marbleMat);
  centerBody.position.set(0, 14.7, 0);
  centerBody.castShadow = true;
  group.add(centerBody);

  // Classical Cornice Ledges, Stringcourses & Stepped Pediments
  const corniceGeos = [];
  for (const hy of [9.6, 14.8, 20.1]) {
    const wingBelt = new THREE.BoxGeometry(24.4, 0.65, 51.4);
    wingBelt.translate(0, hy, 0);
    corniceGeos.push(wingBelt);
  }
  const wingCornice = new THREE.BoxGeometry(25.4, 1.0, 52.4);
  wingCornice.translate(0, 20.6, 0);
  corniceGeos.push(wingCornice);

  const centerCornice = new THREE.BoxGeometry(28.4, 1.25, 25.6);
  centerCornice.translate(0, 25.4, 0);
  corniceGeos.push(centerCornice);

  const centerAttic = new THREE.BoxGeometry(24.6, 2.2, 22.0);
  centerAttic.translate(0, 27.0, 0);
  corniceGeos.push(centerAttic);

  for (const side of [-1, 1]) {
    const pedBase = new THREE.BoxGeometry(1.6, 0.9, 17.5);
    pedBase.translate(side * 14.2, 25.8, 0);
    corniceGeos.push(pedBase);
    const pedMid = new THREE.BoxGeometry(1.5, 1.3, 12.0);
    pedMid.translate(side * 14.2, 26.8, 0);
    corniceGeos.push(pedMid);
    const pedTop = new THREE.BoxGeometry(1.4, 1.1, 6.2);
    pedTop.translate(side * 14.2, 27.9, 0);
    corniceGeos.push(pedTop);
  }
  group.add(new THREE.Mesh(mergeSafe(corniceGeos), trimMarbleMat));

  // Matte dark slate roof membrane slabs over side wings and central pavilion roof
  const wingRoofCap = new THREE.Mesh(new THREE.BoxGeometry(24.0, 0.25, 51.0), roofCapMat);
  wingRoofCap.position.set(0, 21.14, 0);
  wingRoofCap.receiveShadow = true;
  group.add(wingRoofCap);

  const centerRoofCap = new THREE.Mesh(new THREE.BoxGeometry(26.8, 0.25, 24.2), roofCapMat);
  centerRoofCap.position.set(0, 26.08, 0);
  centerRoofCap.receiveShadow = true;
  group.add(centerRoofCap);

  // 24 Slender Tapered Neoclassical Columns w/ Square Plinth Bases & Flared Capitals
  const colGeos = [];
  const colPositionsZ = [-22.5, -18.5, -14.5, -9.2, -5.6, -2.0, 2.0, 5.6, 9.2, 14.5, 18.5, 22.5];
  for (const z of colPositionsZ) {
    const isCenter = Math.abs(z) < 10.5;
    const colH = isCenter ? 19.6 : 14.8;
    for (const side of [-1, 1]) {
      const cx = side * (isCenter ? 14.2 : 12.6);
      const plinth = new THREE.BoxGeometry(1.15, 0.85, 1.15);
      plinth.translate(cx, 4.62, z);
      colGeos.push(plinth);
      const shaft = new THREE.CylinderGeometry(0.32, 0.40, colH, 12);
      shaft.translate(cx, 5.05 + colH * 0.5, z);
      colGeos.push(shaft);
      const cap = new THREE.CylinderGeometry(0.56, 0.34, 0.72, 12);
      cap.translate(cx, 5.05 + colH + 0.32, z);
      colGeos.push(cap);
      const abacus = new THREE.BoxGeometry(1.15, 0.32, 1.15);
      abacus.translate(cx, 5.05 + colH + 0.78, z);
      colGeos.push(abacus);
    }
  }
  group.add(new THREE.Mesh(mergeSafe(colGeos), trimMarbleMat));

  // PHOTOREALISTIC MULLIONED WARM-INTERIOR PALACE WINDOWS (replaces flat solid yellow blocks!)
  const winMat = new THREE.MeshStandardMaterial({
    color: 0xffe4bd,
    map: pbr.palaceWindow,
    emissive: new THREE.Color(0xffb44c),
    emissiveMap: pbr.palaceWindow,
    emissiveIntensity: 0.95,
    roughness: 0.14,
    metalness: 0.62,
    envMapIntensity: 1.75
  });
  const winGeos = [];
  const winZ = [-20.5, -16.5, -12.4, -7.4, -3.8, 0, 3.8, 7.4, 12.4, 16.5, 20.5];
  for (const z of winZ) {
    const isCenter = Math.abs(z) < 10.5;
    const tiers = isCenter ? [7.0, 12.2, 17.5, 22.0] : [7.0, 12.2, 17.2];
    for (const wy of tiers) {
      const wh = wy > 16 ? 3.2 : 3.6;
      const ww = isCenter ? 1.85 : 1.78;
      for (const side of [-1, 1]) {
        const wx = side * (isCenter ? 12.75 : 11.45);
        const pane = new THREE.BoxGeometry(0.28, wh, ww);
        pane.translate(wx, wy, z);
        winGeos.push(pane);
      }
    }
  }
  for (const wx of [-7.5, -2.5, 2.5, 7.5]) {
    for (const wy of [7.0, 12.2, 17.2]) {
      for (const sz of [-25.15, 25.15]) {
        const pane = new THREE.BoxGeometry(1.78, 3.4, 0.28);
        pane.translate(wx, wy, sz);
        winGeos.push(pane);
      }
    }
  }
  group.add(new THREE.Mesh(mergeSafe(winGeos), winMat));

  // Tall Windowed Cylindrical Rotunda Drum w/ 16 Arched Mullioned Clerestory Windows
  const drum = new THREE.Mesh(new THREE.CylinderGeometry(9.2, 9.6, 8.2, 32), marbleMat);
  drum.position.set(0, 31.8, 0);
  group.add(drum);

  const drumTrimGeos = [];
  const drumWinGeos = [];
  const drumColGeos = [];
  const dBaseRing = new THREE.CylinderGeometry(10.1, 10.3, 0.85, 32);
  dBaseRing.translate(0, 28.0, 0);
  drumTrimGeos.push(dBaseRing);
  const dTopRing = new THREE.CylinderGeometry(10.0, 9.5, 1.0, 32);
  dTopRing.translate(0, 35.8, 0);
  drumTrimGeos.push(dTopRing);

  for (let i = 0; i < 16; i++) {
    const a = (i / 16) * Math.PI * 2;
    const dw = new THREE.BoxGeometry(0.32, 4.4, 1.4);
    dw.rotateY(-a);
    dw.translate(Math.cos(a) * 9.32, 31.9, Math.sin(a) * 9.32);
    drumWinGeos.push(dw);

    const aCol = a + Math.PI / 16;
    const dc = new THREE.CylinderGeometry(0.24, 0.28, 7.2, 8);
    dc.translate(Math.cos(aCol) * 9.55, 31.9, Math.sin(aCol) * 9.55);
    drumColGeos.push(dc);
  }
  group.add(new THREE.Mesh(mergeSafe([...drumTrimGeos, ...drumColGeos]), trimMarbleMat));
  group.add(new THREE.Mesh(mergeSafe(drumWinGeos), winMat));

  // Ribbed Iconic Turquoise-Blue Glazed Dome reflecting real 32-bit HDRI
  const domeMat = new THREE.MeshPhysicalMaterial({
    color: 0x0b7bb8,
    emissive: 0x044470,
    emissiveIntensity: 0.42,
    metalness: 0.44,
    roughness: 0.22,
    clearcoat: 0.9,
    clearcoatRoughness: 0.14,
    normalMap: pbr.metal.normal,
    normalScale: new THREE.Vector2(0.22, 0.22),
    envMapIntensity: 1.8
  });
  const dome = new THREE.Mesh(
    new THREE.SphereGeometry(9.35, 32, 18, 0, Math.PI * 2, 0, Math.PI / 2),
    domeMat
  );
  dome.position.set(0, 36.1, 0);
  group.add(dome);

  const domeRibGeos = [];
  for (let i = 0; i < 16; i++) {
    const a = (i / 16) * Math.PI * 2;
    const pts = [];
    for (let s = 0; s <= 10; s++) {
      const phi = (s / 10) * (Math.PI / 2);
      pts.push(new THREE.Vector3(Math.cos(a) * 9.48 * Math.cos(phi), 36.1 + 9.48 * Math.sin(phi), Math.sin(a) * 9.48 * Math.cos(phi)));
    }
    domeRibGeos.push(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 12, 0.14, 5, false));
  }
  group.add(new THREE.Mesh(mergeSafe(domeRibGeos), goldMat));

  // Delicate translucent holographic dome grid in 2077 mode
  const holoDomeMat = new THREE.MeshBasicMaterial({
    color: 0x38d8f0,
    wireframe: true,
    transparent: true,
    opacity: 0.2,
    blending: THREE.AdditiveBlending,
    depthWrite: false
  });
  const holoDome = new THREE.Mesh(
    new THREE.SphereGeometry(9.82, 16, 10, 0, Math.PI * 2, 0, Math.PI / 2),
    holoDomeMat
  );
  holoDome.position.set(0, 36.1, 0);
  group.add(holoDome);

  // Golden Cupola Lantern + Slender Spire + Sunburst
  const lantern = new THREE.Mesh(new THREE.CylinderGeometry(1.3, 1.85, 2.4, 12), goldMat);
  lantern.position.set(0, 46.2, 0);
  group.add(lantern);
  const spire = new THREE.Mesh(new THREE.ConeGeometry(0.55, 16.5, 10), goldMat);
  spire.position.set(0, 55.4, 0);
  group.add(spire);
  const sunOrb = new THREE.Mesh(new THREE.SphereGeometry(0.95, 12, 12), goldMat);
  sunOrb.position.set(0, 63.8, 0);
  group.add(sunOrb);

  // Hollow perimeter cyan cornice edge lines
  const cyberTrimMat = new THREE.MeshStandardMaterial({
    color: 0x38d8f0,
    emissive: 0x20c8e8,
    emissiveIntensity: 0.72,
    roughness: 0.18
  });
  const trimLinesGeos = [];
  function addRectRim(w, d, y, thick = 0.2) {
    const north = new THREE.BoxGeometry(w, thick, thick);
    north.translate(0, y, -d * 0.5);
    const south = new THREE.BoxGeometry(w, thick, thick);
    south.translate(0, y, d * 0.5);
    const west = new THREE.BoxGeometry(thick, thick, d);
    west.translate(-w * 0.5, y, 0);
    const east = new THREE.BoxGeometry(thick, thick, d);
    east.translate(w * 0.5, y, 0);
    trimLinesGeos.push(north, south, west, east);
  }
  addRectRim(28.6, 25.8, 25.95, 0.22);
  addRectRim(25.6, 52.6, 21.05, 0.2);
  const t3 = new THREE.TorusGeometry(10.05, 0.12, 6, 48);
  t3.rotateX(Math.PI / 2);
  t3.translate(0, 36.2, 0);
  trimLinesGeos.push(t3);
  const cyberTrimMesh = new THREE.Mesh(mergeSafe(trimLinesGeos), cyberTrimMat);
  group.add(cyberTrimMesh);

  // Dedicated warm-gold architectural facade uplights on West & East colonnades (subtle, zero blowout!)
  const facadeLightW = new THREE.PointLight(0xffcb82, 4.5, 56, 2.0);
  facadeLightW.position.set(-20, 14, 0);
  group.add(facadeLightW);

  const facadeLightE = new THREE.PointLight(0xffcb82, 4.5, 56, 2.0);
  facadeLightE.position.set(20, 14, 0);
  group.add(facadeLightE);

  const domeLight = new THREE.PointLight(0x38c8e8, 4.0, 75, 2.0);
  domeLight.position.set(0, 48, 0);
  group.add(domeLight);

  return {
    group,
    update(time, cyber) {
      marbleMat.color.setHex(0xb8afa0).lerp(new THREE.Color(0x768290), cyber * 0.42);
      marbleMat.emissive.setHex(0x14110b).lerp(new THREE.Color(0x0a1018), cyber);
      marbleMat.emissiveIntensity = THREE.MathUtils.lerp(0.06, 0.10, cyber);

      trimMarbleMat.color.setHex(0xc4bbb0).lerp(new THREE.Color(0x828e9c), cyber * 0.38);
      trimMarbleMat.emissive.setHex(0x16120c).lerp(new THREE.Color(0x0c141d), cyber);
      trimMarbleMat.emissiveIntensity = THREE.MathUtils.lerp(0.07, 0.12, cyber);

      domeMat.emissiveIntensity = THREE.MathUtils.lerp(0.22, 0.54, cyber);
      goldMat.emissiveIntensity = THREE.MathUtils.lerp(0.32, 0.85, cyber);
      winMat.emissiveIntensity = THREE.MathUtils.lerp(0.72, 1.12, cyber);

      cyberTrimMesh.visible = cyber > 0.14;
      cyberTrimMat.emissiveIntensity = cyber * 0.72;

      holoDome.visible = cyber > 0.16;
      holoDome.rotation.y = time * 0.16;
      holoDomeMat.opacity = THREE.MathUtils.smoothstep(cyber, 0.16, 0.92) * 0.2;

      facadeLightW.color.setHex(0xffd088).lerp(new THREE.Color(0xc8dce8), cyber * 0.32);
      facadeLightE.color.setHex(0xffd088).lerp(new THREE.Color(0xc8dce8), cyber * 0.32);
      facadeLightW.intensity = THREE.MathUtils.lerp(3.0, 4.5, cyber);
      facadeLightE.intensity = THREE.MathUtils.lerp(3.0, 4.5, cyber);
      domeLight.intensity = THREE.MathUtils.lerp(2.0, 4.0, cyber);
    }
  };
}

/* ============================================================================
   6. PALACE OF PEACE & RECONCILIATION / PYRAMID (Правый берег Есиля · X=188, Z=0)
      Real Photoscanned Concrete / Granite PBR Cladding + Illuminated Glass Capstone
   ============================================================================ */
export function buildPyramid(pbr) {
  const group = new THREE.Group();
  group.name = 'Landmark_Pyramid';
  group.position.set(188, 0, 0);

  const terraceMat = makePlazaMarbleMat(pbr, { color: 0x5c6674, roughness: 0.62, rx: 6, ry: 6 });
  const plinth = new THREE.Mesh(new THREE.BoxGeometry(58, 4.5, 58), terraceMat);
  plinth.position.y = 2.25;
  plinth.receiveShadow = true;
  group.add(plinth);

  const baseRadius = 33;
  const pyrH = 44;

  const lowerMat = makeConcreteMat(pbr, { color: 0x7a8290, roughness: 0.68, metalness: 0.16, rx: 5, ry: 4 });
  const lowerBody = new THREE.Mesh(new THREE.CylinderGeometry(9.2, baseRadius, 31.5, 4, 5), lowerMat);
  lowerBody.rotation.y = Math.PI / 4;
  lowerBody.position.y = 4.5 + 15.75;
  lowerBody.castShadow = true;
  lowerBody.receiveShadow = true;
  group.add(lowerBody);

  const gridMat = new THREE.MeshBasicMaterial({
    color: 0x7c8ea0,
    wireframe: true,
    transparent: true,
    opacity: 0.24
  });
  const lowerGrid = new THREE.Mesh(new THREE.CylinderGeometry(9.32, baseRadius + 0.16, 31.5, 4, 6), gridMat);
  lowerGrid.rotation.y = Math.PI / 4;
  lowerGrid.position.y = 4.5 + 15.75;
  group.add(lowerGrid);

  const apexMat = new THREE.MeshPhysicalMaterial({
    color: 0xf0c975,
    emissive: 0xdca028,
    emissiveIntensity: 1.05,
    roughness: 0.16,
    metalness: 0.35,
    clearcoat: 1.0,
    envMapIntensity: 1.9
  });
  const apexMesh = new THREE.Mesh(new THREE.ConeGeometry(9.2, 12.6, 4), apexMat);
  apexMesh.rotation.y = Math.PI / 4;
  apexMesh.position.y = 4.5 + 31.5 + 6.3;
  group.add(apexMesh);

  const ridgeGeos = [];
  const topPt = new THREE.Vector3(0, 4.5 + pyrH, 0);
  for (let i = 0; i < 4; i++) {
    const a = (i * Math.PI) / 2 + Math.PI / 4;
    const botPt = new THREE.Vector3(Math.cos(a) * baseRadius, 4.5, Math.sin(a) * baseRadius);
    ridgeGeos.push(new THREE.TubeGeometry(new THREE.LineCurve3(botPt, topPt), 4, 0.24, 6, false));
  }
  const collarPts = [];
  for (let i = 0; i <= 4; i++) {
    const a = ((i % 4) * Math.PI) / 2 + Math.PI / 4;
    collarPts.push(new THREE.Vector3(Math.cos(a) * 9.3, 36.0, Math.sin(a) * 9.3));
  }
  ridgeGeos.push(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(collarPts), 16, 0.2, 6, false));

  const ridgeMat = new THREE.MeshStandardMaterial({
    color: 0xf5c848,
    emissive: 0xe6ac22,
    emissiveIntensity: 1.35,
    roughness: 0.18
  });
  group.add(new THREE.Mesh(mergeSafe(ridgeGeos), ridgeMat));

  const beamMat = new THREE.MeshBasicMaterial({
    color: 0xf5c852,
    transparent: true,
    opacity: 0.14,
    blending: THREE.AdditiveBlending,
    depthWrite: false
  });
  const beam = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.95, 135, 8, 1, true), beamMat);
  beam.position.y = 4.5 + pyrH + 67.5;
  group.add(beam);

  return {
    group,
    update(time, cyber) {
      apexMat.emissive.setHex(0xd49630).lerp(new THREE.Color(0xe6b43c), cyber);
      apexMat.emissiveIntensity = THREE.MathUtils.lerp(0.55, 1.2 + Math.sin(time * 2.2) * 0.12, cyber);
      ridgeMat.emissiveIntensity = THREE.MathUtils.lerp(0.15, 1.35, cyber);
      gridMat.color.setHex(0x8898aa).lerp(new THREE.Color(0x42c4dc), cyber);
      gridMat.opacity = THREE.MathUtils.lerp(0.16, 0.34, cyber);
      beam.visible = cyber > 0.22;
      beamMat.opacity = THREE.MathUtils.smoothstep(cyber, 0.22, 1.0) * 0.15;
    }
  };
}

/* ============================================================================
   7. EMERALD TOWERS, NORTHERN LIGHTS & TRIUMPH OF ASTANA
      All upgraded to Real 2048x2048 PBR Glass Curtain-Wall Maps!
      Northern Lights cartoon pink rings REMOVED -> sleek brushed-steel parapets + restrained LED trim!
   ============================================================================ */
export function buildSecondaryAstanaLandmarks(pbr) {
  const group = new THREE.Group();
  group.name = 'Landmark_SkylineClusters';
  const pbrTowerMats = [];

  // --- EMERALD TOWERS (Изумрудный Квартал · X=44, Z=-48) ---
  const emeraldMat = createPBRSkyscraperMaterial(pbr, {
    isInstanced: false,
    tintHex: 0x72aba4,
    seed: 0.27,
    uvScaleX: 20,
    uvScaleY: 50
  });
  pbrTowerMats.push(emeraldMat);

  const emeraldGroup = new THREE.Group();
  emeraldGroup.position.set(44, 0, -48);
  const emSpecs = [
    { x: 0, z: 0, h: 108, w: 17, d: 14, shearX: 0.08 },
    { x: 18, z: 4, h: 84, w: 15, d: 13, shearX: -0.06 },
    { x: -16, z: 6, h: 64, w: 14, d: 12, shearX: 0.05 }
  ];
  const emLedMat = new THREE.MeshStandardMaterial({
    color: 0x22d8b4,
    emissive: 0x16c4a4,
    emissiveIntensity: 1.25
  });
  const darkRoofMetal = makeMetalMat(pbr, { color: 0x2a3444, roughness: 0.35, metalness: 0.88, env: 1.6 });

  for (const s of emSpecs) {
    const segs = 4;
    const segH = s.h / segs;
    for (let k = 0; k < segs; k++) {
      const box = new THREE.Mesh(
        new THREE.BoxGeometry(s.w + k * 1.15, segH - 0.3, s.d + k * 0.55),
        emeraldMat
      );
      box.position.set(s.x + k * s.shearX * 16, segH * (k + 0.5), s.z);
      box.castShadow = true;
      emeraldGroup.add(box);
    }
    const roofCap = new THREE.Mesh(new THREE.BoxGeometry(s.w + 3.5, 1.0, s.d + 1.8), darkRoofMetal);
    roofCap.position.set(s.x + 3 * s.shearX * 16, s.h + 0.4, s.z);
    emeraldGroup.add(roofCap);

    const crownStrip = new THREE.Mesh(new THREE.BoxGeometry(s.w + 3.7, 0.24, s.d + 2.0), emLedMat);
    crownStrip.position.set(s.x + 3 * s.shearX * 16, s.h + 0.92, s.z);
    emeraldGroup.add(crownStrip);
  }
  group.add(emeraldGroup);

  // --- NORTHERN LIGHTS (Северное Сияние · X=-4, Z=-64) ---
  // Cartoon pink rings REMOVED -> authentic brushed steel roof crowns & restrained cool ice-cyan architectural LEDs!
  const nlMat = createPBRSkyscraperMaterial(pbr, {
    isInstanced: false,
    tintHex: 0xa2b8d2,
    seed: 0.82,
    uvScaleX: 22,
    uvScaleY: 50
  });
  pbrTowerMats.push(nlMat);

  const nlGroup = new THREE.Group();
  nlGroup.position.set(-4, 0, -64);
  const nlTowers = [
    { x: -15, h: 68, r: 6.5 },
    { x: 0, h: 82, r: 7.2 },
    { x: 15, h: 58, r: 6.0 }
  ];
  const nlLedMat = new THREE.MeshStandardMaterial({
    color: 0xa0e8ff,
    emissive: 0x38c8e8,
    emissiveIntensity: 1.15,
    roughness: 0.18
  });
  for (const t of nlTowers) {
    const geo = new THREE.CylinderGeometry(t.r * 0.88, t.r, t.h, 20, 12);
    const p = geo.attributes.position;
    for (let i = 0; i < p.count; i++) {
      const y = p.getY(i);
      const wave = Math.sin((y / t.h) * Math.PI * 2.5) * 1.8;
      p.setX(i, p.getX(i) * 1.15 + wave);
      p.setZ(i, p.getZ(i) * 0.68);
    }
    geo.computeVertexNormals();
    const mesh = new THREE.Mesh(geo, nlMat);
    mesh.position.set(t.x, t.h / 2, 0);
    nlGroup.add(mesh);

    // Sleek dark brushed-metal rooftop mechanical parapet crown (ellipse matching wavy top!)
    const crownCap = new THREE.Mesh(
      new THREE.CylinderGeometry(t.r * 0.82, t.r * 0.88, 2.2, 20),
      darkRoofMetal
    );
    crownCap.scale.set(1.15, 1, 0.68);
    crownCap.position.set(t.x + 1.8, t.h + 1.0, 0);
    nlGroup.add(crownCap);

    // Subtle cool-white/ice-cyan rooftop beacon strip (restrained, photorealistic!)
    const ledBand = new THREE.Mesh(
      new THREE.CylinderGeometry(t.r * 0.85, t.r * 0.85, 0.26, 20, 1, true),
      nlLedMat
    );
    ledBand.scale.set(1.15, 1, 0.68);
    ledBand.position.set(t.x + 1.8, t.h + 1.85, 0);
    nlGroup.add(ledBand);
  }
  group.add(nlGroup);

  // --- TRIUMPH OF ASTANA (Триумф Астаны · X=34, Z=62) ---
  const triMat = createPBRSkyscraperMaterial(pbr, {
    isInstanced: false,
    tintHex: 0xd0bda2,
    seed: 0.44,
    uvScaleX: 20,
    uvScaleY: 46
  });
  pbrTowerMats.push(triMat);

  const triGroup = new THREE.Group();
  triGroup.position.set(34, 0, 62);
  const triTiers = [
    [26, 22, 18, 11],
    [18, 28, 15, 36],
    [11, 18, 11, 59],
    [6, 12, 6, 74]
  ];
  for (const [w, h, d, y] of triTiers) {
    const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), triMat);
    b.position.y = y;
    b.castShadow = true;
    triGroup.add(b);
  }
  const triSpireMat = new THREE.MeshPhysicalMaterial({
    color: 0xe6b948,
    emissive: 0xc98a18,
    emissiveIntensity: 0.95,
    metalness: 0.9,
    roughness: 0.18,
    envMapIntensity: 2.0
  });
  const triSpire = new THREE.Mesh(new THREE.ConeGeometry(1.3, 15, 8), triSpireMat);
  triSpire.position.y = 87;
  triGroup.add(triSpire);
  group.add(triGroup);

  return {
    group,
    update(time, cyber) {
      for (const m of pbrTowerMats) {
        m.userData.customUniforms.uTime.value = time;
        m.userData.customUniforms.uCyber.value = cyber;
        m.emissiveIntensity = THREE.MathUtils.lerp(0.68, 1.32, cyber);
      }
      emLedMat.emissiveIntensity = THREE.MathUtils.lerp(0.1, 1.25, cyber);
      nlLedMat.emissiveIntensity = THREE.MathUtils.lerp(0.1, 1.15, cyber);
      triSpireMat.emissiveIntensity = THREE.MathUtils.lerp(0.2, 1.05, cyber);
    }
  };
}

/* ============================================================================
   8. URBAN BASE, WET ASPHALT NURZHOL BOULEVARD, ESIL RIVER, BRIDGES, SKYBRIDGES & MONORAIL
      Powered by Real Poly Haven Photoscanned Asphalt, Concrete, Marble & Metal PBR Maps
   ============================================================================ */
export function buildUrbanBaseAndRiver(pbr) {
  const group = new THREE.Group();
  group.name = 'Urban_BaseAndRiver';

  const roadMat = createWetRoadMaterial(pbr);
  const riverMat = createEsilRiverMaterial(pbr.skyPano);

  // Left & Right Bank Photoscanned Wet Asphalt City Floors
  const leftGround = new THREE.Mesh(new THREE.PlaneGeometry(512, 760), roadMat);
  leftGround.rotation.x = -Math.PI / 2;
  leftGround.position.set(-124, 0, 0);
  leftGround.receiveShadow = true;
  group.add(leftGround);

  const rightGround = new THREE.Mesh(new THREE.PlaneGeometry(316, 760), roadMat);
  rightGround.rotation.x = -Math.PI / 2;
  rightGround.position.set(322, 0, 0);
  rightGround.receiveShadow = true;
  group.add(rightGround);

  // Esil River Nocturnal Mirror Water
  const riverMesh = new THREE.Mesh(new THREE.PlaneGeometry(34, 760, 1, 1), riverMat);
  riverMesh.rotation.x = -Math.PI / 2;
  riverMesh.position.set(148, -1.2, 0);
  group.add(riverMesh);

  // Real Photoscanned Concrete Embankment Walls
  const wallMat = makeConcreteMat(pbr, { color: 0x565e6d, roughness: 0.78, rx: 1, ry: 24 });
  const embNeonMat = new THREE.MeshStandardMaterial({
    color: 0x38d8f0,
    emissive: 0x1fc4e0,
    emissiveIntensity: 1.15
  });
  for (const bx of [131.5, 164.5]) {
    const wall = new THREE.Mesh(new THREE.BoxGeometry(1.4, 2.4, 760), wallMat);
    wall.position.set(bx, -0.4, 0);
    group.add(wall);
    const strip = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.24, 520), embNeonMat);
    strip.position.set(bx + (bx < 148 ? 0.7 : -0.7), 0.75, 0);
    group.add(strip);
  }

  // Arched Parabolic Steel Bridges over Esil River
  const bridgeArchMat = makeMetalMat(pbr, { color: 0xcbd5e1, roughness: 0.26, metalness: 0.88, env: 1.9 });
  bridgeArchMat.emissive = new THREE.Color(0x1cb8d8);
  bridgeArchMat.emissiveIntensity = 0.65;
  const bridgeDeckMat = makeConcreteMat(pbr, { color: 0x38404d, roughness: 0.72, rx: 4, ry: 2 });

  function createArchBridge(zPos, deckWidth, archHeight) {
    const bGroup = new THREE.Group();
    bGroup.position.set(148, 0.8, zPos);
    bGroup.add(new THREE.Mesh(new THREE.BoxGeometry(38, 1.1, deckWidth), bridgeDeckMat));

    const archGeos = [];
    for (const side of [-1, 1]) {
      const zOff = side * (deckWidth * 0.46);
      const curvePts = [];
      for (let s = 0; s <= 12; s++) {
        const u = s / 12;
        curvePts.push(new THREE.Vector3((u - 0.5) * 35, Math.sin(u * Math.PI) * archHeight, zOff));
      }
      archGeos.push(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(curvePts), 22, 0.44, 6, false));
      for (let h = 1; h < 10; h++) {
        const u = h / 10;
        const y = Math.sin(u * Math.PI) * archHeight;
        const cable = new THREE.CylinderGeometry(0.08, 0.08, y, 4);
        cable.translate((u - 0.5) * 35, y / 2, zOff);
        archGeos.push(cable);
      }
    }
    bGroup.add(new THREE.Mesh(mergeSafe(archGeos), bridgeArchMat));
    return bGroup;
  }

  group.add(createArchBridge(0, 14, 13.5));
  group.add(createArchBridge(-88, 11, 10.5));
  group.add(createArchBridge(86, 11, 10.5));

  // Nurzhol Promenade Central Terraces (Photoscanned Matte Granite Tiles) + Reflecting Pools
  const promMat = makePlazaMarbleMat(pbr, { color: 0x3a424e, roughness: 1.0, env: 0.2, rx: 10, ry: 3 });
  const promWest = new THREE.Mesh(new THREE.BoxGeometry(64, 0.7, 15), promMat);
  promWest.position.set(-54, 0.35, 0);
  group.add(promWest);

  const promEast = new THREE.Mesh(new THREE.BoxGeometry(64, 0.7, 15), promMat);
  promEast.position.set(54, 0.35, 0);
  group.add(promEast);

  const poolMat = new THREE.MeshPhysicalMaterial({
    color: 0x072638,
    emissive: 0x0a6c8c,
    emissiveIntensity: 0.85,
    roughness: 0.08,
    metalness: 0.25,
    clearcoat: 1.0,
    envMapIntensity: 2.0
  });
  for (const px of [-68, -42, 42, 68]) {
    const pool = new THREE.Mesh(new THREE.BoxGeometry(16, 0.16, 6.2), poolMat);
    pool.position.set(px, 0.76, 0);
    group.add(pool);
  }

  // 2 Sleek Cyberpunk Glazed Truss Pedestrian Skybridges (PBR Brushed Steel + Smoked Reflective Glass)
  const skybridgeGlassMat = new THREE.MeshPhysicalMaterial({
    color: 0x0b1624,
    emissive: 0x062030,
    emissiveIntensity: 0.28,
    metalness: 0.88,
    roughness: 0.12,
    clearcoat: 1.0,
    envMapIntensity: 2.1,
    transparent: true,
    opacity: 0.48
  });
  const skybridgeFrameMat = makeMetalMat(pbr, { color: 0x475569, roughness: 0.32, metalness: 0.88, env: 1.7 });
  const skybridgeFloorGlowMat = new THREE.MeshStandardMaterial({
    color: 0xffd584,
    emissive: 0x20b8d8,
    emissiveIntensity: 0.85,
    roughness: 0.25
  });
  const skybridgeCyanRailMat = new THREE.MeshStandardMaterial({
    color: 0x38d8f0,
    emissive: 0x1fc4e0,
    emissiveIntensity: 1.35,
    roughness: 0.15
  });
  const skybridgeAmberRailMat = new THREE.MeshStandardMaterial({
    color: 0xf0ad38,
    emissive: 0xdca024,
    emissiveIntensity: 1.25,
    roughness: 0.15
  });

  function buildGlazedTrussSkybridge(sx) {
    const sb = new THREE.Group();
    sb.position.set(sx, 14.2, 0);
    const span = 46;

    const glassTunnel = new THREE.Mesh(
      new THREE.CylinderGeometry(2.1, 2.1, span, 14, 1, true),
      skybridgeGlassMat
    );
    glassTunnel.rotation.x = Math.PI / 2;
    glassTunnel.scale.set(1.08, 1.0, 0.86);
    sb.add(glassTunnel);

    const deckSlab = new THREE.Mesh(new THREE.BoxGeometry(3.8, 0.48, span), skybridgeFrameMat);
    deckSlab.position.y = -1.62;
    sb.add(deckSlab);

    const floorGlow = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.12, span - 1.5), skybridgeFloorGlowMat);
    floorGlow.position.y = -1.32;
    sb.add(floorGlow);

    const trussGeos = [];
    const spine = new THREE.BoxGeometry(0.42, 0.34, span + 0.5);
    spine.translate(0, 1.85, 0);
    trussGeos.push(spine);
    for (const side of [-1, 1]) {
      const chord = new THREE.BoxGeometry(0.24, 0.24, span);
      chord.translate(side * 2.18, -0.35, 0);
      trussGeos.push(chord);
    }
    for (let i = -5; i <= 5; i++) {
      const rib = new THREE.TorusGeometry(2.26, 0.13, 6, 18);
      rib.scale(1.06, 0.86, 1.0);
      rib.translate(0, 0, i * 4.2);
      trussGeos.push(rib);
    }
    for (const sz of [-20.5, 20.5]) {
      for (const legSide of [-1, 1]) {
        const topPt = new THREE.Vector3(legSide * 1.4, -1.6, sz);
        const botPt = new THREE.Vector3(legSide * 3.1, -14.2, sz + Math.sign(sz) * 1.2);
        trussGeos.push(new THREE.TubeGeometry(new THREE.LineCurve3(botPt, topPt), 2, 0.34, 6, false));
      }
      for (const cy of [-5.2, -9.8]) {
        const brace = new THREE.BoxGeometry(4.4, 0.28, 0.32);
        brace.translate(0, cy, sz + Math.sign(sz) * 0.45);
        trussGeos.push(brace);
      }
    }
    sb.add(new THREE.Mesh(mergeSafe(trussGeos), skybridgeFrameMat));

    const railWest = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.14, span), skybridgeCyanRailMat);
    railWest.position.set(-2.0, -1.86, 0);
    sb.add(railWest);
    const railEast = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.14, span), skybridgeAmberRailMat);
    railEast.position.set(2.0, -1.86, 0);
    sb.add(railEast);

    return sb;
  }

  group.add(buildGlazedTrussSkybridge(-62));
  group.add(buildGlazedTrussSkybridge(54));

  // Boulevard Curved Streetlamps
  const lampPosts = [];
  for (let lx = -92; lx <= 88; lx += 14) {
    if (Math.abs(lx) < 22) continue;
    lampPosts.push([lx, -9.8, 1], [lx, 9.8, -1]);
  }
  const poleInst = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.1, 0.18, 6.8, 6), skybridgeFrameMat, lampPosts.length);
  const armInst = new THREE.InstancedMesh(new THREE.BoxGeometry(0.14, 0.14, 1.8), skybridgeFrameMat, lampPosts.length);
  const bulbMat = new THREE.MeshBasicMaterial({ color: 0xffd896 });
  const bulbInst = new THREE.InstancedMesh(new THREE.BoxGeometry(0.32, 0.16, 0.9), bulbMat, lampPosts.length);
  const dummy = new THREE.Object3D();
  lampPosts.forEach(([x, z, dir], idx) => {
    dummy.position.set(x, 3.4, z);
    dummy.updateMatrix();
    poleInst.setMatrixAt(idx, dummy.matrix);
    dummy.position.set(x, 6.8, z + dir * 0.7);
    dummy.updateMatrix();
    armInst.setMatrixAt(idx, dummy.matrix);
    dummy.position.set(x, 6.68, z + dir * 1.15);
    dummy.updateMatrix();
    bulbInst.setMatrixAt(idx, dummy.matrix);
  });
  group.add(poleInst, armInst, bulbInst);

  // Elevated Monorail Viaduct + Streamlined Maglev Train
  const railCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-190, 10.5, 24),
    new THREE.Vector3(-90, 10.5, 21),
    new THREE.Vector3(0, 10.5, 22),
    new THREE.Vector3(68, 10.5, 25),
    new THREE.Vector3(108, 10.5, 34),
    new THREE.Vector3(156, 10.5, 34),
    new THREE.Vector3(215, 10.5, 34)
  ]);
  group.add(new THREE.Mesh(new THREE.TubeGeometry(railCurve, 64, 0.65, 6, false), skybridgeFrameMat));

  const railGlowMat = new THREE.MeshBasicMaterial({ color: 0x38d8f0 });
  group.add(
    new THREE.Mesh(
      new THREE.TubeGeometry(
        new THREE.CatmullRomCurve3(railCurve.getPoints(24).map((p) => new THREE.Vector3(p.x, p.y + 0.62, p.z))),
        64,
        0.14,
        4,
        false
      ),
      railGlowMat
    )
  );

  const pylonGeos = [];
  for (let t = 0.06; t <= 0.94; t += 0.08) {
    const pt = railCurve.getPoint(t);
    if (pt.x > 130 && pt.x < 166) continue;
    const c = new THREE.CylinderGeometry(0.42, 0.68, pt.y, 6);
    c.translate(pt.x, pt.y / 2, pt.z);
    pylonGeos.push(c);
  }
  group.add(new THREE.Mesh(mergeSafe(pylonGeos), skybridgeFrameMat));

  const trainGroup = new THREE.Group();
  const carBodyMat = makeMetalMat(pbr, { color: 0xcbd5e1, roughness: 0.22, metalness: 0.9, env: 2.0 });
  const carNeonMat = new THREE.MeshBasicMaterial({ color: 0x38e0f8 });
  const carTailMat = new THREE.MeshBasicMaterial({ color: 0xe61e38 });
  for (let c = 0; c < 4; c++) {
    const car = new THREE.Mesh(new THREE.BoxGeometry(5.8, 1.9, 2.2), carBodyMat);
    car.position.x = (c - 1.5) * 6.4;
    trainGroup.add(car);
    const stripe = new THREE.Mesh(new THREE.BoxGeometry(5.6, 0.24, 2.32), carNeonMat);
    stripe.position.set((c - 1.5) * 6.4, 0.25, 0);
    trainGroup.add(stripe);
  }
  const headLight = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.55, 1.8), carNeonMat);
  headLight.position.set(12.6, 0, 0);
  trainGroup.add(headLight);
  const tailLight = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.55, 1.8), carTailMat);
  tailLight.position.set(-12.6, 0, 0);
  trainGroup.add(tailLight);
  group.add(trainGroup);

  const tmpPos = new THREE.Vector3();
  const tmpTan = new THREE.Vector3();

  return {
    group,
    shaderMaterials: [roadMat, riverMat],
    update(time, cyber) {
      roadMat.uniforms.uTime.value = time;
      roadMat.uniforms.uCyber.value = cyber;
      riverMat.uniforms.uTime.value = time;
      riverMat.uniforms.uCyber.value = cyber;

      embNeonMat.emissiveIntensity = THREE.MathUtils.lerp(0.12, 1.15, cyber);
      bridgeArchMat.emissive.setHex(0xd4a448).lerp(new THREE.Color(0x28c4e0), cyber);
      bridgeArchMat.emissiveIntensity = THREE.MathUtils.lerp(0.18, 0.72, cyber);
      poolMat.emissiveIntensity = THREE.MathUtils.lerp(0.18, 0.85, cyber);

      skybridgeGlassMat.emissiveIntensity = THREE.MathUtils.lerp(0.1, 0.34, cyber);
      skybridgeFloorGlowMat.emissive.setHex(0xd8a858).lerp(new THREE.Color(0x20b8d8), cyber);
      skybridgeFloorGlowMat.emissiveIntensity = THREE.MathUtils.lerp(0.28, 0.88, cyber);
      skybridgeCyanRailMat.emissive.setHex(0xd8a858).lerp(new THREE.Color(0x28d0e8), cyber);
      skybridgeCyanRailMat.emissiveIntensity = THREE.MathUtils.lerp(0.1, 1.35, cyber);
      skybridgeAmberRailMat.emissive.setHex(0xd8a858).lerp(new THREE.Color(0xe8a828), cyber);
      skybridgeAmberRailMat.emissiveIntensity = THREE.MathUtils.lerp(0.1, 1.25, cyber);

      bulbMat.color.setHex(0xffd485).lerp(new THREE.Color(0xffe0a0), cyber);
      railGlowMat.color.setHex(0x64748b).lerp(new THREE.Color(0x38d8f0), cyber);

      const u = (time * 0.055) % 1;
      railCurve.getPointAt(u, tmpPos);
      railCurve.getTangentAt(u, tmpTan);
      trainGroup.position.set(tmpPos.x, tmpPos.y + 1.55, tmpPos.z);
      trainGroup.rotation.y = -Math.atan2(tmpTan.z, tmpTan.x);
    }
  };
}
