import {campusMapImage,addCampusBrand} from './campus-map.js?v=campus-slope-20261111';
import {stations} from './space-domain.js?v=campus-slope-20261111';
// Photo positions are percentages of the supplied image, not survey coordinates.
const places=[
 {name:'操場',x:40,y:44,description:'校園中央的草地與環形跑道。'},
 {name:'綜合球場',x:33.5,y:24.5,description:'位於示意圖中操場上方的球場。'},
 {name:'遊戲區',x:45,y:28,description:'位於示意圖中綜合球場右側的遊具區。'},
 {name:'視聽大樓／幼兒園',x:63,y:36,description:'依校方標註，位於圖右側校舍上段，2F 為視聽大樓，1F 為幼兒園。'},
 {name:'圖書室（2F）',x:66,y:52,description:'依校方標註，位於圖右側校舍中段的二樓。'},
 {name:'鼓隊練習室（1F）',x:66,y:52,description:'依校方標註，位於圖右側校舍中段一樓，二樓為圖書室。'},
 {name:'前門',x:21.5,y:87,description:'位於圖片左下方，面向台 3 線。'},
 {name:'後門',x:69,y:81,description:'位於圖片右下方，鄰近停車空間。'},
 {name:'東邊校舍',x:30,y:62,description:'依校方標註，位於圖中操場下方橫向校舍的左段；「東邊」為校方提供的校舍名稱。'},
 {name:'辦公室',x:45,y:62,description:'依校方標註，位於操場下方橫向校舍，圖中東邊校舍的右側。'},
 {name:'西邊校舍',x:51,y:79,description:'依校方標註，位於圖下方橫向校舍的右段、保健室右側；「西邊」為校方提供的校舍名稱。'},
 {name:'保健室',x:38,y:81,description:'依校方標註，位於圖下方橫向校舍的中段、西邊校舍左側。'},
 {name:'遊戲區（庭院）',x:28,y:77,description:'依校方標註，位於兩排橫向校舍之間庭院的左側。此處與綜合球場旁的遊戲區是不同位置。'},
 {name:'生態池',x:44,y:72,description:'依校方標註，位於兩排橫向校舍之間庭院的右側。位置依校方提供的圖示對照，池內物種仍需現地觀察確認。'},
 {name:'落葉堆肥區',x:42,y:17,description:'依校方標註，位於圖上方、綜合球場與遊戲區後方的樹帶附近。可觀察落葉分解與堆肥，不能僅憑位置推定有哪些生物。'}
];
const panel=document.querySelector('.map-panel');
const sidebar=document.querySelector('.sidebar');
const toolbar=document.querySelector('.map-toolbar');
const viewButton=document.createElement('button');
viewButton.textContent='3D 視角';viewButton.id='photo-view-toggle';
toolbar.prepend(viewButton);
const spaceCaptureLink=document.createElement('a');spaceCaptureLink.href='./field.html?mode=space';spaceCaptureLink.textContent='空間定位拍照';spaceCaptureLink.className='space-capture-link';viewButton.after(spaceCaptureLink);
const photo=document.createElement('div');photo.id='photo-map';photo.hidden=true;
const image=document.createElement('img');image.src=campusMapImage;image.alt='大南國小校方校對版校園俯視示意圖，北朝左下；非測繪圖。';
const stage=document.createElement('div');stage.className='photo-stage';stage.append(image);addCampusBrand(stage);
photo.append(stage);panel.append(photo);
const stationLayer=document.createElement('div');stationLayer.className='campus-station-layer';stage.append(stationLayer);
for(const s of stations){const pin=document.createElement('a');pin.className='campus-station-pin';pin.textContent=s.id;pin.title=`${s.id} ${s.name}（新版圖片概略位置，待現場核對）`;pin.setAttribute('aria-label',pin.title);pin.style.left=`${s.x}%`;pin.style.top=`${s.y}%`;pin.href=`./capture.html?station=${s.id}`;stationLayer.append(pin);}
let showStations=true;
const stationToggle=document.createElement('button');stationToggle.id='campus-station-toggle';stationToggle.textContent='拍攝站點（15 站）';stationToggle.setAttribute('aria-pressed','true');spaceCaptureLink.after(stationToggle);
stationToggle.onclick=()=>{showStations=!showStations;stationToggle.setAttribute('aria-pressed',String(showStations));show();};
function fitPhoto(){const ratio=image.naturalWidth&&image.naturalHeight?image.naturalWidth/image.naturalHeight:1.5;const width=Math.min(photo.clientWidth,photo.clientHeight*ratio);stage.style.width=`${width}px`;stage.style.height=`${width/ratio}px`;stage.style.aspectRatio=String(ratio);}
image.addEventListener('load',fitPhoto);
new ResizeObserver(fitPhoto).observe(photo);
const guide=document.createElement('section');guide.id='photo-guide';guide.hidden=true;
guide.innerHTML='<p class="intro">校方檢核版保留 15 個拍攝站點；點選站號查看拍照說明。可切換「拍攝站點（15 站）」查看空間名稱標記。校舍用途依校方於 2026/11/09 提供的標註圖修正。</p><p class="coverage">北 ↙ 指向前門方向；東 ↖、南 ↗、西 ↘。圖中上下左右不等於東西南北；東邊／西邊校舍沿用校方名稱。站點為新版圖片概略對照，待現場核對，非 GPS 或測量座標。</p>';
const list=document.createElement('div');guide.append(list);
const tourLink=document.createElement('a');tourLink.href='./tour.html';tourLink.textContent='進入 3D／四向實景校園導覽 →';tourLink.style.cssText='display:block;padding:14px;background:#173f32;color:white;border-radius:10px';guide.prepend(tourLink);
const detail=document.createElement('div');detail.setAttribute('aria-live','polite');guide.append(detail);sidebar.append(guide);
let active=true,currentTopic=new URLSearchParams(location.search).get('topic')||'campus';
const plantLayer=document.createElement('div');plantLayer.className='photo-plants';stage.append(plantLayer);
const plantNote=document.createElement('p');plantNote.className='photo-plant-note';plantNote.textContent='新版重繪底圖：植物點位需重新對照，舊版圖片標點仍保留於原瀏覽器資料。';photo.append(plantNote);
const placePlant=document.createElement('button');placePlant.textContent=currentTopic==='carbon'?'標示選取植物':'標示選取地點';toolbar.append(placePlant);
const suggestedPoints={B01:{x:68,y:35},B02:{x:68,y:81},E01:{x:40,y:60},E02:{x:23,y:46},E03:{x:47,y:86}};
let positioning=false,plantPositions={};
try{plantPositions=JSON.parse(localStorage.getItem('danan-photo-plants-redraw-20261111-v1')||'{}')||{};}catch{}
function drawPlants(){
 plantLayer.replaceChildren();
 if(currentTopic==='ecology'){document.dispatchEvent(new Event('campus-photo-points'));return;}
 document.querySelectorAll('#point-list [data-id]').forEach(row=>{
  const p=plantPositions[row.dataset.id]||(['birds','ecology'].includes(currentTopic)?suggestedPoints[row.dataset.id]:null);if(!p||!Number.isFinite(p.x)||!Number.isFinite(p.y))return;
  const pin=document.createElement('button');pin.className='photo-pin plant-pin';pin.style.left=`${p.x}%`;pin.style.top=`${p.y}%`;pin.textContent=row.querySelector('.point-number').textContent;pin.title=row.querySelector('.point-label').textContent+(!plantPositions[row.dataset.id]?'（示意建議位置，待現場確認）':'（手動圖片標點）');pin.setAttribute('aria-label',pin.title);pin.setAttribute('aria-pressed',String(row.classList.contains('active')));pin.onclick=()=>row.click();plantLayer.append(pin);
 });
 document.dispatchEvent(new Event('campus-photo-points'));
}
new MutationObserver(drawPlants).observe(document.querySelector('#point-list'),{childList:true,subtree:true});
placePlant.onclick=()=>{if(!document.querySelector('#point-list .active'))return;positioning=!positioning;placePlant.textContent=positioning?'點圖片標示（再按取消）':(currentTopic==='carbon'?'標示選取植物':'標示選取地點');};
stage.addEventListener('click',e=>{
 if(!positioning||!['carbon','birds','ecology'].includes(currentTopic)||e.target.closest('button'))return;
 const row=document.querySelector('#point-list .active');if(!row)return;
 const r=stage.getBoundingClientRect(),next={...plantPositions,[row.dataset.id]:{x:Math.max(0,Math.min(100,(e.clientX-r.left)/r.width*100)),y:Math.max(0,Math.min(100,(e.clientY-r.top)/r.height*100))}};
 try{localStorage.setItem('danan-photo-plants-redraw-20261111-v1',JSON.stringify(next));plantPositions=next;if(currentTopic==='ecology')plantNote.textContent='生態主題尚未定位時不放置標記；教師可登入後點圖放置或拖曳標記。';
 positioning=false;placePlant.textContent=currentTopic==='carbon'?'標示選取植物':'標示選取地點';drawPlants();plantNote.textContent='植物點位為手動圖片標示，僅儲存在此瀏覽器，尚未包含在導覽 JSON 匯出中。';}catch{plantNote.textContent='無法儲存圖片點位，請檢查瀏覽器儲存空間。';}
});
function selectPlace(index){
 const p=places[index];
 detail.innerHTML=`<div class="detail-top"><h3>${p.name}</h3></div><span class="status-pill">${index<3?'新版圖片概略對照':'依舊校方標註概略對照'}・非測繪座標</span><p class="detail-description">${p.description}</p>`;
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
 stationToggle.hidden=!(visible&&currentTopic==='campus');stationLayer.hidden=!(visible&&currentTopic==='campus'&&showStations);
 stage.querySelectorAll(':scope > .photo-pin').forEach(pin=>pin.hidden=true);
 plantLayer.hidden=plantNote.hidden=placePlant.hidden=!(visible&&currentTopic!=='campus');if(currentTopic==='ecology'){placePlant.hidden=true;plantNote.textContent='生態主題尚未定位時不放置標記；教師可登入後點圖放置或拖曳標記。';}
 plantNote.textContent=overlay?'深色標記為建議觀察／景點位置，非目擊紀錄或實測座標；可選取清單後按「標示選取地點」手動校正。':'新版重繪底圖：植物點位需重新對照，舊版圖片標點仍保留於原瀏覽器資料。';
 if(currentTopic==='ecology')plantNote.textContent='生態主題尚未定位時不放置標記；教師可登入後點圖放置或拖曳標記。';
 positioning=false;placePlant.textContent=currentTopic==='carbon'?'標示選取植物':'標示選取地點';
 viewButton.hidden=false;viewButton.textContent=visible?'3D 視角':'圖片俯視圖';viewButton.setAttribute('aria-pressed',String(visible));drawPlants();fitPhoto();
}
viewButton.onclick=()=>{active=!active;show();};
document.querySelectorAll('.topic').forEach(b=>b.addEventListener('click',()=>{currentTopic=b.dataset.topic;show();}));
// In photo mode the complete image remains fitted in view; 3D controls stay available after switching.
selectPlace(0);show();
