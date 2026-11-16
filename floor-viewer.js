(() => {
  const tabs = [...document.querySelectorAll('[data-floor]')];
  const panel = document.getElementById('floor-panel');
  const picture = document.getElementById('floor-image');
  if (!tabs.length || !panel || !picture) return;
  const status = document.getElementById('floor-status');
  const download = document.getElementById('floor-download');
  let request = 0;
  async function select(tab) {
    const token = ++request;
    panel.setAttribute('aria-busy', 'true');
    const next = new Image();
    next.src = tab.dataset.src;
    try { await next.decode(); }
    catch {
      if (token === request) {
        panel.removeAttribute('aria-busy');
        status.textContent = 'This floor could not be loaded. Select it to retry.';
      }
      return;
    }
    if (token !== request) return;
    tabs.forEach(button => {
      const active = button === tab;
      button.setAttribute('aria-selected', String(active));
      button.tabIndex = active ? 0 : -1;
    });
    picture.getAnimations().forEach(animation => animation.cancel());
    picture.src = next.src;
    picture.alt = `${picture.dataset.building}, ${tab.dataset.label} interior`;
    download.href = next.src;
    panel.setAttribute('aria-labelledby', tab.id);
    status.textContent = `${tab.dataset.label} · ${tab.lastElementChild.textContent}`;
    panel.removeAttribute('aria-busy');
    if (!matchMedia('(prefers-reduced-motion: reduce)').matches) {
      picture.animate([{ opacity: .2, transform: 'translateY(6px)' }, { opacity: 1, transform: 'translateY(0)' }], { duration: 220, easing: 'ease-out' });
    }
  }
  tabs.forEach((tab, index) => {
    tab.addEventListener('click', () => select(tab));
    tab.addEventListener('keydown', event => {
      let target;
      if (['ArrowDown', 'ArrowRight'].includes(event.key)) target = (index + 1) % tabs.length;
      if (['ArrowUp', 'ArrowLeft'].includes(event.key)) target = (index + tabs.length - 1) % tabs.length;
      if (event.key === 'Home') target = 0;
      if (event.key === 'End') target = tabs.length - 1;
      if (target === undefined) return;
      event.preventDefault();
      tabs[target].focus();
      select(tabs[target]);
    });
  });
})();
