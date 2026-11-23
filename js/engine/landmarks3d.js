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
    baseTint: 0x18253d,
    seed: 0.14,
    accentIndex: 0.12
  });
  const wingMat = createBuildingWindowMaterial({
    isInstanced: false,
    baseTint: 0x141f34,
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
   4. NUR ALEM / EXPO SPHERE (Южная ось · X=-34, Z=56)
   ============================================================================ */
export function buildNurAlem() {
  const group = new THREE.Group();
  group.name = 'Landmark_NurAlem';
  group.position.set(-46, 0, 72);

  // Circular EXPO concourse plaza + twin curved pavilion crescent wings
  const concourseMat = new THREE.MeshStandardMaterial({
    color: 0x20293d,
    roughness: 0.35,
    metalness: 0.65
  });
  const basePlinth = new THREE.Mesh(new THREE.CylinderGeometry(28, 30, 3.6, 36), concourseMat);
  basePlinth.position.y = 1.8;
  basePlinth.receiveShadow = true;
  group.add(basePlinth);

  // Flanking EXPO crescent wings (two iconic sweeping curved halls)
  const wingGeo1 = new THREE.CylinderGeometry(37, 37, 8, 28, 1, false, -0.7, 1.4);
  const wingMesh1 = new THREE.Mesh(wingGeo1, concourseMat);
  wingMesh1.position.y = 4;
  group.add(wingMesh1);

  const wingGeo2 = new THREE.CylinderGeometry(37, 37, 8, 28, 1, false, Math.PI - 0.7, 1.4);
  const wingMesh2 = new THREE.Mesh(wingGeo2, concourseMat);
  wingMesh2.position.y = 4;
  group.add(wingMesh2);

  // Inner multi-level glowing exhibition decks + quantum reactor core
  const innerCoreMat = new THREE.MeshStandardMaterial({
    color: 0x00f0ff,
    emissive: 0x00e5ff,
    emissiveIntensity: 2.2,
    roughness: 0.15
  });
  const innerCore = new THREE.Mesh(new THREE.IcosahedronGeometry(7.5, 2), innerCoreMat);
  innerCore.position.y = 25;
  group.add(innerCore);

  const deckMat = new THREE.MeshStandardMaterial({
    color: 0x94e2ff,
    emissive: 0x00c8ff,
    emissiveIntensity: 1.1,
    roughness: 0.3
  });
  for (let i = -2; i <= 2; i++) {
    const dy = i * 5.2;
    const dr = Math.sqrt(Math.max(1, 20.5 * 20.5 - dy * dy)) * 0.85;
    const deck = new THREE.Mesh(new THREE.TorusGeometry(dr, 0.35, 8, 36), deckMat);
    deck.rotation.x = Math.PI / 2;
    deck.position.y = 25 + dy;
    group.add(deck);
  }

  // Outer Monumental Geodesic Glass Sphere (r = 22)
  const glassMat = new THREE.MeshStandardMaterial({
    color: 0x3b72a8,
    emissive: 0x06233d,
    emissiveIntensity: 0.35,
    metalness: 0.82,
    roughness: 0.14,
    transparent: true,
    opacity: 0.68
  });
  const outerSphere = new THREE.Mesh(new THREE.IcosahedronGeometry(22, 3), glassMat);
  outerSphere.position.y = 25;
  outerSphere.castShadow = true;
  group.add(outerSphere);

  // Crisp geodesic structural mullion lattice
  const latticeMat = new THREE.MeshBasicMaterial({
    color: 0x38e8ff,
    wireframe: true,
    transparent: true,
    opacity: 0.42
  });
  const lattice = new THREE.Mesh(new THREE.IcosahedronGeometry(22.18, 2), latticeMat);
  lattice.position.y = 25;
  group.add(lattice);

  // Twin rooftop wind-turbine accent rings at top pole
  const turbineMat = new THREE.MeshBasicMaterial({ color: 0x00ffb3 });
  const turbine1 = new THREE.Mesh(new THREE.TorusGeometry(4.2, 0.28, 8, 24), turbineMat);
  turbine1.position.set(-4.5, 45.5, 0);
  group.add(turbine1);
  const turbine2 = new THREE.Mesh(new THREE.TorusGeometry(4.2, 0.28, 8, 24), turbineMat);
  turbine2.position.set(4.5, 45.5, 0);
  group.add(turbine2);

  // 2077 Orbiting Equatorial Quantum Hologram Ring
  const eqRingMat = new THREE.MeshBasicMaterial({
    color: 0x00ffb3,
    transparent: true,
    opacity: 0.72,
    blending: THREE.AdditiveBlending,
    depthWrite: false
  });
  const eqRing = new THREE.Mesh(new THREE.TorusGeometry(28.5, 0.32, 8, 72), eqRingMat);
  eqRing.position.y = 25;
  eqRing.rotation.x = Math.PI / 2.25;
  group.add(eqRing);

  const sphereLight = new THREE.PointLight(0x00e5ff, 22, 100, 1.4);
  sphereLight.position.set(0, 25, 0);
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
      // In Real Astana (cyber=0): sleek dark-blue reflective museum sphere with warm floor lighting
      // In Night City (cyber=1): glowing quantum reactor core + cyan geodesic mullions + orbiting holo-ring!
      glassMat.opacity = THREE.MathUtils.lerp(0.84, 0.52, cyber);
      glassMat.emissiveIntensity = THREE.MathUtils.lerp(0.12, 0.45, cyber);
      innerCore.visible = cyber > 0.08;
      innerCoreMat.emissiveIntensity = THREE.MathUtils.lerp(0.15, 1.35 + pulse * 0.28, cyber);
      deckMat.emissive.setHex(0xd8a862).lerp(new THREE.Color(0x00d8ff), cyber);
      deckMat.emissiveIntensity = THREE.MathUtils.lerp(0.28, 0.85, cyber);
      latticeMat.color.setHex(0x88a4c2).lerp(new THREE.Color(0x00e8ff), cyber);
      latticeMat.opacity = THREE.MathUtils.lerp(0.22, 0.48, cyber);
      turbineMat.color.setHex(0x94a3b8).lerp(new THREE.Color(0x00ffb3), cyber);

      eqRing.visible = cyber > 0.1;
      eqRingMat.opacity = THREE.MathUtils.smoothstep(cyber, 0.1, 0.9) * 0.72;
      sphereLight.intensity = THREE.MathUtils.lerp(8, 28, cyber);
    }
  };
}

