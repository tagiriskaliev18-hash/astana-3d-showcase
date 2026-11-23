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
  createWetRoadMaterial,
  createLightConeMaterial,
  createBaiterekBeamMaterial,
  createBaiterekParticlesMaterial,
  createFountainPlumeMaterial
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
    emissiveIntensity: 0.92,
    roughness: 0.18,
    metalness: 0.3
  });
  const poolRing = new THREE.Mesh(new THREE.TorusGeometry(17.5, 0.18, 10, 48), baseGlowMat);
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

  const ribMat = makeMetalMat(pbr, { color: 0xdbe4ef, roughness: 0.28, metalness: 0.88, env: 1.85, rx: 3, ry: 8 });
  const trunkMesh = new THREE.Mesh(mergeSafe(ribGeos), ribMat);
  trunkMesh.castShadow = true;
  trunkMesh.receiveShadow = true;
  group.add(trunkMesh);

  const trunkNeonMat = new THREE.MeshStandardMaterial({
    color: 0x00d8f0,
    emissive: 0x00d0e8,
    emissiveIntensity: 1.08,
    roughness: 0.2
  });
  const trunkNeonMesh = new THREE.Mesh(mergeSafe(neonStripGeos), trunkNeonMat);
  group.add(trunkNeonMesh);

  // Glazed panoramic lift core shaft
  const shaftMat = new THREE.MeshPhysicalMaterial({
    color: 0x102030,
    emissive: 0x09344c,
    emissiveIntensity: 0.45,
    roughness: 0.16,
    metalness: 0.85,
    clearcoat: 1.0,
    envMapIntensity: 1.9
  });
  const shaft = new THREE.Mesh(new THREE.CylinderGeometry(2.15, 2.35, 42, 20), shaftMat);
  shaft.position.y = 23.5;
  group.add(shaft);

  const liftRingMat = new THREE.MeshBasicMaterial({ color: 0xf5c854 });
  const liftRing = new THREE.Mesh(new THREE.TorusGeometry(2.45, 0.14, 8, 24), liftRingMat);
  liftRing.rotation.x = Math.PI / 2;
  liftRing.position.y = 18;
  group.add(liftRing);

  // GOLDEN CHAMELEON SAMRUK SPHERE (Geodesic triangular glass facets reflecting shanghai_bund HDRI!)
  const sphereGlassTex = cloneTiledPBR(pbr.baiterekGlass, 4, 2);
  const sphereMat = new THREE.MeshPhysicalMaterial({
    color: 0xe2a82e,
    emissive: 0xb86e10,
    emissiveIntensity: 0.34,
    metalness: 0.92,
    roughness: 0.48,
    roughnessMap: sphereGlassTex.rough,
    normalMap: sphereGlassTex.normal,
    normalScale: new THREE.Vector2(0.72, 0.72),
    clearcoat: 1.0,
    clearcoatRoughness: 0.06,
    envMapIntensity: 2.4
  });
  const sphere = new THREE.Mesh(new THREE.SphereGeometry(8.4, 64, 48), sphereMat);
  sphere.position.y = 48.0;
  sphere.castShadow = true;
  group.add(sphere);

  // Razor-thin restrained orbital telemetry rings around the golden sphere
  const holoRingGroup = new THREE.Group();
  holoRingGroup.position.y = 48.0;

  const ring1Mat = new THREE.MeshBasicMaterial({
    color: 0x00e5ff,
    transparent: true,
    opacity: 0.26,
    blending: THREE.AdditiveBlending,
    depthWrite: false
  });
  const holoRing1 = new THREE.Mesh(new THREE.TorusGeometry(12.8, 0.055, 8, 72), ring1Mat);
  holoRing1.rotation.x = Math.PI / 2.35;
  holoRingGroup.add(holoRing1);

  const ring2Mat = new THREE.MeshBasicMaterial({
    color: 0xffc842,
    transparent: true,
    opacity: 0.20,
    blending: THREE.AdditiveBlending,
    depthWrite: false
  });
  const holoRing2 = new THREE.Mesh(new THREE.TorusGeometry(14.4, 0.045, 8, 72), ring2Mat);
  holoRing2.rotation.x = Math.PI / 1.7;
  holoRing2.rotation.y = 0.6;
  holoRingGroup.add(holoRing2);
  group.add(holoRingGroup);

  // Monumental Volumetric 3-Layer Sky Beam + Rising Golden-Cyan Energy Particles from Golden Orb Apex
  const beamCoreMat = createBaiterekBeamMaterial({
    colorHex: 0xffd258,
    opacity: 0.44,
    speed: 2.8,
    verticalPow: 1.55,
    edgePow: 2.4
  });
  const beamCore = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 1.35, 310, 20, 1, true), beamCoreMat);
  beamCore.position.y = 55.5 + 155;
  group.add(beamCore);

  const beamWarmMat = createBaiterekBeamMaterial({
    colorHex: 0xff9f2e,
    opacity: 0.18,
    speed: 2.1,
    verticalPow: 1.85,
    edgePow: 2.8
  });
  const beamWarm = new THREE.Mesh(new THREE.CylinderGeometry(1.55, 2.35, 290, 20, 1, true), beamWarmMat);
  beamWarm.position.y = 55.5 + 145;
  group.add(beamWarm);

  const beamHaloMat = createBaiterekBeamMaterial({
    colorHex: 0x00e5ff,
    opacity: 0.11,
    speed: 1.6,
    verticalPow: 2.05,
    edgePow: 3.1
  });
  const beamHalo = new THREE.Mesh(new THREE.CylinderGeometry(3.8, 3.4, 260, 20, 1, true), beamHaloMat);
  beamHalo.position.y = 55.5 + 130;
  group.add(beamHalo);

  // 180 ascending golden-cyan energy motes spiraling upward inside the vertical beam column
  const pCount = 180;
  const pPos = new Float32Array(pCount * 3);
  const pPhase = new Float32Array(pCount);
  const pRadius = new Float32Array(pCount);
  const pAngle = new Float32Array(pCount);
  const pSpeed = new Float32Array(pCount);
  const pSize = new Float32Array(pCount);
  const pTint = new Float32Array(pCount);
  let ps = 971997;
  const pRng = () => {
    ps = (ps * 1664525 + 1013904223) >>> 0;
    return ps / 4294967296;
  };
  for (let i = 0; i < pCount; i++) {
    pPhase[i] = pRng();
    pRadius[i] = 0.6 + pRng() * 2.5;
    pAngle[i] = pRng() * Math.PI * 2;
    pSpeed[i] = 0.055 + pRng() * 0.085;
    pSize[i] = 2.0 + pRng() * 2.6;
    pTint[i] = pRng();
  }
  const pGeo = new THREE.BufferGeometry();
  pGeo.setAttribute('position', new THREE.BufferAttribute(pPos, 3));
  pGeo.setAttribute('aPhase', new THREE.BufferAttribute(pPhase, 1));
  pGeo.setAttribute('aRadius', new THREE.BufferAttribute(pRadius, 1));
  pGeo.setAttribute('aAngle', new THREE.BufferAttribute(pAngle, 1));
  pGeo.setAttribute('aSpeed', new THREE.BufferAttribute(pSpeed, 1));
  pGeo.setAttribute('aSize', new THREE.BufferAttribute(pSize, 1));
  pGeo.setAttribute('aTint', new THREE.BufferAttribute(pTint, 1));
  const beamParticlesMat = createBaiterekParticlesMaterial();
  const beamParticles = new THREE.Points(pGeo, beamParticlesMat);
  beamParticles.frustumCulled = false;
  group.add(beamParticles);

  const orbLight = new THREE.PointLight(0xffaa2b, 22, 95, 1.6);
  orbLight.position.set(0, 48, 0);
  group.add(orbLight);

  return {
    group,
    shaderMaterials: [beamCoreMat, beamWarmMat, beamHaloMat],
    update(time) {
      liftRing.position.y = 10 + (Math.sin(time * 0.65) * 0.5 + 0.5) * 29;
      sphereMat.emissiveIntensity = 0.34 + Math.sin(time * 2.0) * 0.06;
      orbLight.intensity = 22 + Math.sin(time * 2.0) * 2.5;
      holoRing1.rotation.z = time * 0.45;
      holoRing2.rotation.z = -time * 0.30;
      beamCoreMat.uniforms.uTime.value = time;
      beamWarmMat.uniforms.uTime.value = time;
      beamHaloMat.uniforms.uTime.value = time;
      beamParticlesMat.uniforms.uTime.value = time;
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
    emissiveIntensity: 0.72,
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
    emissiveIntensity: 1.02,
    roughness: 0.2
  });
  const terraceRim = new THREE.Mesh(new THREE.TorusGeometry(28.5, 0.14, 8, 56), rimNeonMat);
  terraceRim.rotation.x = Math.PI / 2;
  terraceRim.scale.set(1.08, 0.92, 1);
  terraceRim.position.y = 6.85;
  group.add(terraceRim);

  // Subtle recessed architectural interior mall galleries visible softly through smoked ETFE glass!
  const coreSlabMat = makeConcreteMat(pbr, { color: 0x3b352d, roughness: 0.72, env: 0.6, rx: 4, ry: 4 });
  const coreFloorMat = new THREE.MeshStandardMaterial({
    color: 0xf0be72,
    emissive: 0xc97d24,
    emissiveIntensity: 0.68,
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

  // Diamond-grid inflated ETFE cushion tent shell with warm interior atrium glow
  const etfeTex = cloneTiledPBR(pbr.etfe, 14, 6);
  const tentMat = new THREE.MeshPhysicalMaterial({
    color: 0x7b8ea0,
    map: etfeTex.albedo,
    normalMap: etfeTex.normal,
    normalScale: new THREE.Vector2(0.85, 0.85),
    roughnessMap: etfeTex.rough,
    roughness: 0.86,
    metalness: 0.22,
    emissive: 0x4a290b,
    emissiveIntensity: 0.34,
    clearcoat: 0.95,
    clearcoatRoughness: 0.10,
    envMapIntensity: 2.1,
    transparent: true,
    opacity: 0.82,
    side: THREE.DoubleSide
  });
  const tentMesh = new THREE.Mesh(tentGeo, tentMat);
  tentMesh.castShadow = true;
  group.add(tentMesh);

  // 32 Structural Dark-Chrome Steel Tension Cable Ribs (merged)
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
    cableGeos.push(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 14, 0.19, 4, false));
  }
  const cableMat = makeMetalMat(pbr, { color: 0x9aa8ba, roughness: 0.26, metalness: 0.90, env: 1.95 });
  group.add(new THREE.Mesh(mergeSafe(cableGeos), cableMat));

  // Internal heavy steel tripod mast
  const tripodGeos = [];
  for (let i = 0; i < 3; i++) {
    const a = (i / 3) * Math.PI * 2 + 0.4;
    const start = new THREE.Vector3(Math.cos(a) * 10, 5, Math.sin(a) * 10);
    tripodGeos.push(new THREE.TubeGeometry(new THREE.LineCurve3(start, apex), 4, 0.72, 6, false));
  }
  group.add(new THREE.Mesh(mergeSafe(tripodGeos), makeMetalMat(pbr, { color: 0x2c3644, roughness: 0.4 })));

  // Sleek glowing turquoise entrance portal on the East side facing Nurzhol Boulevard
  const portalSteelMat = makeMetalMat(pbr, { color: 0x1e2733, roughness: 0.28, metalness: 0.88, env: 1.8 });
  const portalGlowMat = new THREE.MeshStandardMaterial({
    color: 0x00e5ff,
    emissive: 0x00d8f0,
    emissiveIntensity: 1.12,
    roughness: 0.14,
    metalness: 0.25
  });
  const portalGlassMat = new THREE.MeshPhysicalMaterial({
    color: 0x08384a,
    emissive: 0x085a72,
    emissiveIntensity: 0.75,
    roughness: 0.10,
    metalness: 0.75,
    clearcoat: 1.0,
    transparent: true,
    opacity: 0.78
  });
  const portalGroup = new THREE.Group();
  portalGroup.position.set(30.4, 0, 0);
  const portalCanopy = new THREE.Mesh(new THREE.BoxGeometry(5.8, 0.42, 13.5), portalSteelMat);
  portalCanopy.position.set(1.2, 6.2, 0);
  portalGroup.add(portalCanopy);
  const portalTrim = new THREE.Mesh(new THREE.BoxGeometry(6.0, 0.16, 13.7), portalGlowMat);
  portalTrim.position.set(1.2, 6.45, 0);
  portalGroup.add(portalTrim);
  for (const pz of [-5.8, 5.8]) {
    const pillar = new THREE.Mesh(new THREE.BoxGeometry(0.65, 6.2, 0.65), portalSteelMat);
    pillar.position.set(3.4, 3.1, pz);
    portalGroup.add(pillar);
    const pStrip = new THREE.Mesh(new THREE.BoxGeometry(0.18, 5.6, 0.18), portalGlowMat);
    pStrip.position.set(3.75, 3.1, pz);
    portalGroup.add(pStrip);
  }
  const portalGate = new THREE.Mesh(new THREE.BoxGeometry(0.35, 5.4, 10.6), portalGlassMat);
  portalGate.position.set(2.8, 2.7, 0);
  portalGroup.add(portalGate);
  const portalLight = new THREE.PointLight(0x00e5ff, 14, 38, 1.8);
  portalLight.position.set(4.5, 4.2, 0);
  portalGroup.add(portalLight);
  group.add(portalGroup);

  // Top Steel Spire & Cyan Apex Beacon
  const spireMat = new THREE.MeshStandardMaterial({
    color: 0xcbd5e1,
    emissive: 0x00d8f0,
    emissiveIntensity: 0.95,
    metalness: 0.9,
    roughness: 0.18
  });
  const spire = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.52, 11, 10), spireMat);
  spire.position.set(apex.x + 1.1, apex.y + 5.2, 0);
  spire.rotation.z = -0.22;
  group.add(spire);

  // Warm interior architectural lantern glow radiating outward through ETFE cushions
  const tentLight = new THREE.PointLight(0xffa940, 26, 105, 1.6);
  tentLight.position.set(tiltX * 0.25, 22, 0);
  group.add(tentLight);

  return {
    group,
    update(time) {
      tentMat.emissiveIntensity = 0.34 + Math.sin(time * 1.4) * 0.03;
      portalGlowMat.emissiveIntensity = 1.12 + Math.sin(time * 2.4) * 0.12;
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
    emissiveIntensity: 0.96,
    roughness: 0.15
  });
  const amberNeonMat = new THREE.MeshStandardMaterial({
    color: 0xf5b832,
    emissive: 0xe69f20,
    emissiveIntensity: 0.90,
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
    update(time) {
      mainMat.userData.customUniforms.uTime.value = time;
      wingMat.userData.customUniforms.uTime.value = time;

      const blink = Math.sin(time * 4.5) > 0.15 ? 1 : 0.15;
      beaconMat.color.setRGB(1.3 * blink, 0.08 * blink, 0.16 * blink);
    }
  };
}

