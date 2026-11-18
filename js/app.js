/**
 * Astana 3D Showcase - Main Application Logic
 * Interactive Catalog, Architectural Dossiers, Audio Engine
 */
import AstanaViewer3D from './viewer3d.js';

const ARCHITECTURAL_DATA = {
  baiterek: {
    id: 'baiterek',
    title: 'Монумент «Астана-Байтерек»',
    titleKz: '«Бәйтерек» монументі',
    height: '105 м',
    year: '2002 год',
    architects: 'Акмурза Рустембеков, сэр Норман Фостер',
    structuralType: 'Стальная решетчатая башня со сферой',
    weight: 'Свыше 1 000 тонн',
    videoViewport: './assets/media/shot1_baiterek_viewport.mp4',
    videoDepth: './assets/media/shot1_baiterek_depth.mp4',
    thumb: './assets/media/thumb_baiterek.jpg',
    snippet: 'Главный символ независимого Казахстана и столицы, олицетворяющий Древо Жизни из древней тюркской мифологии с золотым яйцом священной птицы Самрук в кроне.',
    description: `«Байтерек» — уникальный архитектурный символ столицы Казахстана, воздвигнутый в 2002 году по инициативе первого президента. Высота сооружения составляет 105 метров, а уровень 97 метров символизирует 1997 год — дату официального переноса столицы в Астану.

Архитектурная концепция монумента глубоко укоренена в тюркской космогонии: Байтерек представляет собой священное Древо Жизни («Бәйтерек»), растущее на берегу Мировой реки. Корни древа удерживают подземный мир, ствол находится в земном измерении, а в пышную крону прилетает священная птица Самрук, чтобы отложить золотое яйцо — Солнце.

Ствол башни образован 18 мощными металлическими стрелами-опорами белого цвета, которые на вершине изгибаются и бережно удерживают гигантскую золотую сферу диаметром 22 метра и весом около 300 тонн. Шар выполнен из инновационного многослойного стекла «хамелеон», меняющего оттенок в зависимости от угла падения солнечных лучей. Внутри шара расположена панорамная смотровая площадка с круговым обзором столицы и художественная композиция «Аялы-Алақан» с оттиском ладони.`,
    specs: [
      { label: 'Высота башни', val: '105 метров' },
      { label: 'Уровень смотровой', val: '97 метров' },
      { label: 'Диаметр шара', val: '22 метра' },
      { label: 'Вес сферы', val: '300 тонн' },
      { label: 'Количество опор', val: '18 стальных ветвей' },
      { label: 'Стекло сферы', val: 'Хамелеон (Solarglas)' },
      { label: 'Лифты', val: '2 скоростных панорамных' },
      { label: '3D Mesh', val: 'Blender 5.3 Cycles' }
    ],
    facts: [
      'Шар монумента диаметром 22 метра поднимали на высоту 97 метров по уникальной инженерной технологии с помощью специальных домкратов в разобранном виде.',
      'В панорамном зале установлена композиция «Бата» — деревянный глобус с автографами представителей 17 мировых конфессий.',
      'Монумент способен выдерживать шквальные степные ветра до 40 м/с и сейсмические колебания до 7 баллов.',
      'Отпечаток ладони «Аялы-Алақан» выполнен из сплава золота и серебра — традиция гласит, что прикосновение к нему приносит удачу.'
    ]
  },

  khanshatyr: {
    id: 'khanshatyr',
    title: 'ТРЦ «Хан Шатыр»',
    titleKz: '«Хан Шатыр» сауда-ойын-сауық орталығы',
    height: '150 м (со шпилем)',
    year: '2010 год',
    architects: 'Сэр Норман Фостер (Foster + Partners)',
    structuralType: 'Вантовая коническая шатровая конструкция',
    weight: '1 200 тонн металлоконструкций',
    videoViewport: './assets/media/shot2_khanshatyr_viewport.mp4',
    videoDepth: './assets/media/shot2_khanshatyr_depth.mp4',
    thumb: './assets/media/thumb_khanshatyr.jpg',
    snippet: 'Крупнейшее в мире шатровое сооружение в форме асимметричного косого конуса, выполненное из светопрозрачного полимера ETFE с внутренним круглогодичным тропическим курортом.',
    description: `«Хан Шатыр» (в переводе «Шатер Хана») — колоссальный торгово-развлекательный центр, торжественно открытый 5 июля 2010 года. Здание включено в Книгу рекордов Гиннесса как самое большое шатровое сооружение на планете. Его общая площадь превышает 127 000 квадратных метров, а высота шпиля достигает 150 метров.

Проект разработан выдающимся британским архитектором Норманом Фостером. Форма сооружения переосмысливает традиционную казахскую юрту в эстетике современной био-хай-тек архитектуры. Центральная треногая опора весом 2 000 тонн наклонена на 15 градусов и удерживает гигантскую сеть натянутых стальных вантовых тросов.

Оболочка шатра состоит из трехслойного инновационного полимера ETFE (этилентетрафторэтилена), обладающего уникальными теплоизоляционными свойствами. Благодаря этому внутри комплекса круглый год поддерживается комфортная температура +24°C, даже когда снаружи свирепствуют сибирские бураны с температурой -40°C. На верхнем ярусе расположен знаменитый крытый аквапарк Sky Beach Club с искусственным океанским прибоем и белоснежным песком, доставленным прямиком с Мальдивских островов.`,
    specs: [
      { label: 'Высота шатра', val: '150 метров' },
      { label: 'Площадь основания', val: '127 000 м²' },
      { label: 'Опорный пилон', val: 'Тренога (наклон 15°)' },
      { label: 'Материал купола', val: '3-слойный ETFE' },
      { label: 'Внутренний климат', val: '+24°C круглый год' },
      { label: 'Аквапарк', val: 'Sky Beach Club' },
      { label: 'Песок пляжа', val: 'Природный мальдивский' },
      { label: '3D Mesh', val: 'Вантовая сетка Blender' }
    ],
    facts: [
      'Здание вошло в список лучших эко-построек мира по версии журнала Forbes Style.',
      'Материал ETFE пропускает до 95% ультрафиолета, благодаря чему пальмы и растения внутри шатра растут под естественным солнечным светом.',
      'Песок для пляжного клуба Sky Beach Club нагревается скрытой системой теплого пола и не обжигает ступни.',
      'Конструкция шатра разработана турецкой компанией Sembol Construction и выдерживает колоссальные снеговые нагрузки степной зимы.'
    ]
  },

  nuralem: {
    id: 'nuralem',
    title: 'Сфера «Нур Алем» & Abu Dhabi Plaza',
    titleKz: '«Нұр Әлем» сферасы және Әбу-Даби Плаза',
    height: '100 м (сфера) / 311 м (небоскреб)',
    year: '2017 / 2021 гг.',
    architects: 'Albert Speer Jr., Adrian Smith + Gordon Gill',
    structuralType: 'Полная геодезическая сфера + Мега-небоскреб',
    weight: '13 000 тонн стали и стекла',
    videoViewport: './assets/media/shot3_nuralem_viewport.mp4',
    videoDepth: './assets/media/shot3_nuralem_depth.mp4',
    thumb: './assets/media/thumb_nuralem.jpg',
    snippet: 'Самое большое в мире сферическое здание диаметром 80 метров — Музей энергии будущего EXPO-2017 с встроенными бесшумными ветрогенераторами, на фоне высочайшего небоскреба Центральной Азии (311 м).',
    description: `Архитектурный ансамбль района EXPO и делового центра столицы объединяет два грандиозных инженерных шедевра XXI века: Музей «Нур Алем» (Сияющий Мир) и многофункциональный комплекс «Abu Dhabi Plaza».

«Нур Алем» — это единственное в мире здание, выполненное в форме идеальной сферы диаметром 80 метров. Оно было центральным павильоном Международной специализированной выставки EXPO-2017 «Энергия будущего». Оболочка сферы смонтирована из 2 824 гнутых панелей двоякой кривизны из немецкого многослойного стекла. В верхушку сферы интегрированы два бесшумных ветрогенератора, вырабатывающих электроэнергию для нужд музея. Внутри разместились 8 тематических этажей, посвященных энергии космоса, солнца, ветра, воды и биомассы.

На заднем плане возвышается грандиозная башня «Abu Dhabi Plaza» — самый высокий небоскреб в Казахстане и всей Центральной Азии высотой 311 метров (75 этажей). Спроектированный мировыми лидерами высотного строительства, небоскреб воплощает динамику и экономическую мощь современной Евразии.`,
    specs: [
      { label: 'Диаметр сферы', val: '80 метров' },
      { label: 'Высота сферы', val: '100 метров' },
      { label: 'Панели остекления', val: '2 824 стекла 3D-формы' },
      { label: 'Ветрогенераторы', val: '2 безвибрационных ротора' },
      { label: 'Высота Abu Dhabi', val: '311 метров' },
      { label: 'Этажность башни', val: '75 этажей' },
      { label: 'Концепция', val: 'Zero-Emission Eco-Future' },
      { label: '3D Mesh', val: 'Геодезическая сеть + MoE' }
    ],
    facts: [
      'Каждое из 2 824 стекол сферы «Нур Алем» имеет уникальную пространственную форму и геометрию.',
      'На верхнем 8-м этаже сферы оборудован стеклянный мост со смотровой площадкой прямо над пропастью атриума.',
      'Abu Dhabi Plaza виден с расстояния более 35 километров на подъезде к Астане по карагандинской трассе.',
      'Фасад сферы работает как гигантский медиа-экран площадью более 20 000 м², проецирующий световые шоу в ночное небо.'
    ]
  }
};

