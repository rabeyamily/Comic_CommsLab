/**
 * Comic viewer — Don Midori vs Don Taichi
 *
 * Page order:
 *   0 → 1.JPG  Cover
 *   1 → 2.JPG  Scene 1
 *   2 → 3.JPG  Scene 2
 *   3 → 4.JPG  Scene 3
 *   4 → 5.JPG  Scene 4
 *   5 → 6.JPG  Scene 5
 *   6 → 7.JPG  CHOICE SCREEN  (cat fight — pick the winner)
 *   7 → 8.JPG  Don Midori wins  (Choice A)
 *   8 → 9.JPG  Don Taichi wins  (Choice B)
 *
 * Branching logic:
 *   Pages 0–5 : linear (Previous / Next)
 *   Page 6    : choice screen → Previous | Don Midori | Don Taichi
 *   Pages 7–8 : endings → Restart only
 *
 * Sound map:
 *   First interaction   → intro cinematic hit
 *   Every page flip     → page flip sound
 *   Arriving at page 6  → cat fight sound (500 ms after flip)
 *   Home section        → rain ambient loop
 *   Comic section       → action loop
 *   Team section        → cat purr loop
 *   Mute toggle         → button in header
 */

(function () {
  'use strict';

  /* =====================================================================
     1. SOUND CONFIG
     ⚠️  Check the truncated filenames below match your actual files.
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

  var VOLUMES = {
    intro:    0.60,
    flip:     0.80,
    bg:       0.18,
    catFight: 0.75,
  };

  /* =====================================================================
     2. SOUND ENGINE
     ===================================================================== */

  var isMuted       = false;
  var audioCache    = {};
  var currentBgKey  = null;
  var hasInteracted = false;

  function preloadSounds() {
    Object.keys(SOUNDS).forEach(function (key) {
      var audio = new Audio(SOUNDS[key]);
      audio.preload = 'auto';
      audioCache[key] = audio;
    });
    ['rainBg', 'purrBg', 'actionBg'].forEach(function (key) {
      if (audioCache[key]) {
        audioCache[key].loop   = true;
        audioCache[key].volume = VOLUMES.bg;
      }
    });
    if (audioCache.intro)    audioCache.intro.volume    = VOLUMES.intro;
    if (audioCache.flip)     audioCache.flip.volume     = VOLUMES.flip;
    if (audioCache.catFight) audioCache.catFight.volume = VOLUMES.catFight;
  }

  function playSound(key) {
    if (isMuted || !hasInteracted) return;
    var audio = audioCache[key];
    if (!audio) return;
    audio.currentTime = 0;
    audio.play().catch(function () {});
  }

  function fadeOut(audio, ms, cb) {
    var steps = 20, stepTime = ms / steps, startVol = audio.volume, step = 0;
    var timer = setInterval(function () {
      step++;
      audio.volume = Math.max(0, startVol * (1 - step / steps));
      if (step >= steps) { clearInterval(timer); audio.volume = 0; if (cb) cb(); }
    }, stepTime);
  }

  function fadeIn(audio, targetVol, ms) {
    var steps = 20, stepTime = ms / steps, step = 0;
    var timer = setInterval(function () {
      step++;
      audio.volume = Math.min(targetVol, targetVol * (step / steps));
      if (step >= steps) { clearInterval(timer); audio.volume = targetVol; }
    }, stepTime);
  }

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

  function toggleMute() {
    isMuted = !isMuted;
    Object.keys(audioCache).forEach(function (key) { audioCache[key].muted = isMuted; });
    if (!isMuted && currentBgKey && audioCache[currentBgKey]) {
      audioCache[currentBgKey].play().catch(function () {});
    }
    var btn = document.getElementById('muteBtn');
    if (btn) btn.textContent = isMuted ? '🔇' : '🔊';
  }

  /* =====================================================================
     3. MUTE BUTTON — injected into the header
     ===================================================================== */

  function injectMuteButton() {
    var header = document.querySelector('.header');
    if (!header) return;
    var btn = document.createElement('button');
    btn.id = 'muteBtn';
    btn.type = 'button';
    btn.textContent = '🔊';
    btn.title = 'Toggle sound';
    btn.setAttribute('aria-label', 'Toggle sound');
    btn.style.cssText = [
      'font-size:1.4rem', 'background:transparent', 'border:2px solid #ffd700',
      'border-radius:4px', 'color:#ffd700', 'cursor:pointer',
      'padding:0.2rem 0.55rem', 'line-height:1', 'flex-shrink:0',
      'transition:transform 0.1s ease, background 0.1s ease',
    ].join(';');
    btn.addEventListener('mouseenter', function () { btn.style.background = 'rgba(255,215,0,0.15)'; });
    btn.addEventListener('mouseleave', function () { btn.style.background = 'transparent'; });
    btn.addEventListener('click', toggleMute);
    header.appendChild(btn);
  }

  /* =====================================================================
     4. SECTION-AWARE BACKGROUND MUSIC
     ===================================================================== */

  var SECTION_BG = { home: 'rainBg', comic: 'actionBg', team: 'purrBg' };

  function getSectionInView() {
    var sections = ['home', 'comic', 'team'];
    var headerOffset = 90;
    var scrollY = window.scrollY || window.pageYOffset;
    var current = 'home';
    sections.forEach(function (id) {
      var el = document.getElementById(id);
      if (el && el.offsetTop - headerOffset <= scrollY) current = id;
    });
    return current;
  }

  function onScroll() { switchBackground(SECTION_BG[getSectionInView()]); }

  /* =====================================================================
     5. COMIC VIEWER
     ===================================================================== */

  /* Branch indices */
  var CHOICE_INDEX = 6;   /* 7.JPG — choice screen, cat fight */
  var END_A_INDEX  = 7;   /* 8.JPG — Don Midori wins          */
  var END_B_INDEX  = 8;   /* 9.JPG — Don Taichi wins          */

  var PAGES = [
    { id: 'cover',   image: 'comic-images/1.JPG' },
    { id: 'scene1',  image: 'comic-images/2.JPG' },
    { id: 'scene2',  image: 'comic-images/3.JPG' },
    { id: 'scene3',  image: 'comic-images/4.JPG' },
    { id: 'scene4',  image: 'comic-images/5.JPG' },
    { id: 'scene5',  image: 'comic-images/6.JPG' },
    { id: 'choice',  image: 'comic-images/7.JPG' },  /* cat fight — choose winner */
    { id: 'endA',    image: 'comic-images/8.JPG' },  /* Don Midori wins           */
    { id: 'endB',    image: 'comic-images/9.JPG' },  /* Don Taichi wins           */
  ];

  var totalPages   = PAGES.length;
  var currentIndex = 0;
  var flipDuration = 600;
  var isFlipping   = false;

  /* DOM refs */
  var viewer           = document.getElementById('comicViewer');
  var pageNext         = document.getElementById('pageNext');
  var currentContent   = document.getElementById('currentContent');
  var nextContent      = document.getElementById('nextContent');
  var currentPageNumEl = document.getElementById('currentPageNum');
  var totalPagesEl     = document.getElementById('totalPages');
  var btnPrev          = document.getElementById('btnPrev');
  var btnNext          = document.getElementById('btnNext');
  var btnChoiceA       = document.getElementById('btnChoiceA');
  var btnChoiceB       = document.getElementById('btnChoiceB');
  var btnRestart       = document.getElementById('btnRestart');
  var counterEl        = document.querySelector('.comic-controls__counter');

  /**
   * Render a page image into a container. No labels rendered.
   */
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
      img.alt = 'Comic page';
      img.onerror = function () {
        this.style.display = 'none';
        var fallback = document.createElement('div');
        fallback.className = 'comic-page__placeholder';
        fallback.textContent = 'Image not found';
        wrap.appendChild(fallback);
      };
      wrap.appendChild(img);
    }

    container.appendChild(wrap);
  }

  /**
   * Show/hide the right buttons for the current page.
   *
   *  Cover (0)      → Next only
   *  Scenes (1–5)   → Previous + Next
   *  Choice (6)     → Previous + Don Midori + Don Taichi
   *  Endings (7–8)  → Restart only  (counter hidden)
   */
  function renderControls() {
    var isChoice  = currentIndex === CHOICE_INDEX;
    var isEnding  = currentIndex === END_A_INDEX || currentIndex === END_B_INDEX;
    var isFirst   = currentIndex === 0;

    /* Page counter — hide on ending pages */
    if (counterEl) counterEl.style.display = isEnding ? 'none' : '';
    currentPageNumEl.textContent = currentIndex + 1;

    /* Previous — hide on first page and endings */
    btnPrev.style.display = (isFirst || isEnding) ? 'none' : '';
    btnPrev.disabled      = isFlipping;

    /* Next — hide on choice screen and endings */
    btnNext.style.display = (isChoice || isEnding) ? 'none' : '';
    btnNext.disabled      = isFlipping;

    /* Choice buttons — only on choice screen */
    btnChoiceA.style.display = isChoice ? '' : 'none';
    btnChoiceB.style.display = isChoice ? '' : 'none';
    btnChoiceA.disabled = isFlipping;
    btnChoiceB.disabled = isFlipping;

    /* Restart — only on ending pages */
    btnRestart.style.display = isEnding ? '' : 'none';
    btnRestart.disabled      = isFlipping;
  }

  /**
   * Core flip function — animates to nextIndex with direction 'next' or 'prev'.
   */
  function flipToPage(nextIndex, direction) {
    if (nextIndex < 0 || nextIndex >= totalPages || isFlipping) return;

    isFlipping = true;
    renderControls();

    /* Page flip sound on every turn */
    playSound('flip');

    /* Cat fight sound when arriving at the choice screen */
    if (nextIndex === CHOICE_INDEX) {
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
      renderControls();
    }, flipDuration);
  }

  /* Linear navigation (pages 0–6 only) */
  function goNext() { if (currentIndex < CHOICE_INDEX) flipToPage(currentIndex + 1, 'next'); }
  function goPrev() { if (currentIndex > 0 && currentIndex <= CHOICE_INDEX) flipToPage(currentIndex - 1, 'prev'); }

  /* Branching choices on page 6 */
  function goChoiceA() { flipToPage(END_A_INDEX, 'next'); }  /* Don Midori wins */
  function goChoiceB() { flipToPage(END_B_INDEX, 'next'); }  /* Don Taichi wins */

  /* Restart — flips back to the cover */
  function restart() { flipToPage(0, 'prev'); }

  /* =====================================================================
     6. INIT
     ===================================================================== */

  function init() {
    injectMuteButton();
    preloadSounds();

    /* Set total page count and render first two pages */
    totalPagesEl.textContent = totalPages;
    renderPage(0, currentContent);
    renderPage(1, nextContent);
    renderControls();

    /* Button listeners */
    btnPrev.addEventListener('click', goPrev);
    btnNext.addEventListener('click', goNext);
    btnChoiceA.addEventListener('click', goChoiceA);
    btnChoiceB.addEventListener('click', goChoiceB);
    btnRestart.addEventListener('click', restart);

    /* Background music follows scroll position */
    window.addEventListener('scroll', onScroll, { passive: true });

    /*
     * Browsers require a user gesture before any audio plays.
     * The first click or keydown anywhere unlocks audio.
     */
    function onFirstInteraction() {
      if (hasInteracted) return;
      hasInteracted = true;
      document.removeEventListener('click',   onFirstInteraction);
      document.removeEventListener('keydown', onFirstInteraction);

      playSound('intro');

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
