/**
 * Astana // Night City 2077 — Pass 4 Photorealistic PBR & Cyberpunk WebGL Engine
 * - Real 32-bit Shanghai Bund Urban HDRI Environment (RGBELoader + PMREMGenerator)
 * - Photorealistic Nocturnal Storm Sky Dome (nightcity_sky_pano.jpg)
 * - EffectComposer + RenderPass + N8AOPass + UnrealBloomPass + CinemaGradeShaderPass + OutputPass
 * - Single Permanent Nocturnal Rain-Slicked Atmosphere (Zero Mode Morphing)
 * - 3 Camera Modes: ORBIT, AUTO-TOUR, DRONE (WASD + Mouse Look)
 */
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { N8AOPass } from '../../vendor/n8ao/N8AO.js';

import { LANDMARKS, NOCTURNAL_ATMOSPHERE } from '../data/landmarks.js';
import { createSkyMaterial, CinemaGradeShader } from './shaders.js';
import { createNeonEnvironmentMap } from './textures.js';
import { loadPBRAssets } from './pbrAssets.js';
import {
  buildBaiterek,
  buildKhanShatyr,
  buildAbuDhabiPlaza,
  buildNurAlem,
  buildAkOrda,
  buildPyramid,
  buildSecondaryAstanaLandmarks,
  buildUrbanBaseAndRiver
} from './landmarks3d.js';
import {
  buildMegacityBlocks,
  buildHoloBillboards,
  buildCyberpunkStreetDetails,
  buildFlyingTraffic,
  buildSearchlights,
  buildNeonRain
} from './citySystems.js';

export class AstanaNightCityEngine {
  constructor(canvas, callbacks = {}) {
    this.canvas = canvas;
    this.onStats = callbacks.onStats || (() => {});
    this.onReady = callbacks.onReady || (() => {});

    this.time = 0;
    this.lastFrameTime = performance.now();
    this.frameCount = 0;
    this.fpsAccum = 0;
    this.statsTimer = 0;
    this.assetsReady = false;
    this.hdrLoaded = false;
    this.cyberLevel = 1.0;

    // Camera state
    this.cameraMode = 'orbit';
    this.flyAnim = null;
    this.tourAngle = 0;
    this.keys = Object.create(null);
    this.droneDrag = false;
    this.droneYaw = 0;
    this.dronePitch = 0;
    this.lastPointer = { x: 0, y: 0 };

    // Reusable temp objects
    this._vecFwd = new THREE.Vector3();
    this._vecRight = new THREE.Vector3();
    this._vecMove = new THREE.Vector3();
    this._euler = new THREE.Euler(0, 0, 0, 'YXZ');

    this.shaderFogMaterials = [];
    this.updatables = [];

    this.initRenderer();
    this.initAssets();
    this.initScene();
    this.initLights();
    this.initWorld();
    this.initPostProcessing();
    this.applyStaticAtmosphere();
    this.initControls();
    this.initEvents();

    const overview = LANDMARKS[0];
    this.camera.position.set(...overview.camPos);
    this.controls.target.set(...overview.target);
    this.controls.update();

    this.onReady();
    this.renderer.setAnimationLoop(() => this.tick());
  }

