/**
 * Astana -> Night City 2077
 * Real Photorealistic PBR & 32-Bit HDRI Asset Loader
 * Loads all genuine 2K Poly Haven urban PBR sets, specialty architectural maps (ETFE, Geodesic Glass),
 * and Shanghai Bund 32-bit HDRI via RGBELoader + PMREMGenerator, synced through LoadingManager.
 */
import * as THREE from 'three';
import { RGBELoader } from 'three/addons/loaders/RGBELoader.js';

const BASE = './assets/pbr/';

function createMullionedPalaceWindowTexture() {
  const w = 256;
  const h = 512;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');

  // Deep recessed warm interior gradient (warm chandelier glow at upper-mid, darker lower drape depth)
  const bg = ctx.createLinearGradient(0, 0, 0, h);
  bg.addColorStop(0.0, '#1a120a');
  bg.addColorStop(0.14, '#7d5020');
  bg.addColorStop(0.32, '#d89b44');
  bg.addColorStop(0.55, '#9e6828');
  bg.addColorStop(0.82, '#3d2612');
  bg.addColorStop(1.0, '#140d07');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, w, h);

  // Subtle vertical interior curtain / depth folds
  for (let x = 0; x < w; x += 16) {
    const shade = (Math.sin(x * 0.14) * 0.5 + 0.5) * 0.16;
    ctx.fillStyle = `rgba(10, 6, 3, ${shade})`;
    ctx.fillRect(x, 0, 16, h);
  }

  // Dark bronze outer perimeter frame & refined classical arched header
  ctx.fillStyle = '#0e131b';
  ctx.fillRect(0, 0, w, 24);
  ctx.fillRect(0, h - 20, w, 20);
  ctx.fillRect(0, 0, 18, h);
  ctx.fillRect(w - 18, 0, 18, h);

  // Subtle top arch corners
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(w, 0);
  ctx.lineTo(w, 96);
  ctx.quadraticCurveTo(w * 0.5, 16, 0, 96);
  ctx.closePath();
  ctx.fillStyle = '#0e131b';
  ctx.fill();

  // Crisp architectural bronze mullion bars (2 vertical, 4 horizontal transoms)
  ctx.fillStyle = '#11161f';
  ctx.fillRect(w * 0.33 - 4, 24, 8, h - 44);
  ctx.fillRect(w * 0.67 - 4, 24, 8, h - 44);
  for (const frac of [0.22, 0.44, 0.66, 0.84]) {
    ctx.fillRect(18, h * frac - 4, w - 36, 8);
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  tex.needsUpdate = true;
  return tex;
}

