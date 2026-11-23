/**
 * Astana -> Night City 2077
 * High-Detail Procedural 3D Architectural Builders for All Iconic Astana Landmarks
 * & Cohesive Nurzhol Boulevard + Esil River Urban Masterplan
 */
import * as THREE from 'three';
import * as BufferGeometryUtils from 'three/addons/utils/BufferGeometryUtils.js';
import {
  createBuildingWindowMaterial,
  createEsilRiverMaterial,
  createWetRoadMaterial
} from './shaders.js';

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

/* ============================================================================
   1. BAITEREK TOWER (Центр бульвара Нуржол · X=0, Z=0)
   ============================================================================ */
export function buildBaiterek() {
  const group = new THREE.Group();
  group.name = 'Landmark_Baiterek';

  // Stepped octagonal terraced plaza pedestal
  const plazaMat = new THREE.MeshStandardMaterial({
    color: 0x1b2232,
    roughness: 0.42,
    metalness: 0.45
  });
  const step1 = new THREE.Mesh(new THREE.CylinderGeometry(20, 22, 1.4, 8), plazaMat);
  step1.position.y = 0.7;
  step1.receiveShadow = true;
  group.add(step1);

  const step2 = new THREE.Mesh(new THREE.CylinderGeometry(14.5, 16, 1.6, 8), plazaMat);
  step2.position.y = 2.2;
  step2.receiveShadow = true;
  group.add(step2);

  // Glowing reflecting pool ring around Baiterek base
  const baseGlowMat = new THREE.MeshStandardMaterial({
    color: 0x00f0ff,
    emissive: 0x00e5ff,
    emissiveIntensity: 1.8,
    roughness: 0.15,
    metalness: 0.2
  });
  const poolRing = new THREE.Mesh(new THREE.TorusGeometry(17.5, 0.32, 10, 48), baseGlowMat);
  poolRing.rotation.x = Math.PI / 2;
  poolRing.position.y = 1.45;
  group.add(poolRing);

  // 18 iconic flared steel tree-of-life curved ribs (merged into 1 draw call)
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

    // Every 3rd rib gets a glowing cyber energy conduit
    if (i % 3 === 0) {
      const nPts = pts.map((p) => new THREE.Vector3(p.x * 1.03, p.y, p.z * 1.03));
      const nCurve = new THREE.CatmullRomCurve3(nPts);
      neonStripGeos.push(new THREE.TubeGeometry(nCurve, 22, 0.13, 5, false));
    }
  }

  // Structural horizontal collar rings along trunk
  const collarLevels = [
    { y: 12, r: 5.9 },
    { y: 23, r: 3.75 },
    { y: 34, r: 4.55 },
    { y: 41.5, r: 8.2 },
    { y: 47.5, r: 10.2 }
  ];
  for (const c of collarLevels) {
    const t = new THREE.TorusGeometry(c.r, 0.28, 8, 36);
    t.rotateX(Math.PI / 2);
    t.translate(0, c.y, 0);
    ribGeos.push(t);
  }

  const ribMat = new THREE.MeshStandardMaterial({
    color: 0xeaf0f8,
    roughness: 0.26,
    metalness: 0.72
  });
  const trunkMesh = new THREE.Mesh(mergeSafe(ribGeos), ribMat);
  trunkMesh.castShadow = true;
  trunkMesh.receiveShadow = true;
  group.add(trunkMesh);

  const trunkNeonMat = new THREE.MeshStandardMaterial({
    color: 0x00f0ff,
    emissive: 0x00f0ff,
    emissiveIntensity: 2.2,
    roughness: 0.2
  });
  const trunkNeonMesh = new THREE.Mesh(mergeSafe(neonStripGeos), trunkNeonMat);
  group.add(trunkNeonMesh);

  // Inner glass panoramic elevator core shaft
  const shaftMat = new THREE.MeshStandardMaterial({
    color: 0x162b44,
    emissive: 0x0b4c6e,
    emissiveIntensity: 0.65,
    roughness: 0.15,
    metalness: 0.85
  });
  const shaft = new THREE.Mesh(new THREE.CylinderGeometry(2.15, 2.35, 42, 18), shaftMat);
  shaft.position.y = 23.5;
  group.add(shaft);

  // Moving illuminated elevator capsule ring
  const liftRingMat = new THREE.MeshBasicMaterial({ color: 0xfcee0a });
  const liftRing = new THREE.Mesh(new THREE.TorusGeometry(2.45, 0.18, 8, 24), liftRingMat);
  liftRing.rotation.x = Math.PI / 2;
  liftRing.position.y = 18;
  group.add(liftRing);

  // GOLDEN SAMRUK SPHERE (y = 48, r = 8.4)
  const sphereMat = new THREE.MeshStandardMaterial({
    color: 0xffc83b,
    emissive: 0xff9810,
    emissiveIntensity: 1.05,
    metalness: 0.88,
    roughness: 0.14
  });
  const sphere = new THREE.Mesh(new THREE.IcosahedronGeometry(8.4, 3), sphereMat);
  sphere.position.y = 48.0;
  sphere.castShadow = true;
  group.add(sphere);

  // Geodesic golden glass mullion lattice
  const cageMat = new THREE.MeshBasicMaterial({
    color: 0xffe484,
    wireframe: true,
    transparent: true,
    opacity: 0.42
  });
  const sphereCage = new THREE.Mesh(new THREE.IcosahedronGeometry(8.56, 2), cageMat);
  sphereCage.position.y = 48.0;
  group.add(sphereCage);

  // CYBER 2077 ORBITING HOLOGRAPHIC DATA RINGS
  const holoRingGroup = new THREE.Group();
  holoRingGroup.position.y = 48.0;

  const ring1Mat = new THREE.MeshBasicMaterial({
    color: 0x00f0ff,
    transparent: true,
    opacity: 0.85,
    blending: THREE.AdditiveBlending,
    depthWrite: false
  });
  const holoRing1 = new THREE.Mesh(new THREE.TorusGeometry(13.2, 0.22, 8, 64), ring1Mat);
  holoRing1.rotation.x = Math.PI / 2.35;
  holoRingGroup.add(holoRing1);

  const ring2Mat = new THREE.MeshBasicMaterial({
    color: 0xfcee0a,
    transparent: true,
    opacity: 0.78,
    blending: THREE.AdditiveBlending,
    depthWrite: false
  });
  const holoRing2 = new THREE.Mesh(new THREE.TorusGeometry(15.6, 0.16, 8, 64), ring2Mat);
  holoRing2.rotation.x = Math.PI / 1.7;
  holoRing2.rotation.y = 0.6;
  holoRingGroup.add(holoRing2);

  // Outer dashed cyber ring arcs
  const ring3Mat = new THREE.MeshBasicMaterial({
    color: 0xff005c,
    transparent: true,
    opacity: 0.7,
    blending: THREE.AdditiveBlending,
    depthWrite: false
  });
  const holoRing3 = new THREE.Mesh(new THREE.TorusGeometry(18.0, 0.14, 6, 48, Math.PI * 1.35), ring3Mat);
  holoRing3.rotation.x = Math.PI / 2;
  holoRingGroup.add(holoRing3);
  group.add(holoRingGroup);

  // Skyward focused energy laser spire erupting from top of Baiterek in 2077 mode
  const beamMat = new THREE.MeshBasicMaterial({
    color: 0x00f0ff,
    transparent: true,
    opacity: 0.34,
    blending: THREE.AdditiveBlending,
    depthWrite: false
  });
  const skyBeam = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 1.35, 190, 12, 1, true), beamMat);
  skyBeam.position.y = 56 + 95;
  group.add(skyBeam);

  // Dedicated warm/amber point light radiating from the Golden Orb
  const orbLight = new THREE.PointLight(0xffb422, 24, 95, 1.4);
  orbLight.position.set(0, 48, 0);
  group.add(orbLight);

  return {
    group,
    update(time, cyber) {
      // Elevator glide
      liftRing.position.y = 10 + (Math.sin(time * 0.65) * 0.5 + 0.5) * 29;

      // Golden orb shifts from realistic sunlit chameleon gold -> blazing cyber solar reactor
      sphereMat.emissiveIntensity = THREE.MathUtils.lerp(0.28, 1.15 + Math.sin(time * 2.2) * 0.14, cyber);
      orbLight.intensity = THREE.MathUtils.lerp(14, 34, cyber);
      shaftMat.emissiveIntensity = THREE.MathUtils.lerp(0.18, 0.72, cyber);

      // Trunk chrome + neon conduits morph
      ribMat.color.setHex(0xe2e8f2).lerp(new THREE.Color(0x88b4e0), cyber * 0.45);
      trunkNeonMesh.visible = cyber > 0.04;
      trunkNeonMat.emissiveIntensity = cyber * 1.45;
      baseGlowMat.emissive.setHex(0xffb84d).lerp(new THREE.Color(0x00f0ff), cyber);
      baseGlowMat.emissiveIntensity = THREE.MathUtils.lerp(0.35, 1.35, cyber);

      // Orbiting 2077 holographic data rings
      const ringScale = THREE.MathUtils.smoothstep(cyber, 0.1, 0.95);
      holoRingGroup.visible = ringScale > 0.01;
      holoRingGroup.scale.setScalar(0.55 + ringScale * 0.45);
      holoRing1.rotation.z = time * 0.55;
      holoRing2.rotation.z = -time * 0.38;
      holoRing3.rotation.z = time * 0.25;
      ring1Mat.opacity = ringScale * 0.78;
      ring2Mat.opacity = ringScale * 0.72;
      ring3Mat.opacity = ringScale * 0.62;

      // Skyward beam
      skyBeam.visible = cyber > 0.18;
      beamMat.opacity = THREE.MathUtils.smoothstep(cyber, 0.18, 1.0) * (0.18 + 0.06 * Math.sin(time * 3.5));
    }
  };
}

