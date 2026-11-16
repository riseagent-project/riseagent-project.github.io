/* One decoder for the feature film; the six choices are lightweight posters. */
(() => {
  const video = document.querySelector('#interaction-player');
  if (!video) return;
  const choices = [...document.querySelectorAll('.interaction-choice')];
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const error = document.querySelector('#interaction-error');
  let visible = false, manuallyPaused = false, automaticPause = false, explicitPlay = false;
  function pause() {
    if (!video.paused) { automaticPause = true; video.pause(); }
  }
  function update() {
    if (visible && !document.hidden && (!reduced.matches || explicitPlay) && !manuallyPaused) video.play().catch(() => {});
    else pause();
  }
  video.muted = true;
  video.addEventListener('pause', () => {
    if (automaticPause) automaticPause = false;
    else manuallyPaused = true;
  });
  video.addEventListener('play', () => { manuallyPaused = false; automaticPause = false; });
  video.addEventListener('error', () => {
    error.textContent = 'This video could not be loaded. Select another demonstration or try again.';
    error.hidden = false;
  });
  choices.forEach(choice => choice.addEventListener('click', () => {
    const changed = choice.getAttribute('aria-pressed') !== 'true';
    manuallyPaused = false; explicitPlay = true; error.hidden = true;
    if (changed || video.error) {
      pause();
      choices.forEach(button => button.setAttribute('aria-pressed', String(button === choice)));
      video.poster = choice.dataset.poster;
      video.querySelector('source').src = choice.dataset.src;
      video.setAttribute('aria-label', choice.dataset.title + ' demonstration');
      document.querySelector('#interaction-name').textContent = choice.dataset.title;
      video.load();
    }
    video.play().catch(() => {});
  }));
  const observer = new IntersectionObserver(entries => {
    visible = entries[0].isIntersecting;
    update();
  }, {threshold: .25});
  observer.observe(video);
  document.addEventListener('visibilitychange', update);
  reduced.addEventListener('change', () => { explicitPlay = false; update(); });
})();
