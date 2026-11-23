/**
 * Astana -> Night City 2077
 * Main UI Controller & Diegetic HUD Orchestration
 */
import { LANDMARKS, ATMOSPHERE_PRESETS } from './data/landmarks.js';
import { AstanaNightCityEngine } from './engine/world.js';
import { CyberAudioEngine } from './engine/audio.js';

class AstanaNightCityApp {
  constructor() {
    this.activeLandmarkId = 'overview';
    this.activePresetKey = 'neon_rain';
    this.hudHidden = false;
    this.audio = new CyberAudioEngine();

    this.cacheDom();
    this.buildLandmarkDock();
    this.renderDossier('overview');
    this.initEngine();
    this.bindEvents();
  }

  cacheDom() {
    this.canvas = document.getElementById('scene-canvas');
    this.bootOverlay = document.getElementById('boot-overlay');
    this.shiftFlash = document.getElementById('shift-flash');

    this.slider = document.getElementById('cyber-slider');
    this.sliderFill = document.getElementById('slider-fill');
    this.btnShiftToggle = document.getElementById('btn-shift-toggle');
    this.btnShiftText = document.getElementById('btn-shift-text');

    this.hudCyberPct = document.getElementById('hud-cyber-pct');
    this.statusModeLabel = document.getElementById('status-mode-label');
    this.teleCoords = document.getElementById('tele-coords');
    this.teleAlt = document.getElementById('tele-alt');
    this.teleFps = document.getElementById('tele-fps');

    this.landmarkDock = document.getElementById('landmark-dock');
    this.dossierDrawer = document.getElementById('dossier-drawer');
    this.btnDossier = document.getElementById('btn-dossier');
    this.btnCloseDossier = document.getElementById('btn-close-dossier');
    this.btnAudio = document.getElementById('btn-audio');
    this.btnHideHud = document.getElementById('btn-hide-hud');
    this.btnRestoreHud = document.getElementById('btn-restore-hud');
    this.btnFullscreen = document.getElementById('btn-fullscreen');
    this.droneToast = document.getElementById('drone-toast');

    this.dossierCode = document.getElementById('dossier-code');
    this.dossierTitle = document.getElementById('dossier-title');
    this.dossierKz = document.getElementById('dossier-kz');
    this.dossierStats = document.getElementById('dossier-stats');
    this.dossierRealDesc = document.getElementById('dossier-real-desc');
    this.dossierCyberLore = document.getElementById('dossier-cyber-lore');
  }

  buildLandmarkDock() {
    this.landmarkDock.innerHTML = LANDMARKS.map(
      (lm, idx) => `
      <button
        type="button"
        class="landmark-btn${idx === 0 ? ' active' : ''}"
        data-landmark="${lm.id}"
        title="Перелететь к: ${lm.title} [${idx + 1}]"
      >
        <span class="lm-code">${String(idx).padStart(2, '0')}</span>
        <span>${lm.label}</span>
      </button>
    `
    ).join('');
  }

  initEngine() {
    this.engine = new AstanaNightCityEngine(this.canvas, {
      onCyberChange: (level) => this.syncCyberUI(level),
      onStats: (stats) => this.updateTelemetry(stats),
      onReady: () => {
        // Reveal the live Astana -> Night City transformation smoothly
        requestAnimationFrame(() => {
          this.bootOverlay.classList.add('hidden');
        });
      }
    });

    // Expose globally for inspection/debugging
    window.astanaEngine = this.engine;
    window.astanaApp = this;
  }