/* ============================================================================
   2. KHAN SHATYR (Западная ось · X=-116, Z=0 · Наклонный шатёр 15°)
   ============================================================================ */
export function buildKhanShatyr() {
  const group = new THREE.Group();
  group.name = 'Landmark_KhanShatyr';
  group.position.set(-116, 0, 0);

  // Terraced circular-elliptical stone & glass base mall podium
  const podiumMat = new THREE.MeshStandardMaterial({
    color: 0x262e42,
    roughness: 0.45,
    metalness: 0.5
  });
  const baseDisc = new THREE.Mesh(new THREE.CylinderGeometry(31, 33, 2.4, 36), podiumMat);
  baseDisc.position.y = 1.2;
  baseDisc.scale.set(1.08, 1, 0.92);
  baseDisc.receiveShadow = true;
  group.add(baseDisc);

  const upperBase = new THREE.Mesh(new THREE.CylinderGeometry(28.2, 29.8, 4.4, 36), podiumMat);
  upperBase.position.y = 4.6;
  upperBase.scale.set(1.08, 1, 0.92);
  upperBase.castShadow = true;
  group.add(upperBase);

  // Illuminated retail arcade band wrapping the base
  const arcadeMat = new THREE.MeshStandardMaterial({
    color: 0xffd180,
    emissive: 0xff0066,
    emissiveIntensity: 1.6,
    roughness: 0.2
  });
  const arcadeBand = new THREE.Mesh(new THREE.CylinderGeometry(29.1, 29.4, 1.2, 36, 1, true), arcadeMat);
  arcadeBand.position.y = 4.8;
  arcadeBand.scale.set(1.08, 1, 0.92);
  group.add(arcadeBand);

  // Sculpted asymmetric tilted tensile tent shell (concave catenary + 15° tilt toward +X)
  const tentH = 66;
  const tiltX = 17.5;
  const tentGeo = new THREE.CylinderGeometry(1.15, 27.2, tentH, 48, 22, true);
  const pos = tentGeo.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const y = pos.getY(i);
    const z = pos.getZ(i);
    const t = (y + tentH / 2) / tentH; // 0 at base -> 1 at apex
    // Characteristic Norman Foster concave tensile tent profile
    const linearR = THREE.MathUtils.lerp(27.2, 1.15, t);
    const targetR = THREE.MathUtils.lerp(27.2, 1.15, Math.pow(t, 0.68));
    const scale = linearR > 0.001 ? targetR / linearR : 1.0;
    const ex = x * scale * 1.08 + Math.pow(t, 1.15) * tiltX;
    const ez = z * scale * 0.92;
    pos.setXYZ(i, ex, y + tentH / 2 + 6.5, ez);
  }
  tentGeo.computeVertexNormals();

  const tentMat = new THREE.MeshStandardMaterial({
    color: 0xf4e8d4,
    emissive: 0xff147a,
    emissiveIntensity: 0.65,
    roughness: 0.28,
    metalness: 0.25,
    transparent: true,
    opacity: 0.82,
    side: THREE.DoubleSide
  });
  const tentMesh = new THREE.Mesh(tentGeo, tentMat);
  tentMesh.castShadow = true;
  group.add(tentMesh);

  // 32 Radial structural steel cable ribs + horizontal rings (merged)
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
  const cableMat = new THREE.MeshStandardMaterial({
    color: 0xcbd5e1,
    roughness: 0.35,
    metalness: 0.8
  });
  group.add(new THREE.Mesh(mergeSafe(cableGeos), cableMat));

  // Internal heavy tilted tripod mast visible inside the translucent tent
  const tripodGeos = [];
  for (let i = 0; i < 3; i++) {
    const a = (i / 3) * Math.PI * 2 + 0.4;
    const start = new THREE.Vector3(Math.cos(a) * 10, 5, Math.sin(a) * 10);
    const curve = new THREE.LineCurve3(start, apex);
    tripodGeos.push(new THREE.TubeGeometry(curve, 4, 0.72, 6, false));
  }
  const tripodMat = new THREE.MeshStandardMaterial({
    color: 0x334155,
    roughness: 0.4,
    metalness: 0.85
  });
  group.add(new THREE.Mesh(mergeSafe(tripodGeos), tripodMat));

  // Glowing animated holographic neon scan ring sweeping up the Khan Shatyr tent
  const scanRingMat = new THREE.MeshBasicMaterial({
    color: 0x00f0ff,
    transparent: true,
    opacity: 0.85,
    blending: THREE.AdditiveBlending,
    depthWrite: false
  });
  const scanRing = new THREE.Mesh(new THREE.TorusGeometry(1, 0.03, 8, 48), scanRingMat);
  scanRing.rotation.x = Math.PI / 2;
  group.add(scanRing);

  // Top Spire & Apex Beacon
  const spireMat = new THREE.MeshStandardMaterial({
    color: 0xe2e8f0,
    emissive: 0x00f0ff,
    emissiveIntensity: 2.0,
    metalness: 0.9,
    roughness: 0.15
  });
  const spire = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.55, 11, 10), spireMat);
  spire.position.set(apex.x + 1.1, apex.y + 5.2, 0);
  spire.rotation.z = -0.22;
  group.add(spire);

  const tentLight = new THREE.PointLight(0xff147a, 24, 110, 1.4);
  tentLight.position.set(tiltX * 0.35, 32, 0);
  group.add(tentLight);

  return {
    group,
    update(time, cyber) {
      // Smoothly shift ETFE membrane from warm golden champagne (Real Astana) -> pulsing Magenta/Cyan Night City tent
      const duskColor = new THREE.Color(0xe6d4b8);
      const cyberColor = new THREE.Color(0x230a32);
      tentMat.color.copy(duskColor).lerp(cyberColor, cyber * 0.82);

      const pulse = 0.5 + 0.5 * Math.sin(time * 1.4);
      const cyberEmissive = new THREE.Color(0xff0066).lerp(new THREE.Color(0x00d8ff), pulse * 0.42);
      tentMat.emissive.setHex(0xc88842).lerp(cyberEmissive, cyber);
      tentMat.emissiveIntensity = THREE.MathUtils.lerp(0.18, 0.68 + pulse * 0.18, cyber);

      arcadeMat.emissive.setHex(0xdca048).lerp(new THREE.Color(0x00f0ff), cyber);
      arcadeMat.emissiveIntensity = THREE.MathUtils.lerp(0.45, 1.35, cyber);

      tentLight.color.setHex(0xffb85c).lerp(cyberEmissive, cyber);
      tentLight.intensity = THREE.MathUtils.lerp(12, 34, cyber);
      spireMat.emissiveIntensity = THREE.MathUtils.lerp(0.25, 1.6, cyber);

      // Animated holographic scan ring climbing up the tilted tent profile
      scanRing.visible = cyber > 0.12;
      const t = (time * 0.22) % 1;
      const r = THREE.MathUtils.lerp(27.6, 1.3, Math.pow(t, 0.68));
      scanRing.position.set(Math.pow(t, 1.15) * tiltX, 6.5 + t * tentH, 0);
      scanRing.scale.set(r * 1.09, r * 0.93, 12);
      scanRingMat.opacity = Math.sin(t * Math.PI) * 0.68 * cyber;
    }
  };
}

/* ============================================================================
   3. ABU DHABI PLAZA (Северная мегабашня 311м · X=-48, Z=-58)
   ============================================================================ */
