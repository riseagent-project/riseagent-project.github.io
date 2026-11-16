(() => {
  const tabs=[...document.querySelectorAll('.category-tabs [role="tab"]')];
  const cards=[...document.querySelectorAll('.scene-card[data-building-category]')];
  if(!tabs.length)return;
  const panel=document.getElementById('building-panel');
  function select(tab){
    const category=tab.dataset.category;
    let count=0;
    tabs.forEach(t=>{const active=t===tab;t.setAttribute('aria-selected',String(active));t.tabIndex=active?0:-1;});
    cards.forEach(card=>{
      card.hidden=category!=='all'&&card.dataset.buildingCategory!==category;
      if(card.hidden)card.querySelectorAll('video').forEach(video=>video.pause());
      else count++;
    });
    panel.setAttribute('aria-labelledby',tab.id);
    document.getElementById('collection-status').textContent=`${tab.querySelector('span').textContent} · ${count}`;
  }
  tabs.forEach((tab,index)=>{
    tab.addEventListener('click',()=>select(tab));
    tab.addEventListener('keydown',event=>{
      let next;
      if(['ArrowDown','ArrowRight'].includes(event.key))next=(index+1)%tabs.length;
      else if(['ArrowUp','ArrowLeft'].includes(event.key))next=(index+tabs.length-1)%tabs.length;
      else if(event.key==='Home')next=0;
      else if(event.key==='End')next=tabs.length-1;
      else return;
      event.preventDefault();tabs[next].focus();select(tabs[next]);
    });
  });
  // Incoming links to a specific building should always reveal their destination.
  function revealHash(){
    const target=document.getElementById(location.hash.slice(1));
    if(target?.matches('.scene-card')&&target.hidden){select(tabs[0]);target.scrollIntoView();}
  }
  window.addEventListener('hashchange',revealHash);
  revealHash();
})();
