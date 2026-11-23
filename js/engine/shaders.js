/**
 * Astana // Night City 2077 — Pass 4 Photorealistic PBR & Cyberpunk GLSL Shaders
 * 1. Nocturnal Storm Sky Dome sampling nightcity_sky_pano.jpg
 * 2. True 3D Interior-Mapping Parallax Skyscraper Curtain-Wall Shader (4 facade styles, mirror glass reflecting shanghai_bund HDRI)
 * 3. Esil River Nocturnal Mirror Water Shader
 * 4. Wet Rain-Slicked Asphalt Boulevard Shader (charcoal asphalt + concentric raindrop ripples + cyan/magenta/amber neon puddle streaks)
 * 5. Cyberpunk Signage Shader (RGB chromatic split, CRT scanlines, Fresnel edge glow, glitch sweep, fog)
 * 6. Custom Volumetric Steam / Vapor Plumes Shader (FBM drifting steam colored by neon pools)
 * 7. Downward Volumetric Streetlamp / AV Spinner Light Cone Shader
 * 8. Volumetric Sweeping Searchlight Shader
 * 9. Ultra-Fine Nocturnal Rain Streaks Shader
 * 10. Roger Deakins Filmic Post-Processing Grade Shader
 */
import * as THREE from 'three';

/* ============================================================================
   1. NOCTURNAL STORM SKY DOME (nightcity_sky_pano.jpg)
   ============================================================================ */
export function createSkyMaterial(skyPanoTex) {
  return new THREE.ShaderMaterial({
    side: THREE.BackSide,
    depthWrite: false,
    uniforms: {
      uSkyPano: { value: skyPanoTex },
      uTime: { value: 0 },
      uSkyTint: { value: new THREE.Color(0xdbe6f2) }
    },
    vertexShader: /* glsl */ `
      varying vec3 vWorldPos;
      void main() {
        vec4 wp = modelMatrix * vec4(position, 1.0);
        vWorldPos = wp.xyz;
        gl_Position = projectionMatrix * viewMatrix * wp;
      }
    `,
    fragmentShader: /* glsl */ `
      uniform sampler2D uSkyPano;
      uniform float uTime;
      uniform vec3 uSkyTint;
      varying vec3 vWorldPos;

      void main() {
        vec3 dir = normalize(vWorldPos);
        float up = clamp(dir.y, 0.0, 1.0);

        float azim = atan(dir.z, dir.x);
        float u = fract(azim / 6.2831853 + 0.5 + uTime * 0.001);
        float v = clamp(0.13 + pow(up, 0.78) * 0.86, 0.02, 0.99);
        vec3 panoTex = texture2D(uSkyPano, vec2(u, v)).rgb;

        vec3 col = panoTex * uSkyTint * 1.18;
        if (dir.y < 0.0) {
          col = mix(col, vec3(0.015, 0.022, 0.036), smoothstep(0.0, -0.08, dir.y));
        }

        col = min(col, vec3(0.88));
        gl_FragColor = vec4(col, 1.0);
      }
    `
  });
}

/* ============================================================================
   2. TRUE 3D INTERIOR-MAPPING PARALLAX SKYSCRAPER MATERIAL
      - Ray-traces into each recessed office room cell in world/tangent basis
      - Ceiling LED troffers, floor, back wall depth w/ column/partition silhouette,
        half-drawn blinds, ~35% organically lit rooms (2700K / 4200K / 6200K)
      - Mirror glass panes (roughness 0.06, metalness 0.90) reflecting shanghai_bund HDRI
      - Architectural mullions & spandrels (roughness 0.45) + 4 curtain-wall styles
   ============================================================================ */
