(() => {
  const notice = document.querySelector('.preview-notice');
  let noticeTimer;
  document.querySelectorAll('[data-catalog]').forEach(button => {
    button.addEventListener('click', () => {
      if (!notice) return;
      notice.textContent = 'Сейчас согласовываем оформление. Выдачу каталога подключим после выбора концепции.';
      notice.classList.add('visible');
      clearTimeout(noticeTimer);
      noticeTimer = setTimeout(() => notice.classList.remove('visible'), 6000);
    });
  });
  const track = document.querySelector('.gallery-track');
  document.querySelectorAll('[data-scroll]').forEach(button => {
    button.addEventListener('click', () => {
      if (!track) return;
      const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      track.scrollBy({ left: Number(button.dataset.scroll) * track.clientWidth * .72, behavior: reduced ? 'instant' : 'smooth' });
    });
  });
  const dialog = document.querySelector('.photo-dialog');
  let origin;
  const closeDialog = () => { if (dialog?.open) dialog.close(); };
  document.querySelectorAll('[data-photo]').forEach(button => {
    button.addEventListener('click', () => {
      if (!dialog) return;
      origin = button;
      const photo = dialog.querySelector('img');
      photo.src = button.dataset.photo;
      photo.alt = button.dataset.caption + ' — построенный дом Русских поместий';
      dialog.querySelector('.dialog-caption').textContent = button.dataset.caption;
      dialog.showModal();
      document.body.style.overflow = 'hidden';
    });
  });
  dialog?.querySelector('.dialog-close').addEventListener('click', closeDialog);
  dialog?.addEventListener('click', event => {
    if (event.target !== dialog) return;
    const bounds = dialog.getBoundingClientRect();
    if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) closeDialog();
  });
  dialog?.addEventListener('close', () => {
    document.body.style.overflow = '';
    origin?.focus();
  });
})();
