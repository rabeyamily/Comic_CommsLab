(function () {
  'use strict';

  // Comic pages — images go in comic-images/ (e.g. comic-images/cover.png, scene1.png)
  var PAGES = [
    { id: 'cover', label: 'Cover', placeholder: 'Cover — Don Midori vs Don Taichi' },
    { id: 'scene1', label: 'Scene 1', placeholder: 'Exposition (rain)' },
    { id: 'scene2-4', label: 'Scene 2–4', placeholder: 'Close-ups · Weapons Ready · Cat Feeder Countdown' },
    { id: 'scene5-6', label: 'Scene 5–6', placeholder: 'Don Midori informed · Face-off' },
    { id: 'scene7-8', label: 'Scene 7–8', placeholder: 'FIGHT!' },
    { id: 'scene9', label: 'Scene 9', placeholder: 'Who gets picked up?' },
    { id: 'scene10a', label: 'Scene 10A', placeholder: 'Don Midori picked up → Cuddles' },
    { id: 'scene10b', label: 'Scene 10B', placeholder: 'Don Taichi picked up → Cuddles' },
    { id: 'end', label: 'The End', placeholder: 'The End' }
  ];

  var totalPages = PAGES.length;
  var currentIndex = 0;
  var viewer = document.getElementById('comicViewer');
  var pageCurrent = document.getElementById('pageCurrent');
  var pageNext = document.getElementById('pageNext');
  var currentContent = document.getElementById('currentContent');
  var nextContent = document.getElementById('nextContent');
  var currentPageNumEl = document.getElementById('currentPageNum');
  var totalPagesEl = document.getElementById('totalPages');
  var btnPrev = document.getElementById('btnPrev');
  var btnNext = document.getElementById('btnNext');

  var flipDuration = 600;
  var isFlipping = false;

  function renderPage(index, container) {
    if (index < 0 || index >= totalPages) return;
    var page = PAGES[index];
    container.innerHTML = '';
    var wrap = document.createElement('div');
    wrap.className = 'comic-page';
    var box = document.createElement('div');
    box.className = 'comic-page__placeholder';
    box.textContent = page.placeholder;
    wrap.appendChild(box);
    if (page.label) {
      var label = document.createElement('div');
      label.className = 'comic-page__label';
      label.textContent = page.label;
      wrap.appendChild(label);
    }
    container.appendChild(wrap);
  }

  function updateUI() {
    currentPageNumEl.textContent = currentIndex + 1;
    totalPagesEl.textContent = totalPages;
    btnPrev.disabled = currentIndex === 0 || isFlipping;
    btnNext.disabled = currentIndex === totalPages - 1 || isFlipping;
  }

  function flipToPage(nextIndex, direction, onDone) {
    if (nextIndex < 0 || nextIndex >= totalPages || isFlipping) {
      if (onDone) onDone();
      return;
    }
    isFlipping = true;
    updateUI();

    if (direction === 'next') {
      // Next: like a real book — current page turns forward (hinge on right), next page revealed underneath
      renderPage(nextIndex, nextContent);
      viewer.classList.add('comic-viewer--flip-next');
      setTimeout(function () {
        viewer.classList.remove('comic-viewer--flip-next');
        currentIndex = nextIndex;
        renderPage(currentIndex, currentContent);
        if (currentIndex + 1 < totalPages) renderPage(currentIndex + 1, nextContent);
        else nextContent.innerHTML = '';
        isFlipping = false;
        updateUI();
        if (onDone) onDone();
      }, flipDuration);
    } else {
      // Previous: previous page flips in from the left
      renderPage(nextIndex, nextContent);
      pageNext.classList.add('flip-prev-initial');
      requestAnimationFrame(function () {
        requestAnimationFrame(function () {
          viewer.classList.add('comic-viewer--flip-prev');
        });
      });
      setTimeout(function () {
        viewer.classList.remove('comic-viewer--flip-prev');
        pageNext.classList.remove('flip-prev-initial');
        currentIndex = nextIndex;
        renderPage(currentIndex, currentContent);
        if (currentIndex + 1 < totalPages) renderPage(currentIndex + 1, nextContent);
        else nextContent.innerHTML = '';
        isFlipping = false;
        updateUI();
        if (onDone) onDone();
      }, flipDuration);
    }
  }

  function goNext() {
    var next = currentIndex + 1;
    if (next >= totalPages) return;
    flipToPage(next, 'next');
  }

  function goPrev() {
    if (currentIndex <= 0) return;
    flipToPage(currentIndex - 1, 'prev');
  }

  totalPagesEl.textContent = totalPages;
  renderPage(0, currentContent);
  if (totalPages > 1) renderPage(1, nextContent);
  updateUI();

  btnPrev.addEventListener('click', goPrev);
  btnNext.addEventListener('click', goNext);
})();