export function createPBRSkyscraperMaterial(pbr, {
  isInstanced = true,
  isCurved = false,
  tintHex = 0xbfd0e2,
  seed = 0.25,
  uvScaleX = 24.0,
  uvScaleY = 54.0
} = {}) {
  const mat = new THREE.MeshStandardMaterial({
    color: tintHex,
    roughness: 0.45,
    metalness: 0.68,
    emissive: new THREE.Color(0xffffff),
    emissiveIntensity: 1.0,
    envMapIntensity: 2.05
  });

  const sharedUniforms = {
    uTime: { value: 0.0 },
    uHeroSeed: { value: seed },
    uUvScale: { value: new THREE.Vector2(uvScaleX, uvScaleY) }
  };
  mat.userData.customUniforms = sharedUniforms;

  mat.onBeforeCompile = (shader) => {
    shader.uniforms.uTime = sharedUniforms.uTime;
    shader.uniforms.uHeroSeed = sharedUniforms.uHeroSeed;
    shader.uniforms.uUvScale = sharedUniforms.uUvScale;

    shader.vertexShader = shader.vertexShader
      .replace(
        '#include <common>',
        `#include <common>
        ${isInstanced ? 'attribute vec4 aBuildingData;' : ''}
        uniform float uHeroSeed;
        varying vec3 vArchWorldPos;
        varying vec3 vArchWorldNormal;
        varying vec3 vArchLocalPos;
        flat varying float vArchSeed;
        flat varying float vArchAccent;
        flat varying float vArchHeight;`
      )
      .replace(
        '#include <uv_vertex>',
        `#include <uv_vertex>
        vArchLocalPos = position;
        #ifdef USE_INSTANCING
          vec4 archWp = modelMatrix * instanceMatrix * vec4(position, 1.0);
          mat3 archNMat = mat3(modelMatrix) * mat3(instanceMatrix);
          vec3 archN = normalize(archNMat * normal);
          vArchSeed = floor(aBuildingData.z * 100.0) * 0.01;
          vArchAccent = aBuildingData.w;
          vArchHeight = aBuildingData.y;
        #else
          vec4 archWp = modelMatrix * vec4(position, 1.0);
          vec3 archN = normalize(mat3(modelMatrix) * normal);
          vArchSeed = uHeroSeed;
          vArchAccent = 0.28;
          vArchHeight = 105.0;
        #endif
        vArchWorldPos = archWp.xyz;
        vArchWorldNormal = archN;`
      );

    shader.fragmentShader = shader.fragmentShader
      .replace(
        '#include <common>',
        `#include <common>
        uniform float uTime;
        varying vec3 vArchWorldPos;
        varying vec3 vArchWorldNormal;
        varying vec3 vArchLocalPos;
        flat varying float vArchSeed;
        flat varying float vArchAccent;
        flat varying float vArchHeight;

        float archHash21(vec2 p) {
          p = fract(p * vec2(123.34, 456.21));
          p += dot(p, p + 45.32);
          return fract(p.x * p.y);
        }`
      )
      .replace(
        '#include <map_fragment>',
        `#include <map_fragment>
        vec3 _archN = normalize(vArchWorldNormal);
        vec3 _upRef = abs(_archN.y) < 0.85 ? vec3(0.0, 1.0, 0.0) : vec3(0.0, 0.0, 1.0);
        vec3 _archT = normalize(cross(_upRef, _archN));
        vec3 _archB = normalize(cross(_archN, _archT));
        float _isArchRoof = step(0.68, _archN.y);

        vec3 _archEmis = vec3(0.0);
        float _archRough = 0.88;
        float _archMetal = 0.08;

        if (_isArchRoof > 0.5) {
          // Matte dark gravel/bitumen roof membrane
          diffuseColor.rgb = vec3(0.04, 0.048, 0.062);
          _archRough = 0.90;
          _archMetal = 0.06;
        } else {
          // 4 distinct curtain-wall facade styles driven by building seed
          float styleF = floor(fract(vArchSeed * 7.13) * 4.0);
          float bayW = 3.2;
          float floorH = 3.6;
          float mullX = 0.075;
          float spandrelBot = 0.11;
          float spandrelTop = 0.09;
          vec3 frameCol = vec3(0.11, 0.14, 0.18);

          if (styleF > 0.5 && styleF < 1.5) {
            // Style 1: Corporate vertical rib facade
            bayW = 2.6;
            floorH = 3.8;
            mullX = 0.105;
            spandrelBot = 0.08;
            spandrelTop = 0.08;
            frameCol = vec3(0.15, 0.18, 0.22);
          } else if (styleF >= 1.5 && styleF < 2.5) {
            // Style 2: Brutalist-tech concrete/titanium spandrel bands
            bayW = 3.7;
            floorH = 3.5;
            mullX = 0.06;
            spandrelBot = 0.16;
            spandrelTop = 0.13;
            frameCol = vec3(0.16, 0.17, 0.19);
          } else if (styleF >= 2.5) {
            // Style 3: Sleek panoramic tight glass grid
            bayW = 2.25;
            floorH = 3.4;
            mullX = 0.052;
            spandrelBot = 0.07;
            spandrelTop = 0.06;
            frameCol = vec3(0.08, 0.11, 0.15);
          }

          float uCoord = ${isCurved ? '(atan(vArchLocalPos.z, vArchLocalPos.x) / 6.2831853 + 0.5) * (bayW * 12.0)' : 'dot(vArchWorldPos, _archT)'} + vArchSeed * 19.7;
          float vCoord = vArchWorldPos.y;
          vec2 cellId = floor(vec2(uCoord / bayW, vCoord / floorH));
          vec2 cellUv = fract(vec2(uCoord / bayW, vCoord / floorH));

          // Crisp anti-aliased mullions & spandrel mask
          float mx = smoothstep(mullX - 0.012, mullX + 0.012, cellUv.x)
                   * smoothstep(mullX - 0.012, mullX + 0.012, 1.0 - cellUv.x);
          float my = smoothstep(spandrelBot - 0.012, spandrelBot + 0.012, cellUv.y)
                   * smoothstep(spandrelTop - 0.012, spandrelTop + 0.012, 1.0 - cellUv.y);
          // Optional subtle central vertical mullion bar on wide bays (Styles 0 & 2)
          float midBar = (styleF < 0.5 || (styleF >= 1.5 && styleF < 2.5))
            ? smoothstep(0.014, 0.032, abs(cellUv.x - 0.5))
            : 1.0;
          float glassMask = mx * my * midBar;

          // Subtle lower-floor urban AO darkening + ground lobby contrast
          float urbanAO = mix(0.45, 1.0, smoothstep(0.0, 18.0, vArchWorldPos.y));

          // 3D Interior Mapping ray-box intersection inside window pane
          vec2 winUv = clamp(
            (cellUv - vec2(mullX, spandrelBot)) / vec2(1.0 - 2.0 * mullX, 1.0 - spandrelBot - spandrelTop),
            0.002,
            0.998
          );
          vec3 viewWorld = normalize(vArchWorldPos - cameraPosition);
          float rx = dot(viewWorld, _archT);
          float ry = dot(viewWorld, _archB);
          float rz = dot(viewWorld, -_archN);

          float safeRx = abs(rx) > 0.0005 ? rx : (rx >= 0.0 ? 0.0005 : -0.0005);
          float safeRy = abs(ry) > 0.0005 ? ry : (ry >= 0.0 ? 0.0005 : -0.0005);
          float safeRz = max(rz, 0.045);
          float roomDepth = 1.65;

          float tx = (rx > 0.0 ? (1.0 - winUv.x) : -winUv.x) / safeRx;
          float ty = (ry > 0.0 ? (1.0 - winUv.y) : -winUv.y) / safeRy;
          float tz = roomDepth / safeRz;
          float tHit = min(tz, min(tx, ty));
          vec3 hit = vec3(winUv, 0.0) + vec3(rx, ry, rz) * tHit;

          // Per-room occupancy & color temperature (~35% organically lit offices)
          float roomRand = archHash21(cellId + vec2(vArchSeed * 37.0, vArchSeed * 13.0));
          float floorOcc = archHash21(vec2(cellId.y, floor(vArchSeed * 97.0)));
          float isLit = step(0.65, mix(roomRand, floorOcc, 0.28));

          float tempRand = archHash21(cellId + vec2(9.1, 4.7));
          vec3 lightCol = tempRand < 0.48
            ? vec3(1.00, 0.70, 0.36)   // 2700K warm amber tungsten/LED
            : (tempRand < 0.82
                ? vec3(0.95, 0.94, 0.89) // 4200K neutral office white
                : vec3(0.56, 0.80, 1.00)); // 6200K cool monitor daylight

          vec3 roomRadiant = vec3(0.012, 0.018, 0.028);
          if (tz <= tx && tz <= ty) {
            // Back wall: vertical ceiling falloff + architectural column / partition silhouette
            float partX = 0.28 + 0.44 * fract(roomRand * 17.3);
            float columnSil = (abs(hit.x - partX) < 0.13 || hit.y < 0.26) ? 0.48 : 1.0;
            float wallGrad = mix(0.42, 1.05, hit.y) * columnSil;
            vec3 litBack = lightCol * wallGrad * 0.78;
            // Subtle glowing monitor screen rectangle on cool-lit desks
            float monitor = step(0.82, tempRand) * step(0.24, hit.y) * step(hit.y, 0.44)
                          * step(abs(hit.x - 0.5), 0.16);
            litBack += vec3(0.42, 0.76, 1.0) * monitor * 0.55;
            roomRadiant = isLit > 0.5 ? litBack : vec3(0.016, 0.024, 0.036) * (0.45 + 0.55 * hit.y);
          } else if (ty <= tx && ty <= tz) {
            if (ry > 0.0) {
              // Ceiling: recessed fluorescent / LED troffer strips
              float trofX = step(0.16, abs(hit.x - 0.5)) * step(abs(hit.x - 0.5), 0.34);
              float trofZ = step(0.22, hit.z) * step(hit.z, 1.32);
              float trof = trofX * trofZ;
              roomRadiant = isLit > 0.5
                ? mix(lightCol * 0.34, lightCol * 1.32, trof)
                : vec3(0.012, 0.018, 0.028);
            } else {
              // Floor: dark polished office slab catching ceiling troffer bounce
              float deskSil = (abs(hit.x - 0.5) < 0.24 && hit.z > 0.45 && hit.z < 1.05) ? 0.52 : 1.0;
              roomRadiant = isLit > 0.5
                ? lightCol * 0.24 * deskSil * (1.0 - hit.z * 0.28)
                : vec3(0.008, 0.012, 0.018);
            }
          } else {
            // Side walls: depth occlusion falloff
            float sideShade = mix(0.55, 0.20, clamp(hit.z / roomDepth, 0.0, 1.0));
            roomRadiant = isLit > 0.5 ? lightCol * sideShade * 0.65 : vec3(0.010, 0.015, 0.024);
          }

          // Subtle half-drawn Venetian blinds on upper window section (~40% of offices)
          float hasBlinds = step(0.58, fract(roomRand * 23.17));
          float blindZone = smoothstep(0.56, 0.60, winUv.y) * hasBlinds;
          float slat = 0.58 + 0.42 * sin(winUv.y * 125.0);
          roomRadiant *= mix(1.0, 0.36 * slat, blindZone);

          // Ground-floor lobby accent glow on select buildings
          float isLobby = step(vArchWorldPos.y, 5.0) * step(0.35, vArchSeed);
          if (isLobby > 0.5 && isLit < 0.5) {
            roomRadiant = mix(roomRadiant, vec3(0.95, 0.72, 0.42) * 0.38, 0.55);
          }

          // Glass reflectance + mullion/spandrel albedo
          vec3 glassBaseTint = diffuseColor.rgb * 0.14;
          vec3 mullionCol = frameCol * (0.75 + 0.45 * diffuseColor.rgb);
          diffuseColor.rgb = mix(mullionCol, glassBaseTint, glassMask) * urbanAO;

          _archRough = mix(0.45, 0.06, glassMask);
          _archMetal = mix(0.68, 0.90, glassMask);

          float roomDepthAtten = mix(0.65, 1.15, fract(vArchSeed * 13.37));
          _archEmis = roomRadiant * glassMask * roomDepthAtten * mix(0.75, 1.0, urbanAO);

          #ifdef USE_INSTANCING
            float normY = vArchLocalPos.y + 0.5;
            float crownLine = smoothstep(0.980, 0.988, normY) * smoothstep(0.998, 0.992, normY);
            float hasLed = step(0.52, vArchSeed) * step(44.0, vArchHeight);
            vec3 ledCol = vArchAccent < 0.50
              ? vec3(0.04, 0.80, 0.98)
              : (vArchAccent < 0.80 ? vec3(0.98, 0.65, 0.16) : vec3(0.96, 0.14, 0.36));
            _archEmis += ledCol * crownLine * hasLed * 0.95;
          #endif
        }`
      )
      .replace(
        '#include <roughnessmap_fragment>',
        `#include <roughnessmap_fragment>
        roughnessFactor = _archRough;`
      )
      .replace(
        '#include <metalnessmap_fragment>',
        `#include <metalnessmap_fragment>
        metalnessFactor = _archMetal;`
      )
      .replace(
        '#include <emissivemap_fragment>',
        `#include <emissivemap_fragment>
        totalEmissiveRadiance = _archEmis;`
      );
  };

  mat.customProgramCacheKey = () =>
    `pbr-skyscraper-3d-${isInstanced ? 'inst' : 'hero'}-${isCurved ? 'curved' : 'box'}`;
  return mat;
}

