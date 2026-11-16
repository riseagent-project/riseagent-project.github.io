(() => {
  document.querySelectorAll('[data-photo-gallery]').forEach(gallery => {
    const buttons = [...gallery.querySelectorAll('.photo-thumb')];
    const main = gallery.querySelector('.photo-main');
    const image = gallery.querySelector('.photo-image');
    const link = gallery.querySelector('.photo-image-link');
    const error = gallery.querySelector('.photo-error');
    let current = 0, requested = 0, version = 0;
    async function select(index) {
      index = (index + buttons.length) % buttons.length;
      requested = index;
      const token = ++version;
      const button = buttons[index];
      const pending = new Image();
      main.setAttribute('aria-busy', 'true');
      error.hidden = true;
      pending.src = button.dataset.photoSrc;
      try {
        await pending.decode();
        if (token !== version) return;
        image.src = pending.src;
        image.alt = button.dataset.photoTitle;
        link.href = pending.src;
        gallery.querySelector('.photo-title').textContent = button.dataset.photoTitle;
        gallery.querySelector('.photo-note').textContent = button.dataset.photoNote;
        gallery.querySelector('.photo-counter').textContent = `${String(index + 1).padStart(2, '0')} / ${buttons.length}`;
        buttons.forEach((item, i) => item.setAttribute('aria-pressed', String(i === index)));
        current = index;
        const rail = gallery.querySelector('.photo-thumbnails');
        const frame = button.getBoundingClientRect();
        const bounds = rail.getBoundingClientRect();
        if (frame.left < bounds.left || frame.right > bounds.right) {
          rail.scrollLeft += frame.left - bounds.left - (bounds.width - frame.width) / 2;
        }
        if (frame.top < bounds.top || frame.bottom > bounds.bottom) {
          rail.scrollTop += frame.top - bounds.top - (bounds.height - frame.height) / 2;
        }
      } catch (_) {
        if (token !== version) return;
        requested = current;
        error.textContent = 'This photograph could not be loaded. Please select it again.';
        error.hidden = false;
      } finally {
        if (token === version) main.removeAttribute('aria-busy');
      }
    }
    buttons.forEach((button, index) => {
      button.addEventListener('click', () => select(index));
      button.addEventListener('keydown', event => {
        const offset = {ArrowRight: 1, ArrowLeft: -1, ArrowDown: 2, ArrowUp: -2}[event.key];
        if (offset === undefined && !['Home', 'End'].includes(event.key)) return;
        event.preventDefault();
        const next = event.key === 'Home' ? 0 : event.key === 'End' ? buttons.length - 1 : (index + offset + buttons.length) % buttons.length;
        buttons[next].focus();
        select(next);
      });
    });
    gallery.querySelector('[data-photo-prev]').addEventListener('click', () => select(requested - 1));
    gallery.querySelector('[data-photo-next]').addEventListener('click', () => select(requested + 1));
  });
})();
