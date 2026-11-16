/* Background films have no controls; their posters are the default surface. */
(() => {
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const videos = [...document.querySelectorAll('video[data-background]')];
  const visible = new Set();
  function update(video) {
    if (visible.has(video) && !document.hidden && !reduced.matches && !video.error) {
      video.play().catch(() => video.classList.remove('is-playing'));
    } else {
      video.pause();
      if (reduced.matches) video.classList.remove('is-playing');
    }
  }
  const observer = 'IntersectionObserver' in window ? new IntersectionObserver(entries => {
    entries.forEach(({target, isIntersecting}) => {
      if (isIntersecting) visible.add(target); else visible.delete(target);
      update(target);
    });
  }, {threshold: .05}) : null;
  videos.forEach(video => {
    video.muted = true;
    video.controls = false;
    video.addEventListener('playing', () => {
      if (!reduced.matches && !document.hidden && visible.has(video)) video.classList.add('is-playing');
      else update(video);
    });
    video.addEventListener('error', () => video.classList.remove('is-playing'));
    if (observer) observer.observe(video); else {visible.add(video); update(video);}
  });
  document.addEventListener('visibilitychange', () => videos.forEach(update));
  reduced.addEventListener('change', () => videos.forEach(update));
})();
