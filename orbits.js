/* Quiet, viewport-aware turntables. Card clicks are ordinary accessible links. */
(() => {
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const videos = [...document.querySelectorAll('video[data-orbit]')];
  const visible = new Set();
  // Keep transparent posters visible until a decoded frame proves alpha support.
  // A data URL also works when the site is opened directly with file://.
  function supportsAlphaVideo() {
    return new Promise(resolve => {
      const probe = document.createElement('video');
      probe.muted = true;
      probe.playsInline = true;
      let done = false;
      const finish = supported => {
        if (done) return;
        done = true;
        clearTimeout(timer);
        probe.onloadeddata = probe.onerror = null;
        probe.pause();
        probe.removeAttribute('src');
        probe.load();
        resolve(supported);
      };
      const timer = setTimeout(() => finish(false), 5000);
      probe.onerror = () => finish(false);
      const inspect = () => {
        try {
          const canvas = document.createElement('canvas');
          canvas.width = canvas.height = 16;
          const ctx = canvas.getContext('2d', {willReadFrequently: true});
          ctx.drawImage(probe, 0, 0, 16, 16);
          // Transparent left half and opaque right half reject blank frames too.
          finish(ctx.getImageData(2, 8, 1, 1).data[3] < 16 &&
                 ctx.getImageData(13, 8, 1, 1).data[3] > 240);
        } catch (_) { finish(false); }
      };
      probe.onloadeddata = () => {
        if ('requestVideoFrameCallback' in probe) probe.requestVideoFrameCallback(inspect);
        else setTimeout(inspect, 100);
        probe.play().catch(() => finish(false));
      };
      probe.src = 'data:video/webm;base64,GkXfo59ChoEBQveBAULygQRC84EIQoKEd2VibUKHgQJChYECGFOAZwEAAAAAAALGEU2bdLtNu4tTq4QVSalmU6yB5U27jFOrhBZUrmtTrIIBHE27jFOrhBJUw2dTrIIBYE27jFOrhBxTu2tTrIICsOwBAAAAAAAAnAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABVJqWayKtexgw9CQE2AjUxhdmY1OC4yOS4xMDBXQY1MYXZmNTguMjkuMTAwRImIQGkAAAAAAAAWVK5rv64BAAAAAAAANteBAXPFgQGcgQAitZyDdW5khoVWX1ZQOYOBASPjg4QL68IA4AEAAAAAAAAKsIEQuoEQU8CBARJUw2dAw3NzAQAAAAAAAC5jwAEAAAAAAAAAZ8gBAAAAAAAAGkWjh0VOQ09ERVJEh41MYXZmNTguMjkuMTAwc3MBAAAAAAAAPWPAAQAAAAAAAARjxYEBZ8gBAAAAAAAAJUWjh0VOQ09ERVJEh5hMYXZjNTguNTQuMTAwIGxpYnZweC12cDlzcwEAAAAAAAA6Y8ABAAAAAAAABGPFgQFnyAEAAAAAAAAiRaOIRFVSQVRJT05Eh5QwMDowMDowMC4yMDAwMDAwMDAAAB9DtnVAgeeBAKABAAAAAAAAdaG2gQAAAIJJg0IAAPAA9gA4JBwYAAAAIAAATq////+2r8U////uZMBFf///7Pyav////bIwayQAdaEBAAAAAAAAM6YBAAAAAAAAKu6BAaWlgkmDQgAA8AD2ADgkHBgAAAAgAAAe/////dX4lP///+v6gwAAABxTu2uRu4+zgQC3iveBAfGCAinwgQM=';
      probe.load();
    });
  }
  const sources = new Map();
  const compositorURL = new URL('alpha-video.js?v=2', document.currentScript.src).href;
  let compositor;
  function loadCompositor() {
    if (!compositor) compositor = new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = compositorURL;
      script.onload = () => resolve(window.FloorbenchAlphaVideo);
      script.onerror = reject;
      document.head.append(script);
    });
    return compositor;
  }
  async function playCompatible(video) {
    const source = sources.get(video).find(([, src]) => src && /\.webm(?:\?|$)/.test(src));
    if (!source) return;
    video.dataset.alphaState = 'loading';
    try {
      const player = await loadCompositor();
      await player.install(video, source[1]);
      update(video);
    } catch (error) {
      console.error('Could not start compatible animation', error);
      video.dataset.alphaState = 'error';
    }
  }
  function showPoster(video) {
    video.dataset.alphaState = 'poster';
    video.pause();
    video.removeAttribute('src');
    video.querySelectorAll('source').forEach(source => source.removeAttribute('src'));
    video.classList.remove('canvas-presented');
    const stage = video.closest('.cinema-stage');
    if (stage) {
      stage.querySelectorAll('.hero-frame').forEach(canvas => { canvas.style.display = 'none'; });
      stage.querySelectorAll('.g1-action,.lift-readout').forEach(label => label.classList.remove('visible'));
    }
    video.load();
  }
  videos.forEach(video => {
    sources.set(video, [...video.querySelectorAll('source')].map(source => [source, source.getAttribute('src')]));
    showPoster(video);
    video.dataset.alphaState = 'pending';
    video.addEventListener('error', () => {
      if (video.dataset.alphaState === 'supported') { showPoster(video); playCompatible(video); }
    });
  });
  supportsAlphaVideo().then(supported => {
    videos.forEach(video => {
      if (!supported) { video.dataset.alphaState = 'compatible'; update(video); return; }
      video.dataset.alphaState = 'supported';
      sources.get(video).forEach(([source, src]) => { if (src) source.setAttribute('src', src); });
      video.load();
      update(video);
    });
  });
  function update(video) {
    if (video.dataset.alphaState === 'compatible') {
      if (visible.has(video) && !document.hidden && !reduced.matches) playCompatible(video);
      return;
    }
    if (!['supported', 'packed'].includes(video.dataset.alphaState)) return;
    if (visible.has(video) && !document.hidden && !reduced.matches) video.play().catch(() => {});
    else video.pause();
  }
  const observer = 'IntersectionObserver' in window ? new IntersectionObserver(entries => {
    entries.forEach(({target, isIntersecting}) => {
      if (isIntersecting) visible.add(target); else visible.delete(target);
      update(target);
    });
  }, {threshold: .15}) : null;
  videos.forEach(video => {
    video.muted = true;
    video.controls = false;
    // The hero canvas holds the identical endpoint while resetting the decoder.
    // Firefox's native loop carries callback timestamps across iterations.
    video.addEventListener('ended', () => {
      if (!['supported', 'packed'].includes(video.dataset.alphaState)) return;
      if (video.id !== 'hero-sequence' || video.loop) return;
      video.load();
      update(video);
    });
    if (observer) observer.observe(video); else {visible.add(video); update(video);}
  });
  document.addEventListener('visibilitychange', () => videos.forEach(update));
  reduced.addEventListener('change', () => videos.forEach(update));
})();