/* ============================================================================
   5. AK ORDA PRESIDENTIAL PALACE (Восточная ось · Набережная Есиля · X=108, Z=0)
   ============================================================================ */
export function buildAkOrda() {
  const group = new THREE.Group();
  group.name = 'Landmark_AkOrda';
  group.position.set(108, 0, 0);

  const marbleMat = new THREE.MeshStandardMaterial({
    color: 0xbec8d8,
    roughness: 0.46,
    metalness: 0.15
  });
  const darkMarbleMat = new THREE.MeshStandardMaterial({
    color: 0x263148,
    roughness: 0.42,
    metalness: 0.35
  });
  const goldMat = new THREE.MeshStandardMaterial({
    color: 0xffd152,
    emissive: 0xffa600,
    emissiveIntensity: 0.8,
    metalness: 0.92,
    roughness: 0.18
  });

  // Grand ceremonial raised esplanade podium + western steps
  const podium = new THREE.Mesh(new THREE.BoxGeometry(38, 4, 58), darkMarbleMat);
  podium.position.set(0, 2, 0);
  podium.receiveShadow = true;
  group.add(podium);

  const stairs = new THREE.Mesh(new THREE.BoxGeometry(8, 2.2, 24), marbleMat);
  stairs.position.set(-22, 1.1, 0);
  group.add(stairs);

  // Main neoclassical rectangular palace body & taller central pavilion
  const mainBody = new THREE.Mesh(new THREE.BoxGeometry(24, 15, 48), marbleMat);
  mainBody.position.set(0, 11.5, 0);
  mainBody.castShadow = true;
  mainBody.receiveShadow = true;
  group.add(mainBody);

  const centerBlock = new THREE.Mesh(new THREE.BoxGeometry(27, 20, 22), marbleMat);
  centerBlock.position.set(-1, 14, 0);
  centerBlock.castShadow = true;
  group.add(centerBlock);

  // Classical cornice roof trim
  const cornice = new THREE.Mesh(new THREE.BoxGeometry(29, 1.4, 24), marbleMat);
  cornice.position.set(-1, 24.4, 0);
  group.add(cornice);

  // Portico colonnades on BOTH West (Boulevard) AND East (Esil River) facades!
  const colGeos = [];
  for (let i = 0; i < 10; i++) {
    const z = -20 + (i / 9) * 40;
    const isCenter = Math.abs(z) < 11;
    const h = isCenter ? 19.5 : 14.5;
    // West facade columns (facing Nurzhol Boulevard)
    const xW = isCenter ? -15.2 : -12.8;
    const colW = new THREE.CylinderGeometry(0.52, 0.62, h, 10);
    colW.translate(xW, 4 + h / 2, z);
    colGeos.push(colW);
    // East facade columns (facing Esil River & Pyramid)
    const xE = isCenter ? 13.2 : 12.8;
    const colE = new THREE.CylinderGeometry(0.52, 0.62, h, 10);
    colE.translate(xE, 4 + h / 2, z);
    colGeos.push(colE);
  }
  group.add(new THREE.Mesh(mergeSafe(colGeos), marbleMat));

  // Classical pediment cornice band & illuminated frieze trim
  const corniceGlowMat = new THREE.MeshStandardMaterial({
    color: 0xffd152,
    emissive: 0x00e5ff,
    emissiveIntensity: 1.2,
    roughness: 0.2
  });
  const corniceTrim = new THREE.Mesh(new THREE.BoxGeometry(29.6, 0.45, 24.6), corniceGlowMat);
  corniceTrim.position.set(-1, 24.9, 0);
  group.add(corniceTrim);
  const wingTrim = new THREE.Mesh(new THREE.BoxGeometry(24.6, 0.42, 48.6), corniceGlowMat);
  wingTrim.position.set(0, 19.2, 0);
  group.add(wingTrim);

  // Illuminated arched palace window bays (cleanly offset outside walls — zero Z-fighting!)
  const winMat = new THREE.MeshStandardMaterial({
    color: 0xffe4a0,
    emissive: 0xffb833,
    emissiveIntensity: 1.0,
    roughness: 0.2
  });
  const winGeos = [];
  for (let i = -5; i <= 5; i++) {
    const z = i * 4.1;
    const isCenter = Math.abs(z) < 10.5;
    const boxW = new THREE.BoxGeometry(0.35, isCenter ? 11.0 : 8.5, 1.7);
    boxW.translate(isCenter ? -14.6 : -12.2, isCenter ? 12.5 : 11.5, z);
    winGeos.push(boxW);
    const boxE = new THREE.BoxGeometry(0.35, isCenter ? 11.0 : 8.5, 1.7);
    boxE.translate(isCenter ? 12.65 : 12.2, isCenter ? 12.5 : 11.5, z);
    winGeos.push(boxE);
  }
  group.add(new THREE.Mesh(mergeSafe(winGeos), winMat));

  // Drum rotunda supporting the iconic blue dome
  const drum = new THREE.Mesh(new THREE.CylinderGeometry(9.6, 10.2, 6.5, 24), marbleMat);
  drum.position.set(-1, 27.8, 0);
  group.add(drum);

  // ICONIC TURQUOISE-BLUE DOME
  const domeMat = new THREE.MeshStandardMaterial({
    color: 0x0ea5e9,
    emissive: 0x00b4ff,
    emissiveIntensity: 0.75,
    metalness: 0.45,
    roughness: 0.24
  });
  const dome = new THREE.Mesh(
    new THREE.SphereGeometry(9.8, 28, 16, 0, Math.PI * 2, 0, Math.PI / 2),
    domeMat
  );
  dome.position.set(-1, 31.0, 0);
  group.add(dome);

  // Holographic cyber grid wrapping the turquoise dome in 2077 mode
  const holoDomeMat = new THREE.MeshBasicMaterial({
    color: 0x00f0ff,
    wireframe: true,
    transparent: true,
    opacity: 0.55,
    blending: THREE.AdditiveBlending
  });
  const holoDome = new THREE.Mesh(
    new THREE.SphereGeometry(10.05, 18, 12, 0, Math.PI * 2, 0, Math.PI / 2),
    holoDomeMat
  );
  holoDome.position.set(-1, 31.0, 0);
  group.add(holoDome);

  // Tall Golden Spire + Sunburst Emblem
  const spire = new THREE.Mesh(new THREE.ConeGeometry(0.9, 15.5, 10), goldMat);
  spire.position.set(-1, 48.2, 0);
  group.add(spire);
  const sunOrb = new THREE.Mesh(new THREE.SphereGeometry(1.1, 12, 12), goldMat);
  sunOrb.position.set(-1, 56.2, 0);
  group.add(sunOrb);

  // Cyber perimeter accent pylons along the marble esplanade
  const pylonMat = new THREE.MeshBasicMaterial({ color: 0x00f0ff });
  const pylonGroup = new THREE.Group();
  for (const pz of [-24, -14, 14, 24]) {
    const pylon = new THREE.Mesh(new THREE.BoxGeometry(0.45, 7.5, 0.45), pylonMat);
    pylon.position.set(-18.5, 7.8, pz);
    pylonGroup.add(pylon);
  }
  group.add(pylonGroup);

  const domeLight = new THREE.PointLight(0x00d8ff, 20, 95, 1.4);
  domeLight.position.set(-1, 44, 0);
  group.add(domeLight);

  return {
    group,
    update(time, cyber) {
      marbleMat.color.setHex(0xd8dee9).lerp(new THREE.Color(0x4b5c7a), cyber * 0.65);
      corniceGlowMat.color.setHex(0x8899ad).lerp(new THREE.Color(0x00d8ff), cyber);
      corniceGlowMat.emissive.setHex(0xd8a852).lerp(new THREE.Color(0x00d8ff), cyber);
      corniceGlowMat.emissiveIntensity = THREE.MathUtils.lerp(0.08, 0.62, cyber);
      domeMat.emissiveIntensity = THREE.MathUtils.lerp(0.22, 0.92, cyber);
      goldMat.emissiveIntensity = THREE.MathUtils.lerp(0.35, 1.25, cyber);
      winMat.emissive.setHex(0xe8ae48).lerp(new THREE.Color(0x00d8ff), cyber * 0.55);
      winMat.emissiveIntensity = THREE.MathUtils.lerp(0.65, 1.15, cyber);
      holoDome.visible = cyber > 0.15;
      holoDome.rotation.y = time * 0.18;
      holoDomeMat.opacity = THREE.MathUtils.smoothstep(cyber, 0.15, 0.9) * 0.48;
      pylonGroup.visible = cyber > 0.2;
      domeLight.intensity = THREE.MathUtils.lerp(10, 26, cyber);
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

  // 2 Futuristic Glass & Neon Pedestrian Skybridges crossing Nurzhol Boulevard
  const skybridgeGlassMat = new THREE.MeshStandardMaterial({
    color: 0x0f2b46,
    emissive: 0x00e5ff,
    emissiveIntensity: 0.9,
    metalness: 0.8,
    roughness: 0.15
  });
  const skybridgeNeonMat = new THREE.MeshStandardMaterial({
    color: 0xff005c,
    emissive: 0xff005c,
    emissiveIntensity: 2.6
  });
  for (const sx of [-62, 54]) {
    const sb = new THREE.Group();
    sb.position.set(sx, 14.5, 0);
    const tube = new THREE.Mesh(new THREE.BoxGeometry(4.2, 3.2, 44), skybridgeGlassMat);
    sb.add(tube);
    const stripTop = new THREE.Mesh(new THREE.BoxGeometry(4.5, 0.3, 44), skybridgeNeonMat);
    stripTop.position.y = 1.7;
    sb.add(stripTop);
    for (const sz of [-20, 20]) {
      const leg = new THREE.Mesh(new THREE.BoxGeometry(2.4, 14.5, 2.4), wallMat);
      leg.position.set(0, -7.25, sz);
      sb.add(leg);
    }
    group.add(sb);
  }

  // Boulevard Futuristic Cyber-Streetlamps (InstancedMesh — 1 draw call!)
  const lampPosts = [];
  for (let lx = -92; lx <= 88; lx += 14) {
    if (Math.abs(lx) < 22) continue;
    lampPosts.push([lx, -9.8], [lx, 9.8]);
  }
  const poleInst = new THREE.InstancedMesh(
    new THREE.CylinderGeometry(0.14, 0.2, 6.4, 6),
    wallMat,
    lampPosts.length
  );
  const bulbMat = new THREE.MeshBasicMaterial({ color: 0xfcee0a });
  const bulbInst = new THREE.InstancedMesh(
    new THREE.BoxGeometry(0.9, 0.26, 0.35),
    bulbMat,
    lampPosts.length
  );
  const dummy = new THREE.Object3D();
  lampPosts.forEach(([x, z], idx) => {
    dummy.position.set(x, 3.2, z);
    dummy.updateMatrix();
    poleInst.setMatrixAt(idx, dummy.matrix);
    dummy.position.set(x, 6.45, z);
    dummy.updateMatrix();
    bulbInst.setMatrixAt(idx, dummy.matrix);
  });
  group.add(poleInst, bulbInst);

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
      skybridgeGlassMat.emissive.setHex(0x3a526e).lerp(new THREE.Color(0x00d8ff), cyber);
      skybridgeGlassMat.emissiveIntensity = THREE.MathUtils.lerp(0.14, 0.72, cyber);
      skybridgeNeonMat.color.setHex(0x8899ad).lerp(new THREE.Color(0xff005c), cyber);
      skybridgeNeonMat.emissive.setHex(0xd4a448).lerp(new THREE.Color(0xff005c), cyber);
      skybridgeNeonMat.emissiveIntensity = THREE.MathUtils.lerp(0.12, 1.45, cyber);

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
