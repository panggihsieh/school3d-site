import {seasonForMonth} from './learning.js';
const seasons={spring:'春季',summer:'夏季',autumn:'秋季',winter:'冬季'};
const birds={
 B01:{name:'麻雀',image:'./assets/birds/sparrow-cutout.png',video:'./assets/birds/animations/sparrow.webm?v=0a7730244fa7',artist:'Laitche',license:'Public domain',licenseUrl:'https://creativecommons.org/publicdomain/mark/1.0/',source:'https://commons.wikimedia.org/wiki/File:Tree_Sparrow_August_2007_Osaka_Japan.jpg'},
 B02:{name:'白頭翁',image:'./assets/birds/bulbul-cutout.png',video:'./assets/birds/animations/bulbul.webm?v=d42eb33e3208',artist:'Earthshine..',license:'CC BY-SA 3.0',licenseUrl:'https://creativecommons.org/licenses/by-sa/3.0/',source:'https://commons.wikimedia.org/wiki/File:Chinese_Bubul.JPG'}
};
const panel=document.querySelector('.map-panel');
const bar=document.createElement('section');bar.className='seasonal-bar';bar.setAttribute('aria-label','季節鳥類情境');
bar.innerHTML='<span>季節鳥類 · 情境動畫</span><label>季節 <select aria-label="鳥類動畫季節"><option value="auto">依臺灣目前月份</option><option value="spring">春季</option><option value="summer">夏季</option><option value="autumn">秋季</option><option value="winter">冬季</option></select></label><button type="button" class="bird-toggle">暫停動畫</button><button type="button" class="bird-show">看看季節鳥</button><small>固定於 B01／B02；情境示意，非目擊紀錄</small>';
document.querySelector('.topics').after(bar);
const layer=document.createElement('div');layer.className='seasonal-birds';
const info=document.createElement('div');info.className='bird-information';info.hidden=true;info.setAttribute('role','status');panel.append(info);
const seasonSelect=bar.querySelector('select'),toggle=bar.querySelector('.bird-toggle');
const motion=matchMedia('(prefers-reduced-motion: reduce)');let enabled=!motion.matches;
function season(){const month=Number(new Intl.DateTimeFormat('en',{timeZone:'Asia/Taipei',month:'numeric'}).format(new Date()));return seasonSelect.value==='auto'?seasonForMonth(month):seasonSelect.value;}
function describe(id){
 const bird=birds[id];info.replaceChildren();info.hidden=false;
 const title=document.createElement('strong');title.textContent=`${seasons[season()]}情境 · ${id} ${bird.name}`;
 const text=document.createElement('p');text.textContent='影片由 AI 合成並去背，非實際野外行為錄影；此位置不代表當季校園目擊或棲地調查結果。';
 const credit=document.createElement('p');credit.textContent=`原照片：${bird.artist} · `;
 const license=document.createElement('a');license.href=bird.licenseUrl;license.textContent=bird.license;
 const source=document.createElement('a');source.href=bird.source;source.textContent='原始照片 ↗';
 for(const a of [license,source]){a.target='_blank';a.rel='noopener';}
 credit.append(license);const close=document.createElement('button');close.type='button';close.textContent='關閉';close.onclick=()=>info.hidden=true;info.append(title,text,credit,source,close);
}
function sync(){
 const stage=document.querySelector('.photo-stage'),photo=document.querySelector('#photo-map');
 if(!stage)return;
 if(layer.parentElement!==stage)stage.append(layer);
 const visible=document.querySelector('.topic.active')?.dataset.topic==='birds'&&!photo.hidden;
 layer.hidden=!visible;if(!visible){info.hidden=true;update();return;}
 const pins=[...stage.querySelectorAll('.photo-plants .plant-pin')].filter(pin=>birds[pin.textContent]);
 const ids=new Set(pins.map(pin=>pin.textContent));
 for(const bird of layer.children)if(!ids.has(bird.dataset.station))bird.remove();
 for(const pin of pins){
  const id=pin.textContent,bird=birds[id];let el=layer.querySelector(`[data-station="${id}"]`);
  if(!el){el=document.createElement('button');el.type='button';el.className='seasonal-bird';el.dataset.station=id;el.setAttribute('aria-label',`${id} ${bird.name}，情境示意，點選介紹`);const video=document.createElement('video');video.src=bird.video;video.poster=bird.image;video.muted=true;video.loop=true;video.playsInline=true;video.preload='metadata';video.setAttribute('aria-hidden','true');video.onerror=()=>{const image=document.createElement('img');image.src=bird.image;image.alt=bird.name;video.replaceWith(image);};el.append(video);el.onclick=()=>describe(id);layer.append(el);}
  el.style.left=pin.style.left;el.style.top=pin.style.top;el.classList.toggle('bird-right',parseFloat(pin.style.left)<35);
 }
 update();
}
function update(){for(const video of layer.querySelectorAll('video')){if(enabled&&!document.hidden&&!layer.hidden)void video.play().catch(()=>{});else video.pause();}layer.classList.toggle('is-paused',!enabled||document.hidden);toggle.textContent=enabled?'暫停動畫':'開啟動畫';toggle.setAttribute('aria-pressed',String(enabled));}
toggle.onclick=()=>{enabled=!enabled;update();};
bar.querySelector('.bird-show').onclick=()=>{sync();if(!layer.hidden&&layer.children.length)describe(layer.firstElementChild.dataset.station);};
seasonSelect.onchange=()=>{info.hidden=true;sync();};
document.addEventListener('campus-photo-points',sync);
document.addEventListener('visibilitychange',update);
motion.addEventListener('change',()=>{enabled=!motion.matches;update();});
sync();update();
