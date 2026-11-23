/**
 * Astana -> Night City 2077
 * Pass 3: Photorealistic Cinematic PBR + 32-Bit HDRI WebGL Engine
 * - Real 32-bit HDRI Environment (RGBELoader + PMREMGenerator) + Procedural Instant Fallback
 * - Photorealistic Roger Deakins Storm Sky Dome (nightcity_sky_pano.jpg)
 * - EffectComposer + RenderPass + UnrealBloomPass + CinemaGradeShaderPass + OutputPass
 * - Real-time Astana Reality (0.0) <-> Night City 2077 (1.0) Morphing Engine
 * - 3 Camera Modes: ORBIT, AUTO-TOUR, DRONE (WASD + Mouse Look)
 */
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';

import { LANDMARKS, ATMOSPHERE_PRESETS } from '../data/landmarks.js';
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
  buildFlyingTraffic,
  buildSearchlights,
  buildNeonRain
} from './citySystems.js';

const DUSK_BASE = ATMOSPHERE_PRESETS.astana_dusk;

export class AstanaNightCityEngine {
  constructor(canvas, callbacks = {}) {
    this.canvas = canvas;
    this.onCyberChange = callbacks.onCyberChange || (() => {});
    this.onStats = callbacks.onStats || (() => {});
    this.onReady = callbacks.onReady || (() => {});

    this.time = 0;
    this.lastFrameTime = performance.now();
    this.frameCount = 0;
    this.fpsAccum = 0;
    this.statsTimer = 0;
    this.assetsReady = false;
    this.hdrLoaded = false;

    // Live morph state (boots from Astana Dusk -> 100% Night City 2077 over 1.85s)
    this.cyberLevel = 0.08;
    this.morphAnim = null;
    this.activePresetKey = 'neon_rain';
    this.activeCyberPreset = ATMOSPHERE_PRESETS.neon_rain;

    // Camera state
    this.cameraMode = 'orbit';
    this.flyAnim = null;
    this.tourAngle = 0;
    this.keys = Object.create(null);
    this.droneDrag = false;
    this.droneYaw = 0;
    this.dronePitch = 0;
    this.lastPointer = { x: 0, y: 0 };

    // Reusable temp objects (zero per-frame allocations)
    this._colA = new THREE.Color();
    this._colB = new THREE.Color();
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
    this.initControls();
    this.initEvents();

    const overview = LANDMARKS[0];
    this.camera.position.set(...overview.camPos);
    this.controls.target.set(...overview.target);
    this.controls.update();

    const params = new URLSearchParams(window.location.search);
    if (params.get('instant') === '1') {
      this.setCyberLevel(1.0, false);
    } else {
      this.animateCyberTo(1.0, 1850);
    }

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
    this.renderer.toneMappingExposure = 1.02;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFShadowMap;
    this.renderer.shadowMap.autoUpdate = false;
    this.renderer.shadowMap.needsUpdate = true;
  }

  initAssets() {
    // Instant procedural PMREM fallback while the real 32-bit 2K HDRI streams in
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
    this.scene.fog = new THREE.FogExp2(0x060a12, 0.00155);

    this.scene.environment = this.pbr.envMap || this.fallbackEnvTexture;
    this.scene.environmentIntensity = 1.25;

    this.camera = new THREE.PerspectiveCamera(48, window.innerWidth / window.innerHeight, 0.8, 1600);

    // Photorealistic Storm Sky Dome sampling nightcity_sky_pano.jpg
    this.skyMat = createSkyMaterial(this.pbr.skyPano);
    this.skyDome = new THREE.Mesh(new THREE.SphereGeometry(950, 40, 24), this.skyMat);
    this.skyDome.frustumCulled = false;
    this.scene.add(this.skyDome);
  }

  initLights() {
    // Cool nocturnal atmospheric hemisphere fill (zero pink wash!)
    this.hemiLight = new THREE.HemisphereLight(0x6d8eb2, 0x101622, 0.55);
    this.scene.add(this.hemiLight);

    // Primary Sun (Dusk) / Cool Moonlight (Night City) directional key
    this.sunLight = new THREE.DirectionalLight(0x8bb6d8, 1.05);
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

    // Subtle cool cyan/teal architectural silhouette rim (replaces loud magenta wash)
    this.rimLight = new THREE.DirectionalLight(0x4aa8c8, 0.55);
    this.rimLight.position.set(-180, 95, -130);
    this.scene.add(this.rimLight);

    // Warm distant amber urban bounce from western skyline
    this.amberFill = new THREE.DirectionalLight(0xd89b52, 0.42);
    this.amberFill.position.set(150, 60, -120);
    this.scene.add(this.amberFill);
  }

