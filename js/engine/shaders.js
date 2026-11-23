/**
 * Astana -> Night City 2077
 * Pass 3: Photorealistic Cinematic PBR & GLSL Shaders
 * 1. Photorealistic Storm Sky Dome sampling nightcity_sky_pano.jpg (Roger Deakins / BR2049) <-> Astana Dusk
 * 2. Real PBR Skyscraper Curtain-Wall Material (skyscraper_albedo/normal/rough/emissive + World-Metric UV & Per-Instance Variation!)
 * 3. Esil River Dark Nocturnal Mirror Water sampling real sky pano + fine anisotropic wave ripples
 * 4. Wet Rain-Slicked Asphalt Boulevard sampling real Poly Haven asphalt_albedo/normal/rough + glossy rain puddles
 * 5. Animated Holographic Mega-Billboards (Restrained Cinematic Contrast, Scanlines & Glitch)
 * 6. Volumetric Fresnel Searchlights & GPU-Driven Neon Rain Streaks
 * 7. Cinematic Post-Processing Film Grade ShaderPass (Teal-Obsidian Shadows, Amber Highlights, Vignette, Grain, Lens CA)
 */
import * as THREE from 'three';

/* ============================================================================
   1. PHOTOREALISTIC STORM SKY DOME (nightcity_sky_pano.jpg <-> Astana Golden Dusk)
      Zero cartoon neon-pink sky or flat pink sun circle!
   ============================================================================ */
