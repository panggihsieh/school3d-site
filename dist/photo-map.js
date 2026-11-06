import {campusMapImage,addCampusBrand} from './campus-map.js?v=original-map-20261106';
// Photo positions are percentages of the supplied image, not survey coordinates.
const places=[
 {name:'操場',x:39,y:39,description:'校園中央的草地與環形跑道。'},
 {name:'綜合球場',x:40,y:14,description:'位於示意圖中操場上方的球場。'},
 {name:'遊戲區',x:57,y:17,description:'位於示意圖中綜合球場右側的遊具區。'},
 {name:'教學大樓',x:71,y:31,description:'位於示意圖中操場右側的長條教學大樓。'},
 {name:'幼兒園',x:75,y:59,description:'位於示意圖右下方、教學大樓下端。'},
 {name:'前門',x:12,y:78,description:'位於圖片左下方，面向台 3 線。'},
 {name:'後門',x:86,y:76,description:'位於圖片右下方，鄰近停車空間。'},
 {name:'操場下方校舍',x:40,y:57,description:'位於示意圖中操場下方的橫向校舍，正式名稱與用途待確認。'},
 {name:'圖下方校舍',x:42,y:74,description:'位於示意圖下方、台 3 線上方的橫向校舍，正式名稱與用途待確認。'}
];
const panel=document.querySelector('.map-panel');
const sidebar=document.querySelector('.sidebar');
const toolbar=document.querySelector('.map-toolbar');
const viewButton=document.createElement('button');
viewButton.textContent='3D 視角';viewButton.id='photo-view-toggle';
toolbar.prepend(viewButton);
const spaceCaptureLink=document.createElement('a');spaceCaptureLink.href='./field.html?mode=space';spaceCaptureLink.textContent='空間定位拍照';spaceCaptureLink.className='space-capture-link';viewButton.after(spaceCaptureLink);
const photo=document.createElement('div');photo.id='photo-map';photo.hidden=true;
const image=document.createElement('img');image.src=campusMapImage;image.alt='大南國小原版校園俯視示意圖，從大門進入視角，北朝左下；非測繪圖。';
const stage=document.createElement('div');stage.className='photo-stage';stage.append(image);addCampusBrand(stage);
photo.append(stage);panel.append(photo);
function fitPhoto(){const ratio=image.naturalWidth&&image.naturalHeight?image.naturalWidth/image.naturalHeight:1.5;const width=Math.min(photo.clientWidth,photo.clientHeight*ratio);stage.style.width=`${width}px`;stage.style.height=`${width/ratio}px`;stage.style.aspectRatio=String(ratio);}
image.addEventListener('load',fitPhoto);
new ResizeObserver(fitPhoto).observe(photo);
const guide=document.createElement('section');guide.id='photo-guide';guide.hidden=true;
guide.innerHTML='<p class="intro">從大門進入校園的原版俯視圖，點選標記查看空間介紹。</p><p class="coverage">北 ↙、東 ↖、南 ↗、西 ↘。圖中上下左右不等於東西南北，現場請使用指南針。位置與建物用途為示意，須現場確認；新版正北立體圖保留於拍照後台參考。</p>';
const list=document.createElement('div');guide.append(list);
const tourLink=document.createElement('a');tourLink.href='./tour.html';tourLink.textContent='進入 3D／四向實景校園導覽 →';tourLink.style.cssText='display:block;padding:14px;background:#173f32;color:white;border-radius:10px';guide.prepend(tourLink);
const detail=document.createElement('div');detail.setAttribute('aria-live','polite');guide.append(detail);sidebar.append(guide);
let active=true,currentTopic=new URLSearchParams(location.search).get('topic')||'campus';
const plantLayer=document.createElement('div');plantLayer.className='photo-plants';stage.append(plantLayer);
const plantNote=document.createElement('p');plantNote.className='photo-plant-note';plantNote.textContent='可選取植物後按「標示選取植物」。恢復原版底圖的既有標點。';photo.append(plantNote);
const placePlant=document.createElement('button');placePlant.textContent=currentTopic==='carbon'?'標示選取植物':'標示選取地點';toolbar.append(placePlant);
const suggestedPoints={B01:{x:91,y:35},B02:{x:82,y:86},E01:{x:46,y:64},E02:{x:23,y:46},E03:{x:47,y:86}};
let positioning=false,plantPositions={};
try{plantPositions=JSON.parse(localStorage.getItem('danan-photo-plants-v1')||'{}')||{};}catch{}
function drawPlants(){
 plantLayer.replaceChildren();
 document.querySelectorAll('#point-list [data-id]').forEach(row=>{
  const p=plantPositions[row.dataset.id]||(['birds','ecology'].includes(currentTopic)?suggestedPoints[row.dataset.id]:null);if(!p||!Number.isFinite(p.x)||!Number.isFinite(p.y))return;
  const pin=document.createElement('button');pin.className='photo-pin plant-pin';pin.style.left=`${p.x}%`;pin.style.top=`${p.y}%`;pin.textContent=row.querySelector('.point-number').textContent;pin.title=row.querySelector('.point-label').textContent+(!plantPositions[row.dataset.id]?'（示意建議位置，待現場確認）':'（手動圖片標點）');pin.setAttribute('aria-label',pin.title);pin.setAttribute('aria-pressed',String(row.classList.contains('active')));pin.onclick=()=>row.click();plantLayer.append(pin);
 });
}
new MutationObserver(drawPlants).observe(document.querySelector('#point-list'),{childList:true,subtree:true});
placePlant.onclick=()=>{if(!document.querySelector('#point-list .active'))return;positioning=!positioning;placePlant.textContent=positioning?'點圖片標示（再按取消）':(currentTopic==='carbon'?'標示選取植物':'標示選取地點');};
stage.addEventListener('click',e=>{
 if(!positioning||!['carbon','birds','ecology'].includes(currentTopic)||e.target.closest('button'))return;
 const row=document.querySelector('#point-list .active');if(!row)return;
 const r=stage.getBoundingClientRect(),next={...plantPositions,[row.dataset.id]:{x:Math.max(0,Math.min(100,(e.clientX-r.left)/r.width*100)),y:Math.max(0,Math.min(100,(e.clientY-r.top)/r.height*100))}};
 try{localStorage.setItem('danan-photo-plants-v1',JSON.stringify(next));plantPositions=next;positioning=false;placePlant.textContent=currentTopic==='carbon'?'標示選取植物':'標示選取地點';drawPlants();plantNote.textContent='植物點位為手動圖片標示，僅儲存在此瀏覽器，尚未包含在導覽 JSON 匯出中。';}catch{plantNote.textContent='無法儲存圖片點位，請檢查瀏覽器儲存空間。';}
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
 const visible=active&&['campus','carbon','birds','ecology'].includes(currentTopic);spaceCaptureLink.hidden=currentTopic!=='campus';
 photo.hidden=!visible;guide.hidden=!(visible&&currentTopic==='campus');panel.classList.toggle('photo-mode',visible);sidebar.classList.toggle('photo-mode',visible&&currentTopic==='campus');sidebar.classList.toggle('photo-carbon',visible&&currentTopic==='carbon');
 const overlay=['birds','ecology'].includes(currentTopic);
 panel.classList.toggle('topic-photo-overlay',visible&&overlay);
 stage.querySelectorAll(':scope > .photo-pin').forEach(pin=>pin.hidden=overlay);
 plantLayer.hidden=plantNote.hidden=placePlant.hidden=!(visible&&currentTopic!=='campus');
 plantNote.textContent=overlay?'深色標記為建議觀察／景點位置，非目擊紀錄或實測座標；可選取清單後按「標示選取地點」手動校正。':'可選取植物後按「標示選取植物」。恢復原版底圖的既有標點。';
 positioning=false;placePlant.textContent=currentTopic==='carbon'?'標示選取植物':'標示選取地點';
 viewButton.hidden=false;viewButton.textContent=visible?'3D 視角':'圖片俯視圖';viewButton.setAttribute('aria-pressed',String(visible));drawPlants();fitPhoto();
}
viewButton.onclick=()=>{active=!active;show();};
document.querySelectorAll('.topic').forEach(b=>b.addEventListener('click',()=>{currentTopic=b.dataset.topic;show();}));
// In photo mode the complete image remains fitted in view; 3D controls stay available after switching.
selectPlace(0);show();