/* ============================================================================
   3. ESIL RIVER NOCTURNAL MIRROR WATER SHADER
   ============================================================================ */
export function createEsilRiverMaterial(skyPanoTex) {
  return new THREE.ShaderMaterial({
    uniforms: {
      uSkyPano: { value: skyPanoTex },
      uTime: { value: 0 },
      uFogColor: { value: new THREE.Color(0x060a12) },
      uFogDensity: { value: 0.00105 }
    },
    vertexShader: /* glsl */ `
      varying vec3 vWorldPos;
      varying vec2 vUv;
      void main() {
        vUv = uv;
        vec4 wp = modelMatrix * vec4(position, 1.0);
        vWorldPos = wp.xyz;
        gl_Position = projectionMatrix * viewMatrix * wp;
      }
    `,
    fragmentShader: /* glsl */ `
      uniform sampler2D uSkyPano;
      uniform float uTime;
      uniform vec3 uFogColor;
      uniform float uFogDensity;
      varying vec3 vWorldPos;
      varying vec2 vUv;

      float hash(vec2 p) {
        return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
      }

      float noise(vec2 p) {
        vec2 i = floor(p);
        vec2 f = fract(p);
        vec2 u = f * f * (3.0 - 2.0 * f);
        return mix(
          mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x),
          mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x),
          u.y
        );
      }

      void main() {
        vec2 wp = vWorldPos.xz;

        float r1 = sin(wp.y * 2.4 + wp.x * 0.4 + uTime * 2.0) * 0.45;
        float r2 = sin(wp.y * 5.2 - wp.x * 0.65 - uTime * 2.7) * 0.25;
        float r3 = (noise(vec2(wp.x * 0.85, wp.y * 2.8 + uTime * 0.85)) - 0.5) * 0.8;
        float r4 = (noise(vec2(wp.x * 2.4, wp.y * 7.2 - uTime * 1.5)) - 0.5) * 0.45;
        float rippleZ = (r1 + r2 + r3 + r4) * 0.18;
        float rippleX = (noise(vec2(wp.x * 1.8, wp.y * 4.2 + uTime * 0.75)) - 0.5) * 0.12;

        vec3 N = normalize(vec3(rippleX, 1.0, rippleZ));
        vec3 V = normalize(cameraPosition - vWorldPos);
        vec3 R = reflect(-V, N);
        float fresnel = pow(1.0 - max(dot(N, V), 0.0), 3.6);

        float ru = fract(atan(R.z, R.x) / 6.2831853 + 0.5);
        float rv = clamp(0.13 + pow(max(R.y, 0.0), 0.78) * 0.84, 0.04, 0.98);
        vec3 envRefl = texture2D(uSkyPano, vec2(ru, rv)).rgb * 1.38;

        vec3 waterBase = vec3(0.008, 0.013, 0.022);
        vec3 col = mix(waterBase, envRefl, 0.18 + 0.78 * fresnel);

        float sparkle = pow(0.5 + 0.5 * sin(wp.y * 6.4 + rippleZ * 20.0 - uTime * 2.3), 6.0);
        float micro = pow(0.5 + 0.5 * sin(wp.y * 12.8 - rippleZ * 28.0 + uTime * 3.5), 9.0);
        float specMod = 0.25 + 0.75 * sparkle + 0.6 * micro;

        float bridgeMain = exp(-abs(wp.y) * 0.07);
        float bridgeNorth = exp(-abs(wp.y + 88.0) * 0.085);
        float bridgeSouth = exp(-abs(wp.y - 86.0) * 0.085);
        float akOrdaGlow = exp(-abs(wp.y) * 0.045) * smoothstep(162.0, 134.0, wp.x);
        float cityCol1 = exp(-pow(sin((wp.y + 18.0) * 0.07), 2.0) * 20.0);
        float cityCol2 = exp(-pow(sin((wp.y - 24.0) * 0.06), 2.0) * 22.0);

        vec3 cyberLights =
          vec3(0.05, 0.88, 1.00) * ((bridgeMain + bridgeNorth + bridgeSouth) * 0.76 + cityCol1 * 0.48) +
          vec3(1.00, 0.64, 0.18) * (akOrdaGlow * 0.88) +
          vec3(1.00, 0.14, 0.36) * (cityCol2 * 0.46);

        col += cyberLights * specMod * (0.28 + 0.72 * fresnel);

        float bankEdge = smoothstep(0.04, 0.0, vUv.x) + smoothstep(0.96, 1.0, vUv.x);
        col += vec3(0.08, 0.55, 0.72) * bankEdge * 0.28;

        float dist = length(cameraPosition - vWorldPos);
        float fogFactor = 1.0 - exp(-pow(dist * uFogDensity, 2.0));
        col = mix(col, uFogColor, clamp(fogFactor, 0.0, 1.0));

        gl_FragColor = vec4(col, 1.0);
      }
    `
  });
}