export function buildAbuDhabiPlaza() {
  const group = new THREE.Group();
  group.name = 'Landmark_AbuDhabiPlaza';
  group.position.set(-48, 0, -58);

  // Shared procedural skyscraper window shader materials for the stepped megatowers
  const mainMat = createBuildingWindowMaterial({
    isInstanced: false,
    baseTint: 0x0a1528,
    seed: 0.14,
    accentIndex: 0.12
  });
  const wingMat = createBuildingWindowMaterial({
    isInstanced: false,
    baseTint: 0x081122,
    seed: 0.61,
    accentIndex: 0.78
  });

  // Grand multi-level glass podium
  const podiumMat = new THREE.MeshStandardMaterial({
    color: 0x161d2e,
    roughness: 0.3,
    metalness: 0.7
  });
  const podium = new THREE.Mesh(new THREE.BoxGeometry(52, 11, 28), podiumMat);
  podium.position.set(0, 5.5, 0);
  podium.receiveShadow = true;
  podium.castShadow = true;
  group.add(podium);

  // 4 Recognizable Stepped Interconnected Towers (75F + 58F + 44F + 32F)
  const tiers = [
    { w: 19, h: 146, d: 16, x: -5, z: -1, mat: mainMat }, // Tallest 311m supertall crown
    { w: 16, h: 112, d: 15, x: 11.5, z: 1, mat: wingMat }, // Stepped East Tower
    { w: 15, h: 86, d: 14, x: -20, z: 2, mat: wingMat }, // Stepped West Tower
    { w: 14, h: 58, d: 13, x: 23, z: 3, mat: mainMat } // Stepped Lower Wing
  ];

  for (const t of tiers) {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(t.w, t.h, t.d), t.mat);
    mesh.position.set(t.x, t.h / 2 + 8, t.z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    group.add(mesh);
  }

  // Iconic Vertical Structural Fins & Blazing Neon Crown Blades
  const finMat = new THREE.MeshStandardMaterial({
    color: 0xcbd5e1,
    metalness: 0.9,
    roughness: 0.2
  });
  const finNeonMat = new THREE.MeshStandardMaterial({
    color: 0x00f0ff,
    emissive: 0x00f0ff,
    emissiveIntensity: 2.8,
    roughness: 0.1
  });
  const yellowNeonMat = new THREE.MeshStandardMaterial({
    color: 0xfcee0a,
    emissive: 0xfcee0a,
    emissiveIntensity: 2.6,
    roughness: 0.1
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
      new THREE.BoxGeometry(0.32, fh * 0.98, 0.35),
      i < 4 ? finNeonMat : yellowNeonMat
    );
    neon.position.set(fx, fy, fz + (fz > 0 ? 0.65 : -0.65));
    group.add(neon);
  }

  // Sloped Architectural Crown Fin + Twin Spires + Helipad
  const crownGeo = new THREE.BoxGeometry(19.6, 14, 2.2);
  const crown = new THREE.Mesh(crownGeo, finMat);
  crown.position.set(-5, 158, -1);
  group.add(crown);

  const spire1 = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.55, 22, 8), finMat);
  spire1.position.set(-9, 170, -1);
  group.add(spire1);

  const spire2 = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.42, 16, 8), finMat);
  spire2.position.set(-1, 167, -1);
  group.add(spire2);

  // Blinking red aviation warning beacons
  const beaconMat = new THREE.MeshBasicMaterial({ color: 0xff003c });
  const beacon1 = new THREE.Mesh(new THREE.SphereGeometry(0.8, 10, 10), beaconMat);
  beacon1.position.set(-9, 181.5, -1);
  group.add(beacon1);
  const beacon2 = new THREE.Mesh(new THREE.SphereGeometry(0.65, 10, 10), beaconMat);
  beacon2.position.set(-1, 175.5, -1);
  group.add(beacon2);

  // Rooftop Helipad on Tier 2
  const heliRing = new THREE.Mesh(
    new THREE.RingGeometry(4.2, 5.1, 24),
    new THREE.MeshBasicMaterial({ color: 0xfcee0a, side: THREE.DoubleSide })
  );
  heliRing.rotation.x = -Math.PI / 2;
  heliRing.position.set(11.5, 120.3, 1);
  group.add(heliRing);

  return {
    group,
    shaderMaterials: [mainMat, wingMat],
    update(time, cyber) {
      mainMat.uniforms.uTime.value = time;
      mainMat.uniforms.uCyber.value = cyber;
      wingMat.uniforms.uTime.value = time;
      wingMat.uniforms.uCyber.value = cyber;

      finNeonMat.emissiveIntensity = THREE.MathUtils.lerp(0.12, 1.55, cyber);
      yellowNeonMat.emissiveIntensity = THREE.MathUtils.lerp(0.1, 1.45, cyber);

      const blink = Math.sin(time * 4.5) > 0.15 ? 1 : 0.15;
      beaconMat.color.setRGB(1.4 * blink, 0.03 * blink, 0.25 * blink);
    }
  };
}

/* ============================================================================
   4. NUR ALEM / EXPO SPHERE (Южная ось · X=-46, Z=72)
      Crisp Terraced Dark-Stone & Glass EXPO Plaza + Hollow Curved Glass Crescent Wings
   ============================================================================ */
