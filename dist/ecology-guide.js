import {filterEcologyTopics,seasonForEcologyMonth,ecologySeasons,ecologyPhotoIds} from './ecology-guide-core.js';
const $=s=>document.querySelector(s),seasons={spring:'春季',summer:'夏季',autumn:'秋季',winter:'冬季'};
let data,trees=[],shown=[],gallery=[],photoIndex=0,opener=null;
function element(tag,text,className){const el=document.createElement(tag);if(text!==undefined)el.textContent=text;if(className)el.className=className;return el;}
function sourceLink(title,url){const a=element('a',title);try{const parsed=new URL(url);if(parsed.protocol==='http:')parsed.protocol='https:';if(parsed.protocol==='https:')a.href=parsed.href;}catch{}a.target='_blank';a.rel='noopener noreferrer';return a;}
function resolvedSeason(){const chosen=$('#guide-season').value;if(chosen!=='current')return chosen;const month=Number(new Intl.DateTimeFormat('en',{timeZone:'Asia/Taipei',month:'numeric'}).format(new Date()));return seasonForEcologyMonth(month);}
function photoFigure(id){
 const photo=data.photos[id],figure=element('figure');
 if(!photo?.url){figure.append(element('div',photo?.label||'實景圖片待補','photo-pending'));return figure;}
 const button=element('button',undefined,'photo-button');button.type='button';button.setAttribute('aria-label','放大'+photo.label);const img=element('img');img.src=photo.url;img.alt=photo.label+'，非校內實拍的參考照片';img.loading='lazy';img.width=320;img.height=220;
 img.onerror=()=>{img.hidden=true;button.append(element('span','圖片載入失敗；可於來源頁查看','photo-load-error'));};button.append(img);button.onclick=()=>openPhoto(id,button);
 const caption=element('figcaption',photo.label);caption.append(element('span','實景參考 · '+photo.license));figure.append(button,caption);return figure;
}
function rowFor(topic,index){
 const row=element('tr');row.dataset.topic=topic.id;
 const intro=element('td');intro.append(element('span',String(index+1).padStart(2,'0'),'row-index'),element('h2',topic.title),element('p',topic.plant,'topic-plants'));
 const matched=trees.filter(p=>topic.treeSpeciesCodes.includes(p.sourceSpeciesCode));
 if(matched.length){const links=element('div',undefined,'tree-links');for(const code of topic.treeSpeciesCodes){const group=matched.filter(p=>p.sourceSpeciesCode===code);if(!group.length)continue;const a=element('a','查看校園登錄樹木（'+group.length+' 株） ↗');a.href='./?topic=carbon&tree='+encodeURIComponent(group[0].id);links.append(a);}intro.append(links);}
 const animals=element('td');animals.dataset.label='認識生物';const list=element('ul',undefined,'species-list');for(const name of topic.animals)list.append(element('li',name));animals.append(list,element('small',topic.campusStatus,'campus-status'));
 const timing=element('td');timing.dataset.label='觀察季節';const tags=element('div',undefined,'season-tags');if(topic.seasons.length===4)tags.append(element('span','全年依物候'));else for(const key of topic.seasons)tags.append(element('span',seasons[key]));timing.append(tags,element('p',topic.timing,'timing'));
 const relation=element('td');relation.append(element('p',topic.relation),element('p',topic.idea,'education-idea'));const mission=element('p',undefined,'mission');mission.append(element('strong','帶一個小任務'),document.createTextNode(topic.mission));relation.append(mission);
 const sources=element('details',undefined,'topic-sources');sources.append(element('summary','資料來源與查證'));for(const source of topic.sources)sources.append(sourceLink(source.title,source.url));relation.append(sources);
 const media=element('td'),grid=element('div',undefined,'photo-grid');for(const id of topic.photoIds)grid.append(photoFigure(id));media.append(grid);row.append(intro,animals,timing,relation,media);return row;
}
function render(){
 if(!data)return;const season=resolvedSeason();shown=filterEcologyTopics(data.topics,$('#guide-search').value,season);gallery=ecologyPhotoIds(shown,data.photos);$('#guide-rows').replaceChildren(...shown.map(rowFor));$('#guide-table').hidden=!shown.length;$('#guide-empty').hidden=!!shown.length;
 $('#guide-status').textContent=shown.length+' 個導覽主題 · '+gallery.length+' 張實景參考照'+(season==='all'?'':' · '+seasons[season]);for(const button of document.querySelectorAll('[data-season]'))button.setAttribute('aria-pressed',String(button.dataset.season===season));
}
function renderPhoto(){
 const id=gallery[photoIndex],photo=data.photos[id];$('#photo-title').textContent=photo.label;const img=$('#photo-large');img.hidden=false;$('#photo-error').hidden=true;img.src=photo.url;img.alt=photo.label+'，實景參考照，非大南國小現地實拍';img.onerror=()=>{img.hidden=true;$('#photo-error').hidden=false;};
 $('#photo-position').textContent=(photoIndex+1)+' / '+gallery.length;$('#photo-credit').textContent='攝影／作者：'+photo.artist+' · '+photo.license;const source=sourceLink('照片來源 ↗',photo.source),license=sourceLink(photo.license+' 授權 ↗',photo.licenseURL);source.id='photo-source';license.id='photo-license';$('#photo-source').replaceWith(source);$('#photo-license').replaceWith(license);$('#photo-note').textContent=photo.note||'原始授權參考照；來源照片可能拍於其他地區，不能作為校內出現或繁殖的證據。';$('#photo-prev').disabled=$('#photo-next').disabled=gallery.length<2;
}
function openPhoto(id,button){photoIndex=gallery.indexOf(id);if(photoIndex<0)return;opener=button;renderPhoto();$('#ecology-viewer').showModal();}
function movePhoto(delta){photoIndex=(photoIndex+delta+gallery.length)%gallery.length;renderPhoto();}
$('#photo-close').onclick=()=>$('#ecology-viewer').close();$('#photo-prev').onclick=()=>movePhoto(-1);$('#photo-next').onclick=()=>movePhoto(1);
$('#ecology-viewer').addEventListener('close',()=>{if(opener?.isConnected)opener.focus();});
$('#ecology-viewer').addEventListener('keydown',e=>{if(e.key==='ArrowLeft'||e.key==='ArrowRight'){e.preventDefault();movePhoto(e.key==='ArrowLeft'?-1:1);}});
$('#ecology-viewer').addEventListener('click',e=>{if(e.target!==e.currentTarget)return;const r=e.currentTarget.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)e.currentTarget.close();});
$('#guide-search').oninput=render;$('#guide-season').onchange=render;$('#guide-filters').onsubmit=e=>e.preventDefault();$('#guide-filters').onreset=()=>{setTimeout(render,0);};
async function load(){
 $('#guide-error').hidden=true;$('#guide-status').textContent='正在載入生態導覽…';
 try{
  const [response,campus]=await Promise.all([fetch('./ecology-guide.json?v=1'),fetch('./data.json').then(r=>r.ok?r.json():null).catch(()=>null)]);if(!response.ok)throw Error('Guide unavailable');data=await response.json();trees=(campus?.points||[]).filter(p=>p.topic==='carbon');
  $('#guide-note').textContent=data.note;$('#map-note').textContent=data.mapNote;$('#season-highlights').replaceChildren();for(const item of data.seasonHighlights){const button=element('button');button.type='button';button.dataset.season=item.id;button.setAttribute('aria-pressed','false');button.setAttribute('aria-label','篩選'+seasons[item.id]+'導覽');button.append(element('strong',item.name),element('span',item.text));button.onclick=()=>{$('#guide-season').value=item.id;render();};$('#season-highlights').append(button);}
  const params=new URLSearchParams(location.search);$('#guide-search').value=(params.get('q')||'').slice(0,200);$('#guide-season').value=ecologySeasons.includes(params.get('season'))?params.get('season'):'all';render();
 }catch{data=null;$('#guide-status').textContent='導覽資料尚未載入';$('#guide-error').hidden=false;$('#guide-table').hidden=true;}
}
$('#guide-retry').onclick=load;load();
