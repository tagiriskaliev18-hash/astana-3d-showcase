/**
 * Astana // Night City 2077
 * Main UI Controller & Diegetic HUD Orchestration (Mode-Free Photorealistic Nocturnal Build)
 */
import { LANDMARKS, NOCTURNAL_ATMOSPHERE } from './data/landmarks.js';
import { AstanaNightCityEngine } from './engine/world.js';
import { CyberAudioEngine } from './engine/audio.js';

class AstanaNightCityApp {
  constructor() {
    this.activeLandmarkId = 'overview';
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
    if (!this.landmarkDock) return;
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
    this.audio.syncMood(1.0, NOCTURNAL_ATMOSPHERE.rainIntensity);
    this.engine = new AstanaNightCityEngine(this.canvas, {
      onStats: (stats) => this.updateTelemetry(stats),
      onReady: () => {
        requestAnimationFrame(() => {
          if (this.bootOverlay) this.bootOverlay.classList.add('hidden');
        });
      }
    });

    window.astanaEngine = this.engine;
    window.astanaApp = this;
  }

  bindEvents() {
    // Landmark Quick-Jump Buttons
    if (this.landmarkDock) {
      this.landmarkDock.addEventListener('click', (e) => {
        const btn = e.target.closest('.landmark-btn');
        if (!btn) return;
        this.selectLandmark(btn.dataset.landmark);
      });
    }

    // Camera Mode Buttons
    document.querySelectorAll('[data-cam]').forEach((btn) => {
      btn.addEventListener('click', () => {
        this.setCameraMode(btn.dataset.cam);
      });
    });

    // Dossier Drawer Toggle
    if (this.btnDossier) this.btnDossier.addEventListener('click', () => this.toggleDossier());
    if (this.btnCloseDossier) this.btnCloseDossier.addEventListener('click', () => this.toggleDossier(false));

    // Audio Toggle (Muted by default)
    if (this.btnAudio) {
      this.btnAudio.addEventListener('click', () => {
        const playing = this.audio.toggle();
        this.btnAudio.classList.toggle('active', playing);
      });
    }

    // Hide / Restore HUD
    if (this.btnHideHud) this.btnHideHud.addEventListener('click', () => this.setHudHidden(true));
    if (this.btnRestoreHud) this.btnRestoreHud.addEventListener('click', () => this.setHudHidden(false));

    // Fullscreen
    if (this.btnFullscreen) {
      this.btnFullscreen.addEventListener('click', () => {
        if (!document.fullscreenElement) {
          document.documentElement.requestFullscreen().catch(() => {});
        } else {
          document.exitFullscreen().catch(() => {});
        }
      });
    }

    // Keyboard shortcuts: H = Hide HUD, I = Dossier, 1..8 = Landmarks
    window.addEventListener('keydown', (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      if (e.code === 'KeyH') {
        this.setHudHidden(!this.hudHidden);
      } else if (e.code === 'KeyI') {
        this.toggleDossier();
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

    if (this.landmarkDock) {
      this.landmarkDock.querySelectorAll('.landmark-btn').forEach((b) => {
        b.classList.toggle('active', b.dataset.landmark === id);
      });
    }

    if (this.teleCoords) this.teleCoords.textContent = lm.coords;
    this.renderDossier(id);
    this.engine.flyToLandmark(id);

    // Sync camera button state if tour exited into orbit
    if (this.engine.cameraMode === 'orbit') {
      document.querySelectorAll('[data-cam]').forEach((b) => {
        b.classList.toggle('active', b.dataset.cam === 'orbit');
      });
      if (this.droneToast) this.droneToast.classList.remove('visible');
    }
  }

  renderDossier(id) {
    const lm = LANDMARKS.find((l) => l.id === id);
    if (!lm) return;
    if (this.dossierCode) this.dossierCode.textContent = `${lm.code} // ${lm.sector}`;
    if (this.dossierTitle) this.dossierTitle.textContent = lm.title;
    if (this.dossierKz) this.dossierKz.textContent = lm.titleKz;
    if (this.dossierRealDesc) this.dossierRealDesc.textContent = lm.realDesc;
    if (this.dossierCyberLore) this.dossierCyberLore.textContent = lm.cyberLore;

    if (this.dossierStats) {
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
  }

  toggleDossier(forceState) {
    if (!this.dossierDrawer) return;
    const next = typeof forceState === 'boolean' ? forceState : !this.dossierDrawer.classList.contains('open');
    this.dossierDrawer.classList.toggle('open', next);
    if (this.btnDossier) this.btnDossier.classList.toggle('active', next);
  }

  setCameraMode(mode) {
    this.engine.setCameraMode(mode);
    document.querySelectorAll('[data-cam]').forEach((b) => {
      b.classList.toggle('active', b.dataset.cam === mode);
    });
    if (this.droneToast) this.droneToast.classList.toggle('visible', mode === 'drone');
  }

  setHudHidden(hidden) {
    this.hudHidden = hidden;
    document.body.classList.toggle('hud-hidden', hidden);
  }

  updateTelemetry(stats) {
    if (this.teleFps) this.teleFps.textContent = String(stats.fps);
    if (this.teleAlt) this.teleAlt.textContent = `${stats.alt}M`;
  }
}

document.addEventListener('DOMContentLoaded', () => {
  new AstanaNightCityApp();
});
