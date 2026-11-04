(() => {
  document.querySelectorAll('[data-feature-gallery]').forEach(gallery => {
    const featured = gallery.querySelector('.featured-image');
    const opener = gallery.querySelector('[data-feature-open]');
    const caption = gallery.querySelector('[data-feature-caption]');
    const number = gallery.querySelector('[data-feature-number]');
    const buttons = [...gallery.querySelectorAll('[data-feature]')];
    let request = 0;
    buttons.forEach((button, index) => {
      button.addEventListener('click', async () => {
        const current = ++request;
        const candidate = new Image();
        candidate.src = button.dataset.feature;
        try { await candidate.decode(); } catch { return; }
        if (current !== request) return;
        featured.src = candidate.src;
        featured.alt = button.dataset.caption + ' — построенный дом Русских поместий';
        opener.dataset.photo = button.dataset.feature;
        opener.dataset.caption = button.dataset.caption;
        opener.setAttribute('aria-label', 'Увеличить фото: ' + button.dataset.caption);
        caption.textContent = button.dataset.caption;
        number.textContent = String(index + 1).padStart(2, '0');
        buttons.forEach(item => item.setAttribute('aria-pressed', String(item === button)));
      });
    });
  });
})();
