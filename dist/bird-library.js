const dialog=document.createElement('dialog');
dialog.className='bird-library';
dialog.setAttribute('aria-labelledby','bird-library-title');
dialog.innerHTML='<div class="dialog-heading"><h2 id="bird-library-title">校方鳥類照片參考</h2><button type="button" aria-label="關閉">✕</button></div><p>依校方介紹的 12 張照片整理；兩張角鴞保留分開，並非 12 個已確認物種。參考照片不代表梅山現地拍攝或當日校園目擊。</p><p>已確認鳥種提供 15 秒透明背景循環動畫。影片由 AI 合成，非實際野外行為錄影；鳥種待核對的照片保留原圖。</p><label>搜尋鳥名 <input type="search" placeholder="例如：五色鳥" aria-label="搜尋鳥名"></label><p class="bird-library-status" role="status"></p><div class="bird-library-grid"></div>';
document.body.append(dialog);
dialog.querySelector('button').onclick=()=>dialog.close();
const launch=document.createElement('button');launch.type='button';launch.textContent='校方鳥類照片';
document.querySelector('.seasonal-bar')?.append(launch);
const viewer=document.createElement('dialog');viewer.className='bird-photo-viewer';
viewer.innerHTML='<div class="dialog-heading"><h2></h2><button type="button" aria-label="關閉大圖">✕</button></div><img><p></p>';
document.body.append(viewer);viewer.querySelector('button').onclick=()=>viewer.close();
let birds;
function render(){
 const query=dialog.querySelector('input').value.trim().toLowerCase(),grid=dialog.querySelector('.bird-library-grid');grid.querySelectorAll('video').forEach(video=>video.pause());grid.replaceChildren();
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
  credit.append(license);animate.type='button';animate.textContent=bird.animation?'播放15秒動畫':'鳥種待核對';animate.disabled=!bird.animation;animate.setAttribute('aria-pressed','false');const video=document.createElement('video');video.hidden=true;video.controls=true;video.muted=true;video.loop=true;video.playsInline=true;video.preload='none';video.setAttribute('aria-label',bird.name+'15秒AI動畫');const note=document.createElement('small');note.textContent=bird.animation?'影片由 AI 合成並去背，非實際野外行為錄影。 原照片：'+bird.animationAttribution+' · '+bird.animationLicense+' ':'';if(bird.animation){const videoSource=document.createElement('a');videoSource.href=bird.animationSource;videoSource.textContent='動畫來源照片';videoSource.target='_blank';videoSource.rel='noopener';note.append(videoSource);if(bird.animationLicenseUrl){const terms=document.createElement('a');terms.href=bird.animationLicenseUrl;terms.textContent='授權';terms.target='_blank';terms.rel='noopener';note.append(document.createTextNode(' · '),terms);}}
  animate.onclick=()=>{const active=video.hidden;video.hidden=!active;animate.textContent=active?'收起動畫':'播放15秒動畫';animate.setAttribute('aria-pressed',String(active));if(active){if(!video.getAttribute('src'))video.src=bird.animation+'?v='+(bird.animationSha256||'').slice(0,12);void video.play().catch(()=>{dialog.querySelector('.bird-library-status').textContent='請按影片播放鍵開始。';});}else video.pause();};video.onerror=()=>{dialog.querySelector('.bird-library-status').textContent=bird.name+'動畫讀取失敗，可繼續查看原照片。';};
  card.append(enlarge,title,taxon,animate,video,note,credit,source,document.createTextNode(' · '),school);grid.append(card);
 }
}
dialog.querySelector('input').oninput=()=>{if(birds)render();};
dialog.addEventListener('close',()=>{dialog.querySelectorAll('video').forEach(video=>video.pause());dialog.querySelectorAll('.bird-photo-moving').forEach(el=>el.classList.remove('bird-photo-moving'));if(birds)render();});
launch.onclick=async()=>{
 dialog.showModal();if(birds){render();return;}dialog.querySelector('.bird-library-status').textContent='讀取照片資料…';
 try{const response=await fetch('./bird-reference.json?v=animations-20261106');if(!response.ok)throw Error(response.status);birds=(await response.json()).birds;render();}catch{dialog.querySelector('.bird-library-status').textContent='照片資料讀取失敗，請關閉後重試。';}
};