export function buildNurAlem() {
  const group = new THREE.Group();
  group.name = 'Landmark_NurAlem';
  group.position.set(-46, 0, 72);

  const stoneMat = new THREE.MeshStandardMaterial({
    color: 0x161c28,
    roughness: 0.42,
    metalness: 0.48
  });
  const brushedSteelMat = new THREE.MeshStandardMaterial({
    color: 0x475569,
    roughness: 0.28,
    metalness: 0.85
  });
  const plazaRingGlowMat = new THREE.MeshStandardMaterial({
    color: 0x00e5ff,
    emissive: 0x00e5ff,
    emissiveIntensity: 1.4,
    roughness: 0.2
  });

  // 3-Tier Concentric Terraced Circular EXPO Plaza Podium (clean stepped stone + slim ring trims!)
  const tier1 = new THREE.Mesh(new THREE.CylinderGeometry(31.5, 32.8, 1.0, 48), stoneMat);
  tier1.position.y = 0.5;
  tier1.receiveShadow = true;
  group.add(tier1);

  const tier2 = new THREE.Mesh(new THREE.CylinderGeometry(25.5, 26.5, 1.1, 48), stoneMat);
  tier2.position.y = 1.55;
  tier2.receiveShadow = true;
  group.add(tier2);

  // Recessed central glass-and-steel atrium cradle lifting the 22-unit sphere cleanly
  const atriumPedestal = new THREE.Mesh(new THREE.CylinderGeometry(14.5, 16.2, 3.2, 36), brushedSteelMat);
  atriumPedestal.position.y = 3.2;
  group.add(atriumPedestal);

  // Slim glowing architectural ring trims along podium step edges (NO giant solid cyan disc!)
  const ringTrim1 = new THREE.Mesh(new THREE.TorusGeometry(31.6, 0.16, 8, 64), plazaRingGlowMat);
  ringTrim1.rotation.x = Math.PI / 2;
  ringTrim1.position.y = 1.05;
  group.add(ringTrim1);

  const ringTrim2 = new THREE.Mesh(new THREE.TorusGeometry(25.6, 0.16, 8, 64), plazaRingGlowMat);
  ringTrim2.rotation.x = Math.PI / 2;
  ringTrim2.position.y = 2.15;
  group.add(ringTrim2);

  // TRUE HOLLOW CURVED GLASS EXPO CRESCENT PAVILION WINGS (Extruded Annular Arcs + Mullions!)
  const wingGlassMat = new THREE.MeshStandardMaterial({
    color: 0x162942,
    emissive: 0x0d3654,
    emissiveIntensity: 0.45,
    metalness: 0.85,
    roughness: 0.14
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

    const bodyGeo = new THREE.ExtrudeGeometry(shape, {
      depth: wingH,
      bevelEnabled: false,
      curveSegments: 28
    });
    bodyGeo.rotateX(-Math.PI / 2);
    const bodyMesh = new THREE.Mesh(bodyGeo, wingGlassMat);
    bodyMesh.position.y = 0.2;
    bodyMesh.castShadow = true;
    bodyMesh.receiveShadow = true;
    group.add(bodyMesh);

    // Sleek dark-metal overhanging roof fascia slab
    const roofShape = new THREE.Shape();
    roofShape.absarc(0, 0, outerR + 0.6, startAngle - 0.02, endAngle + 0.02, false);
    roofShape.absarc(0, 0, innerR - 0.6, endAngle + 0.02, startAngle - 0.02, true);
    roofShape.closePath();
    const roofGeo = new THREE.ExtrudeGeometry(roofShape, {
      depth: 0.85,
      bevelEnabled: false,
      curveSegments: 28
    });
    roofGeo.rotateX(-Math.PI / 2);
    const roofMesh = new THREE.Mesh(roofGeo, stoneMat);
    roofMesh.position.y = wingH + 0.2;
    group.add(roofMesh);

    // Rhythmic vertical architectural facade mullions along both inner & outer curved walls
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

  // Slim glowing roofline rim accents on crescent pavilions
  const crescentTrim1 = new THREE.Mesh(
    new THREE.TorusGeometry(31.2, 0.14, 6, 36, 1.24),
    plazaRingGlowMat
  );
  crescentTrim1.rotation.x = Math.PI / 2;
  crescentTrim1.rotation.z = -0.62;
  crescentTrim1.position.y = 7.75;
  group.add(crescentTrim1);

  const crescentTrim2 = new THREE.Mesh(
    new THREE.TorusGeometry(31.2, 0.14, 6, 36, 1.24),
    plazaRingGlowMat
  );
  crescentTrim2.rotation.x = Math.PI / 2;
  crescentTrim2.rotation.z = Math.PI - 0.62;
  crescentTrim2.position.y = 7.75;
  group.add(crescentTrim2);

  // Inner multi-level architectural exhibition decks + pulsing quantum core
  const innerCoreMat = new THREE.MeshStandardMaterial({
    color: 0x00e5ff,
    emissive: 0x00d8ff,
    emissiveIntensity: 1.5,
    roughness: 0.15
  });
  const innerCore = new THREE.Mesh(new THREE.IcosahedronGeometry(6.4, 2), innerCoreMat);
  innerCore.position.y = 25.5;
  group.add(innerCore);

  const deckMat = new THREE.MeshStandardMaterial({
    color: 0x7dd3fc,
    emissive: 0x00c8ff,
    emissiveIntensity: 0.85,
    roughness: 0.3
  });
  for (let i = -2; i <= 2; i++) {
    const dy = i * 5.0;
    const dr = Math.sqrt(Math.max(1, 20.5 * 20.5 - dy * dy)) * 0.86;
    const deck = new THREE.Mesh(new THREE.TorusGeometry(dr, 0.22, 8, 42), deckMat);
    deck.rotation.x = Math.PI / 2;
    deck.position.y = 25.5 + dy;
    group.add(deck);
  }

  // Outer Monumental Geodesic Glass Sphere (r = 22)
  const glassMat = new THREE.MeshStandardMaterial({
    color: 0x1e4b7a,
    emissive: 0x051b33,
    emissiveIntensity: 0.28,
    metalness: 0.86,
    roughness: 0.12,
    transparent: true,
    opacity: 0.62
  });
  const outerSphere = new THREE.Mesh(new THREE.IcosahedronGeometry(22, 3), glassMat);
  outerSphere.position.y = 25.5;
  outerSphere.castShadow = true;
  group.add(outerSphere);

  // Crisp geodesic structural mullion lattice
  const latticeMat = new THREE.MeshBasicMaterial({
    color: 0x38e8ff,
    wireframe: true,
    transparent: true,
    opacity: 0.36
  });
  const lattice = new THREE.Mesh(new THREE.IcosahedronGeometry(22.16, 2), latticeMat);
  lattice.position.y = 25.5;
  group.add(lattice);

  // Twin rooftop wind-turbine accent rings at top pole
  const turbineMat = new THREE.MeshBasicMaterial({ color: 0x00ffb3 });
  const turbine1 = new THREE.Mesh(new THREE.TorusGeometry(3.9, 0.22, 8, 24), turbineMat);
  turbine1.position.set(-4.3, 46.0, 0);
  group.add(turbine1);
  const turbine2 = new THREE.Mesh(new THREE.TorusGeometry(3.9, 0.22, 8, 24), turbineMat);
  turbine2.position.set(4.3, 46.0, 0);
  group.add(turbine2);

  // 2077 Orbiting Equatorial Quantum Hologram Ring
  const eqRingMat = new THREE.MeshBasicMaterial({
    color: 0x00ffb3,
    transparent: true,
    opacity: 0.65,
    blending: THREE.AdditiveBlending,
    depthWrite: false
  });
  const eqRing = new THREE.Mesh(new THREE.TorusGeometry(28.0, 0.24, 8, 72), eqRingMat);
  eqRing.position.y = 25.5;
  eqRing.rotation.x = Math.PI / 2.25;
  group.add(eqRing);

  const sphereLight = new THREE.PointLight(0x00d8ff, 18, 95, 1.4);
  sphereLight.position.set(0, 25.5, 0);
  group.add(sphereLight);

  return {
    group,
    update(time, cyber) {
      innerCore.rotation.y = time * 0.45;
      innerCore.rotation.x = time * 0.22;
      eqRing.rotation.z = time * 0.35;
      turbine1.rotation.z = time * 2.2;
      turbine2.rotation.z = -time * 2.2;

      const pulse = 0.5 + 0.5 * Math.sin(time * 2.0);
      glassMat.opacity = THREE.MathUtils.lerp(0.84, 0.52, cyber);
      glassMat.emissiveIntensity = THREE.MathUtils.lerp(0.1, 0.36, cyber);
      wingGlassMat.emissive.setHex(0x886634).lerp(new THREE.Color(0x0a4468), cyber);
      wingGlassMat.emissiveIntensity = THREE.MathUtils.lerp(0.22, 0.62, cyber);

      plazaRingGlowMat.emissive.setHex(0xe5b864).lerp(new THREE.Color(0x00e5ff), cyber);
      plazaRingGlowMat.emissiveIntensity = THREE.MathUtils.lerp(0.32, 1.4, cyber);

      innerCore.visible = cyber > 0.08;
      innerCoreMat.emissiveIntensity = THREE.MathUtils.lerp(0.15, 1.25 + pulse * 0.25, cyber);
      deckMat.emissive.setHex(0xd8a862).lerp(new THREE.Color(0x00d8ff), cyber);
      deckMat.emissiveIntensity = THREE.MathUtils.lerp(0.24, 0.72, cyber);
      latticeMat.color.setHex(0x88a4c2).lerp(new THREE.Color(0x00e8ff), cyber);
      latticeMat.opacity = THREE.MathUtils.lerp(0.22, 0.42, cyber);
      turbineMat.color.setHex(0x94a3b8).lerp(new THREE.Color(0x00ffb3), cyber);

      eqRing.visible = cyber > 0.1;
      eqRingMat.opacity = THREE.MathUtils.smoothstep(cyber, 0.1, 0.9) * 0.68;
      sphereLight.intensity = THREE.MathUtils.lerp(8, 22, cyber);
    }
  };
}

/* ============================================================================
   5. AK ORDA PRESIDENTIAL PALACE (Восточная ось · Набережная Есиля · X=108, Z=0)
      Monumental Warm-Ivory Marble Neoclassical Palace · Fluted Columns w/ Bases & Capitals
      Recessed Warm Gold Windows · Tall Windowed Rotunda Drum · Ribbed Turquoise Dome
   ============================================================================ */
export function buildAkOrda() {
  const group = new THREE.Group();
  group.name = 'Landmark_AkOrda';
  group.position.set(108, 0, 0);

  // Authentic illuminated warm-ivory Italian marble (stays bright noble marble even in Night City!)
  const marbleMat = new THREE.MeshStandardMaterial({
    color: 0xeee8dc,
    emissive: 0x262018,
    emissiveIntensity: 0.45,
    roughness: 0.42,
    metalness: 0.12
  });
  const trimMarbleMat = new THREE.MeshStandardMaterial({
    color: 0xf7f2e8,
    emissive: 0x2c2419,
    emissiveIntensity: 0.5,
    roughness: 0.36,
    metalness: 0.16
  });
  const graniteMat = new THREE.MeshStandardMaterial({
    color: 0x252d3d,
    roughness: 0.52,
    metalness: 0.25
  });
  const bronzeRecessMat = new THREE.MeshStandardMaterial({
    color: 0x161b24,
    roughness: 0.32,
    metalness: 0.65
  });
  const goldMat = new THREE.MeshStandardMaterial({
    color: 0xffd25a,
    emissive: 0xdda018,
    emissiveIntensity: 0.72,
    metalness: 0.92,
    roughness: 0.16
  });

  // Grand terraced granite & marble ceremonial esplanade podium + West ceremonial steps + East river terrace
  const baseEsplanade = new THREE.Mesh(new THREE.BoxGeometry(42, 2.2, 62), graniteMat);
  baseEsplanade.position.set(0, 1.1, 0);
  baseEsplanade.receiveShadow = true;
  group.add(baseEsplanade);

  const upperEsplanade = new THREE.Mesh(new THREE.BoxGeometry(36, 2.0, 56), marbleMat);
  upperEsplanade.position.set(0, 3.2, 0);
  upperEsplanade.receiveShadow = true;
  group.add(upperEsplanade);

  // Sweeping stepped ceremonial staircase on West & East axes
  for (let s = 0; s < 4; s++) {
    const stepW = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.52, 24 - s * 1.4), trimMarbleMat);
    stepW.position.set(-22.5 + s * 1.5, 0.4 + s * 0.52, 0);
    group.add(stepW);
    const stepE = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.52, 22 - s * 1.4), trimMarbleMat);
    stepE.position.set(22.2 - s * 1.4, 0.4 + s * 0.52, 0);
    group.add(stepE);
  }

  // Main Neoclassical Marble Wings (24 x 16 x 50) + Recessed Dark Glazing Core
  const wingRecess = new THREE.Mesh(new THREE.BoxGeometry(23.4, 15.6, 49.4), bronzeRecessMat);
  wingRecess.position.set(0, 12.0, 0);
  group.add(wingRecess);

  const mainBody = new THREE.Mesh(new THREE.BoxGeometry(22.6, 16.0, 50.0), marbleMat);
  mainBody.position.set(0, 12.2, 0);
  mainBody.castShadow = true;
  mainBody.receiveShadow = true;
  group.add(mainBody);

  // Taller Protruding Central Ceremonial Pavilion (26 x 21 x 23)
  const centerBody = new THREE.Mesh(new THREE.BoxGeometry(25.2, 21.0, 23.0), marbleMat);
  centerBody.position.set(0, 14.7, 0);
  centerBody.castShadow = true;
  group.add(centerBody);

  // Sculpted Architectural Cornice Ledges, Stringcourses & Balustrade Parapets (merged)
  const corniceGeos = [];
  // Horizontal floor belt stringcourses wrapping wings & center
  for (const hy of [9.6, 14.8, 20.1]) {
    const wingBelt = new THREE.BoxGeometry(24.4, 0.65, 51.4);
    wingBelt.translate(0, hy, 0);
    corniceGeos.push(wingBelt);
  }
  // Wing roof overhanging classical cornice + parapet
  const wingCornice = new THREE.BoxGeometry(25.4, 1.0, 52.4);
  wingCornice.translate(0, 20.6, 0);
  corniceGeos.push(wingCornice);

  // Center pavilion overhanging classical cornice + attic pedestal
  const centerCornice = new THREE.BoxGeometry(28.4, 1.25, 25.6);
  centerCornice.translate(0, 25.4, 0);
  corniceGeos.push(centerCornice);

  const centerAttic = new THREE.BoxGeometry(24.6, 2.2, 22.0);
  centerAttic.translate(0, 27.0, 0);
  corniceGeos.push(centerAttic);

  // Stepped classical triangular pediment gables crowning West & East porticos
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

  // SLENDER FLUTED NEOCLASSICAL COLUMNS WITH PLINTH BASES & FLARED CAPITALS (Both West & East Porticos!)
  const colGeos = [];
  const colPositionsZ = [-22.5, -18.5, -14.5, -9.2, -5.6, -2.0, 2.0, 5.6, 9.2, 14.5, 18.5, 22.5];
  for (const z of colPositionsZ) {
    const isCenter = Math.abs(z) < 10.5;
    const colH = isCenter ? 19.6 : 14.8;
    for (const side of [-1, 1]) {
      const cx = side * (isCenter ? 14.2 : 12.6);
      // Square marble plinth base
      const plinth = new THREE.BoxGeometry(1.15, 0.85, 1.15);
      plinth.translate(cx, 4.62, z);
      colGeos.push(plinth);
      // Slender tapered shaft
      const shaft = new THREE.CylinderGeometry(0.32, 0.40, colH, 12);
      shaft.translate(cx, 5.05 + colH * 0.5, z);
      colGeos.push(shaft);
      // Flared Corinthian-inspired capital & abacus
      const cap = new THREE.CylinderGeometry(0.56, 0.34, 0.72, 12);
      cap.translate(cx, 5.05 + colH + 0.32, z);
      colGeos.push(cap);
      const abacus = new THREE.BoxGeometry(1.15, 0.32, 1.15);
      abacus.translate(cx, 5.05 + colH + 0.78, z);
      colGeos.push(abacus);
    }
  }
  group.add(new THREE.Mesh(mergeSafe(colGeos), trimMarbleMat));

  // RECESSED WARM-GOLD PALACE WINDOWS (3 distinct architectural floor tiers framed between columns!)
  const winMat = new THREE.MeshStandardMaterial({
    color: 0xffd584,
    emissive: 0xffab2e,
    emissiveIntensity: 1.05,
    roughness: 0.18
  });
  const winGeos = [];
  const winZ = [-20.5, -16.5, -12.4, -7.4, -3.8, 0, 3.8, 7.4, 12.4, 16.5, 20.5];
  for (const z of winZ) {
    const isCenter = Math.abs(z) < 10.5;
    const tiers = isCenter ? [7.0, 12.2, 17.5, 22.0] : [7.0, 12.2, 17.2];
    for (const wy of tiers) {
      const wh = wy > 16 ? 3.2 : 3.6;
      const ww = isCenter ? 1.8 : 1.75;
      for (const side of [-1, 1]) {
        const wx = side * (isCenter ? 12.75 : 11.45);
        // Dark bronze window mullion frame behind warm glass
        const pane = new THREE.BoxGeometry(0.28, wh, ww);
        pane.translate(wx, wy, z);
        winGeos.push(pane);
      }
    }
  }
  // North & South end facade palace windows
  for (const wx of [-7.5, -2.5, 2.5, 7.5]) {
    for (const wy of [7.0, 12.2, 17.2]) {
      for (const sz of [-25.15, 25.15]) {
        const pane = new THREE.BoxGeometry(1.75, 3.4, 0.28);
        pane.translate(wx, wy, sz);
        winGeos.push(pane);
      }
    }
  }
  group.add(new THREE.Mesh(mergeSafe(winGeos), winMat));

  // PROPER TALL WINDOWED CYLINDRICAL ROTUNDA DRUM supporting the Turquoise Dome
  const drum = new THREE.Mesh(new THREE.CylinderGeometry(9.2, 9.6, 8.2, 32), marbleMat);
  drum.position.set(0, 31.8, 0);
  group.add(drum);

  // Classical Drum Base & Crown Cornice Rings + 16 Tall Arched Clerestory Windows around the Drum!
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
    const wx = Math.cos(a) * 9.32;
    const wz = Math.sin(a) * 9.32;
    const dw = new THREE.BoxGeometry(0.32, 4.4, 1.35);
    dw.rotateY(-a);
    dw.translate(wx, 31.9, wz);
    drumWinGeos.push(dw);

    // Paired pilasters between drum windows
    const aCol = a + Math.PI / 16;
    const dc = new THREE.CylinderGeometry(0.24, 0.28, 7.2, 8);
    dc.translate(Math.cos(aCol) * 9.55, 31.9, Math.sin(aCol) * 9.55);
    drumColGeos.push(dc);
  }
  group.add(new THREE.Mesh(mergeSafe([...drumTrimGeos, ...drumColGeos]), trimMarbleMat));
  group.add(new THREE.Mesh(mergeSafe(drumWinGeos), winMat));

  // ICONIC RIBBED TURQUOISE-BLUE DOME (with 16 raised sculpted golden-ivory meridian ribs!)
  const domeMat = new THREE.MeshStandardMaterial({
    color: 0x0b8fd8,
    emissive: 0x045f9e,
    emissiveIntensity: 0.55,
    metalness: 0.42,
    roughness: 0.22
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
      const r = 9.48 * Math.cos(phi);
      const y = 36.1 + 9.48 * Math.sin(phi);
      pts.push(new THREE.Vector3(Math.cos(a) * r, y, Math.sin(a) * r));
    }
    domeRibGeos.push(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 12, 0.14, 5, false));
  }
  group.add(new THREE.Mesh(mergeSafe(domeRibGeos), goldMat));

  // Delicate translucent holographic dome grid in 2077 mode (never hides the ribbed turquoise dome!)
  const holoDomeMat = new THREE.MeshBasicMaterial({
    color: 0x00f0ff,
    wireframe: true,
    transparent: true,
    opacity: 0.26,
    blending: THREE.AdditiveBlending,
    depthWrite: false
  });
  const holoDome = new THREE.Mesh(
    new THREE.SphereGeometry(9.85, 16, 10, 0, Math.PI * 2, 0, Math.PI / 2),
    holoDomeMat
  );
  holoDome.position.set(0, 36.1, 0);
  group.add(holoDome);

  // Tiered Golden Cupola Lantern + Refined Slender Golden Spire + Sunburst Finial
  const lantern = new THREE.Mesh(new THREE.CylinderGeometry(1.3, 1.85, 2.4, 12), goldMat);
  lantern.position.set(0, 46.2, 0);
  group.add(lantern);
  const spire = new THREE.Mesh(new THREE.ConeGeometry(0.55, 16.5, 10), goldMat);
  spire.position.set(0, 55.4, 0);
  group.add(spire);
  const sunOrb = new THREE.Mesh(new THREE.SphereGeometry(0.95, 12, 12), goldMat);
  sunOrb.position.set(0, 63.8, 0);
  group.add(sunOrb);

  // Razor-thin Cyber Architectural Cornice Perimeter Edge Bars (hollow rectangular rim — never fills roof!)
  const cyberTrimMat = new THREE.MeshStandardMaterial({
    color: 0x00f0ff,
    emissive: 0x00e5ff,
    emissiveIntensity: 1.45,
    roughness: 0.15
  });
  const trimLinesGeos = [];
  function addRectRim(w, d, y, thick = 0.24) {
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
  addRectRim(28.6, 25.8, 25.95, 0.24);
  addRectRim(25.6, 52.6, 21.05, 0.22);
  const t3 = new THREE.TorusGeometry(10.05, 0.14, 6, 48);
  t3.rotateX(Math.PI / 2);
  t3.translate(0, 36.2, 0);
  trimLinesGeos.push(t3);
  const cyberTrimMesh = new THREE.Mesh(mergeSafe(trimLinesGeos), cyberTrimMat);
  group.add(cyberTrimMesh);

  // Dedicated warm-ivory architectural facade uplights on West & East colonnades
  const facadeLightW = new THREE.PointLight(0xffd28a, 24, 58, 1.5);
  facadeLightW.position.set(-20, 14, 0);
  group.add(facadeLightW);

  const facadeLightE = new THREE.PointLight(0xffd28a, 24, 58, 1.5);
  facadeLightE.position.set(20, 14, 0);
  group.add(facadeLightE);

  const domeLight = new THREE.PointLight(0x00d8ff, 18, 80, 1.5);
  domeLight.position.set(0, 48, 0);
  group.add(domeLight);

  return {
    group,
    update(time, cyber) {
      // Keep Ak Orda unmistakably illuminated ivory-white marble in BOTH Dusk and Night City 2077!
      marbleMat.color.setHex(0xeee8dc).lerp(new THREE.Color(0xcad5e4), cyber * 0.55);
      marbleMat.emissive.setHex(0x282117).lerp(new THREE.Color(0x162638), cyber);
      marbleMat.emissiveIntensity = THREE.MathUtils.lerp(0.32, 0.58, cyber);

      trimMarbleMat.color.setHex(0xf8f3ea).lerp(new THREE.Color(0xdbe6f4), cyber * 0.45);
      trimMarbleMat.emissive.setHex(0x30271a).lerp(new THREE.Color(0x1b3048), cyber);
      trimMarbleMat.emissiveIntensity = THREE.MathUtils.lerp(0.35, 0.65, cyber);

      domeMat.emissiveIntensity = THREE.MathUtils.lerp(0.30, 0.85, cyber);
      goldMat.emissiveIntensity = THREE.MathUtils.lerp(0.45, 1.25, cyber);
      winMat.emissive.setHex(0xffb438).lerp(new THREE.Color(0xffc24d), cyber);
      winMat.emissiveIntensity = THREE.MathUtils.lerp(0.85, 1.25, cyber);

      cyberTrimMesh.visible = cyber > 0.12;
      cyberTrimMat.emissiveIntensity = cyber * 1.65;

      holoDome.visible = cyber > 0.15;
      holoDome.rotation.y = time * 0.18;
      holoDomeMat.opacity = THREE.MathUtils.smoothstep(cyber, 0.15, 0.9) * 0.28;

      facadeLightW.color.setHex(0xffd48f).lerp(new THREE.Color(0x9ee8ff), cyber * 0.42);
      facadeLightE.color.setHex(0xffd48f).lerp(new THREE.Color(0x9ee8ff), cyber * 0.42);
      facadeLightW.intensity = THREE.MathUtils.lerp(18, 30, cyber);
      facadeLightE.intensity = THREE.MathUtils.lerp(18, 30, cyber);
      domeLight.intensity = THREE.MathUtils.lerp(10, 24, cyber);
    }
  };
}