/* ============================================================================
   4. WET RAIN-SLICKED ASPHALT BOULEVARD SHADER
      - Deep wet charcoal asphalt_02 (albedo * 0.48)
      - Multi-scale mirror puddle masks reflecting nightcity_sky_pano.jpg
      - Dual-layer staggered concentric raindrop ripples in puddles
      - Vivid stretched cyan (#00e5ff), magenta (#ff1e56) & sodium-amber (#ff9e2c) neon signage streaks
      - Crisp weathered road lane markings & Baiterek Plaza zebra crosswalks
   ============================================================================ */
export function createWetRoadMaterial(pbr) {
  return new THREE.ShaderMaterial({
    uniforms: {
      uAlbedo: { value: pbr.asphalt.albedo },
      uNormal: { value: pbr.asphalt.normal },
      uRough: { value: pbr.asphalt.rough },
      uSkyPano: { value: pbr.skyPano },
      uTime: { value: 0 },
      uFogColor: { value: new THREE.Color(0x060a12) },
      uFogDensity: { value: 0.00105 }
    },
    vertexShader: /* glsl */ `
      varying vec3 vWorldPos;
      varying vec2 vUv;
      void main() {
        vUv = uv;
        vec4 wp = modelMatrix * vec4(position, 1.0);
        vWorldPos = wp.xyz;
        gl_Position = projectionMatrix * viewMatrix * wp;
      }
    `,
    fragmentShader: /* glsl */ `
      uniform sampler2D uAlbedo;
      uniform sampler2D uNormal;
      uniform sampler2D uRough;
      uniform sampler2D uSkyPano;
      uniform float uTime;
      uniform vec3 uFogColor;
      uniform float uFogDensity;
      varying vec3 vWorldPos;
      varying vec2 vUv;

      float hash(vec2 p) {
        return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
      }

      float noise(vec2 p) {
        vec2 i = floor(p);
        vec2 f = fract(p);
        vec2 u = f * f * (3.0 - 2.0 * f);
        return mix(
          mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x),
          mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x),
          u.y
        );
      }

      float fbm(vec2 p) {
        float v = 0.0;
        float a = 0.5;
        for (int i = 0; i < 3; i++) {
          v += a * noise(p);
          p *= 2.08;
          a *= 0.5;
        }
        return v;
      }

      vec2 rainRippleLayer(vec2 wp, float scale, float speed) {
        vec2 g = wp * scale;
        vec2 cell = floor(g);
        vec2 f = fract(g) - 0.5;
        float rnd = hash(cell);
        float t = fract(uTime * speed + rnd);
        vec2 center = (vec2(hash(cell + 3.1), hash(cell + 7.4)) - 0.5) * 0.48;
        vec2 d = f - center;
        float dist = length(d) + 0.0001;
        float ring = sin((dist - t * 0.45) * 48.0) * exp(-dist * 7.5) * (1.0 - t) * smoothstep(0.0, 0.08, t);
        return (d / dist) * ring;
      }

      void main() {
        vec2 wp = vWorldPos.xz;
        vec2 texUv = wp * 0.085;

        vec3 texAlbedo = texture2D(uAlbedo, texUv).rgb;
        vec3 texNorm = texture2D(uNormal, texUv).rgb * 2.0 - 1.0;
        float texRough = texture2D(uRough, texUv).r;

        // Multi-scale natural rainwater pooling inside asphalt cavities
        float puddleMacro = fbm(wp * 0.065 + vec2(1.7, -2.9));
        float puddleMicro = fbm(wp * 0.24 - vec2(4.2, 1.9));
        float puddleMask = smoothstep(0.47, 0.58, puddleMacro * 0.72 + puddleMicro * 0.28 - (texRough - 0.5) * 0.22);

        // Dark charcoal rain-soaked asphalt (albedo * 0.48)
        vec3 asphaltCol = texAlbedo * 0.48 * mix(1.0, 0.56, puddleMask);

        float absZ = abs(wp.y);
        float inBoulevard = step(-126.0, wp.x) * step(wp.x, 128.0);
        float onRoad = step(9.2, absZ) * step(absZ, 21.0) * inBoulevard;
        asphaltCol = mix(asphaltCol, asphaltCol * 0.82, onRoad);

        // Crisp weathered painted road lane markings & zebra crosswalks
        float dash = step(0.46, fract(wp.x * 0.14));
        float lane1 = smoothstep(0.20, 0.06, abs(absZ - 13.2)) * dash * onRoad;
        float lane2 = smoothstep(0.20, 0.06, abs(absZ - 17.0)) * dash * onRoad;
        float paintWear = mix(0.65, 1.0, texRough);
        vec3 paintCol = vec3(0.76, 0.74, 0.68) * paintWear;
        asphaltCol = mix(asphaltCol, paintCol, clamp((lane1 + lane2) * 0.74, 0.0, 0.82));

        // Sodium-amber & cyan boulevard curb trims
        float innerCurb = smoothstep(0.22, 0.07, abs(absZ - 9.4)) * inBoulevard;
        float outerCurb = smoothstep(0.20, 0.07, abs(absZ - 20.6)) * inBoulevard;
        asphaltCol += vec3(0.95, 0.62, 0.18) * innerCurb * 0.62;
        asphaltCol += vec3(0.08, 0.78, 0.96) * outerCurb * 0.36;

        // Crosswalk zebra stripes flanking Baiterek Plaza
        float nearCrosswalk = step(abs(abs(wp.x) - 27.0), 2.3) * onRoad;
        float zebra = step(0.46, fract(wp.y * 0.85));
        asphaltCol = mix(asphaltCol, paintCol, nearCrosswalk * zebra * 0.68);

        // Concentric animated raindrop ripples strictly inside puddles
        vec2 rGrad = (rainRippleLayer(wp, 0.85, 1.35) + rainRippleLayer(wp, 1.70, 1.75) * 0.85) * 0.15;
        vec3 N = normalize(vec3(
          mix(texNorm.x * 0.62, rGrad.x, puddleMask),
          1.0,
          mix(texNorm.y * 0.62, rGrad.y, puddleMask)
        ));
        vec3 V = normalize(cameraPosition - vWorldPos);
        vec3 R = reflect(-V, N);
        float fresnel = pow(1.0 - max(dot(N, V), 0.0), 3.0);

        float ru = fract(atan(R.z, R.x) / 6.2831853 + 0.5);
        float rv = clamp(0.13 + pow(max(R.y, 0.0), 0.78) * 0.84, 0.04, 0.98);
        vec3 skyEnv = texture2D(uSkyPano, vec2(ru, rv)).rgb * 1.48;

        // Vivid stretched cyan, magenta, and sodium-amber neon signage reflections in puddles!
        float canyonMask = exp(-abs(absZ - 17.5) * 0.09) * inBoulevard;
        float streetLampLine = exp(-abs(absZ - 9.8) * 0.35) * inBoulevard;
        float lampPools = pow(max(0.0, cos((wp.x + 7.0) * (3.14159 / 14.0))), 6.0) * streetLampLine;
        float baiterekGold = exp(-length(wp) * 0.025) * 0.75;

        float shimmerC = pow(max(0.0, sin(wp.x * 0.21 + wp.y * 0.14 + rGrad.x * 8.0)), 6.0);
        float shimmerM = pow(max(0.0, cos(wp.x * 0.17 - wp.y * 0.18 + rGrad.y * 8.0)), 8.0);
        float shimmerA = pow(max(0.0, sin(wp.x * 0.13 + 1.4 - rGrad.x * 7.0)), 7.0);
        float rippleGlint = smoothstep(0.015, 0.085, length(rGrad)) * puddleMask * (0.35 + 0.65 * fresnel);

        vec3 signBounce =
          vec3(0.00, 0.90, 1.00) * (shimmerC * (0.45 + 0.65 * canyonMask)) +
          vec3(1.00, 0.12, 0.34) * (shimmerM * (0.35 + 0.72 * canyonMask)) +
          vec3(1.00, 0.62, 0.17) * (shimmerA * 0.45 + lampPools * 0.85 + baiterekGold);
        vec3 rippleCatch = mix(vec3(0.42, 0.85, 1.0), vec3(1.0, 0.76, 0.42), streetLampLine) * rippleGlint * 0.68;

        float gloss = mix(0.14 * (1.0 - texRough * 0.6), 0.95, puddleMask);
        vec3 col = asphaltCol * 0.72
                 + skyEnv * gloss * (0.18 + 0.78 * fresnel)
                 + signBounce * (0.06 + puddleMask * 0.82) * (0.26 + 0.74 * fresnel)
                 + rippleCatch;

        float dist = length(cameraPosition - vWorldPos);
        float fogFactor = 1.0 - exp(-pow(dist * uFogDensity, 2.0));
        col = mix(col, uFogColor, clamp(fogFactor, 0.0, 1.0));

        gl_FragColor = vec4(col, 1.0);
      }
    `
  });
}

