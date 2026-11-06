import {createPlantAudio} from './plant-audio.js?v=reading-context-20261106';
import {mountSpeechTest} from './field-stt.js?v=stt-success-20261106';
import {createFieldSpeaker} from './field-speech.js?v=voice-diagnostic-20261106';
import {createWikiReference} from './wiki-trees.js?v=space-capture-1';
import {createSpeciesReference} from './species-library.js?v=live-follow-20261106';
import {mountTeacherAI} from './teacher-ai.js?v=ai-status-20261106';
import {mountSpaceCapture} from './space-capture.js?v=campus-3d-v4-20261106';
import {showPublishedPhotos} from './public-media.js?v=space-capture-1';
import {refreshPublishedPhotos} from './published-photos.js?v=1';
import {firebaseConfig,adminEmail} from './firebase-config.js';
import {isAuthorizedAdmin} from './admin-auth.js';
import {uploadServiceURL} from './field-config.js';
import {photoKinds,nearbyTrees,arrivalEligible,chooseNearbyTarget,targetReadingContext} from './field-domain.js?v=campus-3d-v4-20261106';
const $=s=>document.querySelector(s);let auth,authAPI,user,trees=[],selected,position,watch,resumeLocation=false,arrivalFor='',draftDB,drafts=[],objectURLs=[],followedTarget=false,actualTarget='';
const admin=()=>isAuthorizedAdmin(user);
const showWikiReference=createWikiReference($('#target'));
const showLibraryReference=createSpeciesReference($('#target'));
const speaker=createFieldSpeaker({synth:window.speechSynthesis,Utterance:window.SpeechSynthesisUtterance,enabled:()=>$('#voice').checked,audioSession:navigator.audioSession,getVoice:()=>$('#tts-voice').value||'system',status:text=>$('#speech-status').textContent=text});
const plantAudio=createPlantAudio({audio:$('#plant-audio'),status:text=>$('#speech-status').textContent=text,stopSpeech:()=>speaker.stop()});
function readCurrentTarget(){
 const context=targetReadingContext(trees,selected,position,watch!==undefined);
 $('#gps-status').textContent=context.message;
 if($('#tts-voice').value==='recorded'){document.dispatchEvent(new Event('teacher-read-target'));return plantAudio.play(context.clip);}
 return say(context.message,true);
}
function say(text,manual=false){if(!manual&&!$('#voice').checked)return false;if($('#tts-voice').value==='recorded'){const clip=text==='STT 成功'?'stt-success':text.startsWith('已接近')?selected?.id:/語音輸出測試|朗讀測試成功/.test(text)?'test':null;if(clip){if(manual)document.dispatchEvent(new Event('teacher-read-target'));return plantAudio.play(clip,{manual});}}plantAudio.stop();if(manual)document.dispatchEvent(new Event('teacher-read-target'));return speaker.speak(text,{manual});}
function stopLocation(){if(watch!==undefined)navigator.geolocation.clearWatch(watch);watch=undefined;$('#locate').disabled=false;$('#stop').disabled=true;$('#follow-status').textContent=$('#follow-location').checked?'自動跟隨已開啟，按「開始定位」後會顯示您附近的植物。':'目標已固定；勾選「依手機位置自動顯示附近植物」可恢復。';}
function pauseFollowing(message){$('#follow-location').checked=false;followedTarget=false;$('#follow-status').textContent=message;}
function manualTarget(id){pauseFollowing('已固定您選取的植物；勾選「依手機位置自動顯示附近植物」可恢復動態切換。');setTarget(id);}
function setTarget(id){selected=trees.find(t=>t.id===id);$('#tree').value=id;$('#confirmed').checked=false;$('#camera').disabled=$('#album').disabled=true;arrivalFor='';renderTarget();drawMap();document.dispatchEvent(new Event('teacher-context-change'));}
function locationReliable(){return !!position&&Number.isFinite(position.accuracy)&&position.accuracy>=0&&position.accuracy<=25&&Date.now()-position.time<=30000&&position.time<=Date.now()+5000;}
function renderTarget(force=false){if(!selected)return;$('#target').replaceChildren();const h=document.createElement('h3');h.textContent=selected.name;const p=document.createElement('p');p.textContent=`平台編號 ${selected.sourceTreeId}；${selected.latitude}, ${selected.longitude}。${locationReliable()?`距離約 ${Math.round(nearbyTrees([selected],position)[0].distance)} 公尺。`:''}平台位置待現場核對。`;$('#target').append(h,p);showWikiReference(selected,{force});showLibraryReference(selected,{force});if(actualTarget!==selected.id){actualTarget=selected.id;$('#target-photos').replaceChildren();showPublishedPhotos(selected.id,$('#target-photos'));}}
function options(){const search=$('#tree-search').value.trim().toLowerCase();const list=trees.filter(t=>`${t.name} ${t.label} ${t.sourceTreeId}`.toLowerCase().includes(search));$('#tree').replaceChildren();for(const t of list){const o=document.createElement('option');o.value=t.id;o.textContent=t.name;$('#tree').append(o);}if(list.some(t=>t.id===selected?.id))$('#tree').value=selected.id;else if(list[0])setTarget(list[0].id);}
function updateNearby(){
 if(!position)return;
 if(!locationReliable()){
  $('#nearest-live').textContent=`定位精度不足或資料過期，無法判斷最近植物（回報誤差 ±${Math.round(position.accuracy)} 公尺）。請保持頁面在前景並重新取得精確定位。`;
  $('#nearby').replaceChildren();$('#resume-follow').hidden=true;
  $('#follow-status').textContent='暫停自動換株與到達提醒；精度改善到 ±25 公尺內且定位更新後才恢復。';
  renderTarget();drawMap();return;
 }
 const nearby=nearbyTrees(trees,position);
 if(nearby[0]?.distance>200){
  $('#nearest-live').textContent=`目前不在校園樹木附近；距最近校樹約 ${Math.round(nearby[0].distance)} 公尺，不代表已接近該株。`;
  $('#nearby').replaceChildren();$('#resume-follow').hidden=true;
  $('#follow-status').textContent='校外暫停自動換株，保留原選取目標；回到校樹附近才恢復。';
  renderTarget();drawMap();return;
 }
 const nearest=nearby[0];$('#nearest-live').textContent=nearest?`目前最近：${nearest.label} ${nearest.species}，約 ${Math.round(nearest.distance)} 公尺（定位精度 ±${Math.round(position.accuracy)} 公尺）。${$('#follow-location').checked?'隨位置持續更新。':'拍攝目標已固定；最近植物仍隨位置更新。'}`:'目前沒有植物定位資料。';$('#resume-follow').hidden=$('#follow-location').checked||!nearest;
 if($('#follow-location').checked){
  const result=chooseNearbyTarget(nearby,followedTarget?selected?.id:null,position.accuracy);
  if(result.tree){followedTarget=true;if(result.tree.id!==selected?.id){$('#tree-search').value='';setTarget(result.tree.id);options();}}
  $('#follow-status').textContent=result.reason==='accuracy'?'定位誤差較大，附近清單持續更新；精度改善到 ±25 公尺內後會自動切換。':result.tree?`自動跟隨中：${result.tree.name}，約 ${Math.round(result.tree.distance)} 公尺。${result.reason==='stable'?'附近植物距離相近，暫時保持目標以減少定位飄移切換。':'位置移動後會自動更新植物、照片與對話目標。'}`:'目前沒有可定位的植物資料。';
 }
 $('#nearby').replaceChildren();for(const t of nearby.slice(0,5)){const b=document.createElement('button');b.textContent=`${t.label} ${t.species} · 約 ${Math.round(t.distance)} 公尺`;b.setAttribute('aria-pressed',String(t.id===selected?.id));b.onclick=()=>manualTarget(t.id);$('#nearby').append(b);}
 renderTarget();drawMap();if(selected){const target=nearby.find(t=>t.id===selected.id);if(target&&arrivalEligible(target.distance,position.accuracy)&&arrivalFor!==selected.id){arrivalFor=selected.id;say(`已接近${selected.label}，${selected.species}。請確認樹木編號，再拍照。`);}}
}
function drawMap(){
 const svg=$('#field-map');svg.replaceChildren();if(!trees.length)return;
 const lat=trees.reduce((s,t)=>s+t.latitude,0)/trees.length,lon=trees.reduce((s,t)=>s+t.longitude,0)/trees.length;
 // North-up display; raw GPS coordinates and distance calculations are unchanged.
 const xy=p=>{const east=(p.longitude-lon)*111320*Math.cos(lat*Math.PI/180),north=(p.latitude-lat)*111320;return [east,north];};
 const coords=trees.map(xy);const xs=coords.map(p=>p[0]),ys=coords.map(p=>p[1]);const minX=Math.min(...xs)-15,maxX=Math.max(...xs)+15,minY=Math.min(...ys)-15,maxY=Math.max(...ys)+15;
 const scale=Math.min(550/(maxX-minX),350/(maxY-minY));const project=p=>{const [x,y]=xy(p);return [25+(x-minX)*scale,375-(y-minY)*scale];};
 const node=(tag,attrs,text)=>{const el=document.createElementNS('http://www.w3.org/2000/svg',tag);for(const [k,v] of Object.entries(attrs))el.setAttribute(k,v);if(text)el.textContent=text;svg.append(el);return el;};
 // Faint context image only; no geographic registration is implied.
 node('image',{href:'./assets/campus-overview-3d-north-v4.png',x:0,y:12,width:600,height:375,preserveAspectRatio:'xMidYMid meet',opacity:.12,'aria-hidden':'true'});
 node('rect',{x:540,y:12,width:60,height:65,fill:'#eef4e7'});
 node('text',{x:550,y:30,fill:'#193d30'},'北 ↑');
 node('text',{x:12,y:395,fill:'#506450','font-size':11},'淡化底圖僅供環境參考・未精準對位');
 for(const t of trees){const [cx,cy]=project(t);const pin=node('circle',{cx,cy,r:t.id===selected?.id?8:3.5,fill:t.id===selected?.id?'#d06c0b':'#37814c'});const title=document.createElementNS(svg.namespaceURI,'title');title.textContent=t.name;pin.append(title);}
 if(position&&!locationReliable()){node('text',{x:20,y:25,fill:'#8d3d20'},'手機定位精度不足或資料過期，暫不顯示藍點');}
 else if(position){const [cx,cy]=project(position);if(cx>=0&&cx<=600&&cy>=0&&cy<=400){node('circle',{cx,cy,r:position.accuracy*scale,fill:'#2187cf22',stroke:'#2187cf'});node('circle',{cx,cy,r:6,fill:'#0876ca',stroke:'white','stroke-width':2});}else node('text',{x:20,y:25,fill:'#8d3d20'},'你目前在校園座標圖範圍外');}
}
function locate(){
 if(!admin())return;if(!navigator.geolocation){$('#gps-status').textContent='此瀏覽器不支援定位。';return;}
 stopLocation();followedTarget=false;if(!$('#confirmed').checked){$('#follow-location').checked=true;$('#tree-search').value='';options();}$('#locate').disabled=true;$('#stop').disabled=false;$('#gps-status').textContent='定位中，請允許瀏覽器使用位置…';$('#follow-status').textContent=$('#follow-location').checked?'取得手機位置後，會自動顯示附近植物。':'目標已固定，附近清單仍會依位置更新。';say('開始定位，取得位置後會顯示附近樹木。');
 watch=navigator.geolocation.watchPosition(p=>{
  position={latitude:p.coords.latitude,longitude:p.coords.longitude,accuracy:p.coords.accuracy,time:p.timestamp};
  $('#gps-status').textContent=`定位精度約 ±${Math.round(position.accuracy)} 公尺，更新於 ${new Date(p.timestamp).toLocaleTimeString('zh-TW')}。${position.accuracy>25?'目前誤差較大，暫不觸發到達提醒。':''}`;
  updateNearby();
 },e=>{$('#gps-status').textContent=e.code===1?'定位權限未開啟，請在 Safari 網站設定允許位置；仍可手動選樹拍照。':e.code===3?'定位逾時，請移到空曠處重試。':'無法取得位置，請檢查定位服務。';stopLocation();},{enableHighAccuracy:true,maximumAge:5000,timeout:20000});
}
async function openDrafts(){return new Promise((resolve,reject)=>{const r=indexedDB.open('danan-field-photos',1);r.onupgradeneeded=()=>r.result.createObjectStore('photos',{keyPath:'id'});r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);});}
function store(method,value){return new Promise((resolve,reject)=>{const tx=draftDB.transaction('photos',method==='getAll'?'readonly':'readwrite');const r=tx.objectStore('photos')[method](...(value===undefined?[]:[value]));let result;r.onsuccess=()=>result=r.result;tx.oncomplete=()=>resolve(result);tx.onerror=()=>reject(tx.error);tx.onabort=()=>reject(tx.error||Error('保存失敗'));});}
async function compress(file,panorama=false){
 const url=URL.createObjectURL(file);try{const image=new Image();image.src=url;await image.decode();if(panorama&&Math.abs(image.naturalWidth/image.naturalHeight-2)>.02)throw Error('完整環景必須是 2:1 圖片；比例符合仍需確認已涵蓋完整球面');let size=panorama?4096:1600;
  for(let attempt=0;attempt<4;attempt++){const scale=Math.min(1,size/Math.max(image.naturalWidth,image.naturalHeight));const canvas=document.createElement('canvas');canvas.width=Math.round(image.naturalWidth*scale);canvas.height=Math.round(image.naturalHeight*scale);canvas.getContext('2d').drawImage(image,0,0,canvas.width,canvas.height);const blob=await new Promise(r=>canvas.toBlob(r,'image/jpeg',.78));if(blob&&blob.size<=(panorama?2600000:650000))return blob;size=Math.round(size*.75);}throw Error('照片壓縮後仍太大');
 }finally{URL.revokeObjectURL(url);}
}
async function capture(input){const file=input.files[0];if(!file||!admin()||!$('#confirmed').checked||!selected)return;
 const target={...selected},kind=$('#kind').value;$('#camera').disabled=$('#album').disabled=true;$('#photo-status').textContent='正在壓縮並保存照片，請稍候…';
 try{const blob=await compress(file);await store('put',{id:crypto.randomUUID(),owner:user.uid,target:target.id,label:target.label,title:`${target.name} ${photoKinds.find(k=>k[0]===kind)[1]}`,description:$('#photo-description').value.trim(),kind,blob,createdAt:Date.now(),state:'draft'});$('#photo-status').textContent='已保存本機，尚未上傳。請在下方確認照片再按「上傳公開」。';say('照片已保存，請點選上傳公開。');await renderDrafts();}
 catch(e){$('#photo-status').textContent=`保存失敗：${e.message}。請保留手機相簿原圖後重試。`;}
 finally{input.value='';$('#camera').disabled=$('#album').disabled=!$('#confirmed').checked;}
}
function blobBase64(blob){return new Promise((resolve,reject)=>{const r=new FileReader();r.onload=()=>resolve(r.result.split(',')[1]);r.onerror=()=>reject(r.error);r.readAsDataURL(blob);});}
async function upload(d,button){if(!admin()||d.owner!==user.uid)return;if(!uploadServiceURL){$('#queue-status').textContent='上傳服務尚待設定；照片已保留本機，可先匯出備份。';return;}if(!confirm(d.location?'這張照片及拍攝站點 GPS 將公開到 GitHub 與校園網站，確定上傳？':'這張照片將公開到 GitHub 與校園網站，確定上傳？'))return;
 button.disabled=true;$('#queue-status').textContent='正在上傳至 GitHub，請保持頁面開啟…';
 try{const token=await user.getIdToken();const r=await fetch(`${uploadServiceURL.replace(/\/$/,'')}/upload`,{method:'POST',headers:{Authorization:`Bearer ${token}`,'Content-Type':'application/json'},body:JSON.stringify({id:d.id,target:d.target,kind:d.kind,title:d.title,description:d.description,location:d.location,image:await blobBase64(d.blob)}),signal:AbortSignal.timeout(90000)});const result=await r.json();if(!r.ok)throw Error(result.error||`上傳失敗 ${r.status}`);await store('put',{...d,state:'published',commit:result.commit});$('#queue-status').textContent='GitHub 已接收，等待網站部署完成後前台顯示。';say('上傳成功，等待網站更新。');await renderDrafts();}
 catch(e){$('#queue-status').textContent=`${e.message}。照片仍在本機，可重新按上傳；相同照片不會重複發布。`;say('上傳尚未完成，照片仍在手機瀏覽器。');}finally{button.disabled=false;}
}
async function renderDrafts(){drafts=(await store('getAll')).filter(d=>d.owner===user?.uid).sort((a,b)=>b.createdAt-a.createdAt);for(const url of objectURLs)URL.revokeObjectURL(url);objectURLs=[];$('#queue').replaceChildren();
 for(const d of drafts){const card=document.createElement('article');card.className='photo-card';const img=document.createElement('img');img.src=URL.createObjectURL(d.blob);objectURLs.push(img.src);img.alt=d.title;const title=document.createElement('h3');title.textContent=d.title;const p=document.createElement('p');p.textContent=d.state==='published'?'GitHub 已接收，等待／已完成發布':'已存本機，待上傳';const actions=document.createElement('div');actions.className='queue-actions';if(d.state!=='published'){const b=document.createElement('button');b.textContent='上傳公開';b.onclick=()=>upload(d,b);actions.append(b);}const save=document.createElement('a');save.href=img.src;save.download=`${d.label}_${d.kind}_${d.id}.jpg`;save.textContent='下載備份';actions.append(save);card.append(img,title,p,actions);$('#queue').append(card);}
 if(!drafts.length)$('#queue-status').textContent='尚無本機照片。';
}
async function publicGallery(){try{const r=await fetch('./public-photos.json',{cache:'no-store'});if(!r.ok)throw Error();const records=await r.json();$('#public-gallery').textContent=records.length?'':'尚無已發布照片。';for(const p of records.slice().reverse()){const card=document.createElement('article');card.className='photo-card';const img=document.createElement('img');img.src=p.url;img.alt=p.title;img.loading='lazy';const title=document.createElement('p');title.textContent=p.title;card.append(img,title);$('#public-gallery').append(card);}}catch{$('#public-gallery').textContent='相簿暫時無法載入。';}}
async function start(){
 for(const [value,label] of photoKinds){const o=document.createElement('option');o.value=value;o.textContent=label;$('#kind').append(o);}$('#kind').onchange=()=>$('#instructions').textContent=photoKinds.find(k=>k[0]===$('#kind').value)[2];$('#kind').onchange();
 $('#locate').onclick=locate;$('#stop').onclick=()=>{stopLocation();$('#gps-status').textContent='已停止定位。';};$('#voice').onchange=()=>{if($('#voice').checked)say('語音提醒已啟動。');else{plantAudio.stop();speaker.stop();}};$('#tts-test').onclick=()=>say('語音輸出測試。您好，這是大南國小植物導覽。',true);$('#speak').onclick=readCurrentTarget;$('#target-read-test').onclick=()=>say('朗讀測試成功。',true);$('#speech-stop').onclick=()=>{plantAudio.stop();speaker.stop();$('#speech-status').textContent='已停止朗讀。';};$('#tree-search').oninput=()=>{pauseFollowing('已切換手動搜尋；勾選「依手機位置自動顯示附近植物」可恢復。');options();};$('#tree').onchange=e=>manualTarget(e.target.value);$('#confirmed').onchange=()=>{if($('#confirmed').checked)pauseFollowing('已固定拍照目標，移動時不會換株；拍攝完成後可重新勾選自動跟隨。');$('#camera').disabled=$('#album').disabled=!$('#confirmed').checked;};$('#camera').onchange=()=>capture($('#camera'));$('#album').onchange=()=>capture($('#album'));
 $('#resume-follow').onclick=()=>{$('#follow-location').checked=true;$('#follow-location').onchange();};
 $('#follow-location').onchange=()=>{followedTarget=false;if($('#follow-location').checked){$('#confirmed').checked=false;$('#camera').disabled=$('#album').disabled=true;$('#tree-search').value='';options();if(watch!==undefined&&position)updateNearby();else $('#follow-status').textContent='自動跟隨已開啟，按「開始定位」後會顯示您附近的植物。';}else pauseFollowing('已固定目前植物；勾選自動跟隨可恢復動態切換。');};
 $('#refresh-published').onclick=async()=>{try{await refreshPublishedPhotos();$('#public-gallery').replaceChildren();await publicGallery();actualTarget='';renderTarget(true);}catch{$('#public-gallery').textContent='發布清單暫時無法載入，請稍後重試。';}};
 $('#export').onclick=async()=>{if(!drafts.length){$('#queue-status').textContent='尚無照片可匯出。';return;}const payload={version:1,photos:await Promise.all(drafts.map(async d=>({...d,blob:undefined,image:await blobBase64(d.blob)})))};const url=URL.createObjectURL(new Blob([JSON.stringify(payload)],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download='校園照片備份.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),60000);};
 $('#service-status').textContent=uploadServiceURL?'使用免費 GitHub 上傳服務；須先在 Cloudflare 設好 GITHUB_TOKEN Secret。設定完成前照片只會保存本機。':'照片採集可先保存本機；GitHub 上傳服務尚待部署及專用授權。';
 const base='https://www.gstatic.com/firebasejs/13.2.0/';const [app,api,data]=await Promise.all([import(`${base}firebase-app.js`),import(`${base}firebase-auth.js`),fetch('./data.json').then(r=>{if(!r.ok)throw Error('樹木資料載入失敗');return r.json();})]);authAPI=api;auth=api.getAuth(app.initializeApp(firebaseConfig));trees=data.points.filter(t=>t.topic==='carbon'&&Number.isFinite(t.latitude)&&Number.isFinite(t.longitude));options();setTarget(trees.find(t=>t.id===new URLSearchParams(location.search).get("tree"))?.id||trees[0].id);draftDB=await openDrafts();mountSpaceCapture({getUser:()=>user,isAdmin:admin,compress,store,renderDrafts});mountTeacherAI({getUser:()=>user,getPlant:()=>selected,isAdmin:admin,compress});
 const refreshVoices=()=>{const select=$('#tts-voice'),previous=select.value;select.replaceChildren();const system=document.createElement('option');system.value='recorded';system.textContent='標準音訊（iPhone 建議）';select.append(system);const native=document.createElement('option');native.value='system';native.textContent='系統語音（原有模式）';select.append(native);for(const voice of window.speechSynthesis?.getVoices()||[]){if(!/^zh/i.test(voice.lang))continue;const option=document.createElement('option');option.value=voice.voiceURI;option.textContent=`${voice.name}（${voice.lang}）`;select.append(option);}select.value=Array.from(select.options).some(o=>o.value===previous)?previous:'recorded';};
 $('#tts-voice').onchange=()=>{plantAudio.stop();speaker.stop();};refreshVoices();window.speechSynthesis?.addEventListener('voiceschanged',refreshVoices);
 $('#speaker-test').onclick=()=>{plantAudio.stop();document.dispatchEvent(new Event('teacher-read-target'));speaker.stop();const audio=$('#speaker-test-audio');audio.currentTime=0;audio.volume=1;$('#speaker-test-status').textContent='正在啟動提示音…';audio.onended=()=>$('#speaker-test-status').textContent='提示音播放結束。若有聽到，表示媒體音訊可輸出；請再測試系統預設朗讀。';try{audio.play().catch(()=>$('#speaker-test-status').textContent='提示音無法播放，請用 Safari 直接開啟此頁重試。');}catch{$('#speaker-test-status').textContent='此瀏覽器無法啟動提示音。';}};
 mountSpeechTest({button:$('#stt-test'),status:$('#stt-status'),result:$('#stt-result'),Recognition:window.SpeechRecognition||window.webkitSpeechRecognition,isAdmin:admin,stopSpeech:()=>{plantAudio.stop();speaker.stop();},onSuccess:()=>say('STT 成功',true),document});
 $('#login').disabled=false;$('#login').onclick=async()=>{try{const provider=new api.GoogleAuthProvider();provider.setCustomParameters({prompt:'select_account'});await api.signInWithPopup(auth,provider);}catch(e){$('#auth-status').textContent=`登入失敗：${e.code||e.message}。請在 Safari 開啟並允許彈出視窗。`;}};$('#logout').onclick=()=>api.signOut(auth).catch(e=>$('#auth-status').textContent=e.message);
 api.onAuthStateChanged(auth,async current=>{const rejected=!!current&&!isAuthorizedAdmin(current);user=rejected?null:current;document.dispatchEvent(new Event('teacher-context-change'));$('#login').hidden=!!user;$('#logout').hidden=!user;$('#workspace').hidden=!admin();$('#auth-status').textContent=admin()?'管理員已登入，可開始定位與拍照。':user?'此帳號不是管理員，請登出並切換指定帳號。':'請使用 teacher.hsieh@gmail.com 登入。';if(!admin()){stopLocation();plantAudio.stop();speaker.stop();for(const url of objectURLs)URL.revokeObjectURL(url);objectURLs=[];$('#queue').replaceChildren();drafts=[];}else try{await renderDrafts();}catch(e){$('#queue-status').textContent=`無法讀取本機照片：${e.message}`;}if(rejected){try{await api.signOut(auth);$('#auth-status').textContent='此帳號沒有管理權限，已拒絕登入。請使用指定管理員 Google 帳號。';}catch{$('#auth-status').textContent='此帳號沒有管理權限，後台已鎖定；登出未完成，請重新整理後切換帳號。';}}});
}
document.addEventListener('visibilitychange',()=>{if(document.hidden){resumeLocation=watch!==undefined;stopLocation();plantAudio.stop();speaker.stop();$('#gps-status').textContent='頁面進入背景，定位暫停；回到前景後會恢復更新。';}else if(resumeLocation&&admin()){resumeLocation=false;locate();}});
window.addEventListener('pagehide',()=>{stopLocation();plantAudio.stop();speaker.stop();});
if(new URLSearchParams(location.search).get('mode')==='space'||new URLSearchParams(location.search).has('station')){document.body.classList.add('space-capture-mode');document.title='校園空間定位拍照｜大南國小';document.querySelector('h1').textContent='校園空間定位拍照';document.querySelector('header p').textContent='登入 → 定位或選站 → 確認位置 → 拍四個水平方向 → 上傳簡易 VR 素材';}
publicGallery();start().catch(e=>$('#auth-status').textContent=`初始化失敗：${e.message}。請確認網路並重新整理。`);
