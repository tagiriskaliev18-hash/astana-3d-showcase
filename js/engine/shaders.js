/**
 * Astana -> Night City 2077
 * Custom GLSL Shaders (Tuned for High-Contrast Obsidian + Saturated Neon Bloom)
 */
import * as THREE from 'three';

/* ============================================================================
   1. SKY DOME SHADER (Astana Golden Twilight <-> Moody Dark Indigo Night City)
   ============================================================================ */
export function createSkyMaterial() {
  return new THREE.ShaderMaterial({
    side: THREE.BackSide,
    depthWrite: false,
    uniforms: {
      uTime: { value: 0 },
      uCyber: { value: 1.0 },
      uTopColor: { value: new THREE.Color(0x03020a) },
      uMidColor: { value: new THREE.Color(0x0d0622) },
      uHorizonColor: { value: new THREE.Color(0x8a0f45) },
      uAccentColor: { value: new THREE.Color(0x007c99) }
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
      uniform float uTime;
      uniform float uCyber;
      uniform vec3 uTopColor;
      uniform vec3 uMidColor;
      uniform vec3 uHorizonColor;
      uniform vec3 uAccentColor;
      varying vec3 vWorldPos;

      float hash21(vec2 p) {
        p = fract(p * vec2(234.34, 435.345));
        p += dot(p, p + 34.23);
        return fract(p.x * p.y);
      }

      float noise(vec2 p) {
        vec2 i = floor(p);
        vec2 f = fract(p);
        vec2 u = f * f * (3.0 - 2.0 * f);
        return mix(
          mix(hash21(i), hash21(i + vec2(1.0, 0.0)), u.x),
          mix(hash21(i + vec2(0.0, 1.0)), hash21(i + vec2(1.0, 1.0)), u.x),
          u.y
        );
      }

      float fbm(vec2 p) {
        float v = 0.0;
        float a = 0.5;
        for (int i = 0; i < 4; i++) {
          v += a * noise(p);
          p *= 2.05;
          a *= 0.5;
        }
        return v;
      }

      void main() {
        vec3 dir = normalize(vWorldPos);
        float up = clamp(dir.y, 0.0, 1.0);

        // Deep dramatic vertical gradient (stays below bloom threshold so sky never washes out!)
        vec3 col = mix(uHorizonColor, uMidColor, smoothstep(0.0, 0.22, up));
        col = mix(col, uTopColor, smoothstep(0.16, 0.68, up));

        // Dual directional neon smog city bounce along horizon (magenta west / cyan east)
        float azim = atan(dir.z, dir.x);
        float horizonBand = exp(-abs(dir.y - 0.015) * 14.0);
        float accentMask = 0.5 + 0.5 * sin(azim * 2.0 - 0.7);
        vec3 horizonBounce = mix(uHorizonColor, uAccentColor, accentMask * 0.72);
        col += horizonBounce * horizonBand * (0.28 + 0.32 * uCyber);

        // Animated low cloud / smog strata illuminated from beneath by neon city
        if (dir.y > 0.01) {
          vec2 cloudUV = dir.xz / (dir.y + 0.24) * 1.4;
          float c1 = fbm(cloudUV + vec2(uTime * 0.014, -uTime * 0.008));
          float c2 = fbm(cloudUV * 2.1 - vec2(uTime * 0.02, uTime * 0.011));
          float clouds = smoothstep(0.40, 0.84, c1 * 0.65 + c2 * 0.35);
          float cloudFade = smoothstep(0.02, 0.14, dir.y) * smoothstep(0.72, 0.16, dir.y);
          vec3 cloudTint = mix(uHorizonColor * 0.62, uAccentColor * 0.55, c2);
          col = mix(col, col * 0.55 + cloudTint * (0.28 + 0.35 * uCyber), clouds * cloudFade * 0.72);
        }

        // Stylized Setting Dusk Sun (0%) <-> Retrowave Sliced Cyber Moon (100%)
        vec3 sunDir = normalize(vec3(0.58, 0.21, -0.78));
        float sunDot = dot(dir, sunDir);
        float disc = smoothstep(0.9972, 0.9985, sunDot);
        float halo = pow(max(sunDot, 0.0), 34.0) * 0.35 + pow(max(sunDot, 0.0), 8.0) * 0.08;
        float slice = mix(1.0, step(0.30, fract(dir.y * 92.0)), uCyber * smoothstep(0.24, 0.18, dir.y));
        vec3 orbCol = mix(vec3(1.0, 0.72, 0.38), vec3(1.0, 0.12, 0.45), uCyber);
        col += orbCol * halo;
        col = mix(col, orbCol * 1.15, disc * slice);

        // Distant megastructure orbital arc in upper sky (cyber mode)
        float ringDist = abs(dir.y - (0.38 + 0.16 * sin(azim + 0.75)));
        float ring = smoothstep(0.004, 0.0008, ringDist) * smoothstep(0.10, 0.32, dir.y);
        col += uAccentColor * ring * 0.38 * uCyber;

        // Crisp subtle stars near zenith
        if (dir.y > 0.20) {
          vec2 starGrid = floor((dir.xz / (dir.y + 0.5)) * 170.0);
          float starSeed = hash21(starGrid);
          if (starSeed > 0.993) {
            float twinkle = 0.6 + 0.4 * sin(uTime * 2.4 + starSeed * 62.0);
            col += vec3(0.75, 0.85, 1.0) * twinkle * smoothstep(0.20, 0.65, dir.y) * 0.55;
          }
        }

        if (dir.y < 0.0) {
          col = mix(col, uTopColor * 0.45, smoothstep(0.0, -0.1, dir.y));
        }

        // Cap non-disc sky brightness below bloom threshold so the sky stays crisp & deep
        col = min(col, vec3(0.86));
        gl_FragColor = vec4(col, 1.0);
      }
    `
  });
}

/* ============================================================================
   2. PROCEDURAL SKYSCRAPER WINDOW MATRIX SHADER (Anti-Aliased Architectural Glass)
   ============================================================================ */
export function createBuildingWindowMaterial({
  isInstanced = true,
  baseTint = 0x101828,
  seed = 0.37,
  accentIndex = 0.15
} = {}) {
  return new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uCyber: { value: 1.0 },
      uFogColor: { value: new THREE.Color(0x0b0618) },
      uFogDensity: { value: 0.00175 },
      uBaseTint: { value: new THREE.Color(baseTint) },
      uSunDir: { value: new THREE.Vector3(0.55, 0.62, 0.45).normalize() },
      uHeroData: { value: new THREE.Vector4(24.0, 90.0, seed, accentIndex) }
    },
    vertexShader: /* glsl */ `
      ${isInstanced ? 'attribute vec4 aBuildingData;' : ''}
      uniform vec4 uHeroData;
      varying vec3 vWorldPos;
      varying vec3 vWorldNormal;
      varying vec3 vLocalPos;
      varying vec2 vUv;
      varying vec4 vData;

      void main() {
        vUv = uv;
        vLocalPos = position;
        #ifdef USE_INSTANCING
          vec4 worldPos = modelMatrix * instanceMatrix * vec4(position, 1.0);
          mat3 normalMat = mat3(modelMatrix) * mat3(instanceMatrix);
          vWorldNormal = normalize(normalMat * normal);
          vData = vec4(aBuildingData.xy, floor(aBuildingData.z * 100.0), aBuildingData.w);
        #else
          vec4 worldPos = modelMatrix * vec4(position, 1.0);
          vWorldNormal = normalize(mat3(modelMatrix) * normal);
          vData = vec4(uHeroData.xy, floor(uHeroData.z * 100.0), uHeroData.w);
        #endif
        vWorldPos = worldPos.xyz;
        gl_Position = projectionMatrix * viewMatrix * worldPos;
      }
    `,
    fragmentShader: /* glsl */ `
      uniform float uTime;
      uniform float uCyber;
      uniform vec3 uFogColor;
      uniform float uFogDensity;
      uniform vec3 uBaseTint;
      uniform vec3 uSunDir;

      varying vec3 vWorldPos;
      varying vec3 vWorldNormal;
      varying vec3 vLocalPos;
      varying vec2 vUv;
      varying vec4 vData; // x: width, y: height, z: random seed, w: accent palette index

      float hash21(vec2 p) {
        p = fract(p * vec2(127.1, 311.7));
        p += dot(p, p + 34.5);
        return fract(p.x * p.y);
      }

      void main() {
        vec3 N = normalize(vWorldNormal);
        vec3 V = normalize(cameraPosition - vWorldPos);
        float dist = length(cameraPosition - vWorldPos);
        float isRoof = step(0.65, N.y);

        // Quantize integer building seed cleanly so perspective interpolation never causes window static!
        float seedInt = floor(vData.z + 0.5);
        float seedNorm = seedInt * 0.01;

        // Real Astana Dusk: sleek reflective deep steel-blue / warm architectural stone cladding
        // Night City 2077: dark rain-wet obsidian monoliths so glowing neon windows POP!
        vec3 realFacade = mix(uBaseTint * 1.45 + vec3(0.06, 0.09, 0.14), vec3(0.18, 0.22, 0.30), seedNorm * 0.45);
        vec3 cyberFacade = uBaseTint * 0.42 + vec3(0.015, 0.018, 0.038);
        vec3 facadeBase = mix(realFacade, cyberFacade, uCyber);

        float ndl = max(dot(N, uSunDir), 0.0);
        float fresnel = pow(1.0 - max(dot(N, V), 0.0), 3.2);

        // Warm golden sunset reflection on Astana Dusk glass -> cyan/magenta reflection in Night City
        vec3 duskSkyRefl = mix(vec3(0.28, 0.42, 0.68), vec3(0.95, 0.62, 0.32), pow(max(dot(N, vec3(0.6, 0.2, -0.7)), 0.0), 2.0));
        vec3 cyberSkyRefl = vec3(0.04, 0.26, 0.44);
        vec3 skyReflect = mix(duskSkyRefl, cyberSkyRefl, uCyber);
        vec3 pinkBounce = vec3(0.32, 0.03, 0.22) * uCyber * max(dot(N, normalize(vec3(-0.7, 0.15, 0.6))), 0.0);

        vec3 col = facadeBase * (0.34 + 0.52 * ndl) + skyReflect * fresnel * 0.38 + pinkBounce * 0.32;

        if (isRoof < 0.5) {
          float seed = seedNorm;
          float horizCoord = abs(N.x) > 0.5 ? vWorldPos.z : vWorldPos.x;

          // Clean architectural curtain-wall floor & bay spacing
          float wx = horizCoord * 0.42 + seedInt * 1.37;
          float wy = vWorldPos.y * 0.32;

          vec2 cell = floor(vec2(wx, wy));
          vec2 f = fract(vec2(wx, wy));

          // Anti-aliased smooth mullions that stay silky at distance (zero moire!)
          float aa = clamp(dist * 0.0007, 0.02, 0.22);
          float paneX = smoothstep(0.12 - aa, 0.18 + aa, f.x) * (1.0 - smoothstep(0.82 - aa, 0.88 + aa, f.x));
          float paneY = smoothstep(0.20 - aa, 0.28 + aa, f.y) * (1.0 - smoothstep(0.76 - aa, 0.84 + aa, f.y));
          float pane = paneX * paneY;

          // Horizontal office bands (multi-room clusters look like real skyscrapers!)
          float clusterX = floor(cell.x * 0.35);
          float floorRand = hash21(vec2(cell.y, seedInt * 3.17));
          float clusterRand = hash21(vec2(clusterX, cell.y) + vec2(seedInt * 5.71, seedInt * 2.13));
          float roomRand = hash21(cell + vec2(seedInt * 7.31, seedInt * 11.43));

          float density = mix(0.28, 0.54, uCyber);
          float lit = step(1.0 - density, mix(roomRand, clusterRand, 0.55)) * step(0.26, floorRand);

          // Leave dark ground plinth + mechanical sky-lobby floors
          float groundPlinth = smoothstep(2.0, 4.2, vWorldPos.y);
          float mechBand = step(0.11, fract(vWorldPos.y / 30.0));
          lit *= pane * groundPlinth * mechBand;

          // Window color palette:
          // Real Astana Dusk: warm golden/champagne offices + soft cool white
          // Night City 2077: crisp saturated cyan, warm amber, hot magenta & cool white
          vec3 warmOffice = mix(vec3(0.95, 0.72, 0.38), vec3(0.72, 0.84, 0.96), step(0.72, roomRand));
          vec3 cyberPalette = vec3(0.0, 0.88, 1.0);
          if (roomRand > 0.80) cyberPalette = vec3(1.0, 0.06, 0.44);
          else if (roomRand > 0.52) cyberPalette = vec3(1.0, 0.76, 0.12);
          else if (roomRand > 0.34) cyberPalette = vec3(0.88, 0.94, 1.0);

          vec3 winCol = mix(warmOffice, cyberPalette, uCyber * (0.42 + 0.58 * step(0.32, floorRand)));

          float pulse = 0.90 + 0.10 * sin(uTime * 1.4 + seed * 50.0 + cell.y * 0.6);
          // Controlled brightness (~0.88 max on general windows so only neon crowns & billboards bloom!)
          float winBoost = mix(0.62, 0.94, uCyber);
          col += winCol * lit * pulse * winBoost;

          #ifdef USE_INSTANCING
          // Razor-sharp glowing neon crown stripe near top of instanced Night City skyscrapers
          float normY = vLocalPos.y + 0.5;
          float crownBand = smoothstep(0.962, 0.976, normY) * smoothstep(0.996, 0.986, normY);
          vec3 crownColor = vData.w < 0.36
            ? vec3(0.0, 0.95, 1.0)
            : (vData.w < 0.70 ? vec3(1.0, 0.04, 0.42) : vec3(0.99, 0.92, 0.05));
          col += crownColor * crownBand * (0.06 + 1.38 * uCyber);

          // Thin vertical corner neon accent on select tall instanced megablocks
          float cornerTrim = smoothstep(0.478, 0.496, abs(vLocalPos.x)) * smoothstep(0.478, 0.496, abs(vLocalPos.z));
          col += crownColor * cornerTrim * step(0.55, seed) * 1.15 * uCyber;
          #endif
        } else {
          // Dark metallic roof slab with subtle crisp perimeter trim on instanced blocks
          #ifdef USE_INSTANCING
          float roofEdge = max(smoothstep(0.465, 0.496, abs(vLocalPos.x)), smoothstep(0.465, 0.496, abs(vLocalPos.z)));
          vec3 roofNeon = vData.w < 0.5 ? vec3(0.0, 0.9, 1.0) : vec3(1.0, 0.05, 0.42);
          col = col * 0.5 + roofNeon * roofEdge * 0.62 * uCyber;
          #else
          col = col * 0.55;
          #endif
        }

        // Atmospheric distance fog matching scene
        float fogFactor = 1.0 - exp(-pow(dist * uFogDensity, 2.0));
        col = mix(col, uFogColor, clamp(fogFactor, 0.0, 1.0));

        gl_FragColor = vec4(col, 1.0);
      }
    `
  });
}

/* ============================================================================
   3. ESIL RIVER WATER SHADER (Deep Obsidian Water + Vibrant Neon Shimmer)
   ============================================================================ */
export function createEsilRiverMaterial() {
  return new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uCyber: { value: 1.0 },
      uFogColor: { value: new THREE.Color(0x0b0618) },
      uFogDensity: { value: 0.00175 }
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
      uniform float uTime;
      uniform float uCyber;
      uniform vec3 uFogColor;
      uniform float uFogDensity;
      varying vec3 vWorldPos;
      varying vec2 vUv;

      float hash(vec2 p) {
        return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
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
        vec2 p = vWorldPos.xz * 0.20;
        float w1 = noise(p * vec2(1.8, 0.75) + vec2(0.0, uTime * 0.45));
        float w2 = noise(p * vec2(3.6, 1.45) - vec2(uTime * 0.22, uTime * 0.62));
        float wave = (w1 * 0.6 + w2 * 0.4) - 0.5;

        vec3 N = normalize(vec3(wave * 0.38, 1.0, (w2 - 0.5) * 0.48));
        vec3 V = normalize(cameraPosition - vWorldPos);
        float fresnel = pow(1.0 - max(dot(N, V), 0.0), 2.8);

        vec3 deepWater = mix(vec3(0.025, 0.08, 0.16), vec3(0.01, 0.015, 0.045), uCyber);
        vec3 skyRefl = mix(vec3(0.24, 0.38, 0.58), vec3(0.08, 0.05, 0.18), uCyber);
        vec3 col = mix(deepWater, skyRefl, fresnel * 0.78);

        // Crisp neon skyline reflection ribbons rippling across the Esil River
        float stripCoord = vWorldPos.z * 0.10 + wave * 4.2;
        float shimmer1 = pow(0.5 + 0.5 * sin(stripCoord * 2.4 + 0.5), 7.0);
        float shimmer2 = pow(0.5 + 0.5 * sin(stripCoord * 3.9 - 1.4), 8.0);
        float shimmer3 = pow(0.5 + 0.5 * sin(stripCoord * 1.6 + 2.2), 6.0);

        float centerGlow = exp(-abs(vWorldPos.z) * 0.012);
        vec3 duskRefl = vec3(0.95, 0.68, 0.34) * (shimmer1 * 0.65 + shimmer3 * 0.45);
        vec3 cyberRefl =
          vec3(0.0, 0.92, 1.0) * shimmer1 * 0.95 +
          vec3(1.0, 0.04, 0.45) * shimmer2 * 0.92 +
          vec3(0.99, 0.85, 0.08) * shimmer3 * 0.72;

        col += mix(duskRefl, cyberRefl, uCyber) * (0.45 + 0.75 * centerGlow) * (0.35 + 0.65 * fresnel);

        float bankEdge = smoothstep(0.07, 0.0, vUv.x) + smoothstep(0.93, 1.0, vUv.x);
        col += mix(vec3(0.85, 0.68, 0.42), vec3(0.0, 0.85, 1.0), uCyber) * bankEdge * 0.42;

        float dist = length(cameraPosition - vWorldPos);
        float fogFactor = 1.0 - exp(-pow(dist * uFogDensity, 2.0));
        col = mix(col, uFogColor, clamp(fogFactor, 0.0, 1.0));

        gl_FragColor = vec4(col, 1.0);
      }
    `
  });
}

/* ============================================================================
   4. WET ASPHALT & RAIN PUDDLE REFLECTION SHADER (Nurzhol Boulevard & Roads)
   ============================================================================ */
export function createWetRoadMaterial() {
  return new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uCyber: { value: 1.0 },
      uFogColor: { value: new THREE.Color(0x0b0618) },
      uFogDensity: { value: 0.00175 }
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
        float puddleNoise = noise(wp * 0.085) * 0.65 + noise(wp * 0.26) * 0.35;
        float wetness = smoothstep(0.36, 0.72, puddleNoise) * uCyber;

        float ripple = sin(length(fract(wp * 0.35) - 0.5) * 32.0 - uTime * 8.0) * 0.5 + 0.5;
        ripple *= wetness * 0.10;

        // Deep crisp wet asphalt
        vec3 dryAsphalt = vec3(0.075, 0.082, 0.105);
        vec3 wetAsphalt = vec3(0.018, 0.022, 0.040);
        vec3 col = mix(dryAsphalt, wetAsphalt, 0.25 + 0.75 * wetness);
        col += noise(wp * 1.8) * 0.018;

        // Crisp boulevard lane markings along Nurzhol axis (Z = +-14 lanes)
        float distLane1 = abs(abs(wp.y) - 14.0);
        float dash = step(0.42, fract(wp.x * 0.12));
        float laneLine = smoothstep(0.30, 0.10, distLane1) * dash * step(-112.0, wp.x) * step(wp.x, 128.0);
        vec3 markCol = mix(vec3(0.75, 0.72, 0.62), vec3(0.0, 0.90, 1.0), uCyber * 0.8);
        col += markCol * laneLine * 0.55;

        // Illuminated curbside light strip flanking Nurzhol promenade
        float curb = smoothstep(0.38, 0.10, abs(abs(wp.y) - 9.2)) * step(-102.0, wp.x) * step(wp.x, 96.0);
        vec3 curbCol = mix(vec3(0.85, 0.66, 0.35), vec3(0.99, 0.90, 0.06), uCyber);
        col += curbCol * curb * (0.20 + 0.85 * uCyber);

        // Specular neon puddle reflections
        vec3 V = normalize(cameraPosition - vWorldPos);
        float fresnel = pow(1.0 - max(V.y, 0.0), 2.2);

        float neonBandA = pow(0.5 + 0.5 * sin(wp.x * 0.065 + puddleNoise * 4.5), 4.0);
        float neonBandB = pow(0.5 + 0.5 * cos(wp.y * 0.075 - puddleNoise * 5.0), 4.0);
        vec3 puddleGlow =
          vec3(0.0, 0.88, 1.0) * neonBandA * 0.72 +
          vec3(1.0, 0.04, 0.45) * neonBandB * 0.68 +
          vec3(1.0, 0.72, 0.12) * exp(-length(wp) * 0.020) * 0.70;

        col += puddleGlow * (0.16 + wetness * 0.78 + ripple) * (0.35 + 0.65 * fresnel) * (0.12 + 0.88 * uCyber);

        float dist = length(cameraPosition - vWorldPos);
        float fogFactor = 1.0 - exp(-pow(dist * uFogDensity, 2.0));
        col = mix(col, uFogColor, clamp(fogFactor, 0.0, 1.0));

        gl_FragColor = vec4(col, 1.0);
      }
    `
  });
}

/* ============================================================================
   5. ANIMATED HOLOGRAPHIC MEGA-BILLBOARD SHADER (Razor-Sharp Readable Neon!)
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

        // Subtle periodic horizontal cyber glitch slice
        float glitchTrigger = step(0.96, sin(uTime * 1.8 + uSeed * 17.3) * 0.5 + 0.5);
        float band = step(0.5, sin(uv.y * 28.0 + uTime * 12.0));
        uv.x += glitchTrigger * band * 0.022 * sin(uTime * 43.0 + uSeed);

        // Crisp RGB split
        float ca = 0.0028 + glitchTrigger * 0.006;
        float r = texture2D(uMap, uv + vec2(ca, 0.0)).r;
        float g = texture2D(uMap, uv).g;
        float b = texture2D(uMap, uv - vec2(ca, 0.0)).b;
        vec3 col = vec3(r, g, b);

        // CRT holographic scanlines + subtle refresh sweep
        float scan = 0.88 + 0.12 * sin(uv.y * 220.0 - uTime * 7.0);
        float sweep = exp(-abs(fract(uTime * 0.22 + uSeed) - uv.y) * 32.0) * 0.25;
        float lum = dot(col, vec3(0.299, 0.587, 0.114));

        // Dark billboard backing stays rich & deep so neon text is razor-sharp & readable!
        vec3 finalCol = col * scan * mix(0.65, 1.18, smoothstep(0.18, 0.72, lum)) + col * sweep;

        float edge = smoothstep(0.0, 0.02, uv.x) * smoothstep(1.0, 0.98, uv.x)
                   * smoothstep(0.0, 0.02, uv.y) * smoothstep(1.0, 0.98, uv.y);

        float wipeMask = smoothstep(uv.y - 0.10, uv.y + 0.04, reveal * 1.12);
        float flicker = 0.95 + 0.05 * sin(uTime * 16.0 + uSeed * 9.0);
        // Translucent dark background (0.78) + solid bright neon lettering (0.98)
        float alpha = reveal * wipeMask * edge * flicker * mix(0.78, 0.98, smoothstep(0.12, 0.55, lum));

        gl_FragColor = vec4(finalCol, alpha);
      }
    `
  });
}

