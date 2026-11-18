/**
 * Astana 3D Digital Twin - WebGL 3D Viewer Engine
 * Powered by Three.js (ES Module via importmap)
 */
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

class AstanaViewer3D {
  constructor(canvasId, loaderId, hudId) {
    this.canvas = document.getElementById(canvasId);
    this.loaderEl = document.getElementById(loaderId);
    this.hudEl = document.getElementById(hudId);
    
    this.currentModelKey = 'baiterek';
    this.currentShading = 'pbr';
    this.autoRotate = true;
    this.isHoveringModel = false;
    
    this.models = {
      baiterek: {
        file: './assets/models/baiterek.glb',
        name: 'Монумент Байтерек',
        camPos: new THREE.Vector3(50, 45, 60),
        target: new THREE.Vector3(0, 40, 0),
        scale: 1.0
      },
      khanshatyr: {
        file: './assets/models/khanshatyr.glb',
        name: 'ТРЦ Хан Шатыр',
        camPos: new THREE.Vector3(80, 50, 90),
        target: new THREE.Vector3(0, 30, 0),
        scale: 1.0
      },
      nuralem: {
        file: './assets/models/nuralem.glb',
        name: 'Сфера Нур Алем & Abu Dhabi Plaza',
        camPos: new THREE.Vector3(90, 60, 100),
        target: new THREE.Vector3(0, 45, 0),
        scale: 1.0
      },
      astana_full: {
        file: './assets/models/astana_full.glb',
        name: 'Панорама Столицы',
        camPos: new THREE.Vector3(300, 200, 450),
        target: new THREE.Vector3(400, 40, 0),
        scale: 1.0
      }
    };
    
    this.loadedScenes = {};
    this.activeSceneObj = null;
    
    this.initScene();
    this.initLights();
    this.initHelpers();
    this.initEvents();
    this.animate();
  }

  initScene() {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x0a0e17);
    this.scene.fog = new THREE.FogExp2(0x0a0e17, 0.0015);

    const width = this.canvas.clientWidth || 800;
    const height = this.canvas.clientHeight || 600;

