/**
 * Astana -> Night City 2077
 * AAA Custom GLSL Shaders:
 * 1. Sky Dome + Neon Smog Horizon + Sliced Cyber Moon + Orbital Ring
 * 2. AAA Obsidian Architectural Glass Skyscraper Window Matrix (3x Finer, Clustered Office Strips, MEP Floors, Anti-Aliased)
 * 3. AAA Esil River Dark Mirror Water + Fine Anisotropic Ripples & Stretched Neon Reflections
 * 4. AAA Wet Charcoal Asphalt Boulevard + Crisp Lane Markings & Sharp Glossy Rain Puddles
 * 5. Animated Holographic Mega-Billboards (Razor-Sharp NormalBlending + Scanlines + Glitch)
 * 6. Volumetric Fresnel Searchlight Cones
 * 7. GPU-Driven Wrap-Safe Neon Rain Streaks
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
      uTopColor: { value: new THREE.Color(0x03030b) },
      uMidColor: { value: new THREE.Color(0x0b071e) },
      uHorizonColor: { value: new THREE.Color(0x880f44) },
      uAccentColor: { value: new THREE.Color(0x0082a4) }
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

        vec3 col = mix(uHorizonColor, uMidColor, smoothstep(0.0, 0.22, up));
        col = mix(col, uTopColor, smoothstep(0.16, 0.68, up));

        // Dual directional neon smog bounce along horizon
        float azim = atan(dir.z, dir.x);
        float horizonBand = exp(-abs(dir.y - 0.015) * 14.0);
        float accentMask = 0.5 + 0.5 * sin(azim * 2.0 - 0.7);
        vec3 horizonBounce = mix(uHorizonColor, uAccentColor, accentMask * 0.72);
        col += horizonBounce * horizonBand * (0.26 + 0.30 * uCyber);

        // Animated nocturnal cloud deck lit from beneath by neon metropolis
        if (dir.y > 0.01) {
          vec2 cloudUV = dir.xz / (dir.y + 0.24) * 1.4;
          float c1 = fbm(cloudUV + vec2(uTime * 0.014, -uTime * 0.008));
          float c2 = fbm(cloudUV * 2.1 - vec2(uTime * 0.02, uTime * 0.011));
          float clouds = smoothstep(0.40, 0.84, c1 * 0.65 + c2 * 0.35);
          float cloudFade = smoothstep(0.02, 0.14, dir.y) * smoothstep(0.72, 0.16, dir.y);
          vec3 cloudTint = mix(uHorizonColor * 0.58, uAccentColor * 0.52, c2);
          col = mix(col, col * 0.55 + cloudTint * (0.26 + 0.34 * uCyber), clouds * cloudFade * 0.72);
        }

        // Stylized Setting Dusk Sun (0%) <-> Retrowave Sliced Cyber Moon (100%)
        vec3 sunDir = normalize(vec3(0.58, 0.21, -0.78));
        float sunDot = dot(dir, sunDir);
        float disc = smoothstep(0.9972, 0.9985, sunDot);
        float halo = pow(max(sunDot, 0.0), 34.0) * 0.32 + pow(max(sunDot, 0.0), 8.0) * 0.07;
        float slice = mix(1.0, step(0.30, fract(dir.y * 92.0)), uCyber * smoothstep(0.24, 0.18, dir.y));
        vec3 orbCol = mix(vec3(1.0, 0.72, 0.38), vec3(1.0, 0.12, 0.45), uCyber);
        col += orbCol * halo;
        col = mix(col, orbCol * 1.12, disc * slice);

        // Distant megastructure orbital arc in upper sky
        float ringDist = abs(dir.y - (0.38 + 0.16 * sin(azim + 0.75)));
        float ring = smoothstep(0.0038, 0.0008, ringDist) * smoothstep(0.10, 0.32, dir.y);
        col += uAccentColor * ring * 0.34 * uCyber;

        // Subtle stars near zenith
        if (dir.y > 0.20) {
          vec2 starGrid = floor((dir.xz / (dir.y + 0.5)) * 170.0);
          float starSeed = hash21(starGrid);
          if (starSeed > 0.993) {
            float twinkle = 0.6 + 0.4 * sin(uTime * 2.4 + starSeed * 62.0);
            col += vec3(0.75, 0.85, 1.0) * twinkle * smoothstep(0.20, 0.65, dir.y) * 0.52;
          }
        }

        if (dir.y < 0.0) {
          col = mix(col, uTopColor * 0.45, smoothstep(0.0, -0.1, dir.y));
        }

        col = min(col, vec3(0.84));
        gl_FragColor = vec4(col, 1.0);
      }
    `
  });
}

/* ============================================================================
   2. AAA OBSIDIAN ARCHITECTURAL GLASS SKYSCRAPER SHADER
      - Deep gunmetal/obsidian glass base (#050811 .. #0a101d), zero purple wash
      - 3x finer & denser horizontal floor ribbons + crisp vertical glass mullions
      - Clustered realistic office strips (~25-33% lit), dark MEP floors every 12F
      - Subtle reflective vertical glass sheen + crisp thin cyber crown/corner trim
   ============================================================================ */
