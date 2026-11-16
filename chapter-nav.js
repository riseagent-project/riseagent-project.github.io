(() => {
 const header = document.querySelector('.chapter-nav');
 if (!header) return;
 const toggle = document.querySelector('.chapter-toggle');
 const narrow = matchMedia('(max-width: 800px)');
 const entries = [...header.querySelectorAll('nav a[href^="#"]')].map(link => ({link, section:document.querySelector(link.hash)})).filter(entry => entry.section);
 function setOpen(open) {
  document.body.classList.toggle('nav-open', open);
  toggle.setAttribute('aria-expanded', String(open));
  toggle.setAttribute('aria-label', open ? 'Close chapter navigation' : 'Open chapter navigation');
  header.inert = narrow.matches && !open;
 }
 toggle.addEventListener('click', () => setOpen(!document.body.classList.contains('nav-open')));
 header.querySelectorAll('a').forEach(link => link.addEventListener('click', () => {setOpen(false);if(narrow.matches) toggle.focus();}));
 document.addEventListener('keydown', event => {if(event.key === 'Escape' && document.body.classList.contains('nav-open')) {setOpen(false);toggle.focus();}});
 document.addEventListener('click', event => {if(!header.contains(event.target) && !toggle.contains(event.target)) setOpen(false);});
 let queued = false;
 function update() {
  queued = false;
  let current = entries[0];
  for (const entry of entries) if(entry.section.getBoundingClientRect().top <= (narrow.matches ? 110 : 80)) current = entry;
  for (const entry of entries) {
   if(entry === current) entry.link.setAttribute('aria-current','location');
   else entry.link.removeAttribute('aria-current');
  }
 }
 function queue(){if(!queued){queued=true;requestAnimationFrame(update);}}
 narrow.addEventListener('change',()=>{setOpen(false);queue();});
 addEventListener('resize',queue);addEventListener('load',queue);
 addEventListener('scroll',queue,{passive:true});addEventListener('hashchange',queue);
 setOpen(false);update();
})();