  initRenderer() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: true,
      powerPreference: 'high-performance'
    });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    this.renderer.setSize(w, h, false);
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = NOCTURNAL_ATMOSPHERE.exposure;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFShadowMap;
    this.renderer.shadowMap.autoUpdate = false;
    this.renderer.shadowMap.needsUpdate = true;
  }

  initAssets() {
    this.fallbackEnvTexture = createNeonEnvironmentMap(this.renderer);

    this.pbr = loadPBRAssets(this.renderer, (hdrEnvMap) => {
      this.hdrLoaded = true;
      if (this.scene) {
        this.scene.environment = hdrEnvMap;
      }
    });

    this.assetsReadyPromise = this.pbr.readyPromise.then(() => {
      this.assetsReady = true;
    });
  }

  initScene() {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x050810);
    this.scene.fog = new THREE.FogExp2(NOCTURNAL_ATMOSPHERE.fogColor, NOCTURNAL_ATMOSPHERE.fogDensity);

    this.scene.environment = this.pbr.envMap || this.fallbackEnvTexture;
    this.scene.environmentIntensity = 1.02;

    this.camera = new THREE.PerspectiveCamera(48, window.innerWidth / window.innerHeight, 0.8, 2400);

    this.skyMat = createSkyMaterial(this.pbr.skyPano);
    this.skyDome = new THREE.Mesh(new THREE.SphereGeometry(1350, 40, 24), this.skyMat);
    this.skyDome.frustumCulled = false;
    this.scene.add(this.skyDome);
  }

  initLights() {
    this.hemiLight = new THREE.HemisphereLight(0x7496ba, 0x101622, 0.46);
    this.scene.add(this.hemiLight);

    this.sunLight = new THREE.DirectionalLight(NOCTURNAL_ATMOSPHERE.sunColor, 0.80);
    this.sunLight.position.set(160, 210, 120);
    this.sunLight.castShadow = true;
    this.sunLight.shadow.mapSize.set(2048, 2048);
    this.sunLight.shadow.camera.near = 20;
    this.sunLight.shadow.camera.far = 650;
    const d = 240;
    this.sunLight.shadow.camera.left = -d;
    this.sunLight.shadow.camera.right = d;
    this.sunLight.shadow.camera.top = d;
    this.sunLight.shadow.camera.bottom = -d;
    this.sunLight.shadow.bias = -0.0006;
    this.scene.add(this.sunLight);

    this.rimLight = new THREE.DirectionalLight(NOCTURNAL_ATMOSPHERE.rimColor, 0.52);
    this.rimLight.position.set(-180, 95, -130);
    this.scene.add(this.rimLight);

    this.amberFill = new THREE.DirectionalLight(0xd89b52, 0.34);
    this.amberFill.position.set(150, 60, -120);
    this.scene.add(this.amberFill);
  }

  initWorld() {
    // 1. Urban Base: Wet Asphalt Nurzhol Boulevard, Mirror Esil River, Bridges, Streetlamps & Monorail
    const urban = buildUrbanBaseAndRiver(this.pbr);
    this.scene.add(urban.group);
    if (urban.shaderMaterials) this.shaderFogMaterials.push(...urban.shaderMaterials);
    this.updatables.push(urban);

    // 2. All Iconic Recognizable Astana Architectural Landmarks
    const landmarkModules = [
      buildBaiterek(this.pbr),
      buildKhanShatyr(this.pbr),
      buildAbuDhabiPlaza(this.pbr),
      buildNurAlem(this.pbr),
      buildAkOrda(this.pbr),
      buildPyramid(this.pbr),
      buildSecondaryAstanaLandmarks(this.pbr)
    ];
    for (const mod of landmarkModules) {
      this.scene.add(mod.group);
      if (mod.shaderMaterials) this.shaderFogMaterials.push(...mod.shaderMaterials);
      this.updatables.push(mod);
    }

    // 3. Instanced 3D Interior-Mapping Parallax Megacity Skyline + Rooftop Details & Roof Signs
    this.megacity = buildMegacityBlocks(this.pbr);
    this.scene.add(this.megacity.group);
    if (this.megacity.shaderMaterials) this.shaderFogMaterials.push(...this.megacity.shaderMaterials);
    this.updatables.push(this.megacity);

    // 4. Physical Truss-Mounted Holo-Billboards & 12 Projecting Vertical Neon Blade Signs
    this.billboards = buildHoloBillboards(this.pbr, this.megacity.canyonTowers);
    this.scene.add(this.billboards.group);
    if (this.billboards.shaderMaterials) this.shaderFogMaterials.push(...this.billboards.shaderMaterials);
    this.updatables.push(this.billboards);

    // 5. Street Info-Kiosks, Volumetric Steam Plume Vents & Neon Canyon Light Pools
    this.cyberDetails = buildCyberpunkStreetDetails(this.pbr, this.megacity.placements);
    this.scene.add(this.cyberDetails.group);
    if (this.cyberDetails.shaderMaterials) this.shaderFogMaterials.push(...this.cyberDetails.shaderMaterials);
    this.updatables.push(this.cyberDetails);

    // 6. Multi-Tier Flying AV Spinner Traffic w/ Patrol Searchlights & Ground Traffic
    this.traffic = buildFlyingTraffic();
    this.scene.add(this.traffic.group);

    // 7. Volumetric Sky Searchlights
    this.searchlights = buildSearchlights();
    this.scene.add(this.searchlights.group);

    // 8. GPU-Driven Nocturnal Rain Drops & Subtle Atmospheric Mist
    this.rain = buildNeonRain();
    this.scene.add(this.rain.mesh);
    if (this.rain.shaderMaterials) this.shaderFogMaterials.push(...this.rain.shaderMaterials);

    this.renderer.shadowMap.needsUpdate = true;
  }

  initPostProcessing() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.composer = new EffectComposer(this.renderer);
    this.composer.setPixelRatio(dpr);
    this.composer.setSize(w, h);

    this.renderPass = new RenderPass(this.scene, this.camera);
    // N8AOPass renders beauty + depth internally into its HalfFloat target; keeping RenderPass disabled avoids a redundant scene pass.
    this.renderPass.enabled = false;
    this.composer.addPass(this.renderPass);

    this.n8aoPass = new N8AOPass(this.scene, this.camera, Math.round(w * dpr), Math.round(h * dpr));
    this.n8aoPass.configuration.aoRadius = 2.4;
    this.n8aoPass.configuration.distanceFalloff = 0.9;
    this.n8aoPass.configuration.intensity = 2.2;
    this.n8aoPass.configuration.aoSamples = 16;
    this.n8aoPass.configuration.denoiseSamples = 8;
    this.n8aoPass.configuration.denoiseRadius = 8;
    this.n8aoPass.configuration.biasOffset = 0.02;
    this.n8aoPass.configuration.biasMultiplier = 0.5;
    this.n8aoPass.configuration.halfRes = false;
    this.n8aoPass.configuration.gammaCorrection = false;
    this.composer.addPass(this.n8aoPass);

    this.bloomPass = new UnrealBloomPass(
      new THREE.Vector2(w, h),
      NOCTURNAL_ATMOSPHERE.bloomStrength,
      0.28,
      NOCTURNAL_ATMOSPHERE.bloomThreshold
    );
    this.composer.addPass(this.bloomPass);

    this.cinemaPass = new ShaderPass(CinemaGradeShader);
    this.composer.addPass(this.cinemaPass);

    this.outputPass = new OutputPass();
    this.composer.addPass(this.outputPass);
  }

  applyStaticAtmosphere() {
    const p = NOCTURNAL_ATMOSPHERE;
    this.skyMat.uniforms.uSkyTint.value.setHex(p.skyTint);
    this.scene.fog.color.setHex(p.fogColor);
    this.scene.fog.density = p.fogDensity;

    for (let i = 0; i < this.shaderFogMaterials.length; i++) {
      const m = this.shaderFogMaterials[i];
      if (m.uniforms && m.uniforms.uFogColor) m.uniforms.uFogColor.value.setHex(p.fogColor);
      if (m.uniforms && m.uniforms.uFogDensity) m.uniforms.uFogDensity.value = p.fogDensity;
    }
  }

  initControls() {
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.055;
    this.controls.maxPolarAngle = Math.PI / 2 - 0.025;
    this.controls.minPolarAngle = 0.08;
    this.controls.minDistance = 18;
    this.controls.maxDistance = 420;
    this.controls.panSpeed = 0.85;
    this.controls.rotateSpeed = 0.65;
  }

  initEvents() {
    window.addEventListener('resize', () => this.onResize());

    this.canvas.addEventListener('pointerdown', (e) => {
      this.flyAnim = null;
      if (this.cameraMode === 'drone') {
        this.droneDrag = true;
        this.lastPointer.x = e.clientX;
        this.lastPointer.y = e.clientY;
      }
    });

    window.addEventListener('pointermove', (e) => {
      if (!this.droneDrag || this.cameraMode !== 'drone') return;
      const dx = e.clientX - this.lastPointer.x;
      const dy = e.clientY - this.lastPointer.y;
      this.lastPointer.x = e.clientX;
      this.lastPointer.y = e.clientY;

      this.droneYaw -= dx * 0.0042;
      this.dronePitch = THREE.MathUtils.clamp(this.dronePitch - dy * 0.0038, -1.25, 1.15);
      this._euler.set(this.dronePitch, this.droneYaw, 0, 'YXZ');
      this.camera.quaternion.setFromEuler(this._euler);
    });

    window.addEventListener('pointerup', () => {
      this.droneDrag = false;
    });

    window.addEventListener('keydown', (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      this.keys[e.code] = true;
    });

    window.addEventListener('keyup', (e) => {
      this.keys[e.code] = false;
    });
  }

  onResize() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h, false);
    this.composer.setSize(w, h);
    this.bloomPass.resolution.set(w, h);
  }

  flyToLandmark(landmarkId, durationMs = 1250) {
    const lm = LANDMARKS.find((l) => l.id === landmarkId);
    if (!lm) return;

    if (this.cameraMode === 'tour') {
      this.setCameraMode('orbit');
    }

    const endPos = new THREE.Vector3(...lm.camPos);
    const endTarget = new THREE.Vector3(...lm.target);

    if (this.cameraMode === 'drone') {
      this.camera.position.copy(endPos);
      this.camera.lookAt(endTarget);
      this._euler.setFromQuaternion(this.camera.quaternion, 'YXZ');
      this.droneYaw = this._euler.y;
      this.dronePitch = this._euler.x;
      return;
    }

    this.flyAnim = {
      startPos: this.camera.position.clone(),
      startTarget: this.controls.target.clone(),
      endPos,
      endTarget,
      startTime: performance.now(),
      duration: durationMs
    };
  }

  setCameraMode(mode) {
    if (mode === this.cameraMode) return;
    this.cameraMode = mode;
    this.flyAnim = null;

    if (mode === 'drone') {
      this.controls.enabled = false;
      this._euler.setFromQuaternion(this.camera.quaternion, 'YXZ');
      this.droneYaw = this._euler.y;
      this.dronePitch = this._euler.x;
    } else if (mode === 'tour') {
      this.controls.enabled = false;
      this.tourAngle = Math.atan2(this.camera.position.z, this.camera.position.x);
    } else {
      this.controls.enabled = true;
      this.camera.getWorldDirection(this._vecFwd);
      this.controls.target.copy(this.camera.position).addScaledVector(this._vecFwd, 70);
      this.controls.target.y = THREE.MathUtils.clamp(this.controls.target.y, 6, 65);
      this.controls.update();
    }
  }

  updateCamera(dt, now) {
    if (this.flyAnim) {
      const t = Math.min((now - this.flyAnim.startTime) / this.flyAnim.duration, 1);
      const ease = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
      this.camera.position.lerpVectors(this.flyAnim.startPos, this.flyAnim.endPos, ease);
      this.controls.target.lerpVectors(this.flyAnim.startTarget, this.flyAnim.endTarget, ease);
      this.controls.update();
      if (t >= 1) this.flyAnim = null;
      return;
    }

    if (this.cameraMode === 'orbit') {
      this.controls.update();
    } else if (this.cameraMode === 'tour') {
      this.tourAngle += dt * 0.11;
      const cx = 18 + Math.cos(this.tourAngle) * 185;
      const cz = Math.sin(this.tourAngle) * 128;
      const cy = 50 + Math.sin(this.tourAngle * 2.0) * 18;
      this.camera.position.set(cx, cy, cz);
      this.camera.lookAt(12 + Math.sin(this.tourAngle) * 28, 26, -4);
    } else if (this.cameraMode === 'drone') {
      const boost = this.keys.ShiftLeft || this.keys.ShiftRight ? 2.4 : 1.0;
      const speed = 58 * boost * dt;
      this.camera.getWorldDirection(this._vecFwd);
      this._vecRight.crossVectors(this._vecFwd, this.camera.up).normalize();
      this._vecMove.set(0, 0, 0);

      if (this.keys.KeyW || this.keys.ArrowUp) this._vecMove.add(this._vecFwd);
      if (this.keys.KeyS || this.keys.ArrowDown) this._vecMove.sub(this._vecFwd);
      if (this.keys.KeyD || this.keys.ArrowRight) this._vecMove.add(this._vecRight);
      if (this.keys.KeyA || this.keys.ArrowLeft) this._vecMove.sub(this._vecRight);
      if (this.keys.KeyE || this.keys.Space) this._vecMove.y += 1;
      if (this.keys.KeyQ || this.keys.ControlLeft) this._vecMove.y -= 1;

      if (this._vecMove.lengthSq() > 0) {
        this._vecMove.normalize().multiplyScalar(speed);
        this.camera.position.add(this._vecMove);
        this.camera.position.y = THREE.MathUtils.clamp(this.camera.position.y, 4, 240);
      }
    }
  }

  tick() {
    const now = performance.now();
    const dt = Math.min((now - this.lastFrameTime) / 1000, 0.05);
    this.lastFrameTime = now;
    this.time += dt;

    this.skyMat.uniforms.uTime.value = this.time;
    this.cinemaPass.uniforms.uTime.value = this.time;

    this.updateCamera(dt, now);

    for (let i = 0; i < this.updatables.length; i++) {
      this.updatables[i].update(this.time);
    }

    const p = NOCTURNAL_ATMOSPHERE;
    this.traffic.update(this.time, p.trafficSpeed);
    this.searchlights.update(this.time, p.searchlightBoost);
    this.rain.update(this.time, p.rainIntensity, p.skyGlowAccent, 0xdca25c);

    this.composer.render();

    this.frameCount++;
    this.fpsAccum += dt;
    this.statsTimer += dt;
    if (this.statsTimer >= 0.35) {
      const fps = Math.round(this.frameCount / Math.max(this.fpsAccum, 0.001));
      this.onStats({
        fps,
        calls: this.renderer.info.render.calls,
        alt: Math.round(this.camera.position.y * 2),
        buildings: this.megacity ? this.megacity.count : 0
      });
      this.frameCount = 0;
      this.fpsAccum = 0;
      this.statsTimer = 0;
    }
  }
}
