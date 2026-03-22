/**
 * Comic viewer — Don Midori vs Don Taichi
 *
 * Responsibilities:
 * - Define list of comic pages (PAGES) and total count
 * - Render each page into currentContent or nextContent
 * - Flip animations: Next and Previous with 3D CSS
 * - Update counter and disable Prev/Next at boundaries
 * - SOUND SYSTEM: real MP3 files from sounds/ folder
 *
 * ── SOUND MAP ────────────────────────────────────────────────────────────
 *  Event                   │ File used
 * ─────────────────────────┼──────────────────────────────────────────────
 *  Site load (1st click)   │ breakzstudios-cinematic-movie-logo-185801.mp3
 *  Page flip (next/prev)   │ oxidvideos-page-flip-smaller-page-453027.mp3
 *  Button hover            │ universfield-cartoon-blinking-487897.mp3
 *  Home section active     │ liecio-calming-rain-257596.mp3  (loop)
 *  Comic section active    │ brvhrtz-action-loop-e-90-bpm-brvhrtz-233462.mp3 (loop)
 *  Team section active     │ dragon-studio-cat-purr-sfx-482870.mp3 (loop)
 *  Reaching last page      │ magiaz-cat-fighting-331254.mp3
 * ─────────────────────────────────────────────────────────────────────────
 *
 * ── TRUNCATED FILENAMES ──────────────────────────────────────────────────
 *  Some filenames were cut off in the file browser. If a sound does not
 *  play, check the SOUNDS object below and correct the path to match
 *  the actual filename in your sounds/ folder.
 * ─────────────────────────────────────────────────────────────────────────
 */

