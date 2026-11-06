// Photo positions are percentages of the supplied image, not survey coordinates.
const places=[
 {name:'操場',x:37.8,y:60.5,description:'草地與環形跑道，依衛星截圖重繪。'},
 {name:'綜合球場',x:51.4,y:74.2,description:'位於操場東南側的球場，區域名稱參考校園圖。'},
 {name:'操場旁長條校舍',x:32.5,y:44.6,description:'沿操場西北側的長條校舍；屋頂可見太陽能板。正式名稱、用途與入口待校方確認。'},
 {name:'臨路校舍',x:30.6,y:29.3,description:'靠台 3 線、位於長條校舍西北側的校舍。用途與入口待確認。'},
 {name:'西南側校舍',x:21.8,y:73,description:'操場西南端的校舍群，實際樓層與用途待校方確認。'},
 {name:'校舍間庭院',x:33,y:34.2,description:'臨路校舍與操場旁長條校舍之間的空間；可通行範圍與出入口須現場確認。'}
];
const panel=document.querySelector('.map-panel');
const sidebar=document.querySelector('.sidebar');
const toolbar=document.querySelector('.map-toolbar');
const viewButton=document.createElement('button');
viewButton.textContent='3D 視角';viewButton.id='photo-view-toggle';
toolbar.prepend(viewButton);
const spaceCaptureLink=document.createElement('a');spaceCaptureLink.href='./field.html?mode=space';spaceCaptureLink.textContent='空間定位拍照';spaceCaptureLink.className='space-capture-link';viewButton.after(spaceCaptureLink);
const photo=document.createElement('div');photo.id='photo-map';photo.hidden=true;
const image=document.createElement('img');image.src='./assets/campus-overview-north-v2.png';image.alt='大南國小校園俯視重繪示意圖，正北朝上，台 3 線在校園西北側；非測繪圖。';
const stage=document.createElement('div');stage.className='photo-stage';stage.append(image);
photo.append(stage);panel.append(photo);
function fitPhoto(){const ratio=image.naturalWidth&&image.naturalHeight?image.naturalWidth/image.naturalHeight:1.5;const width=Math.min(photo.clientWidth,photo.clientHeight*ratio);stage.style.width=`${width}px`;stage.style.height=`${width/ratio}px`;stage.style.aspectRatio=String(ratio);}
image.addEventListener('load',fitPhoto);
new ResizeObserver(fitPhoto).observe(photo);
const guide=document.createElement('section');guide.id='photo-guide';guide.hidden=true;
guide.innerHTML='<p class="intro">依提供的 Google Earth 衛星截圖與校園圖參考重繪。點選標記查看各區介紹。</p><p class="coverage">本圖正北朝上：北 ↑、東 →、南 ↓、西 ←。AI 重繪為配置示意，非實拍、非測繪圖；建物用途與出入口待現場核對。拍照站點頁仍使用原圖，請依站號及現場指南針確認。</p>';
const list=document.createElement('div');guide.append(list);
const tourLink=document.createElement('a');tourLink.href='./tour.html';tourLink.textContent='進入 3D／四向實景校園導覽 →';tourLink.style.cssText='display:block;padding:14px;background:#173f32;color:white;border-radius:10px';guide.prepend(tourLink);
const detail=document.createElement('div');detail.setAttribute('aria-live','polite');guide.append(detail);sidebar.append(guide);
let active=true,currentTopic=new URLSearchParams(location.search).get('topic')||'campus';
const plantLayer=document.createElement('div');plantLayer.className='photo-plants';stage.append(plantLayer);
const plantNote=document.createElement('p');plantNote.className='photo-plant-note';plantNote.textContent='新底圖植物點位待標示；舊圖標點保留但不套用。可選取植物後按「標示選取植物」。';photo.append(plantNote);
const placePlant=document.createElement('button');placePlant.textContent='標示選取植物';toolbar.append(placePlant);
let positioning=false,plantPositions={};
try{plantPositions=JSON.parse(localStorage.getItem('danan-photo-plants-north-v2')||'{}')||{};}catch{}
function drawPlants(){
 plantLayer.replaceChildren();
 document.querySelectorAll('#point-list [data-id]').forEach(row=>{
  const p=plantPositions[row.dataset.id];if(!p||!Number.isFinite(p.x)||!Number.isFinite(p.y))return;
  const pin=document.createElement('button');pin.className='photo-pin plant-pin';pin.style.left=`${p.x}%`;pin.style.top=`${p.y}%`;pin.textContent=row.querySelector('.point-number').textContent;pin.title=row.querySelector('.point-label').textContent;pin.setAttribute('aria-label',pin.title);pin.setAttribute('aria-pressed',String(row.classList.contains('active')));pin.onclick=()=>row.click();plantLayer.append(pin);
 });
}
new MutationObserver(drawPlants).observe(document.querySelector('#point-list'),{childList:true,subtree:true});
placePlant.onclick=()=>{if(!document.querySelector('#point-list .active'))return;positioning=!positioning;placePlant.textContent=positioning?'點圖片標示（再按取消）':'標示選取植物';};
stage.addEventListener('click',e=>{
 if(!positioning||currentTopic!=='carbon'||e.target.closest('button'))return;
 const row=document.querySelector('#point-list .active');if(!row)return;
 const r=stage.getBoundingClientRect(),next={...plantPositions,[row.dataset.id]:{x:Math.max(0,Math.min(100,(e.clientX-r.left)/r.width*100)),y:Math.max(0,Math.min(100,(e.clientY-r.top)/r.height*100))}};
 try{localStorage.setItem('danan-photo-plants-north-v2',JSON.stringify(next));plantPositions=next;positioning=false;placePlant.textContent='標示選取植物';drawPlants();plantNote.textContent='植物點位為手動圖片標示，僅儲存在此瀏覽器，尚未包含在導覽 JSON 匯出中。';}catch{plantNote.textContent='無法儲存圖片點位，請檢查瀏覽器儲存空間。';}
});
function selectPlace(index){
 const p=places[index];
 detail.innerHTML=`<div class="detail-top"><h3>${p.name}</h3></div><span class="status-pill">依重繪圖片標示・待現場核對</span><p class="detail-description">${p.description}</p>`;
 stage.querySelectorAll(':scope > .photo-pin').forEach((b,i)=>b.setAttribute('aria-pressed',String(i===index)));
 list.querySelectorAll('button').forEach((b,i)=>{b.classList.toggle('active',i===index);b.setAttribute('aria-pressed',String(i===index));});
}
places.forEach((p,i)=>{
 const pin=document.createElement('button');pin.className='photo-pin';pin.textContent=p.name;pin.style.left=`${p.x}%`;pin.style.top=`${p.y}%`;pin.onclick=()=>selectPlace(i);stage.append(pin);
 const item=document.createElement('button');item.className='point-row';item.innerHTML=`<span class="point-number">${String(i+1).padStart(2,'0')}</span><span class="point-label">${p.name}</span><span class="point-arrow">↗</span>`;item.onclick=()=>selectPlace(i);list.append(item);
});
function show(){
 const visible=active&&['campus','carbon'].includes(currentTopic);spaceCaptureLink.hidden=currentTopic!=='campus';
 photo.hidden=!visible;guide.hidden=!(visible&&currentTopic==='campus');panel.classList.toggle('photo-mode',visible);sidebar.classList.toggle('photo-mode',visible&&currentTopic==='campus');sidebar.classList.toggle('photo-carbon',visible&&currentTopic==='carbon');
 plantLayer.hidden=plantNote.hidden=placePlant.hidden=!(visible&&currentTopic==='carbon');
 positioning=false;placePlant.textContent='標示選取植物';
 viewButton.hidden=!['campus','carbon'].includes(currentTopic);viewButton.textContent=visible?'3D 視角':'圖片俯視圖';viewButton.setAttribute('aria-pressed',String(visible));drawPlants();fitPhoto();
}
viewButton.onclick=()=>{active=!active;show();};
document.querySelectorAll('.topic').forEach(b=>b.addEventListener('click',()=>{currentTopic=b.dataset.topic;show();}));
// In photo mode the complete image remains fitted in view; 3D controls stay available after switching.
selectPlace(0);show();
