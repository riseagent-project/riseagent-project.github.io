(() => {
 const dialog = document.getElementById('bibtex-dialog');
 document.getElementById('bibtex-button').addEventListener('click', () => {document.getElementById('copy-status').textContent='';dialog.showModal();});
 document.getElementById('close-citation').addEventListener('click', () => dialog.close());
 dialog.addEventListener('click', event => {if(event.target === dialog){const r=dialog.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)dialog.close();}});
 document.getElementById('copy-citation').addEventListener('click', async () => {
  const text = document.getElementById('citation-text').textContent;
  const status = document.getElementById('copy-status');
  try {await navigator.clipboard.writeText(text);status.textContent='Copied';}
  catch {const range=document.createRange();range.selectNodeContents(document.getElementById('citation-text'));const selection=getSelection();selection.removeAllRanges();selection.addRange(range);status.textContent='Press Ctrl+C / ⌘C to copy';}
 });
})();
