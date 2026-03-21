/**
 * Comic viewer — Don Midori vs Don Taichi
 *
 * Responsibilities:
 * - Define list of comic pages (PAGES) and total count
 * - Render each page into currentContent or nextContent (placeholder box + optional label)
 * - On Next: put next page in nextContent, add flip class so current page rotates away
 * - On Previous: put previous page in nextContent, add flip classes so that page animates in from the left
 * - Update counter and disable Prev/Next at first/last page
 *
 * Images: add files to comic-images/ and optionally add PAGES[i].image to show <img> instead of placeholder.
 */
(function () {
  'use strict';

  /* ---------- Page definitions ---------- */
  /* id: used for logic; label: shown under the placeholder; placeholder: main text in the panel */
  var PAGES = [
    { id: 'cover', label: 'Cover', image: 'comic-images/1.JPG' },
    { id: 'scene1', label: 'Scene 1', image: 'comic-images/2.JPG' },
    { id: 'scene2-4', label: 'Scene 2–4', image: 'comic-images/3.JPG' },
    { id: 'scene5-6', label: 'Scene 5–6', image: 'comic-images/4.JPG' },
    { id: 'scene7-8', label: 'Scene 7–8', image: 'comic-images/5.JPG' },
    { id: 'scene9', label: 'Scene 9', image: 'comic-images/6.JPG' },
    { id: 'scene10a', label: 'Scene 10A', image: 'comic-images/7.JPG'},
    { id: 'scene10b', label: 'Scene 10B', image: 'comic-images/8.JPG'},
    { id: 'end', label: 'The End', image: 'comic-images/9.JPG' }
  ];

  var totalPages = PAGES.length;
  var currentIndex = 0;

  /* ---------- DOM refs ---------- */
  var viewer = document.getElementById('comicViewer');       /* Container that gets .comic-viewer--flip-next / --flip-prev */
  var pageCurrent = document.getElementById('pageCurrent');   /* Div that holds the "front" page (currentContent) */
  var pageNext = document.getElementById('pageNext');         /* Div that holds the "back" page (nextContent) */
  var currentContent = document.getElementById('currentContent'); /* Actual content of current page (script fills this) */
  var nextContent = document.getElementById('nextContent');       /* Actual content of next/prev page during flip */
  var currentPageNumEl = document.getElementById('currentPageNum');
  var totalPagesEl = document.getElementById('totalPages');
  var btnPrev = document.getElementById('btnPrev');
  var btnNext = document.getElementById('btnNext');

  var flipDuration = 600;  /* ms; must match CSS transition (0.6s) so we cleanup after animation ends */
  var isFlipping = false;  /* Prevents starting another flip before the current one finishes */


    /**
   * Render a single page into a container (currentContent or nextContent).
   * Builds: .comic-page > img + optional .comic-page__label.
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
      img.alt = page.label || 'Comic page';
  
      // fallback if image fails
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
      var label = document.createElement('div');
      label.className = 'comic-page__label';
      label.textContent = page.label;
      wrap.appendChild(label);
    }
  
    container.appendChild(wrap);
  }
  /**
   * Update page counter and button disabled states.
   */
  function updateUI() {
    currentPageNumEl.textContent = currentIndex + 1;
    totalPagesEl.textContent = totalPages;
    btnPrev.disabled = currentIndex === 0 || isFlipping;
    btnNext.disabled = currentIndex === totalPages - 1 || isFlipping;
  }

  /**
   * Flip to a given page index with animation.
   * @param {number} nextIndex - Target page index (0-based).
   * @param {'next'|'prev'} direction - Used to choose animation: next = current page turns away; prev = previous page flips in from left.
   * @param {function} [onDone] - Optional callback when flip completes.
   */
  /**
   * Flip to a given page index with animation.
   * @param {number} nextIndex - Target page index (0-based).
   * @param {'next'|'prev'} direction - Chooses animation: next = current turns away; prev = page flips in from left.
   * @param {function} [onDone] - Optional callback when flip completes.
   */
  function flipToPage(nextIndex, direction) {
    if (nextIndex < 0 || nextIndex >= totalPages || isFlipping) return;
  
    isFlipping = true;
    updateUI();
  
    /* Always render target page fresh */
    renderPage(nextIndex, nextContent);
  
    /* Keep nextContent invisible but ready for animation*/
    pageNext.style.visibility = 'hidden';
    
    /* Trigger animation */
    requestAnimationFrame(() => {
      if (direction === 'next') {
        viewer.classList.add('comic-viewer--flip-next');
      } else {
        pageNext.classList.add('flip-prev-initial');
          requestAnimationFrame(() => {
            viewer.classList.add('comic-viewer--flip-prev');
          });
      }

      /* Make nextContent visible after animation starts*/
    pageNext.style.visibility = 'visible';
    });
  
    setTimeout(function () {
      /* Update index */
      currentIndex = nextIndex;
  
      /* Copy what's already visible */
      currentContent.innerHTML = nextContent.innerHTML;

      /* Clean classes */
      viewer.classList.remove('comic-viewer--flip-next');
      viewer.classList.remove('comic-viewer--flip-prev');
      pageNext.classList.remove('flip-prev-initial');
  
      isFlipping = false;
      updateUI();
    }, flipDuration);
  }

  /** Go to next page (if not at end). */
  function goNext() {
    var next = currentIndex + 1;
    if (next >= totalPages) return;
    flipToPage(next, 'next');
  }

  /** Go to previous page (if not at start). */
  function goPrev() {
    if (currentIndex <= 0) return;
    flipToPage(currentIndex - 1, 'prev');
  }

  /* ---------- Init ---------- */
  totalPagesEl.textContent = totalPages;
  renderPage(0, currentContent);           /* First page in the "current" slot */
  if (totalPages > 1) renderPage(1, nextContent);  /* Second page in "next" slot (ready for first Next click) */
  updateUI();

  btnPrev.addEventListener('click', goPrev);
  btnNext.addEventListener('click', goNext);
})();
