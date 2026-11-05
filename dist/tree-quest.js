const questUrl='https://panggihsieh.github.io/school3d/tree/';
let dialog;

export function openTreeQuest(){
 if(!dialog){
  dialog=document.createElement('dialog');dialog.className='tree-quest-dialog';dialog.setAttribute('aria-labelledby','tree-quest-title');
  dialog.innerHTML=`<div class="tree-quest-shell"><div class="tree-quest-heading"><h2 id="tree-quest-title">校樹碳匯探險隊</h2><button type="button" autofocus>關閉工具</button></div><p class="tree-quest-status" role="status">正在載入探險工具…</p></div>`;
  const status=dialog.querySelector('.tree-quest-status');
  const showStatus=text=>{status.replaceChildren(document.createTextNode(text+' '));const link=document.createElement('a');link.href=questUrl;link.target='_blank';link.rel='noopener';link.textContent='另開原網站 ↗';status.append(link);};
  showStatus('正在載入探險工具；若畫面無法使用，可');
  const frame=document.createElement('iframe');frame.title='校樹碳匯探險隊：量樹高、現勘與碳匯工具';frame.src=questUrl;
  frame.addEventListener('load',()=>showStatus('紀錄依原網站方式儲存在此瀏覽器，未與導覽資料同步。'));
  dialog.querySelector('.tree-quest-shell').append(frame);
  dialog.querySelector('button').onclick=()=>dialog.close();
  document.body.append(dialog);
 }
 dialog.showModal();
}