export function createBuildingWindowMaterial({
  isInstanced = true,
  baseTint = 0x070c16,
  seed = 0.37,
  accentIndex = 0.15
} = {}) {
  return new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uCyber: { value: 1.0 },
      uFogColor: { value: new THREE.Color(0x090714) },
      uFogDensity: { value: 0.0017 },
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
      varying vec4 vData; // x: width, y: height, z: quantized integer seed, w: accent index

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

        // Exact integer seed quantization (zero perspective interpolation noise!)
        float seedInt = floor(vData.z + 0.5);
        float seedNorm = seedInt * 0.01;

        // Deep obsidian / gunmetal-blue architectural glass (Astana Dusk: refined dark blue-slate steel)
        vec3 realFacade = mix(uBaseTint * 2.2 + vec3(0.04, 0.07, 0.12), vec3(0.14, 0.19, 0.27), seedNorm * 0.55);
        vec3 cyberFacade = mix(vec3(0.018, 0.028, 0.055), vec3(0.036, 0.052, 0.088), seedNorm) + uBaseTint * 0.35;
        vec3 facadeBase = mix(realFacade, cyberFacade, uCyber);

        float ndl = max(dot(N, uSunDir), 0.0);
        float fresnel = pow(1.0 - max(dot(N, V), 0.0), 3.6);

        // Subtle reflective curtain-wall sky & distant neon horizon reflection
        vec3 R = reflect(-V, N);
        float heightSheen = smoothstep(0.0, 95.0, vWorldPos.y);
        vec3 duskRefl = mix(vec3(0.14, 0.26, 0.46), vec3(0.85, 0.52, 0.26), pow(max(dot(R, vec3(0.55, 0.15, -0.75)), 0.0), 2.5));
        vec3 cyberRefl = mix(vec3(0.02, 0.12, 0.22), vec3(0.04, 0.28, 0.38), heightSheen)
                       + vec3(0.14, 0.02, 0.10) * pow(max(dot(R, normalize(vec3(-0.75, 0.08, 0.65))), 0.0), 3.0);
        vec3 skyReflect = mix(duskRefl, cyberRefl, uCyber);

        vec3 col = facadeBase * (0.38 + 0.48 * ndl) + skyReflect * (0.14 + 0.42 * fresnel);

        if (isRoof < 0.5) {
          float horizCoord = abs(N.x) > 0.5 ? vWorldPos.z : vWorldPos.x;

          // 3x FINER & DENSER architectural curtain-wall glass grid!
          float wx = horizCoord * 1.18 + seedInt * 1.73;
          float wy = vWorldPos.y * 0.86;

          vec2 cell = floor(vec2(wx, wy));
          vec2 f = fract(vec2(wx, wy));

          // Crisp architectural mullions + spandrel slab dividers (anti-aliased by distance)
          float aa = clamp(dist * 0.0012, 0.03, 0.28);
          float paneX = smoothstep(0.10 - aa, 0.18 + aa, f.x) * (1.0 - smoothstep(0.82 - aa, 0.90 + aa, f.x));
          float paneY = smoothstep(0.24 - aa, 0.34 + aa, f.y) * (1.0 - smoothstep(0.76 - aa, 0.86 + aa, f.y));
          float pane = paneX * paneY;

          // Subtle vertical structural glass pilaster sheen every 4 bays (even on dark floors!)
          float majorRib = smoothstep(0.04, 0.0, abs(fract(wx * 0.25) - 0.5));
          float glassBand = paneY * (0.04 + 0.09 * fresnel);
          col += skyReflect * glassBand * (1.0 - majorRib * 0.7);
          col *= (1.0 - majorRib * 0.28);

          // Dark mechanical / MEP equipment floors every 12 stories + recessed ground lobby
          float floorIdx = cell.y;
          float isMepFloor = step(11.5, mod(floorIdx, 12.0));
          float groundPlinth = smoothstep(1.8, 3.6, vWorldPos.y);

          // Clustered horizontal office suites (3-6 panes wide) -> realistic modern corporate towers!
          float suiteId = floor(cell.x * 0.22 + hash21(vec2(floorIdx, seedInt * 2.3)) * 2.0);
          float floorOcc = hash21(vec2(floorIdx, seedInt * 3.17));
          float suiteRand = hash21(vec2(suiteId, floorIdx) + vec2(seedInt * 5.71, seedInt * 2.13));
          float paneVar = hash21(cell + vec2(seedInt * 7.31, seedInt * 11.43));

          // Realistic occupancy: ~22% in Astana Dusk, ~32% in Night City (never cluttered pastel noise!)
          float density = mix(0.22, 0.34, uCyber);
          float suiteLit = step(1.0 - density, suiteRand) * step(0.28, floorOcc);
          // Occasional dark individual office inside a lit suite for natural realism
          float paneMask = step(0.18, paneVar);
          float lit = suiteLit * paneMask * pane * (1.0 - isMepFloor) * groundPlinth;

          // Subtle horizontal interior depth gradient inside each lit office pane (brighter ceiling!)
          float interiorGrad = mix(0.62, 1.05, smoothstep(0.25, 0.78, f.y));

          // Ground lobby warm/cyan showcase glazing
          float lobbyWin = (1.0 - groundPlinth) * step(0.4, vWorldPos.y) * paneX * step(0.35, suiteRand) * 0.65;

          // Realistic Architectural Color Palette:
          // Real Astana: warm tungsten/champagne offices + clean daylight-white offices
          // Night City: refined warm-white, cool architectural cyan-white, warm amber, rare neon accent suite
          vec3 warmWhite = vec3(1.0, 0.86, 0.64);
          vec3 coolWhite = vec3(0.76, 0.91, 1.0);
          vec3 amberOffice = vec3(1.0, 0.68, 0.28);
          vec3 cyanOffice = vec3(0.18, 0.88, 1.0);
          vec3 accentMagenta = vec3(1.0, 0.14, 0.48);

          vec3 realWinCol = mix(warmWhite, coolWhite, step(0.62, suiteRand));
          vec3 cyberWinCol = warmWhite;
          if (suiteRand > 0.93) cyberWinCol = accentMagenta; // rare ~7% corporate neon room
          else if (suiteRand > 0.72) cyberWinCol = cyanOffice;
          else if (suiteRand > 0.48) cyberWinCol = amberOffice;
          else if (suiteRand > 0.28) cyberWinCol = coolWhite;

          vec3 winCol = mix(realWinCol, cyberWinCol, uCyber * 0.82);

          // Gentle subtle office shimmer + selective brightness (keeps general windows crisp, not bloom soup)
          float shimmer = 0.94 + 0.06 * sin(uTime * 1.1 + seedInt + floorIdx * 0.4);
          float winIntensity = mix(0.68, 0.92, uCyber) * interiorGrad * shimmer;
          col += winCol * (lit * winIntensity + lobbyWin * mix(0.55, 0.85, uCyber));

          #ifdef USE_INSTANCING
          // Razor-thin architectural neon crown strip at top edge of select Night City megatowers
          float normY = vLocalPos.y + 0.5;
          float crownBand = smoothstep(0.975, 0.985, normY) * smoothstep(0.998, 0.990, normY);
          float hasCrown = step(0.38, seedNorm);
          vec3 crownColor = vData.w < 0.45
            ? vec3(0.0, 0.95, 1.0)
            : (vData.w < 0.78 ? vec3(1.0, 0.08, 0.44) : vec3(0.99, 0.85, 0.10));
          col += crownColor * crownBand * hasCrown * (0.04 + 1.32 * uCyber);

          // Crisp razor-thin vertical corner neon edge strip on tall hero filler towers
          float cornerTrim = smoothstep(0.486, 0.497, abs(vLocalPos.x)) * smoothstep(0.486, 0.497, abs(vLocalPos.z));
          float tallEnough = step(46.0, vData.y);
          col += crownColor * cornerTrim * tallEnough * step(0.55, seedNorm) * 1.15 * uCyber;
          #endif
        } else {
          // Dark architectural roof gravel/steel + thin subtle perimeter accent only on select towers
          col *= 0.42;
          #ifdef USE_INSTANCING
          float roofEdge = max(smoothstep(0.478, 0.496, abs(vLocalPos.x)), smoothstep(0.478, 0.496, abs(vLocalPos.z)));
          vec3 roofNeon = vData.w < 0.55 ? vec3(0.0, 0.88, 1.0) : vec3(1.0, 0.08, 0.44);
          col += roofNeon * roofEdge * step(0.42, seedNorm) * 0.45 * uCyber;
          #endif
        }

        // Exponential distance fog matching scene
        float fogFactor = 1.0 - exp(-pow(dist * uFogDensity, 2.0));
        col = mix(col, uFogColor, clamp(fogFactor, 0.0, 1.0));

        gl_FragColor = vec4(col, 1.0);
      }
    `
  });
}

/* ============================================================================
   3. AAA ESIL RIVER WATER SHADER
      - Deep near-black nocturnal mirror (#03060c)
      - Fine anisotropic horizontal wave ripples (high-freq multi-octave)
      - Stretched vertical Blade Runner / Night City neon specular reflections!
   ============================================================================ */
export function createEsilRiverMaterial() {
  return new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uCyber: { value: 1.0 },
      uFogColor: { value: new THREE.Color(0x090714) },
      uFogDensity: { value: 0.0017 }
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

        // Fine high-frequency anisotropic river ripples (stretched across channel width)
        float r1 = sin(wp.y * 2.2 + wp.x * 0.35 + uTime * 2.1) * 0.5;
        float r2 = sin(wp.y * 4.7 - wp.x * 0.55 - uTime * 2.8) * 0.3;
        float r3 = (noise(vec2(wp.x * 0.9, wp.y * 2.6 + uTime * 0.9)) - 0.5) * 0.85;
        float r4 = (noise(vec2(wp.x * 2.2, wp.y * 6.5 - uTime * 1.4)) - 0.5) * 0.45;
        float rippleZ = (r1 + r2 + r3 + r4) * 0.22;
        float rippleX = (noise(vec2(wp.x * 1.6, wp.y * 3.8 + uTime * 0.7)) - 0.5) * 0.14;

        vec3 N = normalize(vec3(rippleX, 1.0, rippleZ));
        vec3 V = normalize(cameraPosition - vWorldPos);
        vec3 R = reflect(-V, N);
        float fresnel = pow(1.0 - max(dot(N, V), 0.0), 3.4);

        // Deep near-black mirror water base
        vec3 deepWater = mix(vec3(0.02, 0.055, 0.11), vec3(0.010, 0.016, 0.032), uCyber);
        vec3 skyTint = mix(vec3(0.18, 0.28, 0.46), vec3(0.05, 0.04, 0.12), uCyber);
        vec3 col = mix(deepWater, skyTint, fresnel * 0.65);

        // High-frequency horizontal sparkle modulation across water ripples
        float fineSparkle = pow(0.5 + 0.5 * sin(wp.y * 5.8 + rippleZ * 18.0 - uTime * 2.4), 5.0);
        float microGlint = pow(0.5 + 0.5 * sin(wp.y * 11.5 - rippleZ * 26.0 + uTime * 3.6), 8.0);
        float rippleSpec = 0.28 + 0.72 * fineSparkle + 0.65 * microGlint;

        // Stretched vertical reflections aligned to real skyline light columns (Ak Orda, Bridges, Megatowers!)
        float bridgeMain = exp(-abs(wp.y) * 0.065);
        float bridgeNorth = exp(-abs(wp.y + 88.0) * 0.08);
        float bridgeSouth = exp(-abs(wp.y - 86.0) * 0.08);
        float akOrdaGold = exp(-abs(wp.y) * 0.045) * smoothstep(162.0, 134.0, wp.x);
        float towerCol1 = exp(-pow(sin((wp.y + 18.0) * 0.065), 2.0) * 18.0);
        float towerCol2 = exp(-pow(sin((wp.y - 26.0) * 0.055), 2.0) * 20.0);
        float towerCol3 = exp(-pow(sin((wp.y + 42.0) * 0.085), 2.0) * 22.0);

        vec3 duskCol =
          vec3(1.0, 0.74, 0.36) * (akOrdaGold * 0.75 + bridgeMain * 0.5 + towerCol1 * 0.25) +
          vec3(0.45, 0.75, 1.0) * (bridgeNorth + bridgeSouth) * 0.35;

        vec3 cyberCol =
          vec3(0.0, 0.92, 1.0) * ((bridgeMain + bridgeNorth + bridgeSouth) * 0.95 + towerCol1 * 0.62) +
          vec3(1.0, 0.08, 0.44) * (towerCol2 * 0.65) +
          vec3(1.0, 0.76, 0.18) * (akOrdaGold * 0.85 + towerCol3 * 0.42);

        col += mix(duskCol, cyberCol, uCyber) * rippleSpec * (0.30 + 0.70 * fresnel);

        // Crisp embankment shoreline glow (thin specular edge along concrete walls)
        float bankEdge = smoothstep(0.045, 0.0, vUv.x) + smoothstep(0.955, 1.0, vUv.x);
        col += mix(vec3(0.65, 0.52, 0.34), vec3(0.0, 0.85, 1.0), uCyber) * bankEdge * 0.38;

        float dist = length(cameraPosition - vWorldPos);
        float fogFactor = 1.0 - exp(-pow(dist * uFogDensity, 2.0));
        col = mix(col, uFogColor, clamp(fogFactor, 0.0, 1.0));

        gl_FragColor = vec4(col, 1.0);
      }
    `
  });
}