export function createSkyMaterial(skyPanoTex) {
  return new THREE.ShaderMaterial({
    side: THREE.BackSide,
    depthWrite: false,
    uniforms: {
      uSkyPano: { value: skyPanoTex },
      uTime: { value: 0 },
      uCyber: { value: 1.0 },
      uSkyTint: { value: new THREE.Color(0xffffff) },
      uDuskTop: { value: new THREE.Color(0x0c1a36) },
      uDuskMid: { value: new THREE.Color(0x284369) },
      uDuskHorizon: { value: new THREE.Color(0xc27b48) }
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
      uniform float uCyber;
      uniform vec3 uSkyTint;
      uniform vec3 uDuskTop;
      uniform vec3 uDuskMid;
      uniform vec3 uDuskHorizon;
      varying vec3 vWorldPos;

      void main() {
        vec3 dir = normalize(vWorldPos);
        float up = clamp(dir.y, 0.0, 1.0);

        // 1) Photorealistic Golden-Hour Astana Dusk sky (cyber = 0)
        vec3 duskSky = mix(uDuskHorizon, uDuskMid, smoothstep(0.0, 0.22, up));
        duskSky = mix(duskSky, uDuskTop, smoothstep(0.18, 0.68, up));
        // Subtle warm sunset glow along western horizon (no cartoon hard circle!)
        vec3 sunDir = normalize(vec3(0.55, 0.14, -0.82));
        float sunGlow = pow(max(dot(dir, sunDir), 0.0), 14.0) * 0.42 + pow(max(dot(dir, sunDir), 0.0), 90.0) * 0.48;
        duskSky += vec3(1.0, 0.72, 0.40) * sunGlow;

        // 2) Real brooding Roger Deakins / Blade Runner 2049 storm panorama (nightcity_sky_pano.jpg)
        float azim = atan(dir.z, dir.x);
        float u = fract(azim / 6.2831853 + 0.5 + uTime * 0.0012);
        // Align horizon (dir.y = 0) right with distant city horizon (~v = 0.14 in texture)
        float v = clamp(0.13 + pow(up, 0.78) * 0.86, 0.02, 0.99);
        vec3 panoTex = texture2D(uSkyPano, vec2(u, v)).rgb;

        // Subtle volumetric storm-cloud depth & realistic preset tint
        vec3 nightSky = panoTex * uSkyTint * 1.18;
        if (dir.y < 0.0) {
          nightSky = mix(nightSky, vec3(0.015, 0.022, 0.036), smoothstep(0.0, -0.08, dir.y));
          duskSky = mix(duskSky, vec3(0.05, 0.08, 0.13), smoothstep(0.0, -0.08, dir.y));
        }

        vec3 col = mix(duskSky, nightSky, smoothstep(0.05, 0.92, uCyber));
        // Keep sky strictly below HDR bloom threshold so clouds remain razor-detailed and brooding
        col = min(col, vec3(0.88));
        gl_FragColor = vec4(col, 1.0);
      }
    `
  });
}

/* ============================================================================
   2. REAL PBR SKYSCRAPER CURTAIN-WALL MATERIAL (MeshStandardMaterial + onBeforeCompile)
      - Uses 2048x2048 skyscraper_albedo / normal / rough / emissive PBR maps!
      - Reflects the real 32-bit Shanghai Bund Night HDRI via scene.environment!
      - World-metric architectural UV mapping so tall/short towers never stretch!
      - Per-instance UV offset & subtle dark architectural glass tint variation!
   ============================================================================ */
export function createPBRSkyscraperMaterial(pbr, {
  isInstanced = true,
  tintHex = 0xc8d8ea,
  seed = 0.25,
  uvScaleX = 24.0,
  uvScaleY = 56.0
} = {}) {
  const mat = new THREE.MeshStandardMaterial({
    color: tintHex,
    map: pbr.skyscraper.albedo,
    normalMap: pbr.skyscraper.normal,
    normalScale: new THREE.Vector2(0.75, 0.75),
    roughnessMap: pbr.skyscraper.rough,
    roughness: 0.78,
    metalness: 0.76,
    emissive: new THREE.Color(0xfff4e2),
    emissiveMap: pbr.skyscraper.emissive,
    emissiveIntensity: 1.35,
    envMapIntensity: 1.85
  });

  const sharedUniforms = {
    uCyber: { value: 1.0 },
    uTime: { value: 0.0 },
    uHeroSeed: { value: seed },
    uUvScale: { value: new THREE.Vector2(uvScaleX, uvScaleY) }
  };
  mat.userData.customUniforms = sharedUniforms;

  mat.onBeforeCompile = (shader) => {
    shader.uniforms.uCyber = sharedUniforms.uCyber;
    shader.uniforms.uTime = sharedUniforms.uTime;
    shader.uniforms.uHeroSeed = sharedUniforms.uHeroSeed;
    shader.uniforms.uUvScale = sharedUniforms.uUvScale;

    // Inject world-metric UV & roof/crown detection into vertex shader
    shader.vertexShader = shader.vertexShader
      .replace(
        '#include <common>',
        `#include <common>
        ${isInstanced ? 'attribute vec4 aBuildingData;' : ''}
        uniform float uHeroSeed;
        uniform vec2 uUvScale;
        varying vec3 vArchWorldNormal;
        varying vec3 vArchLocalPos;
        varying float vArchSeed;
        varying float vArchAccent;
        varying float vArchHeight;`
      )
      .replace(
        '#include <uv_vertex>',
        `#include <uv_vertex>
        vArchLocalPos = position;
        #ifdef USE_INSTANCING
          vec4 archWp = modelMatrix * instanceMatrix * vec4(position, 1.0);
          mat3 archNMat = mat3(modelMatrix) * mat3(instanceMatrix);
          vArchWorldNormal = normalize(archNMat * normal);
          vArchSeed = floor(aBuildingData.z * 100.0) * 0.01;
          vArchAccent = aBuildingData.w;
          vArchHeight = aBuildingData.y;
        #else
          vec4 archWp = modelMatrix * vec4(position, 1.0);
          vArchWorldNormal = normalize(mat3(modelMatrix) * normal);
          vArchSeed = uHeroSeed;
          vArchAccent = 0.25;
          vArchHeight = 95.0;
        #endif
        float archHoriz = abs(vArchWorldNormal.x) > 0.5 ? archWp.z : archWp.x;
        vec2 metricUv = vec2(archHoriz / uUvScale.x + vArchSeed * 3.7, archWp.y / uUvScale.y + vArchSeed * 1.9);
        #ifdef USE_MAP
          vMapUv = metricUv;
        #endif
        #ifdef USE_NORMALMAP
          vNormalMapUv = metricUv;
        #endif
        #ifdef USE_ROUGHNESSMAP
          vRoughnessMapUv = metricUv;
        #endif
        #ifdef USE_EMISSIVEMAP
          vEmissiveMapUv = metricUv;
        #endif`
      );

    // Mask rooftops cleanly (no windows on roof slabs!) + subtle cyber crown strip on tall instanced towers
    shader.fragmentShader = shader.fragmentShader
      .replace(
        '#include <common>',
        `#include <common>
        uniform float uCyber;
        uniform float uTime;
        varying vec3 vArchWorldNormal;
        varying vec3 vArchLocalPos;
        varying float vArchSeed;
        varying float vArchAccent;
        varying float vArchHeight;`
      )
      .replace(
        '#include <emissivemap_fragment>',
        `#include <emissivemap_fragment>
        float isArchRoof = step(0.65, normalize(vArchWorldNormal).y);
        // Zero windows on rooftops; realistic subtle interior warmth/cool shift with uCyber
        totalEmissiveRadiance *= (1.0 - isArchRoof);
        // Slight per-building brightness variety so skyline reads organic & photorealistic
        totalEmissiveRadiance *= mix(0.62, 1.22, fract(vArchSeed * 13.37));
        #ifdef USE_INSTANCING
        if (isArchRoof < 0.5) {
          float normY = vArchLocalPos.y + 0.5;
          // Restrained razor-thin architectural LED cornice line near top of select tall megatowers
          float crownLine = smoothstep(0.980, 0.988, normY) * smoothstep(0.998, 0.992, normY);
          float hasLed = step(0.52, vArchSeed) * step(44.0, vArchHeight);
          vec3 ledCol = vArchAccent < 0.50
            ? vec3(0.05, 0.78, 0.96)
            : (vArchAccent < 0.80 ? vec3(0.98, 0.68, 0.16) : vec3(0.95, 0.12, 0.32));
          totalEmissiveRadiance += ledCol * crownLine * hasLed * 1.15 * uCyber;
        }
        #endif`
      )
      .replace(
        '#include <map_fragment>',
        `#include <map_fragment>
        float archRoofMask = step(0.65, normalize(vArchWorldNormal).y);
        // Roofs get dark architectural bitumen/steel instead of curtain-wall glass
        diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.045, 0.055, 0.075), archRoofMask);`
      );
  };

  mat.customProgramCacheKey = () => `pbr-skyscraper-${isInstanced ? 'inst' : 'hero'}-${uvScaleX}-${uvScaleY}`;
  return mat;
}

/* ============================================================================
   3. PHOTOREALISTIC ESIL RIVER WATER SHADER
      - Samples real nightcity_sky_pano.jpg in reflected ray!
      - Deep near-black mirror water + fine anisotropic river ripples
      - Stretched golden Ak Orda, cool-cyan bridge & muted skyline reflections
   ============================================================================ */
export function createEsilRiverMaterial(skyPanoTex) {
  return new THREE.ShaderMaterial({
    uniforms: {
      uSkyPano: { value: skyPanoTex },
      uTime: { value: 0 },
      uCyber: { value: 1.0 },
      uFogColor: { value: new THREE.Color(0x060a12) },
      uFogDensity: { value: 0.0016 }
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
      uniform float uCyber;
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

        // Multi-scale anisotropic river current ripples
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

        // Reflect actual photorealistic storm sky panorama onto the Esil River surface!
        float ru = fract(atan(R.z, R.x) / 6.2831853 + 0.5);
        float rv = clamp(0.13 + pow(max(R.y, 0.0), 0.78) * 0.84, 0.04, 0.98);
        vec3 skyRefl = texture2D(uSkyPano, vec2(ru, rv)).rgb;
        vec3 duskRefl = mix(vec3(0.45, 0.34, 0.24), vec3(0.10, 0.18, 0.32), clamp(R.y * 2.4, 0.0, 1.0));
        vec3 envRefl = mix(duskRefl, skyRefl * 1.35, uCyber);

        // Deep cold nocturnal river water
        vec3 waterBase = mix(vec3(0.016, 0.042, 0.075), vec3(0.008, 0.013, 0.022), uCyber);
        vec3 col = mix(waterBase, envRefl, 0.18 + 0.78 * fresnel);

        // Fine horizontal ripple specular shimmer catching bridges & Ak Orda lights
        float sparkle = pow(0.5 + 0.5 * sin(wp.y * 6.4 + rippleZ * 20.0 - uTime * 2.3), 6.0);
        float micro = pow(0.5 + 0.5 * sin(wp.y * 12.8 - rippleZ * 28.0 + uTime * 3.5), 9.0);
        float specMod = 0.25 + 0.75 * sparkle + 0.6 * micro;

        float bridgeMain = exp(-abs(wp.y) * 0.07);
        float bridgeNorth = exp(-abs(wp.y + 88.0) * 0.085);
        float bridgeSouth = exp(-abs(wp.y - 86.0) * 0.085);
        float akOrdaGlow = exp(-abs(wp.y) * 0.045) * smoothstep(162.0, 134.0, wp.x);
        float cityCol1 = exp(-pow(sin((wp.y + 18.0) * 0.07), 2.0) * 20.0);
        float cityCol2 = exp(-pow(sin((wp.y - 24.0) * 0.06), 2.0) * 22.0);

        vec3 duskLights = vec3(1.0, 0.74, 0.38) * (akOrdaGlow * 0.65 + bridgeMain * 0.45 + cityCol1 * 0.22);
        vec3 cyberLights =
          vec3(0.05, 0.85, 0.98) * ((bridgeMain + bridgeNorth + bridgeSouth) * 0.72 + cityCol1 * 0.45) +
          vec3(1.0, 0.68, 0.22) * (akOrdaGlow * 0.85) +
          vec3(0.95, 0.16, 0.34) * (cityCol2 * 0.42);

        col += mix(duskLights, cyberLights, uCyber) * specMod * (0.28 + 0.72 * fresnel);

        // Subtle concrete embankment waterline shadow/glow
        float bankEdge = smoothstep(0.04, 0.0, vUv.x) + smoothstep(0.96, 1.0, vUv.x);
        col += mix(vec3(0.35, 0.30, 0.22), vec3(0.08, 0.55, 0.72), uCyber) * bankEdge * 0.28;

        float dist = length(cameraPosition - vWorldPos);
        float fogFactor = 1.0 - exp(-pow(dist * uFogDensity, 2.0));
        col = mix(col, uFogColor, clamp(fogFactor, 0.0, 1.0));

        gl_FragColor = vec4(col, 1.0);
      }
    `
  });
}

/* ============================================================================
   4. PHOTOREALISTIC WET RAIN-SLICKED ASPHALT BOULEVARD SHADER
      - Samples real Poly Haven CC0 photoscan asphalt_albedo / normal / rough!
      - Realistic puddle roughness contrast reflecting real nightcity_sky_pano.jpg + amber/cyan street lights!
   ============================================================================ */
export function createWetRoadMaterial(pbr) {
  return new THREE.ShaderMaterial({
    uniforms: {
      uAlbedo: { value: pbr.asphalt.albedo },
      uNormal: { value: pbr.asphalt.normal },
      uRough: { value: pbr.asphalt.rough },
      uSkyPano: { value: pbr.skyPano },
      uTime: { value: 0 },
      uCyber: { value: 1.0 },
      uFogColor: { value: new THREE.Color(0x060a12) },
      uFogDensity: { value: 0.0016 }
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
      uniform float uCyber;
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

      void main() {
        vec2 wp = vWorldPos.xz;
        vec2 texUv = wp * 0.085;

        // Real Poly Haven photoscanned asphalt PBR maps!
        vec3 texAlbedo = texture2D(uAlbedo, texUv).rgb;
        vec3 texNorm = texture2D(uNormal, texUv).rgb * 2.0 - 1.0;
        float texRough = texture2D(uRough, texUv).r;

        // Realistic rain puddle distribution modulated by asphalt surface roughness cavities
        float puddleNoise = fbm(wp * 0.085 + vec2(1.7, -2.9));
        float puddleMask = smoothstep(0.49, 0.58, puddleNoise - (texRough - 0.5) * 0.25) * uCyber;

        // Wet asphalt darkens physically (wet porous rock drops albedo ~55%) and lowers roughness inside puddles!
        float dampFactor = mix(0.20, 0.65, uCyber);
        vec3 asphaltCol = texAlbedo * mix(0.42, 0.16, dampFactor) * mix(1.0, 0.62, puddleMask);

        // Nurzhol Boulevard Roadway Corridor (Z = +-9.5 to +-20.5)
        float absZ = abs(wp.y);
        float inBoulevard = step(-126.0, wp.x) * step(wp.x, 128.0);
        float onRoad = step(9.2, absZ) * step(absZ, 21.0) * inBoulevard;

        asphaltCol = mix(asphaltCol, asphaltCol * 0.80, onRoad);

        // Crisp weathered painted road lane markings & zebra crosswalks
        float dash = step(0.46, fract(wp.x * 0.14));
        float lane1 = smoothstep(0.20, 0.06, abs(absZ - 13.2)) * dash * onRoad;
        float lane2 = smoothstep(0.20, 0.06, abs(absZ - 17.0)) * dash * onRoad;
        float paintWear = mix(0.68, 1.0, texRough);
        vec3 paintCol = vec3(0.76, 0.74, 0.68) * paintWear;
        asphaltCol = mix(asphaltCol, paintCol, clamp((lane1 + lane2) * 0.72, 0.0, 0.8));

        // Double amber median stripe & subtle outer shoulder stripe
        float innerCurb = smoothstep(0.22, 0.07, abs(absZ - 9.4)) * inBoulevard;
        float outerCurb = smoothstep(0.20, 0.07, abs(absZ - 20.6)) * inBoulevard;
        asphaltCol += vec3(0.85, 0.62, 0.18) * innerCurb * (0.28 + 0.35 * uCyber);
        asphaltCol += vec3(0.10, 0.68, 0.85) * outerCurb * 0.30 * uCyber;

        // Crisp crosswalk zebra stripes flanking Baiterek Plaza (X = +-27)
        float nearCrosswalk = step(abs(abs(wp.x) - 27.0), 2.3) * onRoad;
        float zebra = step(0.46, fract(wp.y * 0.85));
        asphaltCol = mix(asphaltCol, paintCol, nearCrosswalk * zebra * 0.65);

        // Raindrop ripple micro-perturbation inside puddles
        vec2 dropCell = fract(wp * 0.7) - 0.5;
        float dropRing = sin(length(dropCell) * 36.0 - uTime * 9.0) * exp(-length(dropCell) * 4.5);

        // Perturbed world normal: coarse asphalt grain on damp road, glass-flat + micro ripples inside puddles!
        vec3 N = normalize(vec3(
          mix(texNorm.x * 0.55, dropRing * 0.08, puddleMask),
          1.0,
          mix(texNorm.y * 0.55, dropRing * 0.08, puddleMask)
        ));
        vec3 V = normalize(cameraPosition - vWorldPos);
        vec3 R = reflect(-V, N);
        float fresnel = pow(1.0 - max(dot(N, V), 0.0), 3.2);

        // Physically grounded environment reflection from real nightcity_sky_pano.jpg!
        float ru = fract(atan(R.z, R.x) / 6.2831853 + 0.5);
        float rv = clamp(0.13 + pow(max(R.y, 0.0), 0.78) * 0.84, 0.04, 0.98);
        vec3 skyEnv = texture2D(uSkyPano, vec2(ru, rv)).rgb * 1.4;
        vec3 duskEnv = vec3(0.32, 0.28, 0.24);
        vec3 envRefl = mix(duskEnv, skyEnv, uCyber);

        // Crisp localized specular neon & streetlight glints reflected strictly inside glossy puddles
        float streetLampLine = exp(-abs(absZ - 9.8) * 0.32) * inBoulevard;
        float baiterekGold = exp(-length(wp) * 0.024) * 0.65;
        float wetSpec = pow(max(0.0, sin(wp.y * 0.45 + wp.x * 0.04 + dropRing * 3.0)), 14.0);
        float wetSpec2 = pow(max(0.0, cos(wp.y * 0.38 - wp.x * 0.05 - dropRing * 3.0)), 16.0);

        vec3 cityBounce =
          vec3(0.08, 0.80, 0.96) * wetSpec * 0.45 +
          vec3(0.95, 0.14, 0.32) * wetSpec2 * 0.36 +
          vec3(1.0, 0.72, 0.24) * (baiterekGold + streetLampLine * 0.38);

        // Compose diffuse + wet Fresnel sky reflection + crisp puddle neon specular!
        float gloss = mix(0.12 * (1.0 - texRough * 0.65), 0.92, puddleMask);
        vec3 col = asphaltCol * mix(0.85, 0.58, uCyber)
                 + envRefl * gloss * (0.14 + 0.72 * fresnel)
                 + cityBounce * (0.04 + puddleMask * 0.62) * (0.28 + 0.72 * fresnel) * uCyber;

        float dist = length(cameraPosition - vWorldPos);
        float fogFactor = 1.0 - exp(-pow(dist * uFogDensity, 2.0));
        col = mix(col, uFogColor, clamp(fogFactor, 0.0, 1.0));

        gl_FragColor = vec4(col, 1.0);
      }
    `
  });
}

/* ============================================================================
   5. ANIMATED HOLOGRAPHIC MEGA-BILLBOARD SHADER (Cinematic Contrast & Scanlines)
   ============================================================================ */
export function createHoloBillboardMaterial(texture, seed = 0) {
  return new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    side: THREE.FrontSide,
    blending: THREE.NormalBlending,
    uniforms: {
      uMap: { value: texture },
      uTime: { value: 0 },
      uCyber: { value: 1.0 },
      uSeed: { value: seed }
    },
    vertexShader: /* glsl */ `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: /* glsl */ `
      uniform sampler2D uMap;
      uniform float uTime;
      uniform float uCyber;
      uniform float uSeed;
      varying vec2 vUv;

      void main() {
        float reveal = smoothstep(0.18, 0.92, uCyber);
        if (reveal < 0.01) discard;

        vec2 uv = vUv;
        float glitchTrigger = step(0.965, sin(uTime * 1.8 + uSeed * 17.3) * 0.5 + 0.5);
        float band = step(0.5, sin(uv.y * 28.0 + uTime * 12.0));
        uv.x += glitchTrigger * band * 0.018 * sin(uTime * 43.0 + uSeed);

        float ca = 0.0022 + glitchTrigger * 0.005;
        float r = texture2D(uMap, uv + vec2(ca, 0.0)).r;
        float g = texture2D(uMap, uv).g;
        float b = texture2D(uMap, uv - vec2(ca, 0.0)).b;
        vec3 col = vec3(r, g, b);

        float scan = 0.88 + 0.12 * sin(uv.y * 240.0 - uTime * 7.0);
        float sweep = exp(-abs(fract(uTime * 0.22 + uSeed) - uv.y) * 32.0) * 0.22;
        float lum = dot(col, vec3(0.299, 0.587, 0.114));

        vec3 finalCol = col * scan * mix(0.58, 1.12, smoothstep(0.18, 0.72, lum)) + col * sweep;

        float edge = smoothstep(0.0, 0.02, uv.x) * smoothstep(1.0, 0.98, uv.x)
                   * smoothstep(0.0, 0.02, uv.y) * smoothstep(1.0, 0.98, uv.y);

        float wipeMask = smoothstep(uv.y - 0.10, uv.y + 0.04, reveal * 1.12);
        float flicker = 0.95 + 0.05 * sin(uTime * 16.0 + uSeed * 9.0);
        float alpha = reveal * wipeMask * edge * flicker * mix(0.72, 0.94, smoothstep(0.12, 0.55, lum));

        gl_FragColor = vec4(finalCol, alpha);
      }
    `
  });
}

/* ============================================================================
   6. VOLUMETRIC SEARCHLIGHT BEAM SHADER (Restrained Atmospheric Cones)
   ============================================================================ */
export function createSearchlightMaterial(colorHex) {
  return new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
    blending: THREE.AdditiveBlending,
    uniforms: {
      uColor: { value: new THREE.Color(colorHex) },
      uCyber: { value: 1.0 },
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
      uniform float uCyber;
      uniform float uBoost;
      uniform float uTime;
      varying vec2 vUv;
      varying vec3 vNormalView;
      varying vec3 vViewDir;

      void main() {
        float edgeSoft = pow(abs(dot(normalize(vNormalView), normalize(vViewDir))), 2.4);
        float verticalFade = smoothstep(0.0, 0.10, vUv.y) * pow(1.0 - vUv.y, 2.0);
        float shimmer = 0.90 + 0.10 * sin(uTime * 2.5 + vUv.y * 8.0);
        float alpha = edgeSoft * verticalFade * shimmer * 0.095 * smoothstep(0.15, 0.88, uCyber) * uBoost;
        if (alpha < 0.002) discard;
        gl_FragColor = vec4(uColor * 0.9, alpha);
      }
    `
  });
}

