(() => {
  const track = document.querySelector('.gallery-track');
  const cards = [...track.querySelectorAll('.gallery-card')];
  const dialog = document.querySelector('.viewer');
  const viewerTrack = dialog.querySelector('.viewer-track');
  const slides = [...dialog.querySelectorAll('.viewer-slide')];
  const thumbsTrack = dialog.querySelector('.viewer-thumbs');
  const thumbs = [...dialog.querySelectorAll('.viewer-thumb')];
  const photos = cards.map(card => ({
    caption: card.querySelector('figcaption>span').textContent
  }));
  const previous = document.querySelector('[data-gallery-prev]');
  const next = document.querySelector('[data-gallery-next]');
  const viewerPrevious = dialog.querySelector('[data-viewer-prev]');
  const viewerNext = dialog.querySelector('[data-viewer-next]');
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  const clamp = value => Math.max(0, Math.min(photos.length - 1, value));
  const format = value => String(value + 1).padStart(2, '0');
  let active = 0;
  let origin;
  let savedScroll = 0;
  let galleryFrame;
  let viewerFrame;
  const behavior = instant => instant || reduced.matches ? 'auto' : 'smooth';
  const step = () => cards[1].offsetLeft - cards[0].offsetLeft;

  function updateGallery() {
    const max = track.scrollWidth - track.clientWidth;
    const first = clamp(Math.round(track.scrollLeft / step()));
    const visible = Number(getComputedStyle(track).getPropertyValue('--visible-items'));
    const end = Math.min(photos.length - 1, first + visible - 1);
    document.querySelector('[data-gallery-range]').textContent = format(first) + (end > first ? '–' + format(end) : '');
    previous.disabled = track.scrollLeft < 3;
    next.disabled = max - track.scrollLeft < 3;
    document.querySelector('.gallery-progress>span').style.width = Math.min(100, (track.scrollLeft + track.clientWidth) / track.scrollWidth * 100) + '%';
  }

  function moveGallery(direction) {
    const target = Math.round(track.scrollLeft / step()) + direction;
    track.scrollTo({ left: clamp(target) * step(), behavior: behavior(false) });
  }
  previous.addEventListener('click', () => moveGallery(-1));
  next.addEventListener('click', () => moveGallery(1));
  track.addEventListener('scroll', () => {
    cancelAnimationFrame(galleryFrame);
    galleryFrame = requestAnimationFrame(updateGallery);
  }, { passive: true });
  track.addEventListener('keydown', event => {
    if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
      event.preventDefault();
      moveGallery(event.key === 'ArrowLeft' ? -1 : 1);
    }
  });

  function loadImage(index) {
    if (index < 0 || index >= photos.length) return;
    const image = slides[index].querySelector('img');
    if (!image.getAttribute('src')) image.src = image.dataset.src;
  }

  function updateViewer(index) {
    active = clamp(index);
    loadImage(active - 1);
    loadImage(active);
    loadImage(active + 1);
    slides.forEach((slide, number) => {
      if (Math.abs(number - active) > 1) slide.querySelector('img').removeAttribute('src');
    });
    dialog.querySelector('[data-viewer-number]').textContent = format(active);
    dialog.querySelector('.viewer-caption').textContent = photos[active].caption;
    viewerPrevious.disabled = active === 0;
    viewerNext.disabled = active === photos.length - 1;
    thumbs.forEach((thumb, number) => thumb.setAttribute('aria-pressed', String(number === active)));
    const thumb = thumbs[active];
    thumbsTrack.scrollTo({ left: thumb.offsetLeft - thumbsTrack.offsetLeft - thumbsTrack.clientWidth / 2 + thumb.clientWidth / 2, behavior: behavior(false) });
  }

  function selectPhoto(index) {
    const selected = clamp(index);
    loadImage(selected);
    updateViewer(selected);
    viewerTrack.scrollTo({ left: selected * viewerTrack.clientWidth, behavior: 'auto' });
  }

  function openViewer(index, button) {
    origin = button;
    savedScroll = window.scrollY;
    document.documentElement.classList.add('viewer-open');
    document.body.style.position = 'fixed';
    document.body.style.top = -savedScroll + 'px';
    document.body.style.width = '100%';
    thumbs.forEach(thumb => {
      const image = thumb.querySelector('img');
      if (!image.getAttribute('src')) image.src = image.dataset.src;
    });
    dialog.showModal();
    selectPhoto(index);
    dialog.querySelector('.viewer-close').focus({ preventScroll: true });
  }

  document.querySelectorAll('[data-open]').forEach(button => {
    button.addEventListener('click', () => openViewer(Number(button.dataset.open), button));
  });
  viewerPrevious.addEventListener('click', () => selectPhoto(active - 1));
  viewerNext.addEventListener('click', () => selectPhoto(active + 1));
  thumbs.forEach(thumb => thumb.addEventListener('click', () => selectPhoto(Number(thumb.dataset.select))));
  viewerTrack.addEventListener('scroll', () => {
    cancelAnimationFrame(viewerFrame);
    viewerFrame = requestAnimationFrame(() => {
      if (!dialog.open || !viewerTrack.clientWidth) return;
      const index = clamp(Math.round(viewerTrack.scrollLeft / viewerTrack.clientWidth));
      if (index !== active) updateViewer(index);
    });
  }, { passive: true });
  document.addEventListener('keydown', event => {
    if (!dialog.open) return;
    if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
      event.preventDefault();
      selectPhoto(active + (event.key === 'ArrowLeft' ? -1 : 1));
    } else if (event.key === 'Home' || event.key === 'End') {
      event.preventDefault();
      selectPhoto(event.key === 'Home' ? 0 : photos.length - 1);
    }
  });
  dialog.querySelector('.viewer-close').addEventListener('click', () => dialog.close());
  dialog.addEventListener('close', () => {
    document.documentElement.classList.remove('viewer-open');
    document.body.style.position = '';
    document.body.style.top = '';
    document.body.style.width = '';
    const old = document.documentElement.style.scrollBehavior;
    document.documentElement.style.scrollBehavior = 'auto';
    window.scrollTo(0, savedScroll);
    document.documentElement.style.scrollBehavior = old;
    origin?.focus({ preventScroll: true });
  });

  // Touch uses the browser's native scrolling. Mouse dragging uses the same strips.
  function mouseDrag(element, getStep) {
    let drag;
    let suppressClick = false;
    element.addEventListener('pointerdown', event => {
      if (event.pointerType !== 'mouse' || event.button !== 0) return;
      drag = { x: event.clientX, left: element.scrollLeft, id: event.pointerId, moved: false };
    });
    element.addEventListener('pointermove', event => {
      if (!drag || event.pointerId !== drag.id) return;
      const distance = event.clientX - drag.x;
      if (!drag.moved && Math.abs(distance) < 6) return;
      if (!drag.moved) {
        drag.moved = true;
        element.setPointerCapture(event.pointerId);
        element.classList.add('dragging');
      }
      event.preventDefault();
      element.scrollLeft = drag.left - distance;
    });
    function finish(event) {
      if (!drag || event.pointerId !== drag.id) return;
      const moved = drag.moved;
      drag = null;
      element.classList.remove('dragging');
      if (element.hasPointerCapture(event.pointerId)) element.releasePointerCapture(event.pointerId);
      if (moved) {
        suppressClick = true;
        const unit = getStep();
        element.scrollTo({ left: Math.round(element.scrollLeft / unit) * unit, behavior: behavior(false) });
        setTimeout(() => { suppressClick = false; }, 0);
      }
    }
    element.addEventListener('pointerup', finish);
    element.addEventListener('pointercancel', finish);
    element.addEventListener('pointerleave', event => { if (drag && !drag.moved) finish(event); });
    element.addEventListener('click', event => {
      if (suppressClick) { event.preventDefault(); event.stopImmediatePropagation(); }
    }, true);
    element.addEventListener('dragstart', event => event.preventDefault());
  }
  mouseDrag(track, step);
  mouseDrag(viewerTrack, () => viewerTrack.clientWidth);

  const observer = new ResizeObserver(() => {
    updateGallery();
    if (dialog.open) viewerTrack.scrollTo({ left: active * viewerTrack.clientWidth, behavior: 'auto' });
  });
  observer.observe(track);
  observer.observe(viewerTrack);
  updateGallery();

  const notice = document.querySelector('.preview-notice');
  let timer;
  document.querySelectorAll('[data-catalog],[data-planned]').forEach(button => {
    button.addEventListener('click', event => {
      event.preventDefault();
      notice.textContent = button.hasAttribute('data-catalog')
        ? 'Сейчас согласовываем оформление. Получение каталога подключим после согласования.'
        : 'Этот раздел добавим на следующем этапе. Сейчас готовы первые два экрана.';
      notice.classList.add('visible');
      clearTimeout(timer);
      timer = setTimeout(() => notice.classList.remove('visible'), 5000);
    });
  });
})();
