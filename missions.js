/* Three recorded demonstrations, arranged around a shared comparison case. */
(() => {
const data = document.getElementById('mission-demo-data');
if (!data) return;
const demos = JSON.parse(data.textContent);
const formatTime = seconds => `${Math.floor(seconds / 60).toString().padStart(2, '0')}:${Math.floor(seconds % 60).toString().padStart(2, '0')}`;
const escape = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const lastAt = (items, time) => {
  let lo = 0, hi = items.length;
  while (lo < hi) { const mid = (lo + hi) >> 1; if (items[mid].time <= time) lo = mid + 1; else hi = mid; }
  return lo - 1;
};
const cases = [
  {id:'mission-g1-elevator-ride',letter:'A',robot:'Unitree G1',body:'Humanoid',scene:'Service Center',elevators:'1 elevator',route:'3F → 2F',relation:'Different embodiment'},
  {id:'mission-elevator-ride',letter:'B',robot:'FWMiniPiper',body:'Wheeled manipulator',scene:'Service Center',elevators:'1 elevator',route:'3F → 2F',relation:'Shared reference'},
  {id:'mission-apartment-three-elevators',letter:'C',robot:'FWMiniPiper',body:'Wheeled manipulator',scene:'Apartment',elevators:'3 elevators',route:'1F → 8F',relation:'Different scene & elevator count'},
];
const container = document.getElementById('mission-demo-list');
container.classList.add('comparison-grid');
const intro = document.createElement('div');
intro.className = 'comparison-intro';
intro.innerHTML = `<p>One agent across robot embodiments and elevator configurations.</p><span>GPT-6 Astra · Recorded demonstrations</span>`;
const axes = document.createElement('div'); axes.className = 'comparison-axes';
axes.innerHTML = `<div class="comparison-axis embodiment-axis"><span class="pair-label">A ↔ B</span><div><h3>Embodiment differences</h3><p>Same scene &amp; elevator count · Humanoid ↔ wheeled</p></div></div><div class="comparison-axis scene-axis"><span class="pair-label">B ↔ C</span><div><h3>Scene differences</h3><p>Same wheeled robot · Different scenes &amp; elevator counts</p></div></div>`;
container.before(intro,axes);
for (const config of cases) {
  const demo = demos.find(d => d.id === config.id);
  if (!demo) continue;
  const card = document.createElement('article'); card.className='demo-card comparison-card'; card.id=demo.id;
  if (config.letter==='B') card.classList.add('reference-card');
  const tile = (view, i) => `<figure class="view-tile ${i===0?'world-tile':''}" data-view="${escape(view.id)}"><figcaption><span>${escape(view.label)}</span><button class="expand" aria-label="Expand ${escape(config.robot+' '+config.scene+' '+view.label)}">⛶</button></figcaption><div class="view-screen"><video ${i===0?'controls':''} muted playsinline preload="metadata" poster="${escape(view.poster)}" aria-label="${escape(config.robot+' '+config.scene+' '+view.label)}"><source src="${escape(view.src)}" type="video/mp4"></video>${i===0?`<label class="world-speed">Speed <select aria-label="${escape(config.robot+' '+config.scene)} playback speed"><option value="1" selected>4×</option></select></label>`:''}</div></figure>`;
  card.innerHTML=`<header class="comparison-header"><div class="case-heading"><span class="case-letter">${config.letter}</span><span>${config.relation}</span><time>${formatTime(demo.duration)}</time></div><h3>${config.robot}<small>${config.body}</small></h3><div class="case-context"><span class="scene-tag">${config.scene}</span><span class="elevator-tag">${config.elevators}</span><span class="floor-route">${config.route}</span></div></header><div class="video-area">${tile(demo.views[0],0)}<details class="observations"><summary>Robot observations <span>3 synchronized views</span></summary><div class="sensor-grid">${demo.views.slice(1).map((view,i)=>tile(view,i+1)).join('')}</div></details><p class="error-message" role="alert" hidden></p></div>`;
  container.append(card);
  const videos=[...card.querySelectorAll('video')],master=videos[0];
  const error=card.querySelector('.error-message');
  const expectedSeek=new WeakMap(),ignoredPause=new WeakSet();
  let playing=false,buffering=false,changing=false,generation=0,speed=demo.playbackRate||1;
  const pauseMedia=()=>videos.forEach(v=>{if(!v.paused){ignoredPause.add(v);v.pause();}});
  const update=()=>{
    const time=master.currentTime||0;
    if(demo.speedTimeline){const segment=demo.speedTimeline[Math.max(0,lastAt(demo.speedTimeline,time))];card.querySelector('select option').textContent=`${segment.speed}×`;}
  };
  const fail = message => { playing = false; buffering = false; changing = false; generation++; pauseMedia(); error.textContent = message; error.hidden = false; update(); };
  const pause = () => { playing = false; buffering = false; generation++; changing = false; pauseMedia(); update(); };
  let resuming = false;
  const resume = async () => {
    if (!playing || changing || resuming) return;
    const token = generation;
    if (videos.some(v => v.readyState < 3 || v.seeking)) { buffering = true; pauseMedia(); update(); return; }
    buffering = false; resuming = true;
    try { await Promise.all(videos.map(v => v.play())); }
    catch (err) {
      // A coordinated buffer pause can interrupt a pending play() promise.
      // Keep the user's playback intent and retry when every view is ready.
      if (generation === token && playing) {
        if (err.name === 'AbortError') { buffering = true; pauseMedia(); }
        else fail('Playback could not start. Use a video play button to try again.');
      }
    } finally { resuming = false; }
    update();
  };
  const position = (v, time) => new Promise((resolve, reject) => {
    const target = Math.min(time, Number.isFinite(v.duration) ? v.duration - 0.001 : time);
    let timeout;
    const clean = () => { clearTimeout(timeout); v.removeEventListener('seeked', done); v.removeEventListener('loadedmetadata', seek); v.removeEventListener('error', failed); };
    const done = () => { if (Math.abs(v.currentTime - target) < .15 && !v.seeking) { clean(); resolve(); } };
    const failed = () => { clean(); reject(new Error('View unavailable')); };
    const seek = () => {
      if (Math.abs(v.currentTime - target) < .01 && !v.seeking) { clean(); resolve(); return; }
      expectedSeek.set(v, target); v.currentTime = target;
    };
    timeout = setTimeout(failed, 15000);
    v.addEventListener('seeked', done); v.addEventListener('error', failed);
    if (v.readyState === 0) { v.addEventListener('loadedmetadata', seek, {once:true}); v.load(); } else seek();
  });
  const seekAll = async (time, shouldPlay = playing) => {
    const token = ++generation;
    playing = shouldPlay; buffering = false; changing = true; error.hidden = true;

    // Metadata-only preload may never fetch enough data to emit canplay.
    // Activate all streams in this task before waiting for shared readiness.
    videos.forEach(v => { v.preload = 'auto'; });
    pauseMedia(); update();
    try {
      await Promise.all(videos.map(v => position(v, Math.max(0, Math.min(time, demo.duration - .001)))));
      if (token !== generation) return;
      changing = false; update(); if (playing) await resume();
    } catch { if (token === generation) fail('A view could not be synchronized. Check the local video files and try again.'); }
  };
  const setSpeed = value => { value = 1; speed = value; videos.forEach(v => { if (v.playbackRate !== value) v.playbackRate = value; }); card.querySelector('select').value = String(value); };
  card.querySelector('select').addEventListener('change', e => setSpeed(Number(e.target.value)));
  videos.forEach(v => {
    v.addEventListener('play', () => { if (!playing && !changing) seekAll(v.currentTime, true); });
    v.addEventListener('pause', () => { if (ignoredPause.has(v)) { ignoredPause.delete(v); return; } if (playing && !changing && !buffering && !v.ended) pause(); });
    v.addEventListener('seeking', () => {
      const expected = expectedSeek.get(v);
      if (expected !== undefined && Math.abs(v.currentTime - expected) < .15) return;
      seekAll(v.currentTime);
    });
    v.addEventListener('seeked', () => { expectedSeek.delete(v); update(); });
    v.addEventListener('ratechange', () => { if (v.playbackRate !== speed) setSpeed(v.playbackRate); });
    v.addEventListener('waiting', () => { if (playing && !changing) { buffering = true; pauseMedia(); update(); } });
    v.addEventListener('canplay', () => { if (buffering && playing && !changing) resume(); });
    v.addEventListener('ended', () => { if (v === master) pause(); });
    v.addEventListener('error', () => fail('A video could not be loaded. Check that all view files are available.'));
    v.querySelector('source').addEventListener('error', () => fail('A video file is missing or cannot be decoded.'));
    v.closest('figure').querySelector('.expand').addEventListener('click', () => { const target = v; if (target.requestFullscreen) target.requestFullscreen().catch(() => {}); else if (v.webkitEnterFullscreen) v.webkitEnterFullscreen(); });
  });
  videos.forEach(v => { v.defaultPlaybackRate = demo.playbackRate || 1; });
  setSpeed(demo.playbackRate || 1);
  master.addEventListener('timeupdate', update);
  let lastCheck = 0;
  const tick = now => {
    if (playing && !changing && now - lastCheck > 150) {
      lastCheck = now;
      if (buffering) resume();
      else for (const v of videos.slice(1)) if (!v.seeking && Math.abs(v.currentTime - master.currentTime) > .12) { expectedSeek.set(v, master.currentTime); v.currentTime = master.currentTime; }
    }
    requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick); update();
}
})();