/* ============================================================================
   5. CYBERPUNK SIGNAGE SHADER (Mega-Billboards, Blade Signs, Roof Signs, Kiosks)
      - Chromatic aberration RGB split
      - CRT horizontal & vertical micro-scanlines
      - Fresnel holographic edge glow
      - Animated refresh sweep & periodic subtle glitch jitter
      - Distance fog fade
   ============================================================================ */
export function createCyberSignShaderMaterial(texture, {
  seed = 0,
  doubleSided = false,
  transparent = false,
  intensity = 0.96,
  opacity = 1.0
} = {}) {
  return new THREE.ShaderMaterial({
    transparent,
    depthWrite: !transparent,
    side: doubleSided ? THREE.DoubleSide : THREE.FrontSide,
    blending: THREE.NormalBlending,
    uniforms: {
      uMap: { value: texture },
      uTime: { value: 0 },
      uSeed: { value: seed },
      uIntensity: { value: intensity },
      uOpacity: { value: opacity },
      uTransparent: { value: transparent ? 1.0 : 0.0 },
      uFogColor: { value: new THREE.Color(0x060a12) },
      uFogDensity: { value: 0.00105 }
    },
    vertexShader: /* glsl */ `
      varying vec2 vUv;
      varying vec3 vWorldPos;
      varying vec3 vWorldNormal;
      void main() {
        vUv = uv;
        vec4 wp = modelMatrix * vec4(position, 1.0);
        vWorldPos = wp.xyz;
        vWorldNormal = normalize(mat3(modelMatrix) * normal);
        gl_Position = projectionMatrix * viewMatrix * wp;
      }
    `,
    fragmentShader: /* glsl */ `
      uniform sampler2D uMap;
      uniform float uTime;
      uniform float uSeed;
      uniform float uIntensity;
      uniform float uOpacity;
      uniform float uTransparent;
      uniform vec3 uFogColor;
      uniform float uFogDensity;
      varying vec2 vUv;
      varying vec3 vWorldPos;
      varying vec3 vWorldNormal;

      void main() {
        vec2 uv = vUv;

        // Subtle micro-shimmer refresh (keeps architectural LED text razor-sharp)
        float glitchTrigger = step(0.985, sin(uTime * 1.4 + uSeed * 17.3) * 0.5 + 0.5);
        float band = step(0.65, sin(uv.y * 28.0 + uTime * 12.0));
        uv.x += glitchTrigger * band * 0.0025 * sin(uTime * 37.0 + uSeed);

        // Tight subpixel chromatic split
        float ca = 0.0009 + glitchTrigger * 0.0016;
        float r = texture2D(uMap, clamp(uv + vec2(ca, 0.0), 0.002, 0.998)).r;
        float g = texture2D(uMap, clamp(uv, 0.002, 0.998)).g;
        float b = texture2D(uMap, clamp(uv - vec2(ca, 0.0), 0.002, 0.998)).b;
        vec3 col = vec3(r, g, b);

        // Micro-LED pixel pitch scanlines + gentle refresh sweep
        float scanH = 0.91 + 0.09 * sin(uv.y * 260.0 - uTime * 7.5);
        float scanV = 0.96 + 0.04 * sin(uv.x * 180.0);
        float sweep = exp(-abs(fract(uTime * 0.22 + uSeed) - uv.y) * 42.0) * 0.16;
        float lum = dot(col, vec3(0.299, 0.587, 0.114));

        vec3 V = normalize(cameraPosition - vWorldPos);
        float fresnel = pow(1.0 - abs(dot(normalize(vWorldNormal), V)), 2.5);
        vec3 finalCol = col * scanH * scanV * uIntensity * mix(0.68, 1.08, smoothstep(0.14, 0.72, lum))
                      + col * (sweep + fresnel * 0.20);

        float edge = smoothstep(0.0, 0.015, uv.x) * smoothstep(1.0, 0.985, uv.x)
                   * smoothstep(0.0, 0.015, uv.y) * smoothstep(1.0, 0.985, uv.y);
        float flicker = 0.96 + 0.04 * sin(uTime * 14.0 + uSeed * 9.0);
        float alpha = uTransparent > 0.5
          ? edge * flicker * uOpacity * mix(0.76, 0.98, smoothstep(0.10, 0.52, lum))
          : 1.0;

        float dist = length(cameraPosition - vWorldPos);
        float fogFactor = 1.0 - exp(-pow(dist * uFogDensity, 2.0));
        finalCol = mix(finalCol * mix(0.88 + 0.12 * edge, 1.0, uTransparent), uFogColor, clamp(fogFactor * 0.88, 0.0, 0.94));

        gl_FragColor = vec4(finalCol, alpha);
      }
    `
  });
}