    this.camera = new THREE.PerspectiveCamera(45, width / height, 0.5, 3000);
    this.camera.position.set(60, 50, 70);

    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: true,
      powerPreference: 'high-performance'
    });
    this.renderer.setSize(width, height, false);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.1;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.06;
    this.controls.maxPolarAngle = Math.PI / 2 + 0.05; // slight under-ground angle
    this.controls.minDistance = 5;
    this.controls.maxDistance = 1200;
    this.controls.autoRotate = this.autoRotate;
    this.controls.autoRotateSpeed = 0.8;

    this.gltfLoader = new GLTFLoader();
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2(-999, -999);
  }

  initLights() {
    // Soft Ambient Light
    this.ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    this.scene.add(this.ambientLight);

    // Hemispheric Light (sky blue & warm ground bounce)
    this.hemiLight = new THREE.HemisphereLight(0x38bdf8, 0x1e293b, 0.6);
    this.hemiLight.position.set(0, 300, 0);
    this.scene.add(this.hemiLight);

    // Main Key Sunlight
    this.sunLight = new THREE.DirectionalLight(0xfff5e6, 2.2);
    this.sunLight.position.set(150, 250, 100);
    this.sunLight.castShadow = true;
    this.sunLight.shadow.mapSize.width = 2048;
    this.sunLight.shadow.mapSize.height = 2048;
    this.sunLight.shadow.camera.near = 10;
    this.sunLight.shadow.camera.far = 1000;
    const d = 150;
    this.sunLight.shadow.camera.left = -d;
    this.sunLight.shadow.camera.right = d;
    this.sunLight.shadow.camera.top = d;
    this.sunLight.shadow.camera.bottom = -d;
    this.sunLight.shadow.bias = -0.0005;
    this.scene.add(this.sunLight);

    // Rim / Accent Cyan Light
    this.rimLight = new THREE.DirectionalLight(0x00e5ff, 1.2);
    this.rimLight.position.set(-150, 100, -100);
    this.scene.add(this.rimLight);
  }

  initHelpers() {
    // Cyberpunk Architectural Grid
    const gridHelper = new THREE.GridHelper(1000, 100, 0xd4af37, 0x1e293b);
    gridHelper.position.y = -0.1;
    gridHelper.material.opacity = 0.35;
    gridHelper.material.transparent = true;
    this.scene.add(gridHelper);

    // Ground plane to receive shadows
    const groundGeo = new THREE.PlaneGeometry(2000, 2000);
    const groundMat = new THREE.MeshStandardMaterial({
      color: 0x07090e,
      roughness: 0.9,
      metalness: 0.1
    });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.15;
    ground.receiveShadow = true;
    this.scene.add(ground);
  }

  initEvents() {
    window.addEventListener('resize', () => this.onWindowResize());

    this.canvas.addEventListener('mousemove', (e) => {
      const rect = this.canvas.getBoundingClientRect();
      this.mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      this.mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
    });

    this.canvas.addEventListener('click', () => {
      if (this.isHoveringModel && window.astanaApp) {
        window.astanaApp.openDossier(this.currentModelKey);
      }
    });

    // Touch support for mobile tap
    this.canvas.addEventListener('touchend', (e) => {
      if (e.changedTouches.length === 1 && window.astanaApp) {
        const touch = e.changedTouches[0];
        const rect = this.canvas.getBoundingClientRect();
        this.mouse.x = ((touch.clientX - rect.left) / rect.width) * 2 - 1;
        this.mouse.y = -((touch.clientY - rect.top) / rect.height) * 2 + 1;
        this.raycastCheck(true);
      }
    });
  }

  onWindowResize() {
    const width = this.canvas.parentElement.clientWidth;
    const height = this.canvas.parentElement.clientHeight;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height, false);
  }

  showLoader(show, text = 'Загрузка 3D модели...') {
    if (this.loaderEl) {
      if (show) {
        this.loaderEl.classList.add('visible');
        const txt = this.loaderEl.querySelector('.loader-text');
        if (txt) txt.textContent = text;
      } else {
        this.loaderEl.classList.remove('visible');
      }
    }
  }

  async loadModel(key) {
    if (!this.models[key]) return;
    this.currentModelKey = key;
    const cfg = this.models[key];

    this.showLoader(true, `Загрузка геометрии: ${cfg.name}...`);

    if (this.activeSceneObj) {
      this.scene.remove(this.activeSceneObj);
      this.activeSceneObj = null;
    }

    try {
      if (this.loadedScenes[key]) {
        this.activeSceneObj = this.loadedScenes[key];
        this.scene.add(this.activeSceneObj);
        this.applyShadingMode(this.currentShading);
        this.animateCamera(cfg.camPos, cfg.target);
        this.updateHUD(cfg);
        this.showLoader(false);
        return;
      }

      const gltf = await this.loadGLTFPromise(cfg.file);
      const root = gltf.scene;

      // Enhance materials based on mesh names
      root.traverse((child) => {
        if (child.isMesh) {
          child.castShadow = true;
          child.receiveShadow = true;
          child.geometry.computeVertexNormals();

          // Store original materials for shading swaps
          child.userData.origMaterial = child.material;

          // Realistic material tuning
          if (child.name.includes('Gold') || child.name.includes('Sphere')) {
            child.material = new THREE.MeshStandardMaterial({
              color: 0xffd700,
              metalness: 0.95,
              roughness: 0.15,
              envMapIntensity: 2.0
            });
          } else if (child.name.includes('Tent') || child.name.includes('NurAlem_Sphere')) {
            child.material = new THREE.MeshPhysicalMaterial({
              color: 0x93c5fd,
              metalness: 0.1,
              roughness: 0.2,
              transmission: 0.65,
              thickness: 1.2,
              transparent: true,
              opacity: 0.85
            });
          } else if (child.name.includes('Pool')) {
            child.material = new THREE.MeshStandardMaterial({
              color: 0x0284c7,
              roughness: 0.1,
              metalness: 0.3
            });
          } else {
            child.material = new THREE.MeshStandardMaterial({
              color: 0xcccccc,
              roughness: 0.6,
              metalness: 0.2
            });
          }
          child.userData.pbrMaterial = child.material;
        }
      });

      this.loadedScenes[key] = root;
      this.activeSceneObj = root;
      this.scene.add(root);

      this.applyShadingMode(this.currentShading);
      this.animateCamera(cfg.camPos, cfg.target);
      this.updateHUD(cfg);
      this.showLoader(false);

    } catch (err) {
      console.error('Error loading 3D model:', err);
      this.showLoader(true, `Ошибка загрузки модели: ${err.message}`);
    }
  }

  loadGLTFPromise(url) {
    return new Promise((resolve, reject) => {
      this.gltfLoader.load(url, resolve, undefined, reject);
    });
  }

  applyShadingMode(mode) {
    this.currentShading = mode;
    if (!this.activeSceneObj) return;

    this.activeSceneObj.traverse((child) => {
      if (child.isMesh) {
        if (mode === 'pbr') {
          child.material = child.userData.pbrMaterial || child.userData.origMaterial;
          child.material.wireframe = false;
        } else if (mode === 'wireframe') {
          // Blender / Instagram Reel orange wireframe style
          child.material = new THREE.MeshBasicMaterial({
            color: 0xff7a00,
            wireframe: true,
            wireframeLinewidth: 1.5
          });
        } else if (mode === 'clay') {
          // Matte solid architectural clay
          child.material = new THREE.MeshLambertMaterial({
            color: 0xd8d8d8
          });
          child.material.wireframe = false;
        } else if (mode === 'depth') {
          // Depth scan shader
          child.material = new THREE.MeshDepthMaterial();
        }
      }
    });
  }

  animateCamera(targetPos, targetLookAt) {
    const startPos = this.camera.position.clone();
    const startTarget = this.controls.target.clone();
    const startTime = performance.now();
    const duration = 1200; // ms

    const ease = (t) => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;

    const tick = (now) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = ease(progress);

      this.camera.position.lerpVectors(startPos, targetPos, eased);
      this.controls.target.lerpVectors(startTarget, targetLookAt, eased);
      this.controls.update();

      if (progress < 1) {
        requestAnimationFrame(tick);
      }
    };
    requestAnimationFrame(tick);
  }

  resetView() {
    const cfg = this.models[this.currentModelKey];
    if (cfg) {
      this.animateCamera(cfg.camPos, cfg.target);
    }
  }

  toggleAutoRotate() {
    this.autoRotate = !this.autoRotate;
    this.controls.autoRotate = this.autoRotate;
    return this.autoRotate;
  }

  updateHUD(cfg) {
    if (!this.hudEl || !this.activeSceneObj) return;
    let polyCount = 0;
    let vertCount = 0;
    this.activeSceneObj.traverse((child) => {
      if (child.isMesh && child.geometry) {
        const geo = child.geometry;
        if (geo.index) {
          polyCount += geo.index.count / 3;
        } else if (geo.attributes.position) {
          polyCount += geo.attributes.position.count / 3;
        }
        if (geo.attributes.position) {
          vertCount += geo.attributes.position.count;
        }
      }
    });

    this.hudEl.innerHTML = `
      <div class="hud-pill">Объект: <strong>${cfg.name}</strong></div>
      <div class="hud-pill">Полигоны: <strong>${Math.round(polyCount).toLocaleString()}</strong> · Вершины: <strong>${Math.round(vertCount).toLocaleString()}</strong></div>
      <div class="hud-pill">Координаты: <strong>51°07'48" N · 71°26'01" E</strong></div>
    `;
  }

  raycastCheck(triggerClick = false) {
    if (!this.activeSceneObj) return;
    this.raycaster.setFromCamera(this.mouse, this.camera);
    const intersects = this.raycaster.intersectObjects(this.activeSceneObj.children, true);

    if (intersects.length > 0) {
      this.isHoveringModel = true;
      this.canvas.style.cursor = 'pointer';
      if (triggerClick && window.astanaApp) {
        window.astanaApp.openDossier(this.currentModelKey);
      }
    } else {
      this.isHoveringModel = false;
      this.canvas.style.cursor = 'grab';
    }
  }

  animate() {
    requestAnimationFrame(() => this.animate());
    this.controls.update();
    this.raycastCheck();
    this.renderer.render(this.scene, this.camera);
  }
}

export default AstanaViewer3D;