/* ============================================================================
   6. VOLUMETRIC SEARCHLIGHT BEAM SHADER (Subtle Silky Fresnel Additive Cone)
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
        float edgeSoft = pow(abs(dot(normalize(vNormalView), normalize(vViewDir))), 2.2);
        float verticalFade = smoothstep(0.0, 0.10, vUv.y) * pow(1.0 - vUv.y, 1.85);
        float shimmer = 0.90 + 0.10 * sin(uTime * 2.8 + vUv.y * 8.0);
        // Delicate volumetric beam opacity (0.11) so overlapping beams never create white glare!
        float alpha = edgeSoft * verticalFade * shimmer * 0.11 * smoothstep(0.15, 0.88, uCyber) * uBoost;
        if (alpha < 0.002) discard;
        gl_FragColor = vec4(uColor * 0.95, alpha);
      }
    `
  });
}

/* ============================================================================
   7. GPU-DRIVEN NEON RAIN STREAKS SHADER (Wrap-Safe via aOffsetY)
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
      uColorA: { value: new THREE.Color(0x00d8ff) },
      uColorB: { value: new THREE.Color(0xff1a75) }
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
        vec3 col = mix(uColorA, uColorB, vTint);
        gl_FragColor = vec4(col, vAlpha * 0.26 * min(strength, 1.25));
      }
    `
  });
}