/* ============================================================================
   6. CUSTOM VOLUMETRIC STEAM / VAPOR PLUMES SHADER
      - Drifting animated FBM vapor vents rising from boulevard grates & rooftops
      - Soft Gaussian/vertical plume falloff (zero hard quad edges)
      - Colored by local neon pools (cyan, sodium-amber, crimson-magenta)
   ============================================================================ */
export function createVolumetricSteamMaterial() {
  return new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
    blending: THREE.AdditiveBlending,
    uniforms: {
      uTime: { value: 0 },
      uFogColor: { value: new THREE.Color(0x060a12) },
      uFogDensity: { value: 0.00105 }
    },
    vertexShader: /* glsl */ `
      attribute vec3 aSteamData; // x = phase, y = speed, z = density
      varying vec2 vUv;
      varying vec3 vColor;
      varying vec3 vSteamData;
      varying vec3 vWorldPos;
      void main() {
        vUv = uv;
        vSteamData = aSteamData;
        #ifdef USE_INSTANCING_COLOR
          vColor = instanceColor;
        #else
          vColor = vec3(0.0, 0.88, 1.0);
        #endif
        vec4 wp = modelMatrix * instanceMatrix * vec4(position, 1.0);
        vWorldPos = wp.xyz;
        gl_Position = projectionMatrix * viewMatrix * wp;
      }
    `,
    fragmentShader: /* glsl */ `
      uniform float uTime;
      uniform vec3 uFogColor;
      uniform float uFogDensity;
      varying vec2 vUv;
      varying vec3 vColor;
      varying vec3 vSteamData;
      varying vec3 vWorldPos;

      float hash(vec2 p) {
        return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
      }

      float noise(vec2 p) {
        vec2 i = floor(p);
        vec2 f = fract(p);
        vec2 u = f * f * (3.0 - 2.0 * f);
        return mix(
          mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x),
          mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x),
          u.y
        );
      }

      float fbm(vec2 p) {
        float v = 0.0;
        float a = 0.5;
        for (int i = 0; i < 3; i++) {
          v += a * noise(p);
          p *= 2.05;
          a *= 0.5;
        }
        return v;
      }

      void main() {
        float phase = vSteamData.x;
        float speed = vSteamData.y;
        float density = vSteamData.z;

        // Rising animated plume drift with gentle horizontal wind sway
        float xSwirl = sin(vUv.y * 4.0 - uTime * speed * 1.4 + phase) * 0.12 * vUv.y;
        vec2 pUv = vec2((vUv.x - 0.5) * 2.2 + xSwirl, vUv.y * 2.4 - uTime * speed + phase * 3.1);
        float vapor = fbm(pUv) * 0.72 + fbm(pUv * 2.1 + vec2(2.3, -uTime * speed * 0.6)) * 0.28;

        // Soft plume silhouette: narrow at grate base, widening & fading softly upward and laterally
        float coneWidth = mix(0.22, 0.48, vUv.y);
        float latMask = smoothstep(coneWidth, 0.04, abs(vUv.x - 0.5));
        float vertMask = smoothstep(0.0, 0.14, vUv.y) * pow(smoothstep(1.0, 0.15, vUv.y), 1.4);

        float alpha = smoothstep(0.26, 0.84, vapor) * latMask * vertMask * density;
        float dist = length(cameraPosition - vWorldPos);
        float fogFade = exp(-pow(dist * uFogDensity * 0.9, 2.0));
        alpha *= fogFade;

        if (alpha < 0.004) discard;
        gl_FragColor = vec4(vColor * (0.65 + 0.55 * (1.0 - vUv.y)), alpha);
      }
    `
  });
}

/* ============================================================================
   7. VOLUMETRIC STREETLAMP & AV SPINNER DOWNWARD LIGHT CONE SHADER
   ============================================================================ */
export function createLightConeMaterial({ opacity = 0.09, colorHex = 0xffb852 } = {}) {
  return new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
    blending: THREE.AdditiveBlending,
    uniforms: {
      uTime: { value: 0 },
      uOpacity: { value: opacity },
      uColor: { value: new THREE.Color(colorHex) }
    },
    vertexShader: /* glsl */ `
      uniform vec3 uColor;
      varying vec2 vUv;
      varying vec3 vColor;
      varying vec3 vNormalView;
      varying vec3 vViewDir;
      void main() {
        vUv = uv;
        #ifdef USE_INSTANCING_COLOR
          vColor = instanceColor;
        #else
          vColor = uColor;
        #endif
        #ifdef USE_INSTANCING
          vec4 mvPos = modelViewMatrix * instanceMatrix * vec4(position, 1.0);
          mat3 nMat = mat3(modelViewMatrix) * mat3(instanceMatrix);
          vNormalView = normalize(nMat * normal);
        #else
          vec4 mvPos = modelViewMatrix * vec4(position, 1.0);
          vNormalView = normalize(normalMatrix * normal);
        #endif
        vViewDir = normalize(-mvPos.xyz);
        gl_Position = projectionMatrix * mvPos;
      }
    `,
    fragmentShader: /* glsl */ `
      uniform float uTime;
      uniform float uOpacity;
      varying vec2 vUv;
      varying vec3 vColor;
      varying vec3 vNormalView;
      varying vec3 vViewDir;

      void main() {
        float edgeSoft = pow(abs(dot(normalize(vNormalView), normalize(vViewDir))), 1.9);
        // Cylinder UV vUv.y = 1 at top (fixture), 0 at bottom (ground)
        float vertFade = smoothstep(0.0, 0.35, vUv.y) * smoothstep(1.0, 0.86, vUv.y);
        float mist = 0.86 + 0.14 * sin(vUv.y * 18.0 + uTime * 3.2);
        float alpha = edgeSoft * vertFade * mist * uOpacity;
        if (alpha < 0.002) discard;
        gl_FragColor = vec4(vColor, alpha);
      }
    `
  });
}

/* ============================================================================
   8. VOLUMETRIC SEARCHLIGHT BEAM SHADER
   ============================================================================ */