/* ============================================================================
   4. AAA WET CHARCOAL ASPHALT BOULEVARD SHADER
      - Deep crisp charcoal wet asphalt (#080b11), fine asphalt micro-grain
      - Razor-sharp painted road lanes, double centerlines, crosswalks & curbs
      - Sharp-edged localized glossy rain puddles reflecting fine neon streaks (zero blurry pastel clouds!)
   ============================================================================ */
export function createWetRoadMaterial() {
  return new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uCyber: { value: 1.0 },
      uFogColor: { value: new THREE.Color(0x090714) },
      uFogDensity: { value: 0.0017 }
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

      float fbm(vec2 p) {
        float v = 0.0;
        float a = 0.5;
        for (int i = 0; i < 3; i++) {
          v += a * noise(p);
          p *= 2.1;
          a *= 0.5;
        }
        return v;
      }

      void main() {
        vec2 wp = vWorldPos.xz;

        // Crisp dark charcoal asphalt base + fine aggregate micro-grain
        float fineGrain = noise(wp * 4.5) * 0.016 + noise(wp * 13.0) * 0.008;
        vec3 dryAsphalt = vec3(0.055, 0.062, 0.078) + fineGrain;
        vec3 wetAsphalt = vec3(0.024, 0.029, 0.042) + fineGrain * 0.45;

        // Sharp-edged realistic rain puddles (NOT low-freq blurry haze!)
        float puddleField = fbm(wp * 0.095 + vec2(2.3, -1.7));
        float puddleMask = smoothstep(0.51, 0.59, puddleField) * uCyber;

        vec3 col = mix(dryAsphalt, wetAsphalt, 0.35 + 0.65 * puddleMask);

        // Nurzhol Boulevard Roadway Corridor (Z = +-9.5 to +-20.5)
        float absZ = abs(wp.y);
        float inBoulevard = step(-118.0, wp.x) * step(wp.x, 128.0);
        float onRoad = step(9.2, absZ) * step(absZ, 21.0) * inBoulevard;

        // Slightly darker freshly-paved asphalt on active road lanes
        col = mix(col, col * 0.78, onRoad);

        // Crisp painted dashed lane dividers (at Z = +-13.0 and Z = +-17.0)
        float dash = step(0.45, fract(wp.x * 0.14));
        float lane1 = smoothstep(0.22, 0.06, abs(absZ - 13.2)) * dash * onRoad;
        float lane2 = smoothstep(0.22, 0.06, abs(absZ - 17.0)) * dash * onRoad;
        vec3 paintCol = mix(vec3(0.74, 0.72, 0.64), vec3(0.75, 0.92, 1.0), uCyber * 0.55);
        col += paintCol * (lane1 + lane2) * 0.52;

        // Double amber-yellow / cyan edge curb line along boulevard median & outer shoulder
        float innerCurb = smoothstep(0.24, 0.07, abs(absZ - 9.4)) * inBoulevard;
        float outerCurb = smoothstep(0.22, 0.07, abs(absZ - 20.6)) * inBoulevard;
        vec3 curbCol = mix(vec3(0.72, 0.58, 0.32), vec3(0.95, 0.78, 0.12), uCyber);
        col += curbCol * innerCurb * (0.25 + 0.55 * uCyber);
        col += vec3(0.0, 0.82, 1.0) * outerCurb * 0.42 * uCyber;

        // Crisp zebra crosswalk bars flanking Baiterek Plaza (X = +-27)
        float nearCrosswalk = step(abs(abs(wp.x) - 27.0), 2.4) * onRoad;
        float zebra = step(0.45, fract(wp.y * 0.85));
        col += vec3(0.78, 0.82, 0.88) * nearCrosswalk * zebra * 0.45;

        // Sharp, localized glossy rain-puddle neon specular reflections + micro raindrop rings
        vec3 V = normalize(cameraPosition - vWorldPos);
        float fresnel = pow(1.0 - max(V.y, 0.0), 2.6);

        // Fine raindrop concentric ring ripples inside puddles
        vec2 dropCell = fract(wp * 0.65) - 0.5;
        float dropRing = sin(length(dropCell) * 38.0 - uTime * 9.5) * exp(-length(dropCell) * 4.5);
        float ripplePerturb = dropRing * puddleMask * 0.18;

        // High-frequency specular light streak reflections ONLY crisp inside glossy puddles!
        float streak1 = pow(max(0.0, sin(wp.y * 0.42 + wp.x * 0.04 + ripplePerturb * 6.0)), 10.0);
        float streak2 = pow(max(0.0, cos(wp.y * 0.36 - wp.x * 0.05 - ripplePerturb * 6.0)), 12.0);
        float baiterekPool = exp(-length(wp) * 0.024) * 0.75;

        vec3 puddleRefl =
          vec3(0.0, 0.90, 1.0) * (streak1 * 0.65 + innerCurb * 0.4) +
          vec3(1.0, 0.08, 0.44) * (streak2 * 0.58) +
          vec3(1.0, 0.72, 0.16) * baiterekPool;

        // Wet sheen everywhere subtle (0.08), razor-crisp neon mirror glints inside puddles (0.78)
        col += puddleRefl * (0.06 + puddleMask * 0.72) * (0.30 + 0.70 * fresnel) * uCyber;

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

        float glitchTrigger = step(0.96, sin(uTime * 1.8 + uSeed * 17.3) * 0.5 + 0.5);
        float band = step(0.5, sin(uv.y * 28.0 + uTime * 12.0));
        uv.x += glitchTrigger * band * 0.022 * sin(uTime * 43.0 + uSeed);

        float ca = 0.0028 + glitchTrigger * 0.006;
        float r = texture2D(uMap, uv + vec2(ca, 0.0)).r;
        float g = texture2D(uMap, uv).g;
        float b = texture2D(uMap, uv - vec2(ca, 0.0)).b;
        vec3 col = vec3(r, g, b);

        float scan = 0.88 + 0.12 * sin(uv.y * 220.0 - uTime * 7.0);
        float sweep = exp(-abs(fract(uTime * 0.22 + uSeed) - uv.y) * 32.0) * 0.25;
        float lum = dot(col, vec3(0.299, 0.587, 0.114));

        vec3 finalCol = col * scan * mix(0.65, 1.18, smoothstep(0.18, 0.72, lum)) + col * sweep;

        float edge = smoothstep(0.0, 0.02, uv.x) * smoothstep(1.0, 0.98, uv.x)
                   * smoothstep(0.0, 0.02, uv.y) * smoothstep(1.0, 0.98, uv.y);

        float wipeMask = smoothstep(uv.y - 0.10, uv.y + 0.04, reveal * 1.12);
        float flicker = 0.95 + 0.05 * sin(uTime * 16.0 + uSeed * 9.0);
        float alpha = reveal * wipeMask * edge * flicker * mix(0.78, 0.98, smoothstep(0.12, 0.55, lum));

        gl_FragColor = vec4(finalCol, alpha);
      }
    `
  });
}

/* ============================================================================
   6. VOLUMETRIC SEARCHLIGHT BEAM SHADER (Silky Fresnel Additive Cone)
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
        gl_FragColor = vec4(col, vAlpha * 0.25 * min(strength, 1.25));
      }
    `
  });
}