  initWorld() {
    // 1. Cohesive Urban Base: Photoscanned Wet Asphalt Nurzhol Boulevard, Mirror Esil River, Bridges & Monorail
    const urban = buildUrbanBaseAndRiver(this.pbr);
    this.scene.add(urban.group);
    this.shaderFogMaterials.push(...urban.shaderMaterials);
    this.updatables.push(urban);

    // 2. All Iconic Recognizable Astana Architectural Landmarks with Real PBR Textures
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

    // 3. Instanced PBR Megacity Skyline Filler Blocks
    this.megacity = buildMegacityBlocks(this.pbr);
    this.scene.add(this.megacity.group);
    this.updatables.push(this.megacity);

    // 4. Giant Animated Holographic Mega-Billboards
    this.billboards = buildHoloBillboards();
    this.scene.add(this.billboards.group);
    this.updatables.push(this.billboards);

    // 5. Multi-Tier Flying AV Spinner Traffic & Ground Traffic Streams
    this.traffic = buildFlyingTraffic();
    this.scene.add(this.traffic.group);

    // 6. Volumetric Searchlights
    this.searchlights = buildSearchlights();
    this.scene.add(this.searchlights.group);

    // 7. GPU-Driven Rain Streaks
    this.rain = buildNeonRain();
    this.scene.add(this.rain.mesh);

    this.renderer.shadowMap.needsUpdate = true;
  }

  initPostProcessing() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    this.composer = new EffectComposer(this.renderer);
    this.composer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    this.composer.setSize(w, h);

    this.renderPass = new RenderPass(this.scene, this.camera);
    this.composer.addPass(this.renderPass);

    // Delicate anamorphic bloom (threshold 0.96, strength 0.34) — only true bright lights glow!
    this.bloomPass = new UnrealBloomPass(new THREE.Vector2(w, h), 0.34, 0.42, 0.96);
    this.composer.addPass(this.bloomPass);

    // Cinematic Roger Deakins Film Grade Pass (Teal-Obsidian Shadows, Amber Highlights, Vignette, Grain, Edge CA)
    this.cinemaPass = new ShaderPass(CinemaGradeShader);
    this.composer.addPass(this.cinemaPass);

    this.outputPass = new OutputPass();
    this.composer.addPass(this.outputPass);
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

  /* ==========================================================================
     PUBLIC API FOR UI CONTROLS
     ========================================================================== */
  setCyberLevel(val, cancelAnim = true) {
    if (cancelAnim) this.morphAnim = null;
    this.cyberLevel = THREE.MathUtils.clamp(val, 0, 1);
    this.onCyberChange(this.cyberLevel);
  }

  animateCyberTo(targetVal, durationMs = 1700) {
    const startVal = this.cyberLevel;
    const clampedTarget = THREE.MathUtils.clamp(targetVal, 0, 1);
    if (Math.abs(startVal - clampedTarget) < 0.005) {
      this.setCyberLevel(clampedTarget, true);
      return;
    }
    this.morphAnim = {
      startVal,
      targetVal: clampedTarget,
      startTime: performance.now(),
      duration: durationMs
    };
  }