/* ============================================================================
   7. GPU-DRIVEN RAIN STREAKS SHADER (Realistic Cold Steel-Cyan / Amber Rain)
   ============================================================================ */
export function createNeonRainMaterial() {
  return new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    uniforms: {
      uTime: { value: 0 },
      uRainIntensity: { value: 1.0 },
      uCyber: { value: 1.0 },
      uColorA: { value: new THREE.Color(0x7dd3e8) },
      uColorB: { value: new THREE.Color(0xdba264) }
    },
    vertexShader: /* glsl */ `
      attribute float aSpeed;
      attribute float aPhase;
      attribute float aTint;
      attribute float aOffsetY;
      uniform float uTime;
      varying float vTint;
      varying float vAlpha;

      void main() {
        vec3 pos = position;
        float ceiling = 175.0;
        float baseY = mod(pos.y - uTime * aSpeed + aPhase * ceiling, ceiling);
        float y = baseY + aOffsetY;
        pos.x += (ceiling - baseY) * 0.045 - aOffsetY * 0.06;
        pos.y = y;

        vTint = aTint;
        vAlpha = smoothstep(0.0, 14.0, baseY) * smoothstep(ceiling, ceiling - 25.0, baseY);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
      }
    `,
    fragmentShader: /* glsl */ `
      uniform float uRainIntensity;
      uniform float uCyber;
      uniform vec3 uColorA;
      uniform vec3 uColorB;
      varying float vTint;
      varying float vAlpha;

      void main() {
        float strength = uRainIntensity * smoothstep(0.15, 0.75, uCyber);
        if (strength < 0.01) discard;
        vec3 col = mix(uColorA, uColorB, vTint * 0.55);
        gl_FragColor = vec4(col, vAlpha * 0.22 * min(strength, 1.25));
      }
    `
  });
}