  bindEvents() {
    // Live Astana <-> Night City Morph Slider
    this.slider.addEventListener('input', (e) => {
      const val = Number(e.target.value) / 100;
      this.engine.setCyberLevel(val, true);
      if (val < 0.08) {
        this.highlightPresetButton('astana_dusk');
      } else {
        this.activePresetKey = this.engine.activeCyberPreset.id;
        this.highlightPresetButton(this.activePresetKey);
      }
    });

    // Dramatic One-Click Astana <-> Night City 2077 Shift CTA
    this.btnShiftToggle.addEventListener('click', () => {
      const toCyber = this.engine.cyberLevel < 0.5;
      this.triggerShiftFlash();
      this.audio.playShiftPulse(toCyber);

      if (toCyber) {
        const targetPreset = this.activePresetKey === 'astana_dusk' ? 'neon_rain' : this.activePresetKey;
        this.activePresetKey = targetPreset;
        this.engine.setAtmospherePreset(targetPreset);
        this.highlightPresetButton(targetPreset);
      } else {
        this.engine.setAtmospherePreset('astana_dusk');
        this.highlightPresetButton('astana_dusk');
      }
    });

    // Landmark Quick-Jump Buttons
    this.landmarkDock.addEventListener('click', (e) => {
      const btn = e.target.closest('.landmark-btn');
      if (!btn) return;
      this.selectLandmark(btn.dataset.landmark);
    });

    // Atmosphere Preset Buttons
    document.querySelectorAll('[data-preset]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const key = btn.dataset.preset;
        this.activePresetKey = key;
        this.triggerShiftFlash();
        this.audio.playShiftPulse(key !== 'astana_dusk');
        this.engine.setAtmospherePreset(key);
        this.highlightPresetButton(key);
      });
    });

    // Camera Mode Buttons
    document.querySelectorAll('[data-cam]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const mode = btn.dataset.cam;
        this.setCameraMode(mode);
      });
    });

    // Dossier Drawer Toggle
    this.btnDossier.addEventListener('click', () => this.toggleDossier());
    this.btnCloseDossier.addEventListener('click', () => this.toggleDossier(false));

    // Audio Toggle (Muted by default)
    this.btnAudio.addEventListener('click', () => {
      const playing = this.audio.toggle();
      this.btnAudio.classList.toggle('active', playing);
    });

    // Hide / Restore HUD
    this.btnHideHud.addEventListener('click', () => this.setHudHidden(true));
    this.btnRestoreHud.addEventListener('click', () => this.setHudHidden(false));

    // Fullscreen
    this.btnFullscreen.addEventListener('click', () => {
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(() => {});
      } else {
        document.exitFullscreen().catch(() => {});
      }
    });

    // Keyboard shortcuts: H = Hide HUD, I = Dossier, 1..8 = Landmarks, X = Shift Astana <-> 2077
    window.addEventListener('keydown', (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      if (e.code === 'KeyH') {
        this.setHudHidden(!this.hudHidden);
      } else if (e.code === 'KeyI') {
        this.toggleDossier();
      } else if (e.code === 'KeyX') {
        this.btnShiftToggle.click();
      } else if (e.key >= '1' && e.key <= '8') {
        const idx = Number(e.key) - 1;
        if (LANDMARKS[idx]) this.selectLandmark(LANDMARKS[idx].id);
      } else if (e.code === 'Escape') {
        this.toggleDossier(false);
        if (this.hudHidden) this.setHudHidden(false);
      }
    });
  }

  selectLandmark(id) {
    const lm = LANDMARKS.find((l) => l.id === id);
    if (!lm) return;
    this.activeLandmarkId = id;

    this.landmarkDock.querySelectorAll('.landmark-btn').forEach((b) => {
      b.classList.toggle('active', b.dataset.landmark === id);
    });

    this.teleCoords.textContent = lm.coords;
    this.renderDossier(id);
    this.engine.flyToLandmark(id);

    // Sync camera button state if tour exited into orbit
    if (this.engine.cameraMode === 'orbit') {
      document.querySelectorAll('[data-cam]').forEach((b) => {
        b.classList.toggle('active', b.dataset.cam === 'orbit');
      });
    }
  }

  renderDossier(id) {
    const lm = LANDMARKS.find((l) => l.id === id);
    if (!lm) return;
    this.dossierCode.textContent = `${lm.code} // ${lm.sector}`;
    this.dossierTitle.textContent = lm.title;
    this.dossierKz.textContent = lm.titleKz;
    this.dossierRealDesc.textContent = lm.realDesc;
    this.dossierCyberLore.textContent = lm.cyberLore;

    this.dossierStats.innerHTML = lm.realStats
      .map(
        (s) => `
      <div class="dossier-stat-card">
        <span>${s.label}</span>
        <strong>${s.value}</strong>
      </div>
    `
      )
      .join('');
  }

  toggleDossier(forceState) {
    const next = typeof forceState === 'boolean' ? forceState : !this.dossierDrawer.classList.contains('open');
    this.dossierDrawer.classList.toggle('open', next);
    this.btnDossier.classList.toggle('active', next);
  }

  setCameraMode(mode) {
    this.engine.setCameraMode(mode);
    document.querySelectorAll('[data-cam]').forEach((b) => {
      b.classList.toggle('active', b.dataset.cam === mode);
    });
    this.droneToast.classList.toggle('visible', mode === 'drone');
  }

  setHudHidden(hidden) {
    this.hudHidden = hidden;
    document.body.classList.toggle('hud-hidden', hidden);
  }

  highlightPresetButton(key) {
    document.querySelectorAll('[data-preset]').forEach((b) => {
      b.classList.toggle('active', b.dataset.preset === key);
    });
  }

  triggerShiftFlash() {
    this.shiftFlash.classList.remove('pulse');
    void this.shiftFlash.offsetWidth; // restart CSS keyframe cleanly
    this.shiftFlash.classList.add('pulse');
  }

  syncCyberUI(level) {
    const pct = Math.round(level * 100);
    this.slider.value = String(pct);
    this.sliderFill.style.width = `${pct}%`;
    this.hudCyberPct.textContent = `${pct}%`;

    const isCyber = level >= 0.5;
    document.body.classList.toggle('mode-cyber', isCyber);
    document.body.classList.toggle('mode-real', !isCyber);

    if (level < 0.15) {
      this.statusModeLabel.textContent = 'ASTANA REALITY · NURZHOL GOLDEN DUSK';
      this.btnShiftText.textContent = 'INITIATE 2077 SHIFT';
    } else if (level < 0.85) {
      this.statusModeLabel.textContent = `SHIFTING REALITY -> NIGHT CITY // ${pct}%`;
      this.btnShiftText.textContent = isCyber ? 'ВЕРНУТЬ АСТАНУ' : 'INITIATE 2077 SHIFT';
    } else {
      const presetId = this.engine ? this.engine.activeCyberPreset.id : this.activePresetKey;
      const p = ATMOSPHERE_PRESETS[presetId];
      this.statusModeLabel.textContent = `NIGHT CITY OVERRIDE · ${p ? p.label : '2077'}`;
      this.btnShiftText.textContent = 'АСТАНА 2026';
    }

    if (this.engine) {
      const presetKey = this.engine.morphAnim
        ? this.engine.activePresetKey
        : (level < 0.08 ? 'astana_dusk' : this.engine.activeCyberPreset.id);
      this.highlightPresetButton(presetKey);
    }

    const rainVal = this.engine ? this.engine.activeCyberPreset.rainIntensity : 1.0;
    this.audio.syncMood(level, rainVal);
  }

  updateTelemetry(stats) {
    this.teleFps.textContent = String(stats.fps);
    this.teleAlt.textContent = `${stats.alt}M`;
  }
}

document.addEventListener('DOMContentLoaded', () => {
  new AstanaNightCityApp();
});