(function () {
  'use strict';

  /* =====================================================================
     1. SOUND CONFIG
     Update any path here if the truncated filename doesn't match exactly.
     ===================================================================== */
  var SOUNDS = {
    intro:     'sounds/breakzstudios-cinematic-movie-logo-185801.mp3',
    flip:      'sounds/oxidvideos-page-flip-smaller-page-453027.mp3',
    actionBg:  'sounds/brvhrtz-action-loop-c-120-bpm-brvhrtz-249496.mp3',
    suspense:  'sounds/hgoliya08-suspense-sound-effect-287450.mp3',
    cinHit:    'sounds/lordsonny-movie-cinematic-hit-159852.mp3',
    actionBg2: 'sounds/brvhrtz-action-loop-e-90-bpm-brvhrtz-233462.mp3',
    hover:     'sounds/universfield-cartoon-blinking-487897.mp3',
    rainBg:    'sounds/liecio-calming-rain-257596.mp3',
    purrBg:    'sounds/dragon-studio-cat-purr-sfx-482870.mp3',
    catFight:  'sounds/magiaz-cat-fighting-331254.mp3',
    whoosh:    'sounds/lordsonny-whoosh-cinematic-161021.mp3',
    punch:     'sounds/u_xg7ssi08yr-cartoon-punch-404407.mp3',
  };

  /* Volume per sound type (0.0 to 1.0) — tweak to taste */
  var VOLUMES = {
    intro:    0.60,
    flip:     0.80,
    hover:    0.35,
    bg:       0.18,   /* all looping backgrounds share this level */
    catFight: 0.75,
  };

  /* =====================================================================
     2. SOUND ENGINE
     ===================================================================== */

  var isMuted       = false;
  var audioCache    = {};       /* Preloaded Audio objects keyed by SOUNDS key  */
  var currentBgKey  = null;     /* Which background loop is currently playing    */
  var hasInteracted = false;    /* Browsers block audio before first interaction */

  /** Preload all sounds so there is no delay on first play. */
  function preloadSounds() {
    Object.keys(SOUNDS).forEach(function (key) {
      var audio = new Audio(SOUNDS[key]);
      audio.preload = 'auto';
      audioCache[key] = audio;
    });

    /* Mark looping backgrounds */
    ['rainBg', 'purrBg', 'actionBg'].forEach(function (key) {
      if (audioCache[key]) {
        audioCache[key].loop   = true;
        audioCache[key].volume = VOLUMES.bg;
      }
    });

    /* Per-sound volumes */
    if (audioCache.intro)    audioCache.intro.volume    = VOLUMES.intro;
    if (audioCache.flip)     audioCache.flip.volume     = VOLUMES.flip;
    if (audioCache.hover)    audioCache.hover.volume    = VOLUMES.hover;
    if (audioCache.catFight) audioCache.catFight.volume = VOLUMES.catFight;
  }

  /** Play a one-shot sound (resets to start if it was already playing). */
  function playSound(key) {
    if (isMuted || !hasInteracted) return;
    var audio = audioCache[key];
    if (!audio) return;
    audio.currentTime = 0;
    audio.play().catch(function () { /* Autoplay still blocked — ignore */ });
  }

  /** Fade an Audio element's volume to 0 over `ms` ms, then call `cb`. */
  function fadeOut(audio, ms, cb) {
    var steps    = 20;
    var stepTime = ms / steps;
    var startVol = audio.volume;
    var step     = 0;
    var timer = setInterval(function () {
      step++;
      audio.volume = Math.max(0, startVol * (1 - step / steps));
      if (step >= steps) {
        clearInterval(timer);
        audio.volume = 0;
        if (cb) cb();
      }
    }, stepTime);
  }

  /** Fade an Audio element's volume from 0 to `targetVol` over `ms` ms. */
  function fadeIn(audio, targetVol, ms) {
    var steps    = 20;
    var stepTime = ms / steps;
    var step     = 0;
    var timer = setInterval(function () {
      step++;
      audio.volume = Math.min(targetVol, targetVol * (step / steps));
      if (step >= steps) {
        clearInterval(timer);
        audio.volume = targetVol;
      }
    }, stepTime);
  }

  /**
   * Switch the looping background track.
   * Fades out the old one, fades in the new one.
   * @param {string|null} key - Key from SOUNDS, or null to stop all.
   */
  function switchBackground(key) {
    if (key === currentBgKey) return;

    var oldKey = currentBgKey;
    currentBgKey = key;

    if (oldKey && audioCache[oldKey]) {
      fadeOut(audioCache[oldKey], 800, function () {
        audioCache[oldKey].pause();
        audioCache[oldKey].currentTime = 0;
      });
    }

    if (key && audioCache[key] && !isMuted && hasInteracted) {
      audioCache[key].volume = 0;
      audioCache[key].play().catch(function () {});
      fadeIn(audioCache[key], VOLUMES.bg, 1200);
    }
  }

  /** Toggle mute state and update the mute button icon. */
  function toggleMute() {
    isMuted = !isMuted;

    Object.keys(audioCache).forEach(function (key) {
      audioCache[key].muted = isMuted;
    });

    if (!isMuted && currentBgKey && audioCache[currentBgKey]) {
      audioCache[currentBgKey].play().catch(function () {});
    }

    var btn = document.getElementById('muteBtn');
    if (btn) btn.textContent = isMuted ? '🔇' : '🔊';
  }

  /* =====================================================================
     3. MUTE BUTTON — injected into the header at runtime
     ===================================================================== */

  function injectMuteButton() {
    var header = document.querySelector('.header');
    if (!header) return;

    var btn = document.createElement('button');
    btn.id   = 'muteBtn';
    btn.type = 'button';
    btn.textContent = '🔊';
    btn.title = 'Toggle sound';
    btn.setAttribute('aria-label', 'Toggle sound');
    btn.style.cssText = [
      'font-size:1.4rem',
      'background:transparent',
      'border:2px solid #ffd700',
      'border-radius:4px',
      'color:#ffd700',
      'cursor:pointer',
      'padding:0.2rem 0.55rem',
      'line-height:1',
      'flex-shrink:0',
      'transition:transform 0.1s ease, background 0.1s ease',
    ].join(';');

    btn.addEventListener('mouseenter', function () {
      btn.style.background = 'rgba(255,215,0,0.15)';
    });
    btn.addEventListener('mouseleave', function () {
      btn.style.background = 'transparent';
    });
    btn.addEventListener('click', toggleMute);

    header.appendChild(btn);
  }

  /* =====================================================================
     4. SECTION-AWARE BACKGROUND MUSIC
     Matches scroll position to section and switches the background track.
     ===================================================================== */

  var SECTION_BG = {
    home:  'rainBg',
    comic: 'actionBg',
    team:  'purrBg',
  };

  function getSectionInView() {
    var sections     = ['home', 'comic', 'team'];
    var headerOffset = 90;
    var scrollY      = window.scrollY || window.pageYOffset;
    var current      = 'home';
    sections.forEach(function (id) {
      var el = document.getElementById(id);
      if (el && el.offsetTop - headerOffset <= scrollY) current = id;
    });
    return current;
  }

  function onScroll() {
    switchBackground(SECTION_BG[getSectionInView()]);
  }

  /* =====================================================================
     5. COMIC VIEWER  (original logic, sound calls added)
     ===================================================================== */

  var PAGES = [
    { id: 'cover',    label: 'Cover',      image: 'comic-images/1.JPG' },
    { id: 'scene1',   label: 'Scene 1',    image: 'comic-images/2.JPG' },
    { id: 'scene2-4', label: 'Scene 2–4',  image: 'comic-images/3.JPG' },
    { id: 'scene5-6', label: 'Scene 5–6',  image: 'comic-images/4.JPG' },
    { id: 'scene7-8', label: 'Scene 7–8',  image: 'comic-images/5.JPG' },
    { id: 'scene9',   label: 'Scene 9',    image: 'comic-images/6.JPG' },
    { id: 'scene10a', label: 'Scene 10A',  image: 'comic-images/7.JPG' },
    { id: 'scene10b', label: 'Scene 10B',  image: 'comic-images/8.JPG' },
    { id: 'end',      label: 'The End',    image: 'comic-images/9.JPG' },
  ];

  var totalPages    = PAGES.length;
  var currentIndex  = 0;
  var flipDuration  = 600;
  var isFlipping    = false;

  var viewer           = document.getElementById('comicViewer');
  var pageNext         = document.getElementById('pageNext');
  var currentContent   = document.getElementById('currentContent');
  var nextContent      = document.getElementById('nextContent');
  var currentPageNumEl = document.getElementById('currentPageNum');
  var totalPagesEl     = document.getElementById('totalPages');
  var btnPrev          = document.getElementById('btnPrev');
  var btnNext          = document.getElementById('btnNext');

  function renderPage(index, container) {
    if (index < 0 || index >= totalPages) return;
    var page = PAGES[index];
    container.innerHTML = '';

    var wrap = document.createElement('div');
    wrap.className = 'comic-page';

    if (page.image) {
      var img = document.createElement('img');
      img.className = 'comic-page__image-wrap';
      img.src = page.image;
      img.alt = page.label || 'Comic page';
      img.onerror = function () {
        this.style.display = 'none';
        var fallback = document.createElement('div');
        fallback.className = 'comic-page__placeholder';
        fallback.textContent = 'Image not found';
        wrap.appendChild(fallback);
      };
      wrap.appendChild(img);
    }

    if (page.label) {
      var lbl = document.createElement('div');
      lbl.className = 'comic-page__label';
      lbl.textContent = page.label;
      wrap.appendChild(lbl);
    }

    container.appendChild(wrap);
  }

  function updateUI() {
    currentPageNumEl.textContent = currentIndex + 1;
    totalPagesEl.textContent     = totalPages;
    btnPrev.disabled = currentIndex === 0               || isFlipping;
    btnNext.disabled = currentIndex === totalPages - 1  || isFlipping;
  }

  function flipToPage(nextIndex, direction) {
    if (nextIndex < 0 || nextIndex >= totalPages || isFlipping) return;

    isFlipping = true;
    updateUI();

    /* 🔊 Page flip sound */
    playSound('flip');

    /* 🔊 Cat fight climax on the very last page (slight delay for drama) */
    if (nextIndex === totalPages - 1) {
      setTimeout(function () { playSound('catFight'); }, 500);
    }

    renderPage(nextIndex, nextContent);
    pageNext.style.visibility = 'hidden';

    requestAnimationFrame(function () {
      if (direction === 'next') {
        viewer.classList.add('comic-viewer--flip-next');
      } else {
        pageNext.classList.add('flip-prev-initial');
        requestAnimationFrame(function () {
          viewer.classList.add('comic-viewer--flip-prev');
        });
      }
      pageNext.style.visibility = 'visible';
    });

    setTimeout(function () {
      currentIndex = nextIndex;
      currentContent.innerHTML = nextContent.innerHTML;
      viewer.classList.remove('comic-viewer--flip-next', 'comic-viewer--flip-prev');
      pageNext.classList.remove('flip-prev-initial');
      isFlipping = false;
      updateUI();
    }, flipDuration);
  }

  function goNext() { if (currentIndex + 1 < totalPages) flipToPage(currentIndex + 1, 'next'); }
  function goPrev() { if (currentIndex > 0)              flipToPage(currentIndex - 1, 'prev'); }

  /* =====================================================================
     6. BUTTON HOVER SOUNDS
     ===================================================================== */

  function attachHoverSounds() {
    [btnPrev, btnNext].forEach(function (btn) {
      btn.addEventListener('mouseenter', function () {
        if (!btn.disabled) playSound('hover');
      });
    });
  }

  /* =====================================================================
     7. INIT
     ===================================================================== */

  function init() {
    injectMuteButton();
    preloadSounds();

    /* Comic viewer */
    totalPagesEl.textContent = totalPages;
    renderPage(0, currentContent);
    if (totalPages > 1) renderPage(1, nextContent);
    updateUI();

    btnPrev.addEventListener('click', goPrev);
    btnNext.addEventListener('click', goNext);
    attachHoverSounds();

    /* Section background music on scroll */
    window.addEventListener('scroll', onScroll, { passive: true });

    /*
     * Audio requires a user gesture first (browser autoplay policy).
     * We listen for ANY click or keydown, then kick everything off.
     */
    function onFirstInteraction() {
      if (hasInteracted) return;
      hasInteracted = true;
      document.removeEventListener('click',   onFirstInteraction);
      document.removeEventListener('keydown', onFirstInteraction);

      /* Cinematic intro hit */
      playSound('intro');

      /* Start the background for the current section after intro settles */
      setTimeout(function () {
        switchBackground(SECTION_BG[getSectionInView()]);
      }, 900);
    }

    document.addEventListener('click',   onFirstInteraction);
    document.addEventListener('keydown', onFirstInteraction);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