/* ============================================================================
   8. CINEMATIC POST-PROCESSING FILM GRADE SHADERPASS
      - Roger Deakins / Blade Runner 2049 Teal-Obsidian Shadows + Warm Amber Highlights
      - Soft Anamorphic Vignette (~20%), Subtle 35mm Film Grain, Edge Chromatic Aberration
   ============================================================================ */
export const CinemaGradeShader = {
  uniforms: {
    tDiffuse: { value: null },
    uTime: { value: 0 },
    uCyber: { value: 1.0 }
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
    uniform float uCyber;
    varying vec2 vUv;

    float randGrain(vec2 co) {
      return fract(sin(dot(co, vec2(12.9898, 78.233))) * 43758.5453);
    }

    void main() {
      vec2 centered = vUv - 0.5;
      float r2 = dot(centered, centered);

      // Subtle anamorphic edge chromatic aberration (zero blur in center!)
      vec2 caOffset = centered * (0.0012 * (0.4 + 0.6 * uCyber)) * smoothstep(0.04, 0.45, r2);
      float r = texture2D(tDiffuse, vUv + caOffset).r;
      float g = texture2D(tDiffuse, vUv).g;
      float b = texture2D(tDiffuse, vUv - caOffset).b;
      vec3 col = vec3(r, g, b);

      // Subtle cinematic desaturation to eliminate toy-neon plastic feel
      float lum = dot(col, vec3(0.2126, 0.7152, 0.0722));
      col = mix(vec3(lum), col, mix(0.96, 0.90, uCyber));

      // Split-tone film grading: deep teal-obsidian shadows + rich warm amber/gold highlights
      vec3 shadowTint = mix(vec3(0.96, 0.98, 1.03), vec3(0.88, 0.98, 1.06), uCyber);
      vec3 highlightTint = mix(vec3(1.04, 1.00, 0.94), vec3(1.06, 0.99, 0.91), uCyber);
      float hlMask = smoothstep(0.25, 0.85, lum);
      col *= mix(shadowTint, highlightTint, hlMask);

      // Gentle cinematic contrast lift (keeps blacks deep & rich without crushing detail)
      col = pow(max(col, vec3(0.0)), vec3(1.03));

      // Soft anamorphic vignette (~20% edge darkening)
      float vig = 1.0 - smoothstep(0.18, 0.78, r2) * 0.24;
      col *= vig;

      // Subtle animated 35mm cinema film grain
      float grain = (randGrain(vUv * 800.0 + fract(uTime * 13.7)) - 0.5) * 0.022;
      col += grain;

      gl_FragColor = vec4(max(col, vec3(0.0)), 1.0);
    }
  `
};