export function loadPBRAssets(renderer, onEnvReady) {
  const maxAniso = Math.min(renderer.capabilities.getMaxAnisotropy() || 4, 8);
  const manager = new THREE.LoadingManager();
  const texLoader = new THREE.TextureLoader(manager);
  const rgbeLoader = new RGBELoader(manager);

  let resolveReady;
  const readyPromise = new Promise((res) => {
    resolveReady = res;
  });

  manager.onLoad = () => {
    resolveReady();
  };
  manager.onError = (url) => {
    console.warn('PBR asset load fallback:', url);
  };

  function loadTex(file, { srgb = false, repeatX = 1, repeatY = 1, wrap = THREE.RepeatWrapping } = {}) {
    const t = texLoader.load(BASE + file, () => {
      if (t.userData.clones) {
        for (const c of t.userData.clones) {
          c.needsUpdate = true;
        }
      }
    });
    t.wrapS = wrap;
    t.wrapT = wrap;
    t.repeat.set(repeatX, repeatY);
    t.anisotropy = maxAniso;
    t.colorSpace = srgb ? THREE.SRGBColorSpace : THREE.NoColorSpace;
    t.userData.clones = [];
    return t;
  }

  const assets = {
    skyPano: loadTex('nightcity_sky_pano.jpg', {
      srgb: true,
      wrap: THREE.RepeatWrapping
    }),
    asphalt: {
      albedo: loadTex('asphalt_albedo.jpg', { srgb: true }),
      normal: loadTex('asphalt_normal.jpg'),
      rough: loadTex('asphalt_rough.jpg')
    },
    concrete: {
      albedo: loadTex('concrete_albedo.jpg', { srgb: true, repeatX: 3, repeatY: 3 }),
      normal: loadTex('concrete_normal.jpg', { repeatX: 3, repeatY: 3 }),
      rough: loadTex('concrete_rough.jpg', { repeatX: 3, repeatY: 3 })
    },
    metal: {
      albedo: loadTex('metal_albedo.jpg', { srgb: true, repeatX: 2, repeatY: 2 }),
      normal: loadTex('metal_normal.jpg', { repeatX: 2, repeatY: 2 }),
      rough: loadTex('metal_rough.jpg', { repeatX: 2, repeatY: 2 })
    },
    marble: {
      albedo: loadTex('marble_albedo.jpg', { srgb: true, repeatX: 4, repeatY: 4 }),
      normal: loadTex('marble_normal.jpg', { repeatX: 4, repeatY: 4 }),
      rough: loadTex('marble_rough.jpg', { repeatX: 4, repeatY: 4 })
    },
    akordaMarble: {
      albedo: loadTex('akorda_marble_albedo.jpg', { srgb: true, repeatX: 3, repeatY: 2 }),
      normal: loadTex('akorda_marble_normal.jpg', { repeatX: 3, repeatY: 2 }),
      rough: loadTex('akorda_marble_rough.jpg', { repeatX: 3, repeatY: 2 })
    },
    etfe: {
      albedo: loadTex('etfe_albedo.jpg', { srgb: true, repeatX: 14, repeatY: 6 }),
      normal: loadTex('etfe_normal.jpg', { repeatX: 14, repeatY: 6 }),
      rough: loadTex('etfe_rough.jpg', { repeatX: 14, repeatY: 6 })
    },
    baiterekGlass: {
      normal: loadTex('baiterek_normal.jpg', { repeatX: 4, repeatY: 2 }),
      rough: loadTex('baiterek_rough.jpg', { repeatX: 4, repeatY: 2 })
    },
    palaceWindow: createMullionedPalaceWindowTexture(),
    envMap: null,
    readyPromise
  };

  // Clamp sky vertical edge cleanly so pole never wraps horizon pixels
  assets.skyPano.wrapS = THREE.RepeatWrapping;
  assets.skyPano.wrapT = THREE.ClampToEdgeWrapping;

  // Load real 32-bit 2K Shanghai Bund Night HDRI for physically accurate PBR reflections
  rgbeLoader.load(
    BASE + 'nightcity_env.hdr',
    (hdrTex) => {
      const pmrem = new THREE.PMREMGenerator(renderer);
      pmrem.compileEquirectangularShader();
      const envRT = pmrem.fromEquirectangular(hdrTex);
      assets.envMap = envRT.texture;
      hdrTex.dispose();
      pmrem.dispose();
      if (onEnvReady) onEnvReady(assets.envMap);
    },
    undefined,
    (err) => {
      console.warn('HDRI load note, keeping procedural envMap:', err);
    }
  );

  return assets;
}

/**
 * Creates a lightweight tiled clone of a PBR texture set (shares underlying GPU image!).
 */
export function cloneTiledPBR(set, repeatX, repeatY) {
  function cloneOne(tex) {
    if (!tex) return null;
    const c = tex.clone();
    c.repeat.set(repeatX, repeatY);
    c.wrapS = THREE.RepeatWrapping;
    c.wrapT = THREE.RepeatWrapping;
    if (tex.image && tex.image.complete && tex.image.naturalWidth > 0) {
      c.needsUpdate = true;
    } else {
      // Texture.prototype.clone() calls copy() which sets needsUpdate=true before image loads;
      // reset version to 0 until the parent TextureLoader onLoad delivers actual image data!
      c.version = 0;
      if (c.source) c.source.version = 0;
      if (tex.userData && Array.isArray(tex.userData.clones)) {
        tex.userData.clones.push(c);
      }
    }
    return c;
  }
  return {
    albedo: cloneOne(set.albedo),
    normal: cloneOne(set.normal),
    rough: cloneOne(set.rough),
    emissive: cloneOne(set.emissive)
  };
}