/* ============================================================================
   6. PALACE OF PEACE & RECONCILIATION / PYRAMID (Правый берег Есиля · X=188, Z=0)
   ============================================================================ */
export function buildPyramid() {
  const group = new THREE.Group();
  group.name = 'Landmark_Pyramid';
  group.position.set(188, 0, 0);

  // Landscaped ziggurat base plinth
  const terraceMat = new THREE.MeshStandardMaterial({
    color: 0x1b2434,
    roughness: 0.5,
    metalness: 0.35
  });
  const plinth = new THREE.Mesh(new THREE.BoxGeometry(58, 4.5, 58), terraceMat);
  plinth.position.y = 2.25;
  plinth.receiveShadow = true;
  group.add(plinth);

  // Main Monumental Pyramid (lower stone/granite body + glowing stained-glass apex!)
  const baseRadius = 33;
  const pyrH = 44;

  // Lower truncated granite body (y = 4.5 to y = 34.5)
  const lowerMat = new THREE.MeshStandardMaterial({
    color: 0x3b4254,
    roughness: 0.45,
    metalness: 0.45
  });
  const lowerBody = new THREE.Mesh(new THREE.CylinderGeometry(9.2, baseRadius, 31.5, 4, 5), lowerMat);
  lowerBody.rotation.y = Math.PI / 4;
  lowerBody.position.y = 4.5 + 15.75;
  lowerBody.castShadow = true;
  lowerBody.receiveShadow = true;
  group.add(lowerBody);

  // Faceted diamond-grid facade truss wireframe
  const gridMat = new THREE.MeshBasicMaterial({
    color: 0x94a3b8,
    wireframe: true,
    transparent: true,
    opacity: 0.28
  });
  const lowerGrid = new THREE.Mesh(new THREE.CylinderGeometry(9.35, baseRadius + 0.2, 31.5, 4, 6), gridMat);
  lowerGrid.rotation.y = Math.PI / 4;
  lowerGrid.position.y = 4.5 + 15.75;
  group.add(lowerGrid);

  // Illuminated Stained-Glass Apex Pyramidion (Norman Foster golden glass capstone!)
  const apexMat = new THREE.MeshStandardMaterial({
    color: 0xffe291,
    emissive: 0xffb300,
    emissiveIntensity: 1.5,
    roughness: 0.15,
    metalness: 0.3
  });
  const apexMesh = new THREE.Mesh(new THREE.ConeGeometry(9.2, 12.6, 4), apexMat);
  apexMesh.rotation.y = Math.PI / 4;
  apexMesh.position.y = 4.5 + 31.5 + 6.3;
  group.add(apexMesh);

  // 4 Razor-Sharp Neon Edge-Tracing Ridges (Base corners -> Apex)
  const ridgeGeos = [];
  const topPt = new THREE.Vector3(0, 4.5 + pyrH, 0);
  const cornerDist = baseRadius;
  for (let i = 0; i < 4; i++) {
    const a = (i * Math.PI) / 2 + Math.PI / 4;
    const botPt = new THREE.Vector3(Math.cos(a) * cornerDist, 4.5, Math.sin(a) * cornerDist);
    ridgeGeos.push(new THREE.TubeGeometry(new THREE.LineCurve3(botPt, topPt), 4, 0.28, 6, false));
  }
  // Glowing collar ring at the glass-stone transition
  const collarPts = [];
  for (let i = 0; i <= 4; i++) {
    const a = ((i % 4) * Math.PI) / 2 + Math.PI / 4;
    collarPts.push(new THREE.Vector3(Math.cos(a) * 9.3, 36.0, Math.sin(a) * 9.3));
  }
  ridgeGeos.push(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(collarPts), 16, 0.24, 6, false));

  const ridgeMat = new THREE.MeshStandardMaterial({
    color: 0xfcee0a,
    emissive: 0xfcee0a,
    emissiveIntensity: 2.4,
    roughness: 0.1
  });
  const ridgeMesh = new THREE.Mesh(mergeSafe(ridgeGeos), ridgeMat);
  group.add(ridgeMesh);

  // Capstone skyward vertical prism beam
  const beamMat = new THREE.MeshBasicMaterial({
    color: 0xfcee0a,
    transparent: true,
    opacity: 0.25,
    blending: THREE.AdditiveBlending,
    depthWrite: false
  });
  const beam = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 1.1, 140, 8, 1, true), beamMat);
  beam.position.y = 4.5 + pyrH + 70;
  group.add(beam);

  return {
    group,
    update(time, cyber) {
      apexMat.emissive.setHex(0xdca038).lerp(new THREE.Color(0x00e5ff), cyber * 0.42);
      apexMat.emissiveIntensity = THREE.MathUtils.lerp(0.55, 1.35 + Math.sin(time * 2.4) * 0.15, cyber);

      ridgeMat.emissive.setHex(0xc89a42).lerp(new THREE.Color(0xfcee0a), cyber);
      ridgeMat.emissiveIntensity = THREE.MathUtils.lerp(0.15, 1.45, cyber);

      gridMat.color.setHex(0x94a3b8).lerp(new THREE.Color(0x00f0ff), cyber);
      gridMat.opacity = THREE.MathUtils.lerp(0.18, 0.44, cyber);

      beam.visible = cyber > 0.2;
      beamMat.opacity = THREE.MathUtils.smoothstep(cyber, 0.2, 1.0) * 0.18;
    }
  };
}