class AstanaApp {
  constructor() {
    this.viewer = null;
    this.audioCtx = null;
    this.isAudioPlaying = false;
    this.soundNodes = null;

    this.initViewer();
    this.bindUI();
    this.bindModal();
    this.bindAudio();
  }

  initViewer() {
    try {
      this.viewer = new AstanaViewer3D('webgl-canvas', 'viewport-loader', 'viewport-hud');
      // Load default model
      this.viewer.loadModel('baiterek');
    } catch (e) {
      console.warn('WebGL init note:', e);
    }
  }

  bindUI() {
    // Model Selector Tabs
    const tabBtns = document.querySelectorAll('.model-tab-btn');
    tabBtns.forEach((btn) => {
      btn.addEventListener('click', (e) => {
        tabBtns.forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');
        const modelKey = btn.dataset.model;
        if (this.viewer) {
          this.viewer.loadModel(modelKey);
        }
      });
    });

    // Shading Mode Buttons
    const shadeBtns = document.querySelectorAll('.shading-btn');
    shadeBtns.forEach((btn) => {
      btn.addEventListener('click', () => {
        shadeBtns.forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');
        const mode = btn.dataset.shading;
        if (this.viewer) {
          this.viewer.applyShadingMode(mode);
        }
      });
    });

    // Reset View Button
    const btnReset = document.getElementById('btn-reset-view');
    if (btnReset) {
      btnReset.addEventListener('click', () => {
        if (this.viewer) this.viewer.resetView();
      });
    }

    // Auto Rotate Button
    const btnRotate = document.getElementById('btn-auto-rotate');
    if (btnRotate) {
      btnRotate.addEventListener('click', () => {
        if (this.viewer) {
          const isRotating = this.viewer.toggleAutoRotate();
          btnRotate.classList.toggle('active', isRotating);
        }
      });
    }

    // Fullscreen Button
    const btnFs = document.getElementById('btn-fullscreen');
    if (btnFs) {
      btnFs.addEventListener('click', () => {
        const wrap = document.querySelector('.viewport-wrapper');
        if (!document.fullscreenElement) {
          wrap.requestFullscreen().catch((err) => console.log(err));
        } else {
          document.exitFullscreen();
        }
      });
    }

    // Catalog Card Clicks
    const cards = document.querySelectorAll('.model-card');
    cards.forEach((card) => {
      card.addEventListener('click', (e) => {
        const id = card.dataset.modelId;
        // If clicked on "3D Осмотр", load in 3D canvas and scroll up
        if (e.target.closest('.btn-inspect-3d')) {
          e.stopPropagation();
          if (this.viewer) {
            this.viewer.loadModel(id);
            // activate corresponding tab
            tabBtns.forEach((b) => b.classList.toggle('active', b.dataset.model === id));
            document.querySelector('.hero-stage').scrollIntoView({ behavior: 'smooth' });
          }
          return;
        }
        // Otherwise open full architectural description modal
        this.openDossier(id);
      });
    });
  }