export function createSearchlightMaterial(colorHex) {
  return new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
    blending: THREE.AdditiveBlending,
    uniforms: {
      uColor: { value: new THREE.Color(colorHex) },
      uBoost: { value: 1.0 },
      uTime: { value: 0 }
    },
    vertexShader: /* glsl */ `
      varying vec2 vUv;
      varying vec3 vNormalView;
      varying vec3 vViewDir;
      void main() {
        vUv = uv;
        vec4 mvPos = modelViewMatrix * vec4(position, 1.0);
        vNormalView = normalize(normalMatrix * normal);
        vViewDir = normalize(-mvPos.xyz);
        gl_Position = projectionMatrix * mvPos;
      }
    `,
    fragmentShader: /* glsl */ `
      uniform vec3 uColor;
      uniform float uBoost;
      uniform float uTime;
      varying vec2 vUv;
      varying vec3 vNormalView;
      varying vec3 vViewDir;

      void main() {
        float edgeSoft = pow(abs(dot(normalize(vNormalView), normalize(vViewDir))), 2.4);
        float verticalFade = smoothstep(0.0, 0.10, vUv.y) * pow(1.0 - vUv.y, 2.0);
        float shimmer = 0.90 + 0.10 * sin(uTime * 2.5 + vUv.y * 8.0);
        float alpha = edgeSoft * verticalFade * shimmer * 0.068 * uBoost;
        if (alpha < 0.002) discard;
        gl_FragColor = vec4(uColor * 0.88, alpha);
      }
    `
  });
}

/* ============================================================================
   9. GPU-DRIVEN SOFT NOCTURNAL RAIN DROPS & ATMOSPHERIC MIST SHADERS
   ============================================================================ */
export function createNeonRainMaterial() {
  return new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    uniforms: {
      uTime: { value: 0 },
      uRainIntensity: { value: 0.78 },
      uColorA: { value: new THREE.Color(0x74b8d0) },
      uColorB: { value: new THREE.Color(0xcba67d) }
    },
    vertexShader: /* glsl */ `
      attribute float aSpeed;
      attribute float aPhase;
      attribute float aTint;
      attribute float aOffsetY;
      attribute float aAlong;
      uniform float uTime;
      varying float vTint;
      varying float vAlpha;
      varying float vAlong;

      void main() {
        vec3 pos = position;
        float ceiling = 170.0;
        float baseY = mod(pos.y - uTime * aSpeed + aPhase * ceiling, ceiling);
        float y = baseY + aOffsetY;
        pos.x += (ceiling - baseY) * 0.015 - aOffsetY * 0.025;
        pos.y = y;

        vec4 wp = modelMatrix * vec4(pos, 1.0);
        float camDist = length(cameraPosition - wp.xyz);
        // Prevent near-lens scratch artifacts and softly fade into distant night mist
        float nearFade = smoothstep(8.0, 26.0, camDist);
        float farFade = exp(-pow(camDist * 0.0044, 2.0));
        float vertFade = smoothstep(0.0, 12.0, baseY) * smoothstep(ceiling, ceiling - 24.0, baseY);

        vTint = aTint;
        vAlong = aAlong;
        vAlpha = vertFade * nearFade * farFade;
        gl_Position = projectionMatrix * viewMatrix * wp;
      }
    `,
    fragmentShader: /* glsl */ `
      uniform float uRainIntensity;
      uniform vec3 uColorA;
      uniform vec3 uColorB;
      varying float vTint;
      varying float vAlpha;
      varying float vAlong;

      void main() {
        float streakTaper = sin(clamp(vAlong, 0.0, 1.0) * 3.14159265);
        vec3 col = mix(uColorA, uColorB, vTint * 0.40) * 0.72;
        float alpha = vAlpha * streakTaper * 0.068 * min(uRainIntensity, 1.05);
        if (alpha < 0.002) discard;
        gl_FragColor = vec4(col, alpha);
      }
    `
  });
}

export function createRainMistMaterial() {
  return new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
    blending: THREE.NormalBlending,
    uniforms: {
      uTime: { value: 0 },
      uRainIntensity: { value: 0.78 },
      uFogColor: { value: new THREE.Color(0x060a12) },
      uFogDensity: { value: 0.00105 }
    },
    vertexShader: /* glsl */ `
      attribute vec3 aMistData; // x = phase, y = speed, z = opacity
      varying vec2 vUv;
      varying vec3 vMistData;
      varying vec3 vColor;
      varying float vCamFade;

      void main() {
        vUv = uv;
        vMistData = aMistData;
        #ifdef USE_INSTANCING_COLOR
          vColor = instanceColor;
        #else
          vColor = vec3(0.32, 0.56, 0.72);
        #endif
        vec4 wp = modelMatrix * instanceMatrix * vec4(position, 1.0);
        float dist = length(cameraPosition - wp.xyz);
        vCamFade = smoothstep(10.0, 28.0, dist) * exp(-pow(dist * 0.0032, 2.0));
        gl_Position = projectionMatrix * viewMatrix * wp;
      }
    `,
    fragmentShader: /* glsl */ `
      uniform float uTime;
      uniform float uRainIntensity;
      varying vec2 vUv;
      varying vec3 vMistData;
      varying vec3 vColor;
      varying float vCamFade;

      float hash(vec2 p) {
        return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
      }

      float noise(vec2 p) {
        vec2 i = floor(p);
        vec2 f = fract(p);
        vec2 u = f * f * (3.0 - 2.0 * f);
        return mix(
          mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x),
          mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x),
          u.y
        );
      }

      void main() {
        vec2 d = vUv - 0.5;
        float radial = smoothstep(0.50, 0.12, length(d));
        float n = noise(vUv * 3.2 + vec2(uTime * vMistData.y, vMistData.x)) * 0.65
                + noise(vUv * 6.5 - vec2(uTime * vMistData.y * 0.6, vMistData.x * 1.7)) * 0.35;
        float alpha = radial * smoothstep(0.22, 0.85, n) * vMistData.z * vCamFade * min(uRainIntensity, 1.0);
        if (alpha < 0.002) discard;
        gl_FragColor = vec4(vColor, alpha);
      }
    `
  });
}

/* ============================================================================
   10. CINEMATIC POST-PROCESSING FILM GRADE SHADERPASS
   ============================================================================ */
