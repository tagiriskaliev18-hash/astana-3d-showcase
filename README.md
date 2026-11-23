# ASTANA // NIGHT CITY 2077 — Interactive 3D WebGL Showcase

> Real-time interactive 3D transformation of **Astana, Kazakhstan** into **Cyberpunk 2077 Night City** — featuring Astana's iconic recognizable architecture along Nurzhol Boulevard and the Esil River, built with zero-bundler Three.js r170 ES Modules, custom GLSL shaders, and HDR UnrealBloom post-processing.

**Live Demo (GitHub Pages):** [https://tagiriskaliev18-hash.github.io/astana-3d-showcase/](https://tagiriskaliev18-hash.github.io/astana-3d-showcase/)

---

## Core Features

- **Real-Time ASTANA 2026 <-> NIGHT CITY 2077 Morph (`0%` to `100%`):**
  - Live interactive morph slider + one-click dramatic **SHIFT** toggle smoothly transforms the sky dome, lighting, atmospheric smog, skyscraper window matrices, Esil River neon reflections, wet rain-slicked roads, landmark holograms, sweeping searchlights, flying AV spinner traffic, and pouring neon rain in real time.
- **Recognizable Iconic Astana Landmarks along Nurzhol Boulevard & Esil River:**
  - **Baiterek Tower (105m):** 18 flared steel tree-of-life ribs, panoramic glass lift shaft, chameleon-gold Samruk sphere morphing into a glowing cyber-amber net-core with spinning holographic data rings and skyward laser beam.
  - **Khan Shatyr (150m):** Norman Foster's 15-degree tilted translucent tensile ETFE tent with radial cable ribs and internal tripod mast, shifting from warm sunlit champagne to pulsing magenta/cyan cyberpunk neon.
  - **Abu Dhabi Plaza (311m):** Central Asia's tallest stepped 4-tier supertall arcology with procedural GLSL window grids, vertical neon architectural fins, rooftop helipad, and colossal holographic billboards (`QAZ-CORP`, `ASTANA 2077`).
  - **Nur Alem / EXPO Sphere (100m):** Full geodesic glass sphere with twin rooftop wind-turbine rotors, inner luminous exhibition decks, pulsing quantum core, and orbiting equatorial ring.
  - **Ak Orda Presidential Palace:** Neoclassical marble facade with East/West colonnades, turquoise-blue dome with holographic cyber grid, and golden needle spire overlooking the Esil River.
  - **Palace of Peace & Reconciliation (Pyramid):** 62m geometric granite-and-glass pyramid across the Esil River with glowing stained-glass apex and neon ridge tracing.
  - **Skyline & Urban Infrastructure:** Emerald Towers, Northern Lights, Triumph of Astana, Esil River with animated neon reflection water shader, illuminated parabolic arched bridges, pedestrian skybridges, and an elevated cyber-monorail with an animated maglev train.
- **AAA Three.js WebGL Rendering Pipeline:**
  - `EffectComposer` + `RenderPass` + `UnrealBloomPass` + `OutputPass` with `ACESFilmicToneMapping` and procedural `PMREMGenerator` neon environment map.
  - 7 custom GLSL shaders (Sky Dome, Instanced Anti-Aliased Skyscraper Window Matrix, Esil River Water, Wet Rain-Puddle Boulevard, Holographic Mega-Billboards, Volumetric Fresnel Searchlights, GPU-driven Neon Rain Streaks).
- **Cyberpunk 2077 Diegetic HUD & Controls:**
  - Full-bleed `100vw x 100vh` viewport with collapsible Architectural & 2077 Lore Dossier (`I`), 8 Landmark Quick-Jump presets (`1`–`8`), 4 Atmosphere presets (`NEON RAIN`, `BLADE RUNNER`, `ASTANA DUSK`, `EMP OVERDRIVE`), 3 Camera modes (`ORBIT`, `AUTO-TOUR`, `DRONE` WASD + mouse), Hide HUD (`H`), and optional procedural Web Audio Cyberpunk synth & rain soundscape.

---

## Local Run

Static zero-bundler ES modules — runs directly via any local static server:

```bash
python -m http.server 8000
# Open http://localhost:8000/
```

---

## Project Structure

- `index.html` — Full-bleed WebGL stage, Cyberpunk 2077 diegetic HUD, importmap (Three.js r170)
- `css/style.css` — Chamfered HUD panels, responsive mobile/desktop layout, Cyber Yellow / Cyan / Crimson palette
- `js/app.js` — UI orchestration, morph controls, keyboard shortcuts, dossier drawer
- `js/data/landmarks.js` — Landmark coordinates, camera presets, real architectural dossiers, 2077 lore, atmosphere presets
- `js/engine/world.js` — Core Three.js renderer, EffectComposer + UnrealBloomPass, camera modes (`ORBIT` / `AUTO-TOUR` / `DRONE`)
- `js/engine/landmarks3d.js` — Procedural 3D architectural builders for all Astana landmarks, Nurzhol Boulevard, Esil River & monorail
- `js/engine/citySystems.js` — InstancedMesh megacity skyline filler, animated holographic billboards, aerial AV traffic, searchlights, GPU neon rain
- `js/engine/shaders.js` — Custom GLSL shaders
- `js/engine/textures.js` — High-res procedural Canvas2D bilingual Kazakh/Cyrillic/Katakana cyberpunk billboard textures & PMREM env map
- `js/engine/audio.js` — Optional procedural Web Audio synth drone + rain generator
