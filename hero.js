/* Captions follow the native G1 film's media timeline, including seeks and loops. */
(() => {
  const video = document.getElementById('hero-sequence');
  const timeline = window.FLOORBENCH_HERO;
  if (!video || !timeline?.frames?.length) return;
  const byId = id => document.getElementById(id);
  const action = byId('g1-action');
  const readout = byId('lift-readout');
  const cues = timeline.cues;
  const between = (t, interval) => Boolean(interval && t >= interval[0] && t < interval[1]);
  const floorLabel = n => `L${String(Math.round(n)).padStart(2, '0')}`;
  const setText = (id, value) => {
    const node = byId(id);
    if (node && node.textContent !== value) node.textContent = value;
  };
  const setVisible = (node, value) => {
    if (node && node.classList.contains('visible') !== value) node.classList.toggle('visible', value);
  };
  function update() {
    if (!['supported', 'packed'].includes(video.dataset.alphaState)) return;
    const t = video.currentTime || 0;
    const frame = timeline.frames[Math.min(timeline.frames.length-1, Math.max(0, Math.floor(t*timeline.fps+1e-5)))];
    const task = ['pickup', 'call', 'cabin', 'door', 'switch', 'place', 'delivered'].find(key => between(t, cues[key]));
    setVisible(action, Boolean(task));
    if (action && task) {
      const labels = {
        pickup: ['RECEPTION', frame.bag_attached ? 'TAKEAWAY COLLECTED' : 'PICK UP TAKEAWAY'],
        call: ['APARTMENT E1', 'CALL ELEVATOR'],
        place: ['APARTMENT 901', frame.delivered ? 'RELEASE TAKEAWAY' : 'PLACE ON DINING TABLE'],
        delivered: ['DELIVERY COMPLETE', 'TAKEAWAY ON TABLE'],
        cabin: ['ELEVATOR', frame.button_selected ? 'LEVEL 09 SELECTED' : 'SELECT LEVEL 09'],
        door: ['APARTMENT 901', frame.door >= 90 ? 'ENTRY OPEN' : frame.door > 1 ? 'DOOR OPENING' : 'REACH FOR HANDLE'],
        switch: ['WALL SWITCH', frame.lamp > 0 ? 'LIGHTS ON' : 'REACH FOR SWITCH']
      };
      if (!cues.pickup && timeline.building === 'serviced_apartment_a' && t >= 5.6 && t < 7.4) {
        labels.cabin = ['APARTMENT / LEVEL 01', 'RECEPTION'];
      }
      setText('g1-heading', labels[task][0]);
      setText('g1-state', labels[task][1]);
    }
    const arriving = between(t, cues.arrival), traffic = between(t, cues.traffic);
    setVisible(readout, arriving || traffic);
    if (readout) {
      const elevators = frame.e3 === undefined ? [frame.e1, frame.e2] : [frame.e1, frame.e2, frame.e3];
      setText('lift-heading', arriving ? 'DESTINATION L09' : `ELEVATORS / ${elevators.map((_, i) => `E${i+1}`).join(' · ')}`);
      setText('lift-floor', arriving ? floorLabel(frame.e1) : elevators.map(floorLabel).join(' · '));
      setText('lift-caption', arriving ? (frame.e1 >= 8.99 ? 'ARRIVED / LEVEL 09' : 'ASCENDING') : 'CROSS-FLOOR SERVICE');
    }
  }
  // Keep a stable RGBA canvas in the page compositor across decoder loops.
  // The video retains layout, media controls and accessible description.
  const canvas = document.createElement('canvas');
  canvas.className = 'hero-frame';
  canvas.setAttribute('aria-hidden', 'true');
  const context = canvas.getContext('2d');
  if (context) { video.after(canvas); video.loop = false; }
  function paint() {
    if (video.dataset.alphaState !== 'supported') return;
    if (!context || video.readyState < 2 || video.seeking || !video.videoWidth) return;
    if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
      canvas.width = video.videoWidth; canvas.height = video.videoHeight;
    }
    // Replace pixels atomically, including alpha, without exposing a cleared frame.
    context.globalCompositeOperation = 'copy';
    context.drawImage(video, 0, 0);
    canvas.style.display = '';
    if (!video.classList.contains('canvas-presented')) video.classList.add('canvas-presented');
  }
  const sync = () => { paint(); update(); };
  ['loadeddata', 'seeked', 'pause'].forEach(event => video.addEventListener(event, sync));
  video.addEventListener('timeupdate', () => { if (video.paused) sync(); });
  if ('requestVideoFrameCallback' in video) {
    const onFrame = () => { sync(); video.requestVideoFrameCallback(onFrame); };
    video.requestVideoFrameCallback(onFrame);
  } else {
    let request;
    const tick = () => { sync(); if (!video.paused) request = requestAnimationFrame(tick); };
    video.addEventListener('play', () => { cancelAnimationFrame(request); tick(); });
    video.addEventListener('pause', () => cancelAnimationFrame(request));
  }
  sync();
})();