export const CinemaGradeShader = {
  uniforms: {
    tDiffuse: { value: null },
    uTime: { value: 0 }
  },
  vertexShader: /* glsl */ `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: /* glsl */ `
    uniform sampler2D tDiffuse;
    uniform float uTime;
    varying vec2 vUv;

    float randGrain(vec2 co) {
      return fract(sin(dot(co, vec2(12.9898, 78.233))) * 43758.5453);
    }

    void main() {
      vec2 centered = vUv - 0.5;
      float r2 = dot(centered, centered);

      vec2 caOffset = centered * 0.00065 * smoothstep(0.06, 0.45, r2);
      float r = texture2D(tDiffuse, vUv + caOffset).r;
      float g = texture2D(tDiffuse, vUv).g;
      float b = texture2D(tDiffuse, vUv - caOffset).b;
      vec3 col = vec3(r, g, b);

      float lum = dot(col, vec3(0.2126, 0.7152, 0.0722));
      col = mix(vec3(lum), col, 0.94);

      vec3 shadowTint = vec3(0.90, 0.98, 1.05);
      vec3 highlightTint = vec3(1.05, 0.99, 0.92);
      float hlMask = smoothstep(0.25, 0.85, lum);
      col *= mix(shadowTint, highlightTint, hlMask);

      col = pow(max(col, vec3(0.0)), vec3(1.02));

      float vig = 1.0 - smoothstep(0.20, 0.78, r2) * 0.22;
      col *= vig;

      float grain = (randGrain(vUv * 800.0 + fract(uTime * 13.7)) - 0.5) * 0.012;
      col += grain;

      gl_FragColor = vec4(max(col, vec3(0.0)), 1.0);
    }
  `
};


/* ============================================================================
   11. BAITEREK MONUMENTAL VOLUMETRIC SKY BEAM, RISING ENERGY MOTES & FOUNTAIN PLUMES
   ============================================================================ */
export function createBaiterekBeamMaterial({
  colorHex = 0xffcf48,
  opacity = 0.40,
  speed = 2.4,
  verticalPow = 1.65,
  edgePow = 2.5
} = {}) {
  return new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
    blending: THREE.AdditiveBlending,
    uniforms: {
      uTime: { value: 0 },
      uColor: { value: new THREE.Color(colorHex) },
      uOpacity: { value: opacity },
      uSpeed: { value: speed },
      uVertPow: { value: verticalPow },
      uEdgePow: { value: edgePow },
      uFogColor: { value: new THREE.Color(0x060a12) },
      uFogDensity: { value: 0.00105 }
    },
    vertexShader: /* glsl */ `
      varying vec2 vUv;
      varying vec3 vNormalView;
      varying vec3 vViewDir;
      varying vec3 vWorldPos;
      void main() {
        vUv = uv;
        vec4 wp = modelMatrix * vec4(position, 1.0);
        vWorldPos = wp.xyz;
        vec4 mvPos = viewMatrix * wp;
        vNormalView = normalize(normalMatrix * normal);
        vViewDir = normalize(-mvPos.xyz);
        gl_Position = projectionMatrix * mvPos;
      }
    `,
    fragmentShader: /* glsl */ `
      uniform float uTime;
      uniform vec3 uColor;
      uniform float uOpacity;
      uniform float uSpeed;
      uniform float uVertPow;
      uniform float uEdgePow;
      uniform vec3 uFogColor;
      uniform float uFogDensity;
      varying vec2 vUv;
      varying vec3 vNormalView;
      varying vec3 vViewDir;
      varying vec3 vWorldPos;

      void main() {
        float edgeSoft = pow(abs(dot(normalize(vNormalView), normalize(vViewDir))), uEdgePow);
        float baseIn = smoothstep(0.0, 0.045, vUv.y);
        float topOut = pow(clamp(1.0 - vUv.y, 0.0, 1.0), uVertPow);
        float energyWave = 0.84 + 0.16 * sin(vUv.y * 26.0 - uTime * uSpeed);
        float swirl = 0.90 + 0.10 * sin(vUv.x * 12.56637 + vUv.y * 8.0 - uTime * (uSpeed * 0.7));
        float dist = length(cameraPosition - vWorldPos);
        float fogFade = exp(-pow(dist * uFogDensity * 0.65, 2.0));
        float alpha = edgeSoft * baseIn * topOut * energyWave * swirl * uOpacity * fogFade;
        if (alpha < 0.002) discard;
        gl_FragColor = vec4(uColor * (0.95 + 0.25 * energyWave), alpha);
      }
    `
  });
}

export function createBaiterekParticlesMaterial() {
  return new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    uniforms: {
      uTime: { value: 0 },
      uPixelRatio: { value: Math.min(window.devicePixelRatio || 1, 2) }
    },
    vertexShader: /* glsl */ `
      attribute float aPhase;
      attribute float aRadius;
      attribute float aAngle;
      attribute float aSpeed;
      attribute float aSize;
      attribute float aTint;
      uniform float uTime;
      uniform float uPixelRatio;
      varying float vAlpha;
      varying float vTint;

      void main() {
        float t = fract(aPhase + uTime * aSpeed);
        float ang = aAngle + t * 5.2 + uTime * 0.35;
        float r = aRadius * (0.60 + 0.85 * t);
        vec3 pos = vec3(
          cos(ang) * r,
          55.5 + t * 235.0,
          sin(ang) * r
        );
        vec4 mvPos = modelViewMatrix * vec4(pos, 1.0);
        gl_PointSize = aSize * uPixelRatio * (260.0 / max(-mvPos.z, 1.0));
        vAlpha = smoothstep(0.0, 0.08, t) * pow(1.0 - t, 1.4) * 0.72;
        vTint = aTint;
        gl_Position = projectionMatrix * mvPos;
      }
    `,
    fragmentShader: /* glsl */ `
      varying float vAlpha;
      varying float vTint;

      void main() {
        vec2 c = gl_PointCoord - 0.5;
        float d2 = dot(c, c);
        if (d2 > 0.25) discard;
        float glow = exp(-d2 * 16.0);
        vec3 col = mix(vec3(1.0, 0.82, 0.32), vec3(0.22, 0.90, 1.0), vTint * 0.45);
        gl_FragColor = vec4(col, glow * vAlpha);
      }
    `
  });
}

export function createFountainPlumeMaterial() {
  return new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    uniforms: {
      uTime: { value: 0 },
      uPixelRatio: { value: Math.min(window.devicePixelRatio || 1, 2) }
    },
    vertexShader: /* glsl */ `
      attribute float aPhase;
      attribute float aSpeed;
      attribute vec2 aDir;
      attribute float aHeight;
      attribute float aTint;
      uniform float uTime;
      uniform float uPixelRatio;
      varying float vAlpha;
      varying float vTint;

      void main() {
        float t = fract(aPhase + uTime * aSpeed);
        float arc = 4.0 * t * (1.0 - t);
        vec3 pos = position;
        pos.x += aDir.x * t * 1.65;
        pos.z += aDir.y * t * 1.65;
        pos.y += aHeight * arc;
        vec4 mvPos = modelViewMatrix * vec4(pos, 1.0);
        gl_PointSize = (2.2 + 1.4 * arc) * uPixelRatio * (180.0 / max(-mvPos.z, 1.0));
        vAlpha = smoothstep(0.0, 0.14, t) * smoothstep(1.0, 0.55, t) * 0.42;
        vTint = aTint;
        gl_Position = projectionMatrix * mvPos;
      }
    `,
    fragmentShader: /* glsl */ `
      varying float vAlpha;
      varying float vTint;

      void main() {
        vec2 c = gl_PointCoord - 0.5;
        float d2 = dot(c, c);
        if (d2 > 0.25) discard;
        float dotSoft = exp(-d2 * 14.0);
        vec3 col = mix(vec3(0.28, 0.88, 1.0), vec3(1.0, 0.80, 0.44), vTint * 0.32);
        gl_FragColor = vec4(col, dotSoft * vAlpha);
      }
    `
  });
}