/* ============================================================================
   7. EMERALD TOWERS, NORTHERN LIGHTS & TRIUMPH OF ASTANA
   ============================================================================ */
export function buildSecondaryAstanaLandmarks() {
  const group = new THREE.Group();
  group.name = 'Landmark_SkylineClusters';
  const shaderMaterials = [];

  // --- EMERALD TOWERS (Изумрудный Квартал · X=44, Z=-48) ---
  const emeraldMat = createBuildingWindowMaterial({
    isInstanced: false,
    baseTint: 0x0b3634,
    seed: 0.27,
    accentIndex: 0.08
  });
  shaderMaterials.push(emeraldMat);

  const emeraldGroup = new THREE.Group();
  emeraldGroup.position.set(44, 0, -48);
  // Signature stepped outward-cantilevered jagged green-glass skyscraper silhouette!
  const emSpecs = [
    { x: 0, z: 0, h: 108, w: 17, d: 14, shearX: 0.08 },
    { x: 18, z: 4, h: 84, w: 15, d: 13, shearX: -0.06 },
    { x: -16, z: 6, h: 64, w: 14, d: 12, shearX: 0.05 }
  ];
  const emNeonMat = new THREE.MeshStandardMaterial({
    color: 0x00ffb3,
    emissive: 0x00ffb3,
    emissiveIntensity: 2.4
  });

  for (const s of emSpecs) {
    // 4 stepped stacked segments flaring out like real Emerald Towers!
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
    const crownBar = new THREE.Mesh(new THREE.BoxGeometry(s.w + 3.6, 0.8, s.d + 2.0), emNeonMat);
    crownBar.position.set(s.x + 3 * s.shearX * 16, s.h + 0.4, s.z);
    emeraldGroup.add(crownBar);
  }
  group.add(emeraldGroup);

  // --- NORTHERN LIGHTS (Северное Сияние · X=-6, Z=-64) ---
  const nlMat = createBuildingWindowMaterial({
    isInstanced: false,
    baseTint: 0x15223c,
    seed: 0.82,
    accentIndex: 0.48
  });
  shaderMaterials.push(nlMat);

  const nlGroup = new THREE.Group();
  nlGroup.position.set(-4, 0, -64);
  const nlTowers = [
    { x: -15, h: 68, r: 6.5 },
    { x: 0, h: 82, r: 7.2 },
    { x: 15, h: 58, r: 6.0 }
  ];
  const nlNeonMat = new THREE.MeshStandardMaterial({
    color: 0xff0066,
    emissive: 0xff0066,
    emissiveIntensity: 2.3
  });
  for (const t of nlTowers) {
    // Sleek undulating elliptical wave silhouette
    const geo = new THREE.CylinderGeometry(t.r * 0.88, t.r, t.h, 16, 10);
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

    const halo = new THREE.Mesh(new THREE.TorusGeometry(t.r * 0.9, 0.25, 6, 24), nlNeonMat);
    halo.rotation.x = Math.PI / 2;
    halo.position.set(t.x, t.h + 0.5, 0);
    nlGroup.add(halo);
  }
  group.add(nlGroup);

  // --- TRIUMPH OF ASTANA (Триумф Астаны · X=34, Z=62) ---
  const triMat = createBuildingWindowMaterial({
    isInstanced: false,
    baseTint: 0x2c241d,
    seed: 0.44,
    accentIndex: 0.82
  });
  shaderMaterials.push(triMat);

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
  const triSpireMat = new THREE.MeshStandardMaterial({
    color: 0xfcee0a,
    emissive: 0xfcee0a,
    emissiveIntensity: 2.2,
    metalness: 0.85
  });
  const triSpire = new THREE.Mesh(new THREE.ConeGeometry(1.4, 15, 8), triSpireMat);
  triSpire.position.y = 87;
  triGroup.add(triSpire);
  group.add(triGroup);

  return {
    group,
    shaderMaterials,
    update(time, cyber) {
      for (const m of shaderMaterials) {
        m.uniforms.uTime.value = time;
        m.uniforms.uCyber.value = cyber;
      }
      emNeonMat.emissiveIntensity = THREE.MathUtils.lerp(0.12, 1.45, cyber);
      nlNeonMat.emissiveIntensity = THREE.MathUtils.lerp(0.12, 1.45, cyber);
      triSpireMat.emissiveIntensity = THREE.MathUtils.lerp(0.18, 1.35, cyber);
    }
  };
}