  bindModal() {
    this.modalOverlay = document.getElementById('detail-modal');
    this.btnCloseModal = document.getElementById('btn-close-modal');
    this.modalVideo = document.getElementById('modal-video-player');

    if (this.btnCloseModal) {
      this.btnCloseModal.addEventListener('click', () => this.closeDossier());
    }

    if (this.modalOverlay) {
      this.modalOverlay.addEventListener('click', (e) => {
        if (e.target === this.modalOverlay) {
          this.closeDossier();
        }
      });
    }

    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') this.closeDossier();
    });

    // Modal Video Tabs (Viewport vs Depth)
    const mediaTabs = document.querySelectorAll('.tab-media-btn');
    mediaTabs.forEach((tab) => {
      tab.addEventListener('click', () => {
        mediaTabs.forEach((t) => t.classList.remove('active'));
        tab.classList.add('active');
        const mediaType = tab.dataset.media;
        const currentData = ARCHITECTURAL_DATA[this.activeModalKey];
        if (currentData && this.modalVideo) {
          if (mediaType === 'viewport') {
            this.modalVideo.src = currentData.videoViewport;
          } else if (mediaType === 'depth') {
            this.modalVideo.src = currentData.videoDepth;
          }
          this.modalVideo.play().catch(() => {});
        }
      });
    });
  }

  openDossier(key) {
    const data = ARCHITECTURAL_DATA[key];
    if (!data) return;
    this.activeModalKey = key;

    // Fill titles
    document.getElementById('modal-title').textContent = data.title;
    document.getElementById('modal-kz-title').textContent = data.titleKz;

    // Fill Stats
    const statsContainer = document.getElementById('modal-dossier-stats');
    if (statsContainer) {
      statsContainer.innerHTML = `
        <div class="dossier-stat"><span>Высота</span><strong>${data.height}</strong></div>
        <div class="dossier-stat"><span>Год ввода</span><strong>${data.year}</strong></div>
        <div class="dossier-stat"><span>Архитектор</span><strong>${data.architects}</strong></div>
        <div class="dossier-stat"><span>Вес / Масса</span><strong>${data.weight}</strong></div>
      `;
    }

    // Fill Description
    const descEl = document.getElementById('modal-desc-text');
    if (descEl) {
      descEl.innerHTML = data.description
        .split('\n\n')
        .map((p) => `<p>${p}</p>`)
        .join('');
    }

    // Fill Specs table
    const specsEl = document.getElementById('modal-specs-list');
    if (specsEl) {
      specsEl.innerHTML = data.specs
        .map(
          (s) => `
        <div class="spec-row" style="display:flex; justify-content:space-between; padding:8px 0; border-bottom:1px solid rgba(255,255,255,0.06); font-size:0.88rem;">
          <span style="color:var(--text-muted); font-family:var(--font-mono);">${s.label}:</span>
          <strong style="color:var(--text-primary); font-weight:600;">${s.val}</strong>
        </div>
      `
        )
        .join('');
    }

    // Fill Facts
    const factsEl = document.getElementById('modal-facts-list');
    if (factsEl) {
      factsEl.innerHTML = data.facts.map((f) => `<li>${f}</li>`).join('');
    }

    // Reset video tab & source
    const mediaTabs = document.querySelectorAll('.tab-media-btn');
    mediaTabs.forEach((t) => t.classList.remove('active'));
    if (mediaTabs[0]) mediaTabs[0].classList.add('active');

    if (this.modalVideo) {
      this.modalVideo.src = data.videoViewport;
      this.modalVideo.play().catch(() => {});
    }

    this.modalOverlay.classList.add('open');
    document.body.style.overflow = 'hidden';
  }

  closeDossier() {
    if (!this.modalOverlay) return;
    this.modalOverlay.classList.remove('open');
    document.body.style.overflow = '';
    if (this.modalVideo) {
      this.modalVideo.pause();
    }
  }

  bindAudio() {
    const audioBtn = document.getElementById('btn-audio-toggle');
    if (!audioBtn) return;

    audioBtn.addEventListener('click', () => {
      if (!this.isAudioPlaying) {
        this.startFuturisticSoundscape();
        audioBtn.classList.add('active');
        audioBtn.title = 'Выключить звук атмосферы';
      } else {
        this.stopFuturisticSoundscape();
        audioBtn.classList.remove('active');
        audioBtn.title = 'Включить атмосферный звук';
      }
    });
  }

  startFuturisticSoundscape() {
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      this.audioCtx = new AudioContext();

      // Atmospheric Steppe Wind & Low Drone Synth Generator
      const masterGain = this.audioCtx.createGain();
      masterGain.gain.setValueAtTime(0.01, this.audioCtx.currentTime);
      masterGain.gain.exponentialRampToValueAtTime(0.2, this.audioCtx.currentTime + 2.0);
      masterGain.connect(this.audioCtx.destination);

      // Low Drone
      const osc1 = this.audioCtx.createOscillator();
      osc1.type = 'sawtooth';
      osc1.frequency.setValueAtTime(55, this.audioCtx.currentTime); // A1 note

      const filter1 = this.audioCtx.createBiquadFilter();
      filter1.type = 'lowpass';
      filter1.frequency.setValueAtTime(140, this.audioCtx.currentTime);

      osc1.connect(filter1);
      filter1.connect(masterGain);
      osc1.start();

      // Soft High Ethereal Resonance (Baiterek golden aura)
      const osc2 = this.audioCtx.createOscillator();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(220, this.audioCtx.currentTime);

      const filter2 = this.audioCtx.createBiquadFilter();
      filter2.type = 'bandpass';
      filter2.frequency.setValueAtTime(440, this.audioCtx.currentTime);
      filter2.Q.value = 5;

      const gain2 = this.audioCtx.createGain();
      gain2.gain.setValueAtTime(0.05, this.audioCtx.currentTime);

      osc2.connect(filter2);
      filter2.connect(gain2);
      gain2.connect(masterGain);
      osc2.start();

      this.soundNodes = { masterGain, osc1, osc2 };
      this.isAudioPlaying = true;
    } catch (err) {
      console.warn('Web Audio not supported or blocked:', err);
    }
  }

  stopFuturisticSoundscape() {
    if (this.soundNodes && this.audioCtx) {
      this.soundNodes.masterGain.gain.exponentialRampToValueAtTime(
        0.001,
        this.audioCtx.currentTime + 0.8
      );
      setTimeout(() => {
        try {
          this.soundNodes.osc1.stop();
          this.soundNodes.osc2.stop();
          this.audioCtx.close();
        } catch (e) {}
        this.isAudioPlaying = false;
      }, 900);
    }
  }
}

// Global hook
document.addEventListener('DOMContentLoaded', () => {
  window.astanaApp = new AstanaApp();
});
