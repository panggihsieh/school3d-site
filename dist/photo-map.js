// Photo positions are percentages of the supplied image, not survey coordinates.
const places=[
 {name:'操場',x:39,y:39,description:'校園中央的草地與環形跑道。'},
 {name:'綜合球場',x:40,y:14,description:'位於示意圖中操場上方的球場。'},
 {name:'遊戲區',x:57,y:17,description:'位於示意圖中綜合球場右側的遊具區。'},
 {name:'教學大樓',x:71,y:31,description:'位於示意圖中操場右側的長條教學大樓。'},
 {name:'幼兒園',x:75,y:59,description:'位於示意圖右下方、教學大樓下端。'},
 {name:'前門',x:12,y:78,description:'位於圖片左下方，面向台 3 線。'},
 {name:'後門',x:86,y:76,description:'位於圖片右下方，鄰近停車空間。'},
 {name:'操場南側校舍',x:40,y:57,description:'位於示意圖中操場下方的橫向校舍，正式名稱與用途待確認。'},
 {name:'南側校舍',x:42,y:74,description:'位於示意圖下方、台 3 線上方的橫向校舍，正式名稱與用途待確認。'}
];
const panel=document.querySelector('.map-panel');
const sidebar=document.querySelector('.sidebar');
const toolbar=document.querySelector('.map-toolbar');
const viewButton=document.createElement('button');
viewButton.textContent='3D 視角';viewButton.id='photo-view-toggle';
toolbar.prepend(viewButton);
const spaceCaptureLink=document.createElement('a');spaceCaptureLink.href='./field.html?mode=space';spaceCaptureLink.textContent='空間定位拍照';spaceCaptureLink.className='space-capture-link';viewButton.after(spaceCaptureLink);
const photo=document.createElement('div');photo.id='photo-map';photo.hidden=true;
const image=document.createElement('img');image.src='./assets/campus-overview.png';image.alt='大南國小校園配置示意圖，北朝圖中左下方，台 3 線繪於圖片下方。';
const stage=document.createElement('div');stage.className='photo-stage';stage.append(image);
// Cover the baked-in north arrow without modifying the shared source image.
const orientationMask=document.createElement('span');orientationMask.className='map-north';orientationMask.innerHTML='北<span aria-hidden="true">↙</span>';orientationMask.setAttribute('role','img');orientationMask.setAttribute('aria-label','北朝左下方');stage.append(orientationMask);photo.append(stage);panel.append(photo);
function fitPhoto(){const width=Math.min(photo.clientWidth,photo.clientHeight*1586/992);stage.style.width=`${width}px`;stage.style.height=`${width*992/1586}px`;}
new ResizeObserver(fitPhoto).observe(photo);
const guide=document.createElement('section');guide.id='photo-guide';guide.hidden=true;
guide.innerHTML='<p class="intro">依提供的校園圖片標示位置。點選圖上的地點或下方清單，查看空間介紹。</p><p class="coverage">北方朝圖中左下方（↙），依現場確認方向標示。圖片為配置示意，非測繪圖；樹木點位請切換至植物碳資訊。</p>';
const list=document.createElement('div');guide.append(list);
const tourLink=document.createElement('a');tourLink.href='./tour.html';tourLink.textContent='進入 3D／四向實景校園導覽 →';tourLink.style.cssText='display:block;padding:14px;background:#173f32;color:white;border-radius:10px';guide.prepend(tourLink);
const detail=document.createElement('div');detail.setAttribute('aria-live','polite');guide.append(detail);sidebar.append(guide);
let active=true,currentTopic=new URLSearchParams(location.search).get('topic')||'campus';
const plantLayer=document.createElement('div');plantLayer.className='photo-plants';stage.append(plantLayer);
const plantNote=document.createElement('p');plantNote.className='photo-plant-note';plantNote.textContent='植物圖片點位待標示；可選取清單中的植物，再點「標示選取植物」。';photo.append(plantNote);
const placePlant=document.createElement('button');placePlant.textContent='標示選取植物';toolbar.append(placePlant);
let positioning=false,plantPositions={};
try{plantPositions=JSON.parse(localStorage.getItem('danan-photo-plants-v1')||'{}')||{};}catch{}
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
 try{localStorage.setItem('danan-photo-plants-v1',JSON.stringify(next));plantPositions=next;positioning=false;placePlant.textContent='標示選取植物';drawPlants();plantNote.textContent='植物點位為手動圖片標示，僅儲存在此瀏覽器，尚未包含在導覽 JSON 匯出中。';}catch{plantNote.textContent='無法儲存圖片點位，請檢查瀏覽器儲存空間。';}
});
function selectPlace(index){
 const p=places[index];
 detail.innerHTML=`<div class="detail-top"><h3>${p.name}</h3></div><span class="status-pill">依校園圖片標示</span><p class="detail-description">${p.description}</p>`;
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