/* ============================================================================
   8. URBAN BASE, NURZHOL BOULEVARD, ESIL RIVER, ARCHED BRIDGES & CYBER-MONORAIL
   ============================================================================ */
export function buildUrbanBaseAndRiver() {
  const group = new THREE.Group();
  group.name = 'Urban_BaseAndRiver';

  const roadMat = createWetRoadMaterial();
  const riverMat = createEsilRiverMaterial();

  // Left Bank Wet Urban Ground Plane (X from -380 to +132)
  const leftGround = new THREE.Mesh(new THREE.PlaneGeometry(512, 760), roadMat);
  leftGround.rotation.x = -Math.PI / 2;
  leftGround.position.set(-124, 0, 0);
  leftGround.receiveShadow = true;
  group.add(leftGround);

  // Right Bank Urban Ground Plane across Esil River (X from +164 to +480)
  const rightGround = new THREE.Mesh(new THREE.PlaneGeometry(316, 760), roadMat);
  rightGround.rotation.x = -Math.PI / 2;
  rightGround.position.set(322, 0, 0);
  rightGround.receiveShadow = true;
  group.add(rightGround);

  // ESIL RIVER CHANNEL (X = 148, width 34, recessed slightly at y = -1.2)
  const riverMesh = new THREE.Mesh(new THREE.PlaneGeometry(34, 760, 1, 1), riverMat);
  riverMesh.rotation.x = -Math.PI / 2;
  riverMesh.position.set(148, -1.2, 0);
  group.add(riverMesh);

  // Granite + Neon River Embankment Walls
  const wallMat = new THREE.MeshStandardMaterial({ color: 0x1b2333, roughness: 0.5, metalness: 0.4 });
  const embNeonMat = new THREE.MeshStandardMaterial({
    color: 0x00f0ff,
    emissive: 0x00f0ff,
    emissiveIntensity: 2.2
  });
  for (const bx of [131.5, 164.5]) {
    const wall = new THREE.Mesh(new THREE.BoxGeometry(1.4, 2.4, 760), wallMat);
    wall.position.set(bx, -0.4, 0);
    group.add(wall);
    const strip = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.35, 520), embNeonMat);
    strip.position.set(bx + (bx < 148 ? 0.7 : -0.7), 0.75, 0);
    group.add(strip);
  }

  // ARCHED GLOWING BRIDGES OVER ESIL RIVER (Z = 0 main bridge + Z = -88 north bridge)
  const bridgeArchMat = new THREE.MeshStandardMaterial({
    color: 0xdbeafe,
    emissive: 0x00e5ff,
    emissiveIntensity: 1.8,
    metalness: 0.7,
    roughness: 0.2
  });
  const bridgeDeckMat = new THREE.MeshStandardMaterial({
    color: 0x111726,
    roughness: 0.35,
    metalness: 0.5
  });

  function createArchBridge(zPos, deckWidth, archHeight) {
    const bGroup = new THREE.Group();
    bGroup.position.set(148, 0.8, zPos);

    const deck = new THREE.Mesh(new THREE.BoxGeometry(38, 1.1, deckWidth), bridgeDeckMat);
    bGroup.add(deck);

    // Twin parabolic illuminated steel arches + vertical hangers
    const archGeos = [];
    for (const side of [-1, 1]) {
      const zOff = side * (deckWidth * 0.46);
      const curvePts = [];
      for (let s = 0; s <= 12; s++) {
        const u = s / 12;
        const x = (u - 0.5) * 35;
        const y = Math.sin(u * Math.PI) * archHeight;
        curvePts.push(new THREE.Vector3(x, y, zOff));
      }
      archGeos.push(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(curvePts), 22, 0.45, 6, false));

      // Vertical suspension cables
      for (let h = 1; h < 10; h++) {
        const u = h / 10;
        const x = (u - 0.5) * 35;
        const y = Math.sin(u * Math.PI) * archHeight;
        const cable = new THREE.CylinderGeometry(0.08, 0.08, y, 4);
        cable.translate(x, y / 2, zOff);
        archGeos.push(cable);
      }
    }
    bGroup.add(new THREE.Mesh(mergeSafe(archGeos), bridgeArchMat));
    return bGroup;
  }

  group.add(createArchBridge(0, 14, 13.5));
  group.add(createArchBridge(-88, 11, 10.5));
  group.add(createArchBridge(86, 11, 10.5));

  // NURZHOL WATER-GREEN BOULEVARD CENTRAL PROMENADE & FOUNTAIN POOLS
  const promMat = new THREE.MeshStandardMaterial({ color: 0x161d2c, roughness: 0.45, metalness: 0.3 });
  const promWest = new THREE.Mesh(new THREE.BoxGeometry(64, 0.7, 15), promMat);
  promWest.position.set(-54, 0.35, 0);
  group.add(promWest);

  const promEast = new THREE.Mesh(new THREE.BoxGeometry(64, 0.7, 15), promMat);
  promEast.position.set(54, 0.35, 0);
  group.add(promEast);

  // Glowing reflecting water pools along Nurzhol Boulevard
  const poolMat = new THREE.MeshStandardMaterial({
    color: 0x064e6e,
    emissive: 0x00d9ff,
    emissiveIntensity: 1.4,
    roughness: 0.1,
    metalness: 0.3
  });
  for (const px of [-68, -42, 42, 68]) {
    const pool = new THREE.Mesh(new THREE.BoxGeometry(16, 0.16, 6.2), poolMat);
    pool.position.set(px, 0.76, 0);
    group.add(pool);
  }

  // 2 SLEEK CYBERPUNK GLAZED TRUSS PEDESTRIAN SKYBRIDGES crossing Nurzhol Boulevard
  const skybridgeGlassMat = new THREE.MeshStandardMaterial({
    color: 0x0b1a2e,
    emissive: 0x06243d,
    emissiveIntensity: 0.35,
    metalness: 0.9,
    roughness: 0.12,
    transparent: true,
    opacity: 0.44
  });
  const skybridgeFrameMat = new THREE.MeshStandardMaterial({
    color: 0x334155,
    metalness: 0.88,
    roughness: 0.25
  });
  const skybridgeFloorGlowMat = new THREE.MeshStandardMaterial({
    color: 0xffd584,
    emissive: 0x00e5ff,
    emissiveIntensity: 1.0,
    roughness: 0.25
  });
  const skybridgeCyanRailMat = new THREE.MeshStandardMaterial({
    color: 0x00f0ff,
    emissive: 0x00f0ff,
    emissiveIntensity: 1.65,
    roughness: 0.15
  });
  const skybridgeAmberRailMat = new THREE.MeshStandardMaterial({
    color: 0xffb82e,
    emissive: 0xffb82e,
    emissiveIntensity: 1.5,
    roughness: 0.15
  });

  function buildGlazedTrussSkybridge(sx) {
    const sb = new THREE.Group();
    sb.position.set(sx, 14.2, 0);

    const span = 46;
    // Translucent dark smoked-glass elliptical walkway tunnel
    const glassTunnel = new THREE.Mesh(
      new THREE.CylinderGeometry(2.1, 2.1, span, 14, 1, true),
      skybridgeGlassMat
    );
    glassTunnel.rotation.x = Math.PI / 2;
    glassTunnel.scale.set(1.08, 1.0, 0.86);
    sb.add(glassTunnel);

    // Solid dark deck base + glowing interior walkway floor strip
    const deckSlab = new THREE.Mesh(new THREE.BoxGeometry(3.8, 0.48, span), skybridgeFrameMat);
    deckSlab.position.y = -1.62;
    sb.add(deckSlab);

    const floorGlow = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.12, span - 1.5), skybridgeFloorGlowMat);
    floorGlow.position.y = -1.32;
    sb.add(floorGlow);

    // Rhythmic curved steel exo-ribs + longitudinal spine + twin V-truss steel pylons (merged!)
    const trussGeos = [];
    // Roof & side longitudinal chord rails
    const spine = new THREE.BoxGeometry(0.42, 0.34, span + 0.5);
    spine.translate(0, 1.85, 0);
    trussGeos.push(spine);
    for (const side of [-1, 1]) {
      const chord = new THREE.BoxGeometry(0.24, 0.24, span);
      chord.translate(side * 2.18, -0.35, 0);
      trussGeos.push(chord);
    }

    // 11 rhythmic curved steel arch ribs wrapping around the glazed tube
    for (let i = -5; i <= 5; i++) {
      const rz = i * 4.2;
      const rib = new THREE.TorusGeometry(2.26, 0.13, 6, 18);
      rib.scale(1.06, 0.86, 1.0);
      rib.translate(0, 0, rz);
      trussGeos.push(rib);
    }

    // Sculpted Twin V-Truss Steel Pylons with horizontal cross-bracing on North & South flanks
    for (const sz of [-20.5, 20.5]) {
      for (const legSide of [-1, 1]) {
        const topPt = new THREE.Vector3(legSide * 1.4, -1.6, sz);
        const botPt = new THREE.Vector3(legSide * 3.1, -14.2, sz + Math.sign(sz) * 1.2);
        trussGeos.push(new THREE.TubeGeometry(new THREE.LineCurve3(botPt, topPt), 2, 0.34, 6, false));
      }
      // Cross braces between V-legs
      for (const cy of [-5.2, -9.8]) {
        const brace = new THREE.BoxGeometry(4.4, 0.28, 0.32);
        brace.translate(0, cy, sz + Math.sign(sz) * 0.45);
        trussGeos.push(brace);
      }
    }
    sb.add(new THREE.Mesh(mergeSafe(trussGeos), skybridgeFrameMat));

    // Razor-thin cyan & amber under-rail neon accent tubes
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

  // Boulevard Futuristic Curved Streetlamps (InstancedMesh)
  const lampPosts = [];
  for (let lx = -92; lx <= 88; lx += 14) {
    if (Math.abs(lx) < 22) continue;
    lampPosts.push([lx, -9.8, 1], [lx, 9.8, -1]);
  }
  const poleInst = new THREE.InstancedMesh(
    new THREE.CylinderGeometry(0.10, 0.18, 6.8, 6),
    skybridgeFrameMat,
    lampPosts.length
  );
  const armInst = new THREE.InstancedMesh(
    new THREE.BoxGeometry(0.14, 0.14, 1.8),
    skybridgeFrameMat,
    lampPosts.length
  );
  const bulbMat = new THREE.MeshBasicMaterial({ color: 0xffe4a0 });
  const bulbInst = new THREE.InstancedMesh(
    new THREE.BoxGeometry(0.32, 0.16, 0.9),
    bulbMat,
    lampPosts.length
  );
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

  // ELEVATED CYBER-MONORAIL VIADUCT + ANIMATED MAGLEV TRAIN (sweeps cleanly south of Ak Orda esplanade)
  const railCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-190, 10.5, 24),
    new THREE.Vector3(-90, 10.5, 21),
    new THREE.Vector3(0, 10.5, 22),
    new THREE.Vector3(68, 10.5, 25),
    new THREE.Vector3(108, 10.5, 34),
    new THREE.Vector3(156, 10.5, 34),
    new THREE.Vector3(215, 10.5, 34)
  ]);
  const railMesh = new THREE.Mesh(new THREE.TubeGeometry(railCurve, 64, 0.65, 6, false), wallMat);
  group.add(railMesh);

  const railGlowMat = new THREE.MeshBasicMaterial({ color: 0x00f0ff });
  const railStrip = new THREE.Mesh(
    new THREE.TubeGeometry(
      new THREE.CatmullRomCurve3(railCurve.getPoints(24).map((p) => new THREE.Vector3(p.x, p.y + 0.62, p.z))),
      64,
      0.16,
      4,
      false
    ),
    railGlowMat
  );
  group.add(railStrip);

  // Support Y-pylons for the monorail
  const pylonGeos = [];
  for (let t = 0.06; t <= 0.94; t += 0.08) {
    const pt = railCurve.getPoint(t);
    if (pt.x > 130 && pt.x < 166) continue; // span over river cleanly
    const c = new THREE.CylinderGeometry(0.45, 0.72, pt.y, 6);
    c.translate(pt.x, pt.y / 2, pt.z);
    pylonGeos.push(c);
  }
  group.add(new THREE.Mesh(mergeSafe(pylonGeos), wallMat));

  // Streamlined 4-Car Glowing Cyber Maglev Train
  const trainGroup = new THREE.Group();
  const carBodyMat = new THREE.MeshStandardMaterial({
    color: 0xe2e8f0,
    metalness: 0.85,
    roughness: 0.2
  });
  const carNeonMat = new THREE.MeshBasicMaterial({ color: 0x00f0ff });
  const carTailMat = new THREE.MeshBasicMaterial({ color: 0xff003c });
  for (let c = 0; c < 4; c++) {
    const car = new THREE.Mesh(new THREE.BoxGeometry(5.8, 1.9, 2.2), carBodyMat);
    car.position.x = (c - 1.5) * 6.4;
    trainGroup.add(car);
    const stripe = new THREE.Mesh(new THREE.BoxGeometry(5.6, 0.28, 2.32), carNeonMat);
    stripe.position.set((c - 1.5) * 6.4, 0.25, 0);
    trainGroup.add(stripe);
  }
  const headLight = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.6, 1.8), carNeonMat);
  headLight.position.set(12.6, 0, 0);
  trainGroup.add(headLight);
  const tailLight = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.6, 1.8), carTailMat);
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

      embNeonMat.emissiveIntensity = THREE.MathUtils.lerp(0.15, 1.35, cyber);
      bridgeArchMat.emissive.setHex(0xd4a448).lerp(new THREE.Color(0x00e5ff), cyber);
      bridgeArchMat.emissiveIntensity = THREE.MathUtils.lerp(0.22, 1.25, cyber);
      poolMat.emissiveIntensity = THREE.MathUtils.lerp(0.18, 1.05, cyber);
      skybridgeGlassMat.emissive.setHex(0x283a52).lerp(new THREE.Color(0x06324d), cyber);
      skybridgeGlassMat.emissiveIntensity = THREE.MathUtils.lerp(0.12, 0.42, cyber);
      skybridgeFloorGlowMat.emissive.setHex(0xd8a858).lerp(new THREE.Color(0x00e5ff), cyber);
      skybridgeFloorGlowMat.emissiveIntensity = THREE.MathUtils.lerp(0.32, 1.05, cyber);
      skybridgeCyanRailMat.emissive.setHex(0xd8a858).lerp(new THREE.Color(0x00f0ff), cyber);
      skybridgeCyanRailMat.emissiveIntensity = THREE.MathUtils.lerp(0.12, 1.65, cyber);
      skybridgeAmberRailMat.emissive.setHex(0xd8a858).lerp(new THREE.Color(0xffb82e), cyber);
      skybridgeAmberRailMat.emissiveIntensity = THREE.MathUtils.lerp(0.12, 1.45, cyber);

      bulbMat.color.setHex(0xffd485).lerp(new THREE.Color(0xfcee0a), cyber);
      railGlowMat.color.setHex(0x64748b).lerp(new THREE.Color(0x00f0ff), cyber);

      // Animate Maglev Train smoothly along railCurve
      const u = (time * 0.055) % 1;
      railCurve.getPointAt(u, tmpPos);
      railCurve.getTangentAt(u, tmpTan);
      trainGroup.position.set(tmpPos.x, tmpPos.y + 1.55, tmpPos.z);
      trainGroup.rotation.y = -Math.atan2(tmpTan.z, tmpTan.x);
    }
  };
}
