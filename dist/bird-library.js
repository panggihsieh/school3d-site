const dialog=document.createElement('dialog');
dialog.className='bird-library';
dialog.setAttribute('aria-labelledby','bird-library-title');
dialog.innerHTML='<div class="dialog-heading"><h2 id="bird-library-title">校方鳥類照片參考</h2><button type="button" aria-label="關閉">✕</button></div><p>依校方介紹的 12 張照片整理；兩張角鴞保留分開，並非 12 個已確認物種。參考照片不代表梅山現地拍攝或當日校園目擊。</p><p>照片動態為輕微位移示意，並非真實行為影片；去背版本仍待製作。</p><label>搜尋鳥名 <input type="search" placeholder="例如：五色鳥" aria-label="搜尋鳥名"></label><p class="bird-library-status" role="status"></p><div class="bird-library-grid"></div>';
document.body.append(dialog);
dialog.querySelector('button').onclick=()=>dialog.close();
const launch=document.createElement('button');launch.type='button';launch.textContent='校方鳥類照片';
document.querySelector('.seasonal-bar')?.append(launch);
const viewer=document.createElement('dialog');viewer.className='bird-photo-viewer';
viewer.innerHTML='<div class="dialog-heading"><h2></h2><button type="button" aria-label="關閉大圖">✕</button></div><img><p></p>';
document.body.append(viewer);viewer.querySelector('button').onclick=()=>viewer.close();
let birds;
function render(){
 const query=dialog.querySelector('input').value.trim().toLowerCase(),grid=dialog.querySelector('.bird-library-grid');grid.replaceChildren();
 const matches=birds.filter(b=>`${b.name} ${b.taxon}`.toLowerCase().includes(query));
 dialog.querySelector('.bird-library-status').textContent=`${matches.length} 張參考照片`;
 for(const bird of matches){
  const card=document.createElement('article'),image=document.createElement('img'),title=document.createElement('h3'),taxon=document.createElement('p'),credit=document.createElement('p'),source=document.createElement('a'),license=document.createElement('a'),school=document.createElement('a'),animate=document.createElement('button');
  image.src=bird.image+'?v='+bird.sha256.slice(0,12);image.alt=bird.name;image.loading='lazy';image.width=360;image.height=240;
  const enlarge=document.createElement('button');enlarge.type='button';enlarge.className='bird-photo-enlarge';enlarge.setAttribute('aria-label','放大'+bird.name+'照片');enlarge.append(image);
  enlarge.onclick=()=>{viewer.querySelector('h2').textContent=bird.name;const full=viewer.querySelector('img');full.src=image.src;full.alt=bird.name;viewer.querySelector('p').textContent=`${bird.imageWidth||bird.sourceWidth} × ${bird.imageHeight||bird.sourceHeight} · 攝影：${bird.artist} · ${bird.license}`;viewer.showModal();};
  title.textContent=bird.name;taxon.textContent=bird.taxon;credit.textContent=`攝影：${bird.artist} · `;
  source.href=bird.sourceUrl;source.textContent='原始照片';license.href=bird.licenseUrl;license.textContent=bird.license;school.href=bird.schoolSource;school.textContent='校方介紹';
  for(const link of [source,license,school]){link.target='_blank';link.rel='noopener';}
  credit.append(license);animate.type='button';animate.textContent='播放照片動態';animate.setAttribute('aria-pressed','false');
  animate.onclick=()=>{if(matchMedia('(prefers-reduced-motion: reduce)').matches){dialog.querySelector('.bird-library-status').textContent='系統已啟用減少動態效果，照片保持靜止。';return;}const active=card.classList.toggle('bird-photo-moving');animate.textContent=active?'停止動態':'播放照片動態';animate.setAttribute('aria-pressed',String(active));};
  card.append(enlarge,title,taxon,animate,credit,source,document.createTextNode(' · '),school);grid.append(card);
 }
}
dialog.querySelector('input').oninput=()=>{if(birds)render();};
dialog.addEventListener('close',()=>{dialog.querySelectorAll('.bird-photo-moving').forEach(el=>el.classList.remove('bird-photo-moving'));if(birds)render();});
launch.onclick=async()=>{
 dialog.showModal();if(birds){render();return;}dialog.querySelector('.bird-library-status').textContent='讀取照片資料…';
 try{const response=await fetch('./bird-reference.json?v=clear-photos-20261106');if(!response.ok)throw Error(response.status);birds=(await response.json()).birds;render();}catch{dialog.querySelector('.bird-library-status').textContent='照片資料讀取失敗，請關閉後重試。';}
};