/* ============================================================================
   4. NUR ALEM / EXPO SPHERE (Южная ось · X=-46, Z=72)
      Monumental Dark Sapphire Reflective Diagrid Glass Sphere (80m-class)
      + Curved Steel/Glass Podium + Subtle Recessed Museum Floor Rings
   ============================================================================ */
export function buildNurAlem(pbr) {
  const group = new THREE.Group();
  group.name = 'Landmark_NurAlem';
  group.position.set(-46, 0, 72);

  const stoneMat = makePlazaMarbleMat(pbr, { color: 0x586373, roughness: 0.56, env: 0.85, rx: 6, ry: 6 });
  const roofConcreteMat = makeConcreteMat(pbr, { color: 0x363f4d, roughness: 0.78, rx: 4, ry: 4 });
  const brushedSteelMat = makeMetalMat(pbr, { color: 0x202a38, roughness: 0.28, metalness: 0.90, env: 1.95 });
  const trimSteelMat = makeMetalMat(pbr, { color: 0x748498, roughness: 0.30, metalness: 0.88, env: 1.8 });

  const plazaRingGlowMat = new THREE.MeshStandardMaterial({
    color: 0x4ec8e0,
    emissive: 0x1ba2c0,
    emissiveIntensity: 0.72,
    roughness: 0.22
  });

  const tier1 = new THREE.Mesh(new THREE.CylinderGeometry(31.5, 32.8, 1.0, 48), stoneMat);
  tier1.position.y = 0.5;
  tier1.receiveShadow = true;
  group.add(tier1);

  const tier2 = new THREE.Mesh(new THREE.CylinderGeometry(25.5, 26.5, 1.1, 48), stoneMat);
  tier2.position.y = 1.55;
  tier2.receiveShadow = true;
  group.add(tier2);

  const ringTrim1 = new THREE.Mesh(new THREE.TorusGeometry(31.6, 0.08, 6, 64), plazaRingGlowMat);
  ringTrim1.rotation.x = Math.PI / 2;
  ringTrim1.position.y = 1.04;
  group.add(ringTrim1);

  const ringTrim2 = new THREE.Mesh(new THREE.TorusGeometry(25.6, 0.08, 6, 64), plazaRingGlowMat);
  ringTrim2.rotation.x = Math.PI / 2;
  ringTrim2.position.y = 2.12;
  group.add(ringTrim2);

  // Curved glass & dark steel podium collar cradling the lower hemisphere
  const wingGlassMat = new THREE.MeshPhysicalMaterial({
    color: 0x0b1b32,
    emissive: 0x041020,
    emissiveIntensity: 0.22,
    metalness: 0.88,
    roughness: 0.09,
    clearcoat: 1.0,
    clearcoatRoughness: 0.06,
    envMapIntensity: 2.25,
    side: THREE.DoubleSide
  });

  const podiumProfile = [
    new THREE.Vector2(17.6, 2.05),
    new THREE.Vector2(14.5, 3.8),
    new THREE.Vector2(12.6, 5.8),
    new THREE.Vector2(14.3, 8.5),
    new THREE.Vector2(17.25, 11.2)
  ];
  const podiumSkirt = new THREE.Mesh(new THREE.LatheGeometry(podiumProfile, 48), wingGlassMat);
  podiumSkirt.castShadow = true;
  podiumSkirt.receiveShadow = true;
  group.add(podiumSkirt);

  const podiumRibGeos = [];
  for (let i = 0; i < 18; i++) {
    const a = (i / 18) * Math.PI * 2;
    const cos = Math.cos(a);
    const sin = Math.sin(a);
    const pts = podiumProfile.map((p) => new THREE.Vector3(cos * (p.x + 0.10), p.y, sin * (p.x + 0.10)));
    podiumRibGeos.push(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 12, 0.18, 5, false));
  }
  const collarRing = new THREE.TorusGeometry(17.32, 0.26, 8, 56);
  collarRing.rotateX(Math.PI / 2);
  collarRing.translate(0, 11.2, 0);
  podiumRibGeos.push(collarRing);
  group.add(new THREE.Mesh(mergeSafe(podiumRibGeos), brushedSteelMat));

  // Hollow curved annular glass EXPO crescent pavilions with reflective PBR curtain wall
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
  group.add(new THREE.Mesh(mergeSafe(wingMullionGeos), trimSteelMat));

  // Subtle recessed interior museum floor rings glowing warmly through dark specular glass
  const sphereR = 23.0;
  const sphereY = 26.5;
  const deckSlabMat = makeConcreteMat(pbr, { color: 0x161d28, roughness: 0.74, env: 0.35 });
  const deckWarmMat = new THREE.MeshStandardMaterial({
    color: 0xe8b060,
    emissive: 0xc97b22,
    emissiveIntensity: 0.48,
    roughness: 0.28
  });

  for (const dy of [-10.0, -5.0, 0.0, 5.0, 10.0]) {
    const dr = Math.sqrt(Math.max(1, sphereR * sphereR - dy * dy)) * 0.74;
    const slab = new THREE.Mesh(new THREE.CylinderGeometry(dr, dr, 0.42, 36), deckSlabMat);
    slab.position.y = sphereY + dy;
    group.add(slab);

    const rim = new THREE.Mesh(new THREE.TorusGeometry(dr - 0.08, 0.11, 6, 48), deckWarmMat);
    rim.rotation.x = Math.PI / 2;
    rim.position.y = sphereY + dy + 0.24;
    group.add(rim);
  }

  // Central brushed-titanium structural core shaft inside sphere
  const corePillar = new THREE.Mesh(
    new THREE.CylinderGeometry(2.1, 2.7, 38, 24),
    brushedSteelMat
  );
  corePillar.position.y = sphereY;
  group.add(corePillar);

  // Monumental Dark Sapphire / Midnight-Blue Specular Diagrid Glass Sphere
  const diagridGlassTex = cloneTiledPBR(pbr.baiterekGlass, 8, 4);
  const glassMat = new THREE.MeshPhysicalMaterial({
    color: 0x071630,
    emissive: 0x020a18,
    emissiveIntensity: 0.18,
    metalness: 0.88,
    roughness: 0.32,
    roughnessMap: diagridGlassTex.rough,
    normalMap: diagridGlassTex.normal,
    normalScale: new THREE.Vector2(0.28, 0.28),
    clearcoat: 1.0,
    clearcoatRoughness: 0.05,
    envMapIntensity: 2.65,
    transparent: true,
    opacity: 0.84
  });
  const outerSphere = new THREE.Mesh(new THREE.SphereGeometry(sphereR, 64, 48), glassMat);
  outerSphere.position.y = sphereY;
  outerSphere.castShadow = true;
  group.add(outerSphere);

  // Crisp Dark-Steel Helical Diagrid Cage + Horizontal Structural Belt Rings
  const diagridGeos = [];
  const ribR = sphereR + 0.08;
  const latMin = -0.23 * Math.PI;
  const latMax = 0.43 * Math.PI;
  const ribCount = 18;

  for (const dir of [-1, 1]) {
    for (let i = 0; i < ribCount; i++) {
      const theta0 = (i / ribCount) * Math.PI * 2;
      const pts = [];
      for (let s = 0; s <= 16; s++) {
        const u = s / 16;
        const lat = THREE.MathUtils.lerp(latMin, latMax, u);
        const theta = theta0 + dir * u * Math.PI * 0.72;
        pts.push(
          new THREE.Vector3(
            ribR * Math.cos(lat) * Math.cos(theta),
            sphereY + ribR * Math.sin(lat),
            ribR * Math.cos(lat) * Math.sin(theta)
          )
        );
      }
      diagridGeos.push(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 16, 0.13, 4, false));
    }
  }
  for (let k = 0; k < 7; k++) {
    const lat = THREE.MathUtils.lerp(-0.18 * Math.PI, 0.38 * Math.PI, k / 6);
    const ringR = ribR * Math.cos(lat);
    const ringY = sphereY + ribR * Math.sin(lat);
    const ring = new THREE.TorusGeometry(ringR, 0.12, 4, 48);
    ring.rotateX(Math.PI / 2);
    ring.translate(0, ringY, 0);
    diagridGeos.push(ring);
  }
  group.add(new THREE.Mesh(mergeSafe(diagridGeos), brushedSteelMat));

  // Recessed Top Wind-Turbine Oculus (clean dark architectural collar, zero sunglasses/floating rings)
  const oculusY = sphereY + ribR * Math.sin(latMax);
  const oculusR = ribR * Math.cos(latMax);
  const oculusCollar = new THREE.Mesh(new THREE.TorusGeometry(oculusR, 0.26, 8, 36), brushedSteelMat);
  oculusCollar.rotation.x = Math.PI / 2;
  oculusCollar.position.y = oculusY;
  group.add(oculusCollar);

  const oculusBay = new THREE.Mesh(
    new THREE.CylinderGeometry(oculusR * 0.96, oculusR * 0.96, 1.5, 28),
    deckSlabMat
  );
  oculusBay.position.y = oculusY - 0.85;
  group.add(oculusBay);

  const rotorMat = makeMetalMat(pbr, { color: 0x8a99ad, roughness: 0.24, metalness: 0.90, env: 1.9 });
  function makeWindRotor(xPos) {
    const rotor = new THREE.Group();
    rotor.position.set(xPos, oculusY - 0.35, 0);
    const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.28, 0.55, 10), rotorMat);
    hub.rotation.x = Math.PI / 2;
    rotor.add(hub);
    for (let b = 0; b < 3; b++) {
      const blade = new THREE.Mesh(new THREE.BoxGeometry(0.14, 1.65, 0.24), rotorMat);
      const ang = (b / 3) * Math.PI * 2;
      blade.position.set(Math.cos(ang) * 0.82, Math.sin(ang) * 0.82, 0);
      blade.rotation.z = ang - Math.PI / 2;
      rotor.add(blade);
    }
    return rotor;
  }
  const turbine1 = makeWindRotor(-1.85);
  const turbine2 = makeWindRotor(1.85);
  group.add(turbine1, turbine2);

  const sphereLight = new THREE.PointLight(0xffb460, 6.5, 52, 1.8);
  sphereLight.position.set(0, sphereY, 0);
  group.add(sphereLight);

  return {
    group,
    update(time) {
      turbine1.rotation.z = time * 1.4;
      turbine2.rotation.z = -time * 1.4;
      const pulse = 0.5 + 0.5 * Math.sin(time * 1.6);
      deckWarmMat.emissiveIntensity = 0.44 + pulse * 0.10;
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
    emissiveIntensity: 0.36,
    metalness: 0.95,
    roughness: 0.14,
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
    emissiveIntensity: 0.72,
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
    emissiveIntensity: 0.28,
    metalness: 0.48,
    roughness: 0.16,
    clearcoat: 1.0,
    clearcoatRoughness: 0.08,
    normalMap: pbr.metal.normal,
    normalScale: new THREE.Vector2(0.18, 0.18),
    envMapIntensity: 2.15
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

  // Golden Cupola Lantern + Slender Spire + Sunburst (NO wireframe holoDome or neon corner lines!)
  const lantern = new THREE.Mesh(new THREE.CylinderGeometry(1.3, 1.85, 2.4, 12), goldMat);
  lantern.position.set(0, 46.2, 0);
  group.add(lantern);
  const spire = new THREE.Mesh(new THREE.ConeGeometry(0.55, 16.5, 10), goldMat);
  spire.position.set(0, 55.4, 0);
  group.add(spire);
  const sunOrb = new THREE.Mesh(new THREE.SphereGeometry(0.95, 12, 12), goldMat);
  sunOrb.position.set(0, 63.8, 0);
  group.add(sunOrb);

  // Subtle warm & cool cyan architectural facade uplights on West & East colonnades & dome
  const facadeLightW = new THREE.PointLight(0xffcb82, 5.2, 60, 2.0);
  facadeLightW.position.set(-20, 14, 0);
  group.add(facadeLightW);

  const facadeLightE = new THREE.PointLight(0xffcb82, 5.2, 60, 2.0);
  facadeLightE.position.set(20, 14, 0);
  group.add(facadeLightE);

  const domeLight = new THREE.PointLight(0x28c8e8, 5.5, 80, 2.0);
  domeLight.position.set(0, 48, 0);
  group.add(domeLight);

  return {
    group,
    update() {}
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

  const lowerMat = makeConcreteMat(pbr, { color: 0x6c7484, roughness: 0.72, metalness: 0.14, rx: 5, ry: 4 });
  const lowerBody = new THREE.Mesh(new THREE.CylinderGeometry(9.2, baseRadius, 31.5, 4, 5), lowerMat);
  lowerBody.rotation.y = Math.PI / 4;
  lowerBody.position.y = 4.5 + 15.75;
  lowerBody.castShadow = true;
  lowerBody.receiveShadow = true;
  group.add(lowerBody);

  // Horizontal stepped architectural structural rib collars on lower pyramid (no crude wireframe!)
  const ribStructMat = makeMetalMat(pbr, { color: 0x263140, roughness: 0.34, metalness: 0.88, env: 1.6 });
  const ribCollars = [];
  for (let tier = 1; tier <= 5; tier++) {
    const f = tier / 6;
    const r = THREE.MathUtils.lerp(baseRadius, 9.2, f) + 0.18;
    const y = 4.5 + f * 31.5;
    const pts = [];
    for (let k = 0; k <= 4; k++) {
      const a = ((k % 4) * Math.PI) / 2 + Math.PI / 4;
      pts.push(new THREE.Vector3(Math.cos(a) * r, y, Math.sin(a) * r));
    }
    ribCollars.push(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 16, 0.16, 6, false));
  }
  group.add(new THREE.Mesh(mergeSafe(ribCollars), ribStructMat));

  const apexMat = new THREE.MeshPhysicalMaterial({
    color: 0xf0c975,
    emissive: 0xdca028,
    emissiveIntensity: 0.72,
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
    emissiveIntensity: 0.88,
    roughness: 0.18
  });
  group.add(new THREE.Mesh(mergeSafe(ridgeGeos), ridgeMat));

  const beamMat = new THREE.MeshBasicMaterial({
    color: 0xf5c852,
    transparent: true,
    opacity: 0.055,
    blending: THREE.AdditiveBlending,
    depthWrite: false
  });
  const beam = new THREE.Mesh(new THREE.CylinderGeometry(0.10, 0.65, 130, 8, 1, true), beamMat);
  beam.position.y = 4.5 + pyrH + 65;
  group.add(beam);

  return {
    group,
    update(time) {
      apexMat.emissiveIntensity = 0.72 + Math.sin(time * 2.2) * 0.08;
      beamMat.opacity = 0.055 + 0.015 * Math.sin(time * 2.2);
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
    emissiveIntensity: 0.92
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
  const nlMat = createPBRSkyscraperMaterial(pbr, {
    isInstanced: false,
    isCurved: true,
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
    emissiveIntensity: 0.88,
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
    emissiveIntensity: 0.58,
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
    update(time) {
      for (const m of pbrTowerMats) {
        m.userData.customUniforms.uTime.value = time;
      }
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

  // Left & Right Bank Photoscanned Wet Asphalt City Floors extended to horizon
  const leftGround = new THREE.Mesh(new THREE.PlaneGeometry(1240, 2200), roadMat);
  leftGround.rotation.x = -Math.PI / 2;
  leftGround.position.set(-488, 0, 0);
  leftGround.receiveShadow = true;
  group.add(leftGround);

  const rightGround = new THREE.Mesh(new THREE.PlaneGeometry(1040, 2200), roadMat);
  rightGround.rotation.x = -Math.PI / 2;
  rightGround.position.set(684, 0, 0);
  rightGround.receiveShadow = true;
  group.add(rightGround);

  // Esil River Nocturnal Mirror Water extended toward horizon
  const riverMesh = new THREE.Mesh(new THREE.PlaneGeometry(34, 2200, 1, 1), riverMat);
  riverMesh.rotation.x = -Math.PI / 2;
  riverMesh.position.set(148, -1.2, 0);
  group.add(riverMesh);

  // Real Photoscanned Concrete Embankment Walls & Riverside Light Strips
  const wallMat = makeConcreteMat(pbr, { color: 0x565e6d, roughness: 0.78, rx: 1, ry: 56 });
  const embNeonMat = new THREE.MeshStandardMaterial({
    color: 0x38d8f0,
    emissive: 0x1fc4e0,
    emissiveIntensity: 0.88
  });
  for (const bx of [131.5, 164.5]) {
    const wall = new THREE.Mesh(new THREE.BoxGeometry(1.4, 2.4, 2200), wallMat);
    wall.position.set(bx, -0.4, 0);
    group.add(wall);
    const strip = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.24, 1800), embNeonMat);
    strip.position.set(bx + (bx < 148 ? 0.7 : -0.7), 0.75, 0);
    group.add(strip);
  }

  // Arched Parabolic Steel Bridges over Esil River (including distant & КАД ring-road crossings)
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
  group.add(createArchBridge(-220, 12, 11.0));
  group.add(createArchBridge(220, 12, 11.0));
  group.add(createArchBridge(-425, 16, 14.5));
  group.add(createArchBridge(425, 16, 14.5));

  // Outer Perimeter Orbital Highway (КАД Ring Road · R=450m)
  const ringRoadDeckMat = makeConcreteMat(pbr, { color: 0x1e2530, roughness: 0.48, metalness: 0.16, env: 0.85, rx: 32, ry: 2 });
  const ringRoadDeck = new THREE.Mesh(new THREE.RingGeometry(441.5, 458.5, 128, 1), ringRoadDeckMat);
  ringRoadDeck.rotation.x = -Math.PI / 2;
  ringRoadDeck.position.y = 0.85;
  group.add(ringRoadDeck);

  const kadAmberMat = new THREE.MeshStandardMaterial({ color: 0xffa63c, emissive: 0xd97d1c, emissiveIntensity: 0.68 });
  const kadCyanMat = new THREE.MeshStandardMaterial({ color: 0x38d8f0, emissive: 0x1ab2d0, emissiveIntensity: 0.65 });
  const kadInnerRail = new THREE.Mesh(new THREE.TorusGeometry(441.8, 0.18, 5, 128), kadAmberMat);
  kadInnerRail.rotation.x = Math.PI / 2;
  kadInnerRail.position.y = 1.05;
  group.add(kadInnerRail);
  const kadOuterRail = new THREE.Mesh(new THREE.TorusGeometry(458.2, 0.18, 5, 128), kadCyanMat);
  kadOuterRail.rotation.x = Math.PI / 2;
  kadOuterRail.position.y = 1.05;
  group.add(kadOuterRail);

  const kadPiers = [];
  for (let i = 0; i < 72; i++) {
    const a = (i / 72) * Math.PI * 2;
    const px = Math.cos(a) * 450;
    const pz = Math.sin(a) * 450;
    if (px > 128 && px < 168) continue;
    kadPiers.push([px, pz, a]);
  }
  const pierInst = new THREE.InstancedMesh(new THREE.BoxGeometry(2.2, 0.9, 14.5), wallMat, kadPiers.length);
  const kadDummy = new THREE.Object3D();
  kadPiers.forEach(([px, pz, a], idx) => {
    kadDummy.position.set(px, 0.42, pz);
    kadDummy.rotation.set(0, -a, 0);
    kadDummy.updateMatrix();
    pierInst.setMatrixAt(idx, kadDummy.matrix);
  });
  pierInst.instanceMatrix.needsUpdate = true;
  group.add(pierInst);

  // Surrounding Dark Forested Steppe Horizon Terrain Hills (R=560..1180m)
  const hillGeo = new THREE.RingGeometry(560, 1180, 128, 18);
  hillGeo.rotateX(-Math.PI / 2);
  const hPos = hillGeo.attributes.position;
  for (let i = 0; i < hPos.count; i++) {
    const hx = hPos.getX(i);
    const hz = hPos.getZ(i);
    const r = Math.hypot(hx, hz);
    const ang = Math.atan2(hz, hx);
    const t = THREE.MathUtils.clamp((r - 560) / 420, 0, 1);
    const valley = THREE.MathUtils.smoothstep(Math.abs(hx - 148), 26, 115);
    const wave =
      18 +
      13 * Math.sin(ang * 3.0 + 0.6) +
      8 * Math.cos(ang * 7.0 - 1.1) +
      5 * Math.sin(r * 0.016 + ang * 2.0);
    hPos.setY(i, Math.max(0, wave * t * t * valley));
  }
  hillGeo.computeVertexNormals();
  const steppeHillMat = new THREE.MeshStandardMaterial({
    color: 0x0b121b,
    roughness: 0.96,
    metalness: 0.04,
    envMapIntensity: 0.08
  });
  group.add(new THREE.Mesh(hillGeo, steppeHillMat));

  // Subtle dark pine/forest steppe horizon ridge silhouettes (180 trees, 1 draw call)
  const treeMat = new THREE.MeshStandardMaterial({ color: 0x0d1820, roughness: 0.94, metalness: 0.02, envMapIntensity: 0.08 });
  let ts = 19972077;
  const tRng = () => {
    ts = (ts * 1664525 + 1013904223) >>> 0;
    return ts / 4294967296;
  };
  const treePts = [];
  for (let i = 0; i < 200; i++) {
    const a = tRng() * Math.PI * 2;
    const r = 565 + tRng() * 290;
    const tx = Math.cos(a) * r;
    const tz = Math.sin(a) * r;
    if (Math.abs(tx - 148) < 42) continue;
    const t = THREE.MathUtils.clamp((r - 560) / 420, 0, 1);
    const valley = THREE.MathUtils.smoothstep(Math.abs(tx - 148), 26, 115);
    const wave = 18 + 13 * Math.sin(a * 3.0 + 0.6) + 8 * Math.cos(a * 7.0 - 1.1) + 5 * Math.sin(r * 0.016 + a * 2.0);
    const ty = Math.max(0, wave * t * t * valley);
    treePts.push({ x: tx, y: ty, z: tz, s: 0.8 + tRng() * 1.1 });
  }
  const treeInst = new THREE.InstancedMesh(new THREE.ConeGeometry(4.2, 14, 6), treeMat, treePts.length);
  treePts.forEach((tp, idx) => {
    kadDummy.position.set(tp.x, tp.y + 6.5 * tp.s, tp.z);
    kadDummy.rotation.set(0, tp.x, 0);
    kadDummy.scale.setScalar(tp.s);
    kadDummy.updateMatrix();
    treeInst.setMatrixAt(idx, kadDummy.matrix);
  });
  treeInst.instanceMatrix.needsUpdate = true;
  group.add(treeInst);

  // Nurzhol Promenade Central Terraces (Photoscanned Matte Granite Tiles) + Reflecting Pools + Fountain Plumes
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
  const poolXs = [-68, -42, 42, 68];
  for (const px of poolXs) {
    const pool = new THREE.Mesh(new THREE.BoxGeometry(16, 0.16, 6.2), poolMat);
    pool.position.set(px, 0.76, 0);
    group.add(pool);
  }

  // Animated Fountain Spray Plumes across the 4 Nurzhol Reflecting Pools (240 droplets, 1 draw call)
  const fPerPool = 60;
  const fTotal = poolXs.length * fPerPool;
  const fPos = new Float32Array(fTotal * 3);
  const fPhase = new Float32Array(fTotal);
  const fSpeed = new Float32Array(fTotal);
  const fDir = new Float32Array(fTotal * 2);
  const fHeight = new Float32Array(fTotal);
  const fTint = new Float32Array(fTotal);
  for (let pi = 0; pi < poolXs.length; pi++) {
    for (let j = 0; j < fPerPool; j++) {
      const idx = pi * fPerPool + j;
      const nozzleX = poolXs[pi] + ((j % 3) - 1) * 4.2;
      const ang = tRng() * Math.PI * 2;
      const spd = 0.25 + tRng() * 0.75;
      fPos[idx * 3 + 0] = nozzleX;
      fPos[idx * 3 + 1] = 0.88;
      fPos[idx * 3 + 2] = (tRng() - 0.5) * 1.2;
      fPhase[idx] = tRng();
      fSpeed[idx] = 0.52 + tRng() * 0.35;
      fDir[idx * 2 + 0] = Math.cos(ang) * spd;
      fDir[idx * 2 + 1] = Math.sin(ang) * spd;
      fHeight[idx] = 2.6 + tRng() * 1.8;
      fTint[idx] = tRng();
    }
  }
  const fGeo = new THREE.BufferGeometry();
  fGeo.setAttribute('position', new THREE.BufferAttribute(fPos, 3));
  fGeo.setAttribute('aPhase', new THREE.BufferAttribute(fPhase, 1));
  fGeo.setAttribute('aSpeed', new THREE.BufferAttribute(fSpeed, 1));
  fGeo.setAttribute('aDir', new THREE.BufferAttribute(fDir, 2));
  fGeo.setAttribute('aHeight', new THREE.BufferAttribute(fHeight, 1));
  fGeo.setAttribute('aTint', new THREE.BufferAttribute(fTint, 1));
  const fountainMat = createFountainPlumeMaterial();
  const fountainPoints = new THREE.Points(fGeo, fountainMat);
  fountainPoints.frustumCulled = false;
  group.add(fountainPoints);

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
    emissiveIntensity: 0.96,
    roughness: 0.15
  });
  const skybridgeAmberRailMat = new THREE.MeshStandardMaterial({
    color: 0xf0ad38,
    emissive: 0xdca024,
    emissiveIntensity: 0.92,
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

  // Arched Cyberpunk Boulevard Streetlamps + Downward Volumetric Rain-Light Cones
  const lampPosts = [];
  for (let lx = -92; lx <= 88; lx += 14) {
    if (Math.abs(lx) < 22) continue;
    lampPosts.push([lx, -9.8, 1], [lx, 9.8, -1]);
  }
  const archCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, 0, 0),
    new THREE.Vector3(0, 5.4, 0),
    new THREE.Vector3(0, 6.8, 0.45),
    new THREE.Vector3(0, 6.9, 1.55)
  ]);
  const archPoleGeo = new THREE.TubeGeometry(archCurve, 12, 0.13, 6, false);
  const archPoleInst = new THREE.InstancedMesh(archPoleGeo, skybridgeFrameMat, lampPosts.length);

  const headGeo = new THREE.BoxGeometry(0.42, 0.18, 1.15);
  const bulbMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
  const bulbInst = new THREE.InstancedMesh(headGeo, bulbMat, lampPosts.length);

  const coneGeo = new THREE.CylinderGeometry(0.24, 3.1, 6.75, 14, 1, true);
  const lightConeMat = createLightConeMaterial({ opacity: 0.11, colorHex: 0xffa638 });
  const coneInst = new THREE.InstancedMesh(coneGeo, lightConeMat, lampPosts.length);

  const dummy = new THREE.Object3D();
  const lampColor = new THREE.Color();
  lampPosts.forEach(([x, z, dir], idx) => {
    dummy.position.set(x, 0, z);
    dummy.rotation.set(0, dir > 0 ? 0 : Math.PI, 0);
    dummy.updateMatrix();
    archPoleInst.setMatrixAt(idx, dummy.matrix);

    dummy.position.set(x, 6.84, z + dir * 1.65);
    dummy.rotation.set(0, 0, 0);
    dummy.updateMatrix();
    bulbInst.setMatrixAt(idx, dummy.matrix);

    // Sodium-amber road lamps with cool-cyan accent near Baiterek plaza crossovers
    const isNearCrossing = Math.abs(Math.abs(x) - 27) < 8;
    lampColor.setHex(isNearCrossing ? 0x00e5ff : 0xff9e2c);
    bulbInst.setColorAt(idx, lampColor);
    coneInst.setColorAt(idx, lampColor);

    dummy.position.set(x, 3.4, z + dir * 1.65);
    dummy.updateMatrix();
    coneInst.setMatrixAt(idx, dummy.matrix);
  });
  archPoleInst.instanceMatrix.needsUpdate = true;
  bulbInst.instanceMatrix.needsUpdate = true;
  if (bulbInst.instanceColor) bulbInst.instanceColor.needsUpdate = true;
  coneInst.instanceMatrix.needsUpdate = true;
  if (coneInst.instanceColor) coneInst.instanceColor.needsUpdate = true;
  group.add(archPoleInst, bulbInst, coneInst);

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
    update(time) {
      roadMat.uniforms.uTime.value = time;
      riverMat.uniforms.uTime.value = time;
      lightConeMat.uniforms.uTime.value = time;
      fountainMat.uniforms.uTime.value = time;

      const u = (time * 0.055) % 1;
      railCurve.getPointAt(u, tmpPos);
      railCurve.getTangentAt(u, tmpTan);
      trainGroup.position.set(tmpPos.x, tmpPos.y + 1.55, tmpPos.z);
      trainGroup.rotation.y = -Math.atan2(tmpTan.z, tmpTan.x);
    }
  };
}