  setAtmospherePreset(presetKey) {
    const preset = ATMOSPHERE_PRESETS[presetKey];
    if (!preset) return;
    this.activePresetKey = presetKey;
    if (presetKey !== 'astana_dusk') {
      this.activeCyberPreset = preset;
    }
    this.animateCyberTo(preset.targetCyber, 1500);
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

  /* ==========================================================================
     MAIN FRAME LOOP
     ========================================================================== */
  applyAtmosphere(cyber) {
    const p = this.activeCyberPreset;

    // Sky Dome crossfade (Golden Astana Dusk <-> Photorealistic Roger Deakins Storm Pano)
    this.skyMat.uniforms.uTime.value = this.time;
    this.skyMat.uniforms.uCyber.value = cyber;
    this.skyMat.uniforms.uSkyTint.value.setHex(p.skyTint || 0xdbe6f2);

    // Subtle lightning surge in EMP Overdrive
    let empFlash = 0;
    if (this.activePresetKey === 'emp_overdrive' && cyber > 0.7) {
      const pulse = Math.pow(Math.max(0, Math.sin(this.time * 0.9) * Math.sin(this.time * 7.3)), 14.0);
      empFlash = pulse * 0.4;
    }

    // Deep restrained slate-obsidian atmospheric fog (zero cartoon pink haze!)
    this._colA.setHex(DUSK_BASE.fogColor).lerp(this._colB.setHex(p.fogColor), cyber);
    const fogDensity = THREE.MathUtils.lerp(DUSK_BASE.fogDensity, p.fogDensity, cyber);
    this.scene.fog.color.copy(this._colA);
    this.scene.fog.density = fogDensity;

    for (let i = 0; i < this.shaderFogMaterials.length; i++) {
      const m = this.shaderFogMaterials[i];
      if (m.uniforms.uFogColor) m.uniforms.uFogColor.value.copy(this._colA);
      if (m.uniforms.uFogDensity) m.uniforms.uFogDensity.value = fogDensity;
    }

    // Photorealistic lighting + 32-bit HDRI environment reflection intensity (calibrated for real HDR dynamic range)
    this.sunLight.color.setHex(DUSK_BASE.sunColor).lerp(this._colB.setHex(p.sunColor), cyber);
    this.sunLight.intensity = THREE.MathUtils.lerp(1.55, 0.62 + empFlash * 1.2, cyber);
    this.rimLight.color.setHex(DUSK_BASE.rimColor).lerp(this._colB.setHex(p.rimColor), cyber);
    this.rimLight.intensity = THREE.MathUtils.lerp(0.4, 0.48 + empFlash * 0.7, cyber);
    this.amberFill.intensity = THREE.MathUtils.lerp(0.28, 0.34, cyber);
    this.hemiLight.intensity = THREE.MathUtils.lerp(0.75, 0.38, cyber);
    this.scene.environmentIntensity = THREE.MathUtils.lerp(0.68, 0.85, cyber);

    // Delicate anamorphic bloom + cinematic film grade uniforms
    this.bloomPass.strength = THREE.MathUtils.lerp(DUSK_BASE.bloomStrength, p.bloomStrength, cyber) + empFlash * 0.2;
    this.bloomPass.threshold = THREE.MathUtils.lerp(DUSK_BASE.bloomThreshold, p.bloomThreshold, cyber);
    this.renderer.toneMappingExposure = THREE.MathUtils.lerp(DUSK_BASE.exposure, p.exposure, cyber);

    this.cinemaPass.uniforms.uTime.value = this.time;
    this.cinemaPass.uniforms.uCyber.value = cyber;
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

    if (this.morphAnim) {
      const p = Math.min((now - this.morphAnim.startTime) / this.morphAnim.duration, 1);
      const ease = p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2;
      this.cyberLevel = THREE.MathUtils.lerp(this.morphAnim.startVal, this.morphAnim.targetVal, ease);
      this.onCyberChange(this.cyberLevel);
      if (p >= 1) this.morphAnim = null;
    }

    const cyber = this.cyberLevel;
    const preset = this.activeCyberPreset;

    this.applyAtmosphere(cyber);
    this.updateCamera(dt, now);

    for (let i = 0; i < this.updatables.length; i++) {
      this.updatables[i].update(this.time, cyber);
    }
    this.traffic.update(this.time, cyber, THREE.MathUtils.lerp(0.6, preset.trafficSpeed, cyber));
    this.searchlights.update(this.time, cyber, preset.searchlightBoost);
    this.rain.update(
      this.time,
      cyber,
      preset.rainIntensity,
      preset.skyGlowAccent,
      0xdca25c
    );

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
        cyberPct: Math.round(cyber * 100),
        buildings: this.megacity ? this.megacity.count : 0
      });
      this.frameCount = 0;
      this.fpsAccum = 0;
      this.statsTimer = 0;
    }
  }
}
